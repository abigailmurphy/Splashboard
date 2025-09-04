const SeasonSetting = require("../models/seasonSettings");

const FALLBACK = {
  cost: { individualPerPerson: 260, familyFlat: 620 },
  deadlines: { offerResponseDays: 14, returnResponseDays: 21, hardOfferDeadline: null, hardReturnDeadline: null },
};

async function getSettingsForSeason(season) {
  // Try exact season, else latest, else fallback
  let s = await SeasonSetting.findOne({ season }).lean();
  if (!s) s = await SeasonSetting.findOne().sort({ season: -1 }).lean();
  if (!s) return { season, ...FALLBACK };
  return s;
}

function computeAmountOwed(membershipType, membershipPeople, settings) {
  const count = Math.max(1, Array.isArray(membershipPeople) ? membershipPeople.length : 1);
  if (membershipType === "family") return settings.cost.familyFlat;
  return settings.cost.individualPerPerson * count;
}

function computeOfferExpiry({ now = new Date(), settings, isReturn = false }) {
  const abs = isReturn ? settings.deadlines.hardReturnDeadline : settings.deadlines.hardOfferDeadline;
  if (abs) return new Date(abs);

  const days = isReturn ? settings.deadlines.returnResponseDays : settings.deadlines.offerResponseDays;
  const ms = (Number.isFinite(days) ? days : 14) * 24 * 60 * 60 * 1000;
  return new Date(now.getTime() + ms);
}

module.exports = { getSettingsForSeason, computeAmountOwed, computeOfferExpiry };
