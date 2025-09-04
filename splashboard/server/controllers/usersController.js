// controllers/membershipController.js
const User = require("../models/user");
const MembershipRecord = require("../models/membershipRecord");
const { getSettingsForSeason, computeAmountOwed } = require("../services/seasonSettingsHelpers");

// GET /user
const getUser = async (req, res) => {
  try {
    const user = await User.findById(res.locals.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /user/:id
const updateUser = async (req, res) => {
  const userId = req.params.id;
  const loggedInId = res.locals.user.id;

  if (userId !== loggedInId) {
    return res.status(403).json({ message: "Unauthorized update attempt" });
  }
  const { first, last, email, password } = req.body;

  const updateData = {
    email,
    name: {
      first,
      last,
    },
  };

  if (password) updateData.password = password; // only update if sent

  try {
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({ updatedUser });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /user/:id
const deleteUser = async (req, res) => {
  const userId = req.params.id;
  const loggedInId = res.locals.user.id;

  if (userId !== loggedInId) {
    return res.status(403).json({ message: "Unauthorized delete attempt" });
  }

  try {
    await User.findByIdAndDelete(userId);
    res.clearCookie("jwt");
    res.json({ message: "Account deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
const getMyMembership = async (req, res) => {
  try {
    const userId = res.locals.user?.id || req.user?.id;
    const { season } = req.query;
    if (!userId) return res.status(401).json({ status: false, message: "Not authenticated" });
    if (!season) return res.status(400).json({ status: false, message: "season is required" });

    const record = await MembershipRecord.findOne({ userId, season });
    return res.json({ status: true, record });
  } catch (err) {
    console.error("getMyMembership error:", err);
    return res.status(500).json({ status: false, message: "Failed to load membership record" });
  }
};

// controllers/membershipController.js (add/replace)
const getWizardInit = async (req, res) => {
  try {
    const userId = res.locals.user?.id || req.user?.id;
    const { season } = req.query;

    if (!userId) return res.status(401).json({ status: false, message: "Not authenticated" });
    if (!season) return res.status(400).json({ status: false, message: "season is required" });

    const [user, record] = await Promise.all([
      User.findById(userId).select("-password"),
      MembershipRecord.findOne({ userId, season }),
    ]);

    if (!user) return res.status(404).json({ status: false, message: "User not found" });

    // ALWAYS from User (identity-level)
    const userFirst = user.name?.first || "";
    const userLast  = user.name?.last  || "";
    const userEmail = user.email || "";

    // Prefer season snapshot for these (if a draft/submit exists), else fallback to User
    const snapAddr = record?.address || user.address || {};
    const snapCell = record?.cell ?? user.cell ?? "";
    const snapCell2 = record?.cell2 ?? user.cell2 ?? "";
    const snapHome = record?.homePhone ?? user.homePhone ?? "";
    const snapWork = record?.workPhone ?? user.workPhone ?? "";

    const formDefaults = {
      // identity from USER
      first: userFirst,
      last: userLast,
      email: userEmail,

      // spouse & household (canonical on USER)
      sfirst: user.spouse?.sfirst || "",
      slast:  user.spouse?.slast  || "",
      semail: user.spouse?.semail || "",
      children: user.children || [],

      // contact/address snapshot (prefer RECORD, else USER)
      address: snapAddr.street || "",
      city:    snapAddr.city   || "",
      state:   snapAddr.state  || "",
      zipCode: snapAddr.zipCode|| "",

      cell: snapCell,
      cell2: snapCell2,
      homePhone: snapHome,
      workPhone: snapWork,

      // membership (prefer RECORD snapshot)
      membershipType: record?.membershipType || user.membershipType || "individual",
      membershipPeople: Array.isArray(record?.membershipPeople) ? record.membershipPeople : [],
      notes: record?.notes || "",

      wantsToApply: true,
      season,
    };

    return res.json({ status: true, formDefaults, record, user });
  } catch (err) {
    console.error("getWizardInit error:", err);
    return res.status(500).json({ status: false, message: "Failed to load wizard init" });
  }
};



// Minimal sanitizer: trust FE membershipPeople, trim strings & coerce DOBs
function sanitizeMembershipPeople(membershipPeople = []) {
  if (!Array.isArray(membershipPeople)) membershipPeople = [];

  return membershipPeople.map(p => ({
    type: p.type, // "Self" | "Spouse" | "Child"
    firstName: String(p.firstName || "").trim(),
    lastName:  String(p.lastName  || "").trim(),
    semail:    p.semail ? String(p.semail).trim() : undefined,
    dob:       p.dob ? new Date(p.dob) : undefined,
    id:        p.id ? String(p.id) : undefined,
  }));
}

// POST /membership/apply
const applyMembership = async (req, res) => {
  try {
    const userId = res.locals.user?.id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: false, errors: { auth: "Not authenticated" } });
    }

    const {
      season,
      action = "save",
      membershipType,
      address,
      homePhone,
      workPhone,
      cell,
      cell2,
      sfirst,
      slast,
      semail,
      children,
      membershipPeople,
      notes,
    } = req.body;

    if (!season) {
      return res.status(400).json({ status: false, errors: { season: "Season is required" } });
    }
    if (!membershipType || !["family", "individual"].includes(membershipType)) {
      return res.status(400).json({
        status: false,
        errors: { membershipType: "Membership type must be 'family' or 'individual'" },
      });
    }
    if (!["save", "submit"].includes(action)) {
      return res.status(400).json({ status: false, errors: { action: "action must be 'save' or 'submit'" } });
    }

    // Load current user for snapshot
    const userDoc = await User.findById(userId);
    if (!userDoc) {
      return res.status(404).json({ status: false, errors: { user: "User not found" } });
    }

    // Keep user profile in sync
    const profileUpdates = {
      spouse: {
        sfirst: (sfirst ?? userDoc?.spouse?.sfirst ?? "").trim(),
        slast:  (slast  ?? userDoc?.spouse?.slast  ?? "").trim(),
        semail: (semail ?? userDoc?.spouse?.semail ?? "").trim(),
      },
      address: {
        street:  address?.street  ?? userDoc?.address?.street  ?? "",
        city:    address?.city    ?? userDoc?.address?.city    ?? "",
        state:   address?.state   ?? userDoc?.address?.state   ?? "",
        zipCode: address?.zipCode ?? userDoc?.address?.zipCode ?? "",
      },
      homePhone: (homePhone ?? userDoc.homePhone ?? "") || undefined,
      workPhone: (workPhone ?? userDoc.workPhone ?? "") || undefined,
      cell:      (cell      ?? userDoc.cell      ?? "") || undefined,
      cell2:     (cell2     ?? userDoc.cell2     ?? "") || undefined,
    };

    if (Array.isArray(children)) {
      profileUpdates.children = children
        .map((c) => c && ({
          firstName: String(c.firstName || "").trim(),
          lastName:  String(c.lastName  || "").trim(),
          dob:       c.dob ? new Date(c.dob) : undefined,
        }))
        .filter(c => c && c.firstName && c.lastName && c.dob);
    }

    await User.findByIdAndUpdate(userId, profileUpdates, { new: false });

    // Use FE roster directly
    const roster = sanitizeMembershipPeople(membershipPeople);

    const isSubmit = action === "submit";
    const status = isSubmit ? "submitted" : "draft";
    const settings = await getSettingsForSeason(String(season));
    const estimated = computeAmountOwed(membershipType, roster, settings);
    const recordUpdate = {
      membershipType,
      address: profileUpdates.address,
      homePhone: profileUpdates.homePhone,
      workPhone: profileUpdates.workPhone,
      cell: profileUpdates.cell,
      cell2: profileUpdates.cell2,
      membershipPeople: roster,
      status,
      notes: notes ?? undefined,

      estimatedCost: estimated,
      settingsSnapshot: { cost: settings.cost, deadlines: settings.deadlines },
    };

    if (isSubmit) {
      recordUpdate.applicationDate = new Date();
    }

    const record = await MembershipRecord.findOneAndUpdate(
      { userId, season },
      recordUpdate,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (isSubmit) {
      await User.findByIdAndUpdate(userId, { appliedMember: true ,activeMembershipRecord: record._id}, { new: false });
      
    }

    return res.status(200).json({
      status: true,
      message: isSubmit ? "Membership application submitted." : "Draft saved.",
      record,
    });
  } catch (err) {
    console.error("applyMembership error:", err);
    return res.status(500).json({
      status: false,
      errors: { message: "Failed to save membership application." },
    });
  }
};

// POST /renew-membership
const renewMembership = async (req, res) => {
  try {
    const userId = res.locals.user.id || req.user?.id;

    const {
      sfirst = "",
      slast = "",
      semail = "",
      address = "",
      city = "",
      state = "",
      zipCode = null,
      homePhone = "",
      workPhone = "",
      cell = "",
      cell2 = "",
      children = [],
      membershipType,
    } = req.body;

    if (membershipType && !["family", "individual"].includes(membershipType)) {
      return res.status(400).json({
        status: false,
        errors: { membershipType: "Membership type must be 'family' or 'individual'" },
      });
    }

    const cleanChildren = children.map((child) => ({
      ...child,
      dob: child.dob ? new Date(child.dob) : null,
    }));

    const updateData = {
      spouse: { sfirst, slast, semail },
      address,
      city,
      state,
      zipCode: zipCode !== null ? Number(zipCode) : undefined,
      homePhone,
      workPhone,
      cell,
      cell2,
      children: cleanChildren,
      membershipType,
      hasOffer: false,
    };

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ status: false, errors: { message: "User not found" } });
    }

    res.status(200).json({
      status: true,
      message: "Membership renewed successfully.",
      user: {
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        membershipType: updatedUser.membershipType,
        hasOffer: updatedUser.hasOffer,
      },
    });
  } catch (err) {
    console.error("Membership renewal error:", err);
    res.status(400).json({
      status: false,
      errors: { message: "Failed to renew membership." },
    });
  }
};

module.exports = { getUser, updateUser, deleteUser, applyMembership, renewMembership,getMyMembership, getWizardInit };
