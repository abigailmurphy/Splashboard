// controllers/membershipController.js
const mongoose = require("mongoose");
const User = require("../models/user");
const MembershipRecord = require("../models/membershipRecord");
const { getSettingsForSeason, computeAmountOwed } = require("../services/seasonSettingsHelpers");

/**
 * GET /api/membership/active
 * Returns the user's active membership record via the pointer.
 * If no pointer yet, returns { record: null, user: { ...basic } }.
 */
const getActiveMembership = async (req, res) => {
  try {
    const userId = res.locals.user?.id || req.user?.id;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const user = await User.findById(userId)
      .select("email name activeMembershipRecord")
      .lean();

    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.activeMembershipRecord) {
      return res.json({ record: null, user: { _id: userId, email: user.email, name: user.name } });
    }

    const record = await MembershipRecord.findById(user.activeMembershipRecord).lean();

    return res.json({
      record: record || null,
      user: { _id: userId, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error("getActiveMembership error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * POST /membership/withdraw
 * Body: { recordId }
 * Marks the active record as "rejected" (withdrawn).
 * Does NOT change the pointer (your rule).
 */
const withdrawMembership = async (req, res) => {
  try {
    const userId = res.locals.user?.id || req.user?.id;
    const { recordId } = req.body;

    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    if (!recordId) return res.status(400).json({ error: "recordId is required" });

    const rec = await MembershipRecord.findOne({ _id: recordId, userId });
    if (!rec) return res.status(404).json({ error: "Record not found" });

    // allowed to withdraw from submitted/waitlist/offered
    if (!["submitted", "waitlist", "offered"].includes(rec.status)) {
      return res.status(400).json({ error: "This record cannot be withdrawn" });
    }

    rec.status = "rejected";
    rec.rejectedAt = new Date();
    await rec.save();

    // If it was an offer, clear the flag
    if (rec.status === "offered") {
      await User.updateOne({ _id: userId }, { $set: { hasOffer: false } });
    }
    await User.updateOne({ _id: userId }, { $set: { appliedMember: false } });

    return res.json({ status: true, message: "Withdrawn.", record: rec });
  } catch (err) {
    console.error("withdrawMembership error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * POST /membership/offer/accept
 * Body: { recordId }
 * Accepts an offer: updates the same record + updates User flags.
 * Pointer stays as-is (still points to this record).
 */
const acceptOffer = async (req, res) => {
  try {
    const loggedInId = String(res.locals.user.id || res.locals.user._id); 
    const { recordId, membershipType, membershipPeople, season } = req.body || {};

    if (!recordId || !mongoose.isValidObjectId(recordId)) {
      return res.status(400).json({ message: "recordId (valid ObjectId) required" });
    }

    const record = await MembershipRecord.findById(recordId).lean();
    if (!record) return res.status(404).json({ message: "Offer record not found" });

    // Must be the logged-in user's offer
    if (String(record.userId) !== loggedInId) {
      return res.status(403).json({ message: "Not your offer" });
    }

    if (record.status !== "offered") {
      return res.status(409).json({ message: `Offer is already ${record.status}` });
    }

    const seasonStr = String(season || record.season);
    const settings = await getSettingsForSeason(seasonStr);

    const type = membershipType || record.membershipType || "individual";
    const people = Array.isArray(membershipPeople)
      ? membershipPeople
      : Array.isArray(record.membershipPeople) ? record.membershipPeople : [];

    if (!["individual", "family"].includes(type)) {
      return res.status(400).json({ message: "Invalid membership type" });
    }

    const amountOwed = computeAmountOwed(type, people, settings);

    // 1) Update user
    const updatedUser = await User.findByIdAndUpdate(
      loggedInId,
      {
        $set: {
          isMember: true,
          hasOffer: false,
          membershipType: type,
          membershipCreated: new Date(),
          amountOwed,
        },
      },
      { new: true, runValidators: true }
    ).select("-password");

    // 2) Mark the offer record accepted
    await MembershipRecord.findByIdAndUpdate(
      record._id,
      {
        $set: {
          status: "accepted",
          acceptedAt: new Date(),
          amountOwed,
          settingsSnapshot: { cost: settings.cost, deadlines: settings.deadlines },
        },
      },
      { new: true }
    );

    return res.json({ message: "Membership accepted", user: updatedUser });
  } catch (err) {
    console.error("acceptOffer error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /membership/offer/decline
 * Body: { recordId }
 * Declines an offer: mark record rejected + clear user's hasOffer.
 * Pointer stays as-is (your rule).
 */
const declineOffer = async (req, res) => {
  try {
    const userId = res.locals.user?.id || req.user?.id;
    const { recordId } = req.body;

    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    if (!recordId) return res.status(400).json({ error: "recordId is required" });

    const rec = await MembershipRecord.findOne({ _id: recordId, userId });
    if (!rec) return res.status(404).json({ error: "Record not found" });
    if (rec.status !== "offered") return res.status(400).json({ error: "Record is not currently offered" });

    rec.status = "rejected";
    rec.rejectedAt = new Date();
    await rec.save();

    await User.updateOne({ _id: userId }, { $set: { hasOffer: false } });

    return res.json({ status: true, message: "Offer declined.", record: rec });
  } catch (err) {
    console.error("declineOffer error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getActiveMembership,
  withdrawMembership,
  acceptOffer,
  declineOffer,
};
