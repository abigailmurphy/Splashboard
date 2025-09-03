// boot/ensureSeasonSettings.js
const AppSettings   = require("../models/appSettings");
const SeasonSetting = require("../models/seasonSettings"); 

function startOfDay(d){ if(!d) return null; d.setHours(0,0,0,0); return d; }
function endOfDay(d){ if(!d) return null; d.setHours(23,59,59,999); return d; }
function june1(seasonStr){ return startOfDay(new Date(Number(seasonStr), 5, 1)); }  // Jun = 5
function sept1(seasonStr){ return endOfDay(new Date(Number(seasonStr), 8, 1)); }    // Sep = 8 (Sep 1 EOD)

module.exports = async function ensureSeasonSettingsOnBoot() {
  console.log("[boot] ensureSeasonSettingsOnBoot()");

  // 1) ensure AppSettings.global exists
  let app = await AppSettings.findById("global").lean();
  if (!app) {
    const y = String(new Date().getFullYear());
    await AppSettings.create({ _id: "global", workingSeason: y });
    app = await AppSettings.findById("global").lean();
    console.log("[boot] created app_settings.global with workingSeason:", app.workingSeason);
  } else {
    console.log("[boot] found workingSeason:", app.workingSeason);
  }

  // 2) compute explicit dates
  const season = String(app.workingSeason);
  const start = june1(season);
  const end   = sept1(season);

  if (!(start instanceof Date) || isNaN(start)) throw new Error(`[boot] bad start for ${season}`);
  if (!(end instanceof Date)   || isNaN(end))   throw new Error(`[boot] bad end for ${season}`);

  // 3) check-then-create (no $setOnInsert, no defaults)
  const existing = await SeasonSetting.findOne({ season }).lean();
  if (existing) {
    console.log("[boot] SeasonSetting already exists for", season);
    return;
  }

  const doc = {
    season,
    seasonRange: { start, end },
    guestCapPerDay: 25,
    guestCapPerPersonPerDay: 5,
    cost: { individualPerPerson: 260, familyFlat: 620 },
    deadlines: {
      offerResponseDays: 14,
      returnResponseDays: 21,
      hardOfferDeadline: null,
      hardReturnDeadline: null,
    },
    visible: true,
  };

  try {
    await SeasonSetting.create(doc);
    console.log("[boot] inserted SeasonSetting for", season, doc.seasonRange);
  } catch (e) {
    if (e.code === 11000) {
      console.log("[boot] SeasonSetting inserted concurrently; continuing");
    } else {
      throw e;
    }
  }
};
