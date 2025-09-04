const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc"); const tz = require("dayjs/plugin/timezone");
dayjs.extend(utc); dayjs.extend(tz);
const ZONE = "America/New_York";

const mongoose = require("mongoose");
const GuestSignup = require("../models/guestSignUp");
const SeasonSetting = require("../models/seasonSettings");
const AppSettings = require("../models/appSettings");
const { setDesiredCount, mgetUsedForDays } = require("../lib/redisClient");
const { publishGuestUpdate, publishSeasonCap } = require("../lib/realtime");

// helpers
function toDayDate(dStr){ return dayjs.tz(`${dStr} 00:00:00`, ZONE).toDate(); }
function toDayStr(date){  return dayjs.tz(date, ZONE).format("YYYY-MM-DD"); }
async function getWorkingSeason(){
  const s = await AppSettings.findById("global").lean();
  return s?.workingSeason || String(new Date().getFullYear());
}
async function loadSeasonConfig(seasonStr){
  const doc = await SeasonSetting.findOne({ season: seasonStr }).lean();
  if (!doc) {
    const y = Number(seasonStr);
    // fallback window like your schema defaults
    const start = dayjs(new Date(y, 5, 1, 0, 0, 0));
    const end   = dayjs(new Date(y, 8, 1, 23, 59, 59, 999));
    return { season: seasonStr, start, end, perDayCap: 25, perUserMax: 5 };
  }
  return {
    season: seasonStr,
    start: dayjs(doc.seasonRange.start),
    end:   dayjs(doc.seasonRange.end),
    perDayCap: doc.guestCapPerDay ?? 25,
    perUserMax: doc.guestCapPerPersonPerDay ?? 5,
  };
}
function listDaysInclusive(start, end){
  const out = [];
  let d = start.startOf("day");
  const last = end.startOf("day");
  while (!d.isAfter(last)) { out.push(d.format("YYYY-MM-DD")); d = d.add(1, "day"); }
  return out;
}

// GET /guest/availability?season=YYYY
exports.getAvailability = async (req, res) => {
  try {
    const season = String(req.query.season || await getWorkingSeason());
    const cfg = await loadSeasonConfig(season);
    const dayStrs = listDaysInclusive(cfg.start, cfg.end);
    const used = await mgetUsedForDays(season, dayStrs);
    const days = dayStrs.map((day, i) => {
      const u = used[i] || 0;
      return { day, cap: cfg.perDayCap, used: u, remaining: Math.max(cfg.perDayCap - u, 0) };
    });
    res.json({ season, perDayCap: cfg.perDayCap, perUserMax: cfg.perUserMax, days });
  } catch (e) {
    console.error("getAvailability error", e);
    res.status(500).json({ error: "server error" });
  }
};

// GET /guest/mine?season=YYYY
exports.getMySignups = async (req, res) => {
  try {
    const season = String(req.query.season || await getWorkingSeason());
    const userId = new mongoose.Types.ObjectId(res.locals.user.id || res.locals.user._id);
    const docs = await GuestSignup.find({ season, userId }).lean();
    res.json({ season, items: docs.map(d => ({ day: toDayStr(d.day), guests: d.guests })) });
  } catch (e) {
    console.error("getMySignups error", e);
    res.status(500).json({ error: "server error" });
  }
};

// GET /guest/day/:day?season=YYYY
exports.getDaySignups = async (req, res) => {
  try {
    const season = String(req.query.season || await getWorkingSeason());
    const dayStr = String(req.params.day);
    const cfg = await loadSeasonConfig(season);
    const d = dayjs(dayStr, "YYYY-MM-DD");
    if (d.isBefore(cfg.start.startOf("day")) || d.isAfter(cfg.end.startOf("day"))) {
      return res.status(422).json({ error: "day outside seasonRange" });
    }
    const docs = await GuestSignup.aggregate([
      { $match: { season, day: toDayDate(dayStr) } },
      { $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [{ $project: { name: 1, email: 1 } }],
      }},
      { $unwind: "$user" },
      { $project: { _id: 1, guests: 1, user: 1 } },
      { $sort: { "user.name.last": 1, "user.name.first": 1 } },
    ]);
    res.json({ season, day: dayStr, signups: docs });
  } catch (e) {
    console.error("getDaySignups error", e);
    res.status(500).json({ error: "server error" });
  }
};

