// controllers/adminController.js
const mongoose = require("mongoose");
const User = require("../models/user");
const MembershipRecord = require("../models/membershipRecord");
const { getSettingsForSeason, computeAmountOwed, computeOfferExpiry } = require("../services/seasonSettingsHelpers");

/**
 * GET /admin/waitlist?season=YYYY
 * - People who applied for the given season and are waiting (submitted or waitlist)
 * - Sorted by applicationDate ASC
 * - Efficient: single aggregation with $lookup for user summary (name/email)
 */
const getWaitlist = async (req, res) => {
  try {
    const { season } = req.query;
    if (!season) return res.status(400).json({ error: "season is required" });

    const pipeline = [
      {
        $match: {
          season,
          status: { $in: ["submitted", "waitlist"] },
        },
      },
      { $sort: { applicationDate: 1, createdAt: 1 } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [
            { $project: { email: 1, name: 1, isMember: 1, hasOffer: 1 } },
          ],
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          userId: 1,
          season: 1,
          membershipType: 1,
          status: 1,
          applicationDate: 1,
          address: 1,
          cell: 1, cell2: 1, homePhone: 1, workPhone: 1,
          membershipPeople: 1,
          "user.email": 1,
          "user.name": 1,
          "user.isMember": 1,
          "user.hasOffer": 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ];

    const waitlist = await MembershipRecord.aggregate(pipeline);
    return res.json({ waitlist });
  } catch (error) {
    console.error("getWaitlist error", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /admin/members?season=YYYY
 * - Current season accepted members
 * - Sorted by acceptedAt ASC
 */
const getMembersForSeason = async (req, res) => {
  try {
    const { season } = req.query;
    if (!season) return res.status(400).json({ error: "season is required" });

    const pipeline = [
      { $match: { season, status: "accepted" } },
      { $sort: { acceptedAt: 1, createdAt: 1 } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [{ $project: { email: 1, name: 1 } }],
        },
      },
      { $unwind: "$user" },
      
    ];

    const members = await MembershipRecord.aggregate(pipeline);
    return res.json({ members });
  } catch (error) {
    console.error("getMembersForSeason error", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /admin/offers?season=YYYY
 * - Current season offered list (not yet accepted)
 * - Sorted by offeredAt ASC
 */
const getOfferList = async (req, res) => {
  try {
    const { season } = req.query;
    if (!season) return res.status(400).json({ error: "season is required" });

    const pipeline = [
      { $match: { season, status: "offered" } },
      { $sort: { offeredAt: 1, createdAt: 1 } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [{ $project: { email: 1, name: 1 } }],
        },
      },
      { $unwind: "$user" },
      
    ];

    const offers = await MembershipRecord.aggregate(pipeline);
    res.json({ offers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
};


/**
 * POST /admin/offers/create
 * Body: { season: "YYYY", userIds: [ ... ] }
 *
 * For the given target season:
 * - For each user, find their most recent **accepted** record (any season).
 * - Upsert a new record for the target season with status "offered" and snapshot
 *   their last accepted membershipType/address/phones/membershipPeople for review.
 * - Also set User.hasOffer = true for those users (optional but keeps FE simple).
 * - Efficient bulkWrite; no unnecessary repeated queries.
 */
const createOffersFromLastAccepted = async (req, res) => {
  try {
    const { season, userIds } = req.body;
    if (!season || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "season and userIds[] are required" });
    }

    const userObjectIds = userIds.map((id) => new mongoose.Types.ObjectId(id));

    // 1) Get each user's most recent accepted record (one per user)
    // Use aggregation to efficiently group by userId and pick latest accepted
    const latestAccepted = await MembershipRecord.aggregate([
      { $match: { userId: { $in: userObjectIds }, status: "accepted" } },
      {
        $sort: { season: -1, acceptedAt: -1, updatedAt: -1 } // latest first
      },
      {
        $group: {
          _id: "$userId",
          record: { $first: "$$ROOT" },
        },
      },
    ]);

    // Prepare a map for quick lookup
    const latestByUser = new Map(
      latestAccepted.map((row) => [String(row._id), row.record])
    );

    const now = new Date();

    // 2) Build bulk upserts for the target season
    const ops = userObjectIds.map((uid) => {
      const key = String(uid);
      const last = latestByUser.get(key);

      // If no accepted record exists, still create a very basic "offered" shell
      const snapshot = last
        ? {
            membershipType: last.membershipType,
            address: last.address || {},
            cell: last.cell || "",
            cell2: last.cell2 || "",
            homePhone: last.homePhone || "",
            workPhone: last.workPhone || "",
            membershipPeople: last.membershipPeople || [],
          }
        : {
            membershipType: "individual",
            address: {},
            cell: "",
            cell2: "",
            homePhone: "",
            workPhone: "",
            membershipPeople: [],
          };
      const amount = computeAmountOwed(snapshot.membershipType, snapshot.membershipPeople, settings);
      const offerExpiresAt = computeOfferExpiry({ now, settings, isReturn: !!last });

      return {
        updateOne: {
          filter: { userId: uid, season },
          update: {
            $set: {
              ...snapshot,
              status: "offer",
              offeredAt: now,
              amountOwed: amount,
              offerExpiresAt,
              settingsSnapshot: { cost: settings.cost, deadlines: settings.deadlines },
            },
          },
          upsert: true,
        },
      };
    });

    
    const writeResult = await MembershipRecord.bulkWrite(ops, { ordered: false });

    //User.hasOffer = true for those users (single updateMany)
    await User.updateMany(
      { _id: { $in: userObjectIds } },
      { $set: { hasOffer: true } }
    );

    //Update pointer
    const seasonRecords = await MembershipRecord.find(
      { userId: { $in: userObjectIds }, season: String(season) },
      { _id: 1, userId: 1 }
    ).lean();

    if (seasonRecords.length) {
      const pointerOps = seasonRecords.map((r) => ({
        updateOne: {
          filter: { _id: r.userId },
          update: { $set: { activeMembershipRecord: r._id } },
        },
      }));
      await User.bulkWrite(pointerOps, { ordered: false });
    }

    return res.json({
      message: "Offers created for target season from last accepted snapshots.",
      result: writeResult,
    });
  } catch (error) {
    console.error("createOffersFromLastAccepted error", error);
    res.status(500).json({ error: error.message });
  }
};

// GET: /admin/returns returns with offer AND isMember
const getReturnOfferList = async (req, res) => {
  try {
    const { season } = req.query;
    if (!season) return res.status(400).json({ error: "season is required" });

    const pipeline = [
      { $match: { season, status: "return" } },
      { $sort: { offeredAt: 1, createdAt: 1 } },
      {
        $lookup: {
          from: "users",
          let: { uid: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$_id", "$$uid"] },
                    { $eq: ["$isMember", true] }
                  ]
                }
              }
            },
            { $project: { email: 1, name: 1 } }
          ],
          as: "user",
        },
      },
      { $unwind: "$user" }, // drops records whose user isn't isMember
    ];

    const returns = await MembershipRecord.aggregate(pipeline);
    return res.json({ returns });
  } catch (error) {
    console.error("getReturnOfferList error", error);
    res.status(500).json({ error: error.message });
  }
};


/**
 * POST /admin/offers/mark
 * Body: { season: "YYYY", recordIds: [ ... ] }
 * - Marks specific records as offered (if you already know recordIds).
 * - Sets offeredAt and User.hasOffer.
 */
// at top of adminController.js (or wherever this function lives)




const markRecordsOffered = async (req, res) => {
  try {
    let { season, recordIds } = req.body;
    const seasonStr = String(season || "");
    if (!/^\d{4}$/.test(seasonStr)) {
      return res.status(400).json({ error: "valid season (YYYY) is required" });
    }
    if (!Array.isArray(recordIds) || recordIds.length === 0) {
      return res.status(400).json({ error: "recordIds[] is required" });
    }

    const ids = recordIds.map((id) => new mongoose.Types.ObjectId(id));
    const now = new Date();

    // Load settings once (single source of truth)
    const settings = await getSettingsForSeason(seasonStr);

    // We need membershipType + membershipPeople to compute cost per record,
    // so load the records first (minimal projection).
    const records = await MembershipRecord.find(
      { _id: { $in: ids } },
      { _id: 1, userId: 1, status: 1, membershipType: 1, membershipPeople: 1 }
    ).lean();

    // Only "submitted" or "waitlist" can be promoted to "offered"
    const eligible = records.filter(r => ["submitted", "waitlist"].includes(r.status));
    if (eligible.length === 0) {
      return res.json({
        status: true,
        message: `No eligible records to mark as offered for season ${seasonStr}.`,
        modifiedCount: 0,
        totalSelected: ids.length,
        eligibleCount: 0,
        skippedRecordIds: records.map(r => String(r._id)),
      });
    }

    // Build per-record updates (need different amount/expiry for each)
    const ops = eligible.map((rec) => {
      const people = Array.isArray(rec.membershipPeople) ? rec.membershipPeople : [];
      const type = ["family", "individual"].includes(rec.membershipType) ? rec.membershipType : "individual";

      const amount = computeAmountOwed(type, people, settings);
      const offerExpiresAt = computeOfferExpiry({ now, settings, isReturn: false });

      return {
        updateOne: {
          filter: { _id: rec._id, status: { $in: ["submitted", "waitlist"] } },
          update: {
            $set: {
              status: "offered",
              offeredAt: now,
              season: seasonStr,
              amountOwed: amount,
              offerExpiresAt,
              settingsSnapshot: {
                cost: settings.cost,
                deadlines: settings.deadlines,
              },
            },
          },
        },
      };
    });

    const writeResult = await MembershipRecord.bulkWrite(ops, { ordered: false });

    // Update affected users -> hasOffer = true (kept from your original logic)
    const userIds = [...new Set(eligible.map((r) => String(r.userId)))].map(
      (s) => new mongoose.Types.ObjectId(s)
    );
    if (userIds.length) {
      await User.updateMany({ _id: { $in: userIds } }, { $set: { hasOffer: true } });
    }

    return res.json({
      status: true,
      message: `Marked ${writeResult.modifiedCount} record(s) as offered for season ${seasonStr}.`,
      modifiedCount: writeResult.modifiedCount || 0,
      totalSelected: ids.length,
      eligibleCount: eligible.length,
      skippedRecordIds: records
        .filter(r => !["submitted", "waitlist"].includes(r.status))
        .map(r => String(r._id)),
    });
  } catch (error) {
    console.error("markRecordsOffered error", error);
    return res.status(500).json({ status: false, error: error.message });
  }
};


/**
 * POST /admin/members/remove
 * Body: { season: "YYYY", userIds: [ ... ] }
 * - For a given season, revoke or expire members’ records and clear user flags.
 * - Minimal logic change from your previous removeMembers, but season-aware.
 */
const removeMembersForSeason = async (req, res) => {
  try {
    const { season, userIds } = req.body;
    if (!season || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "season and userIds[] are required" });
    }
    const userObjectIds = userIds.map((id) => new mongoose.Types.ObjectId(id));

    // Mark season records as revoked
    const recRes = await MembershipRecord.updateMany(
      { userId: { $in: userObjectIds }, season, status: { $in: ["accepted", "offered", "submitted", "waitlist"] } },
      { $set: { status: "revoked", revokedAt: new Date() } }
    );

    // Clear User flags (global)
    const userRes = await User.updateMany(
      { _id: { $in: userObjectIds } },
      { $set: { isMember: false, hasOffer: false } }
    );

    return res.json({
      message: "Season memberships revoked and user flags cleared.",
      recordsModified: recRes.modifiedCount,
      usersModified: userRes.modifiedCount,
    });
  } catch (error) {
    console.error("removeMembersForSeason error", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  // Lists
  getWaitlist,
  getMembersForSeason,
  getOfferList,
  getReturnOfferList,

  // Offer management
  createOffersFromLastAccepted,
  markRecordsOffered,

  // Removal / revocation
  removeMembersForSeason,

  
};
