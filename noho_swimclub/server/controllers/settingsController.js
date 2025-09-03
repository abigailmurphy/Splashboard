const SeasonSetting = require("../models/seasonSettings");
const AppSettings = require("../models/appSettings");
const { computeDefaultSeason } = require("../lib/season");

// shared defaults for new seasons
const DEFAULTS = {
  cost: { individualPerPerson: 260, familyFlat: 620 },
  deadlines: {
    offerResponseDays: 14,
    returnResponseDays: 21,
    hardOfferDeadline: null,
    hardReturnDeadline: null,
  },
};

// helper: make sure a SeasonSetting exists for a given year
async function ensureSeasonSettingsFor(season) {
  await SeasonSetting.updateOne(
    { season: String(season) },
    { $setOnInsert: { season: String(season), ...DEFAULTS, visible: true } },
    { upsert: true }
  );
}

// GET /settings  → returns the global app settings (creates default if missing)
const getAppSettings = async (_req, res) => {
  try {
    let doc = await AppSettings.findById("global").lean();
    if (!doc) {
      // create with default workingSeason (Sep 20 cutoff rule)
      const ws = computeDefaultSeason();
      await AppSettings.updateOne(
        { _id: "global" },
        { $setOnInsert: { workingSeason: ws } },
        { upsert: true }
      );
      await ensureSeasonSettingsFor(ws);
      doc = await AppSettings.findById("global").lean();
    }
    return res.json({ workingSeason: doc.workingSeason, updatedAt: doc.updatedAt });
  } catch (e) {
    console.error("getAppSettings error", e);
    res.status(500).json({ error: "server error" });
  }
};

// PATCH /settings/working-season  (admin) → set working season and ensure seasonSettings
const patchWorkingSeason = async (req, res) => {
  try {
    const { workingSeason } = req.body || {};
    if (!workingSeason) return res.status(400).json({ error: "workingSeason required" });

    const ws = String(workingSeason).trim();
    if (!/^\d{4}$/.test(ws)) return res.status(400).json({ error: "workingSeason must be YYYY" });

    const doc = await AppSettings.findOneAndUpdate(
      { _id: "global" },
      { $set: { workingSeason: ws } },
      { upsert: true, new: true }
    ).lean();

    // lazily create season settings for the selected year
    await ensureSeasonSettingsFor(ws);

    return res.json({ workingSeason: doc.workingSeason, updatedAt: doc.updatedAt });
  } catch (e) {
    console.error("patchWorkingSeason error", e);
    res.status(500).json({ error: "server error" });
  }
};

// GET /settings/public?season=YYYY  (Visible to all users)
const getPublicSettings = async (req, res) => {
  try {
    let season = req.query.season && String(req.query.season);
    if (!season) {
      // fall back to backend's workingSeason, then computeDefaultSeason
      const app = await AppSettings.findById("global").lean();
      season = app?.workingSeason || computeDefaultSeason();
    }

    const s = await SeasonSetting.findOne({ season }).lean();
    if (!s) {
      // return usable defaults if the document doesn't exist yet
      return res.json({
        season,
        cost: { individualPerPerson: 260, familyFlat: 620 },
        deadlines: {
          offerResponseDays: 14,
          returnResponseDays: 21,
          hardOfferDeadline: null,
          hardReturnDeadline: null,
        },
        visible: true,
      });
    }

    res.json({
      season: s.season,
      cost: s.cost,
      deadlines: s.deadlines,
      visible: s.visible,
      updatedAt: s.updatedAt,
    });
  } catch (e) {
    console.error("getPublicSettings error", e);
    res.status(500).json({ error: "server error" });
  }
};

// PUT /settings/admin/:season  (Admin) – upsert season settings
const upsertSeasonSettings = async (req, res) => {
  try {
    const season = String(req.params.season);
    const payload = {
      ...(req.body.cost ? { cost: req.body.cost } : {}),
      ...(req.body.deadlines ? { deadlines: req.body.deadlines } : {}),
      ...(typeof req.body.visible === "boolean" ? { visible: req.body.visible } : {}),
      updatedBy: res.locals?.user?._id || res.locals?.user?.id || undefined,
    };

    const doc = await SeasonSetting.findOneAndUpdate(
      { season },
      { $set: payload, $setOnInsert: { season } },
      { new: true, upsert: true }
    ).lean();

    res.json({ status: true, settings: doc });
  } catch (e) {
    console.error("upsertSeasonSettings error", e);
    res.status(500).json({ status: false, error: "server error" });
  }
};

module.exports = {
  getAppSettings,
  patchWorkingSeason,
  getPublicSettings,
  upsertSeasonSettings,
  ensureSeasonSettingsFor, // exported in case you want to call it elsewhere
};
