import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import UserInfoCard from "../UserInfoCard";

export default function ManageMembers() {
  // Season picker (target season you care about)
  const [season, setSeason] = useState(null);
  const prevSeason = useMemo(() => String(Number(season) + 1), [season]);

  const [confirmedMembers, setConfirmedMembers] = useState([]);     // accepted list
  const [nonConfirmedMembers, setNonConfirmedMembers] = useState([]); // offered list
  const [loading, setLoading] = useState(true);
  const [openUser, setOpenUser] = useState(null);

  // Search controls
  const [searchTerm, setSearchTerm] = useState("");
  const [minFamily, setMinFamily] = useState(1);
  const [maxFamily, setMaxFamily] = useState(10);
  
  // currentSeason = the backend's current working season
  const [currentSeason, setCurrentSeason] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const r = await axios.get("http://localhost:4000/settings", { withCredentials: true });
        const ws = r.data?.workingSeason ? String(r.data.workingSeason) : String(new Date().getFullYear());
        setCurrentSeason(ws);
        setSeason(ws); // default the view to the working season
      } catch (e) {
        // fallback if settings route isn’t ready yet
        const fallback = String(new Date().getFullYear());
        setCurrentSeason(fallback);
        setSeason(fallback);
        console.warn("Could not fetch /settings; falling back to current year", e);
      }
    })();
  }, []);
  // Adapter for new backend record shape
  const adaptRecord = (rec) => {
    const nameFromUser = rec.user?.name;
    const selfEntry = Array.isArray(rec.membershipPeople)
      ? rec.membershipPeople.find((p) => p.type === "Self")
      : null;

    return {
      _id: rec.userId, // stable key (joined user projection doesn’t include _id)
      userId: rec.userId,
      name: nameFromUser
        ? { first: nameFromUser.first || "", last: nameFromUser.last || "" }
        : { first: selfEntry?.firstName || "", last: selfEntry?.lastName || "" },
      email: rec.user?.email || "",
      membershipType: rec.membershipType || "",
      membershipPeople: rec.membershipPeople || [],
      status: rec.status,
      offeredAt: rec.offeredAt || null,
      acceptedAt: rec.acceptedAt || null,
      raw: rec,
    };
  };

  // Family size comes from membershipPeople
  const familySize = (row) =>
    (Array.isArray(row?.membershipPeople) && row.membershipPeople.length) || 1;

  // Apply filters
  const applyFilters = (baseList) =>
    baseList.filter((user) => {
      const name = `${user.name?.first || ""} ${user.name?.last || ""}`.trim().toLowerCase();
      const nameMatch = name.includes(searchTerm.toLowerCase());
      const size = familySize(user);
      return nameMatch && size >= minFamily && size <= maxFamily;
    });

  // Fetch logic:
  // If there are offers for the selected season => Confirmation mode
  // Else => Normal mode (show previous season accepted members)
  const fetchMembers = async () => {
    setLoading(true);
    try {
      // Offered for the target season?
      const offeredRes = await axios.get("http://localhost:4000/admin/returns", {
        params: { season },
        withCredentials: true,
      });
      const offeredRows = (offeredRes.data?.offers || []).map(adaptRecord);

      if (offeredRows.length > 0) {
        // Confirmation mode in this season
        const acceptedRes = await axios.get("http://localhost:4000/admin/members", {
          params: { season },
          withCredentials: true,
        });
        const acceptedRows = (acceptedRes.data?.members || []).map(adaptRecord);
        

        offeredRows.sort((a, b) => new Date(a.offeredAt || 0) - new Date(b.offeredAt || 0));
        acceptedRows.sort((a, b) => new Date(a.acceptedAt || 0) - new Date(b.acceptedAt || 0));

        setNonConfirmedMembers(offeredRows);
        setConfirmedMembers(acceptedRows);
      } else {
        // Normal mode: show last season's accepted members as seed
        const acceptedPrev = await axios.get("http://localhost:4000/admin/members", {
          params: { season: "2025" },
          withCredentials: true,
        });
        const acceptedPrevRows = (acceptedPrev.data?.members || []).map(adaptRecord);
       
        acceptedPrevRows.sort((a, b) => new Date(a.acceptedAt || 0) - new Date(b.acceptedAt || 0));

        setNonConfirmedMembers([]);
        setConfirmedMembers(acceptedPrevRows);
      }
    } catch (err) {
      console.error("Error fetching members/returns", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season]);

  // Filtered views for display + stats
  const filteredConfirmed = useMemo(
    () => applyFilters(confirmedMembers),
    [confirmedMembers, searchTerm, minFamily, maxFamily]
  );
  const filteredPending = useMemo(
    () => applyFilters(nonConfirmedMembers),
    [nonConfirmedMembers, searchTerm, minFamily, maxFamily]
  );

  const confirmationMode = nonConfirmedMembers.length > 0;

  // Send New Year Offers (create offers for the SELECTED season based on last accepted snapshots)
  const handleSendOffers = async () => {
    if (!confirmedMembers.length) {
      return alert(`No source members from season ${prevSeason} to offer.`);
    }
    const ok = window.confirm(
      `⚠️ Start re-apply session for ${season}?\n\nThis will create OFFERS for all ${confirmedMembers.length} member(s) based on their last accepted snapshot.\n\nProceed?`
    );
    if (!ok) return;

    try {
      const userIds = confirmedMembers.map((m) => m.userId);
      await axios.post(
        "http://localhost:4000/admin/offers/create",
        { season, userIds },
        { withCredentials: true }
      );
      await fetchMembers(); // now there should be pending offers → confirmation mode
    } catch (err) {
      console.error("Error creating offers", err);
      alert("Failed to create offers.");
    }
  };

  // End Re-Apply Session (revoke pending for this season; accepted remain)
  const handleEndSession = async () => {
    if (!nonConfirmedMembers.length) return;
    const ok = window.confirm(
      `⚠️ End re-apply session for ${season}?\n\nAll ${nonConfirmedMembers.length} pending offer(s) will be REVOKED.\n\nProceed?`
    );
    if (!ok) return;

    try {
      const userIds = nonConfirmedMembers.map((m) => m.userId);
      await axios.post(
        "http://localhost:4000/admin/members/remove",
        { season, userIds },
        { withCredentials: true }
      );
      await fetchMembers(); // back to normal mode (no pending offers)
    } catch (err) {
      console.error("Error ending session", err);
      alert("Failed to end re-apply session.");
    }
  };

  if (loading) return <p>Loading...</p>;

  // Stats
  const totalConfirmed = filteredConfirmed.reduce((sum, m) => sum + familySize(m), 0);
  const totalPending = filteredPending.reduce((sum, m) => sum + familySize(m), 0);
  const totalMembers = totalConfirmed + totalPending;

  return (
    <div className="members-dashboard">
      <h1 className="dashboard-title">Manage Members</h1>

      {/* Season picker */}
      <div className="filters" style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>Season:</label>
        <div className="input-wrapper">
          <select value={season} onChange={(e) => setSeason(e.target.value)}>
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
          <strong>Total Members:</strong> {totalMembers}
        </div>
        <div className="stat-card">
          <strong>Confirmed Members:</strong> {totalConfirmed}
        </div>
        <div className="stat-card">
          <strong>Pending Confirmation:</strong> {totalPending}
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

      {confirmationMode ? (
        <>
          {/* Confirmation Mode */}
          <h2>Confirmed Members</h2>
          {filteredConfirmed.length === 0 && <p>No confirmed members yet.</p>}
          <ul>
            {filteredConfirmed.map((user) => (
              <li key={user._id} className="user-card">
                {user.name.first} {user.name.last} — {user.membershipType} — Family Size: {familySize(user)}
              </li>
            ))}
          </ul>

          <h2>Pending Confirmation</h2>
          {filteredPending.length === 0 && <p>No pending members.</p>}
          <ul>
            {filteredPending.map((user) => (
              <li key={user._id} className="user-card">
                {user.name.first} {user.name.last} — {user.membershipType} — Family Size: {familySize(user)}
              </li>
            ))}
          </ul>

          <div className="send-container">
            <button onClick={handleEndSession} className="btn-remove">
              End Re-Apply Session
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Normal Mode */}
          <h2>Existing Memberships</h2>
          {filteredConfirmed.length === 0 && <p>No members.</p>}
          <ul>
            {filteredConfirmed.map((user) => (
              <li key={user._id} className="user-card">
                {user.name.first} {user.name.last} — {user.membershipType} — Family Size: {familySize(user)}
                <button className="btn info" onClick={() => setOpenUser(user)}>More</button>
              </li>
            ))}
          </ul>

          <div className="send-container">
            <button onClick={handleSendOffers} className="btn-send" disabled={!confirmedMembers.length}>
              Send New Year Offers
            </button>
          </div>
        </>
      )}

      <UserInfoCard
        open={!!openUser}
        onClose={() => setOpenUser(null)}
        user={openUser}
        context="member"
        onOffer={() => console.log("offer")}
        onReject={() => console.log("reject")}
        onDelete={() => console.log("delete")}
      />
    </div>
  );
}