// PUT /guest/signup  { day:'YYYY-MM-DD', guests:int(0..perUserMax), season? }
exports.upsertSignup = async (req, res) => {
  try {
    const season = String(req.body.season || await getWorkingSeason());
    const dayStr = String(req.body.day || "");
    const guests = Number(req.body.guests);
    if (!dayStr || !Number.isInteger(guests) || guests < 0) {
      return res.status(400).json({ error: "day and guests(>=0) required" });
    }
    const cfg = await loadSeasonConfig(season);
    const d = dayjs(dayStr, "YYYY-MM-DD");
    if (d.isBefore(cfg.start.startOf("day")) || d.isAfter(cfg.end.startOf("day"))) {
      return res.status(422).json({ error: "day outside seasonRange" });
    }

    const userIdStr = String(res.locals.user.id || res.locals.user._id);
    const userId = new mongoose.Types.ObjectId(userIdStr);

    // Atomic apply (Lua)
    const resLua = await setDesiredCount({
      season, dayStr, userId: userIdStr, newCount: guests,
      perUserMax: cfg.perUserMax, capValue: cfg.perDayCap,
    });
    if (!Array.isArray(resLua) || resLua[0] === 0) {
      return res.status(409).json({ error: resLua?.[1] || "capacity_conflict" });
    }
    const [, usedAfter, userCountAfter, ver] = resLua;

    // Persist roster
    const dayDate = toDayDate(dayStr);
    if (guests === 0) {
      await GuestSignup.deleteOne({ season, day: dayDate, userId });
    } else {
      await GuestSignup.updateOne(
        { season, day: dayDate, userId },
        { $set: { season, day: dayDate, userId, guests } },
        { upsert: true }
      );
    }

    // Publish realtime update
    await publishGuestUpdate({
      type: "day", season, day: dayStr,
      used: usedAfter, cap: cfg.perDayCap,
      remaining: Math.max(cfg.perDayCap - usedAfter, 0),
      ver,
    });

    // Respond to actor immediately
    return res.json({
      ok: true, season, day: dayStr, guests: userCountAfter,
      cap: cfg.perDayCap, used: usedAfter,
      remaining: Math.max(cfg.perDayCap - usedAfter, 0),
      ver,
    });
  } catch (e) {
    console.error("upsertSignup error", e);
    res.status(500).json({ error: "server error" });
  }
};

// PATCH /guest/capacity-season  { season?:YYYY, perDayCap:int>=0, perUserMax?:int>=0 } (admin)
exports.setSeasonCapacity = async (req, res) => {
  try {
    const season = String(req.body.season || await getWorkingSeason());
    const updates = {};
    if (req.body.perDayCap != null) {
      const c = Number(req.body.perDayCap);
      if (!Number.isFinite(c) || c < 0) return res.status(400).json({ error: "invalid perDayCap" });
      updates.guestCapPerDay = c;
    }
    if (req.body.perUserMax != null) {
      const m = Number(req.body.perUserMax);
      if (!Number.isFinite(m) || m < 0) return res.status(400).json({ error: "invalid perUserMax" });
      updates.guestCapPerPersonPerDay = m;
    }
    if (!Object.keys(updates).length) return res.status(400).json({ error: "no changes" });

    const doc = await SeasonSetting.findOneAndUpdate(
      { season }, { $set: updates }, { upsert: true, new: true }
    ).lean();

    // Let clients update UI immediately
    if (updates.guestCapPerDay != null) {
      await publishSeasonCap({ type: "seasonCap", season, cap: doc.guestCapPerDay });
    }

    res.json({
      season,
      perDayCap: doc.guestCapPerDay,
      perUserMax: doc.guestCapPerPersonPerDay,
    });
  } catch (e) {
    console.error("setSeasonCapacity error", e);
    res.status(500).json({ error: "server error" });
  }
};
