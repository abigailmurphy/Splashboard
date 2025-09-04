import React, { useEffect, useState } from "react";
import axios from "axios";
import UserInfoCard from "../UserInfoCard";

export default function ManageWaitlist() {
  const [season, setSeason] = useState(String(new Date().getFullYear()));

  const [fullWaitlist, setFullWaitlist] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [draftOfferList, setDraftOfferList] = useState([]);
  const [outstandingOffers, setOutstandingOffers] = useState([]);
  const [members, setMemberList] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [minFamily, setMinFamily] = useState(1);
  const [maxFamily, setMaxFamily] = useState(10);
  const [openUser, setOpenUser] = useState(null);

  // Robust adapter: supports responses with or without $lookup user
  const adaptRecord = (rec) => {
    const nameFromUser = rec.user?.name;
    const selfEntry = Array.isArray(rec.membershipPeople)
      ? rec.membershipPeople.find((p) => p.type === "Self")
      : null;

    return {
      // use the User id as the stable key to send offers
      _id: rec.user?._id || rec.userId,
      name: nameFromUser
        ? { first: nameFromUser.first || "", last: nameFromUser.last || "" }
        : { first: selfEntry?.firstName || "", last: selfEntry?.lastName || "" },
      email: rec.user?.email || "",
      applicationDate: rec.applicationDate || rec.createdAt || null,
      membershipPeople: rec.membershipPeople || [],
      raw: rec,
    };
  };

  // Load season-scoped data
  useEffect(() => {
    const run = async () => {
      try {
        const [wl, mem, off] = await Promise.all([
          axios.get("http://localhost:4000/admin/waitlist", {
            params: { season },
            withCredentials: true,
          }),
          axios.get("http://localhost:4000/admin/members", {
            params: { season },
            withCredentials: true,
          }),
          axios.get("http://localhost:4000/admin/offers", {
            params: { season },
            withCredentials: true,
          }),
        ]);

        const wlRows = (wl.data?.waitlist || []).map(adaptRecord);
        const memRows = (mem.data?.members || []).map(adaptRecord);
        const offRows = (off.data?.offers || []).map(adaptRecord);

        // Oldest first, just in case
        wlRows.sort((a, b) => {
          const aDate = a.applicationDate ? new Date(a.applicationDate) : new Date(0);
          const bDate = b.applicationDate ? new Date(b.applicationDate) : new Date(0);
          return aDate - bDate;
        });

        setFullWaitlist(wlRows);
        setWaitlist(wlRows);
        setMemberList(memRows);
        setOutstandingOffers(offRows);
        setDraftOfferList([]); // reset draft when season changes
      } catch (e) {
        console.error("Failed to load waitlist/members/offers", e);
      }
    };
    run();
  }, [season]);

  const familySize = (row) => row?.membershipPeople?.length || 1;

  const applyFilters = (baseList) =>
    baseList.filter((user) => {
      const name = `${user.name?.first || ""} ${user.name?.last || ""}`.trim();
      const nameMatch = name.toLowerCase().includes(searchTerm.toLowerCase());
      const size = familySize(user);
      return nameMatch && size >= minFamily && size <= maxFamily;
    });

  const moveToDraft = (user) => {
    setDraftOfferList((prev) =>
      prev.some((u) => u._id === user._id) ? prev : [...prev, user]
    );
    setWaitlist((prev) => prev.filter((u) => u._id !== user._id));
    setFullWaitlist((prev) => prev.filter((u) => u._id !== user._id));
  };

  const moveBack = (user) => {
    const updatedList = [...fullWaitlist, user];
    updatedList.sort((a, b) => {
      const aDate = a.applicationDate ? new Date(a.applicationDate) : new Date(0);
      const bDate = b.applicationDate ? new Date(b.applicationDate) : new Date(0);
      return aDate - bDate;
    });
    setFullWaitlist(updatedList);
    setWaitlist(applyFilters(updatedList));
    setDraftOfferList((prev) => prev.filter((u) => u._id !== user._id));
  };

  const totalMembersInDraft = draftOfferList.reduce(
    (sum, user) => sum + familySize(user),
    0
  );
  const existingMembers = members.reduce(
    (sum, user) => sum + familySize(user),
    0
  );
  const outOffers = (outstandingOffers ?? []).reduce(
    (sum, user) => sum + familySize(user),
    0
  );

  // ManageWaitlist.jsx (only the sendOffers function changes)

const sendOffers = async () => {
  const confirmSend = window.confirm(
    `You are about to create ${draftOfferList.length} offer record(s) for ${season}, totaling ${totalMembersInDraft} member(s).\n\nContinue?`
  );
  if (!confirmSend) return;

  try {
    // IMPORTANT: send recordIds, not userIds
    const recordIds = draftOfferList
      .map((u) => u.raw?._id)         // raw is the MembershipRecord from the backend
      .filter(Boolean);

    if (recordIds.length === 0) {
      alert("No valid records selected.");
      return;
    }

    await axios.post(
      "http://localhost:4000/admin/offers/mark",
      { season, recordIds },
      { withCredentials: true }
    );

    alert("Offers marked for the selected season.");
    setDraftOfferList([]);

    // Refresh offers list
    const off = await axios.get("http://localhost:4000/admin/offers", {
      params: { season },
      withCredentials: true,
    });
    setOutstandingOffers((off.data?.offers || []).map(adaptRecord));
  } catch (error) {
    console.error("Failed to mark offers", error);
    alert("Something went wrong while marking offers.");
  }
};


  useEffect(() => {
    setWaitlist(applyFilters(fullWaitlist));
  }, [searchTerm, minFamily, maxFamily, fullWaitlist]);

  function fmtDate(d) {
    if (!d) return null;
    const dt = new Date(d);
    return Number.isNaN(dt) ? String(d) : dt.toLocaleDateString();
  }

  // Optional item actions — wire these to your new admin endpoints when ready
  const handleReject = async (user) => {
    try {
      await axios.post(
        "http://localhost:4000/admin/reject",
        { userId: user._id, season },
        { withCredentials: true }
      );
      setFullWaitlist((prev) => prev.filter((u) => u._id !== user._id));
      setWaitlist((prev) => prev.filter((u) => u._id !== user._id));
      setOpenUser(null);
    } catch (e) {
      console.error(e);
      alert("Failed to reject request.");
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user?.name?.first} ${user?.name?.last}? This cannot be undone.`)) return;
    try {
      await axios.delete(
        `http://localhost:4000/admin/users/${user._id}`,
        { withCredentials: true }
      );
      setFullWaitlist((prev) => prev.filter((u) => u._id !== user._id));
      setWaitlist((prev) => prev.filter((u) => u._id !== user._id));
      setOpenUser(null);
    } catch (e) {
      console.error(e);
      alert("Failed to delete user.");
    }
  };

  const handleOffer = async (user) => {
    try {
      await axios.post(
        "http://localhost:4000/admin/offers/create",
        { season, userIds: [user._id] },
        { withCredentials: true }
      );
      // Move from waitlist to outstanding (local)
      setFullWaitlist((prev) => prev.filter((u) => u._id !== user._id));
      setWaitlist((prev) => prev.filter((u) => u._id !== user._id));
      setOutstandingOffers((prev) => [...prev, user]);
      setOpenUser(null);
    } catch (e) {
      console.error(e);
      alert("Failed to create offer.");
    }
  };

  return (
    <div>
      <h1 className="dashboard-title">Manage: Waitlist</h1>

      {/* Season picker (simple) */}
      <div className="filters" style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>Year:</label>
        <div className="input-wrapper">
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
          >
            {/* You can make this dynamic via /membership/seasons if you prefer */}
            {[-1, 0, 1, 2].map((offset) => {
              const y = String(new Date().getFullYear() + offset);
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <strong>Existing Members:</strong> {existingMembers}
        </div>
        <div className="stat-card">
          <strong>Outstanding Offers (#):</strong> {outOffers}
        </div>
        <div className="stat-card">
          <strong>Members in Draft:</strong> {totalMembersInDraft}
        </div>
        <div className="stat-card highlight">
          <strong>Total Members:</strong>{" "}
          {existingMembers + outOffers + totalMembersInDraft}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <strong>Existing Memberships:</strong> {members.length}
        </div>
        <div className="stat-card">
          <strong>Outstanding Offers:</strong> {outstandingOffers?.length ?? 0}
        </div>
        <div className="stat-card">
          <strong>Draft Offers:</strong> {draftOfferList.length}
        </div>
        <div className="stat-card highlight">
          <strong>Total Memberships:</strong>{" "}
          {members.length + draftOfferList.length}
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search by name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <input
          type="number"
          min={1}
          value={minFamily}
          onChange={(e) => setMinFamily(Number(e.target.value))}
          placeholder="Min family size"
        />
        <input
          type="number"
          min={1}
          value={maxFamily}
          onChange={(e) => setMaxFamily(Number(e.target.value))}
          placeholder="Max family size"
        />
      </div>

      {/* Lists */}
      <div className="lists-container">
        {/* Waitlist */}
        <div className="list-section">
          <h2>Waitlist (Oldest First)</h2>

          <div className="scrollable-list">
            {waitlist.length === 0 && <p>No users in waitlist.</p>}
            {waitlist.map((user) => (
              <li key={user._id} className="user-card">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong>
                      {user.name.first} {user.name.last}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <i>Application Date: </i>
                    <span>{fmtDate(user.applicationDate)}</span>
                  </div>
                </div>

                <span>
                  <b>{familySize(user)}</b>
                </span>
                <button className="btn info" onClick={() => setOpenUser(user)}>
                  More
                </button>

                <button className="btn-move" onClick={() => moveToDraft(user)}>
                  Move to Draft Offer
                </button>
              </li>
            ))}
          </div>
        </div>

        {/* Draft Offer List */}
        <div className="list-section">
          <h2>Draft Offer List</h2>

          <div className="scrollable-list">
            {draftOfferList.length === 0 && <p>No users in draft list.</p>}
            {draftOfferList.map((user) => (
              <li key={user._id} className="user-card">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong>
                      {user.name.first} {user.name.last}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <i>Application Date: </i>
                    <span>{fmtDate(user.applicationDate)}</span>
                  </div>
                </div>

                <span>
                  <b>{familySize(user)}</b>
                </span>
                <button className="btn info" onClick={() => setOpenUser(user)}>
                  More
                </button>
                <button className="btn-remove" onClick={() => moveBack(user)}>
                  Remove
                </button>
              </li>
            ))}
          </div>
        </div>
      </div>

      {/* Send Offers Button */}
      <div className="send-container">
        <button
          onClick={sendOffers}
          disabled={!draftOfferList.length}
          className="btn-send"
        >
          Send Offers
        </button>
      </div>

      <UserInfoCard
        open={!!openUser}
        onClose={() => setOpenUser(null)}
        user={openUser}
        context="waitlist"
        onOffer={handleOffer}
        onReject={handleReject}
        onDelete={handleDelete}
      />
    </div>
  );
}
