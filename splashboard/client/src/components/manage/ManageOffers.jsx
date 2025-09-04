import React, { useEffect, useState } from "react";
import axios from "axios";
import UserInfoCard from "../UserInfoCard";

export default function ManageWaitlist() {
  const [season, setSeason] = useState(String(new Date().getFullYear()));

  const [fullOutstanding, setFullOutstanding] = useState([]);

  
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
        const [off] = await Promise.all([
          
          axios.get("http://localhost:4000/admin/offers", {
            params: { season },
            withCredentials: true,
          }),
        ]);

        
        const offRows = (off.data?.offers || []).map(adaptRecord);

        // Oldest first, just in case
        offRows.sort((a, b) => {
          const aDate = a.raw.offeredAt ? new Date(a.raw.offeredAt) : new Date(0);
          const bDate = b.raw.offeredAt ? new Date(b.raw.offeredAt) : new Date(0);
          return aDate - bDate;
        });

      
       
        setOutstandingOffers(offRows);
        setFullOutstanding(offRows);
        
      } catch (e) {
        console.error("Failed to load /members/offers", e);
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

  
  
  const existingMembers = members.reduce(
    (sum, user) => sum + familySize(user),
    0
  );
  const outOffers = (outstandingOffers ?? []).reduce(
    (sum, user) => sum + familySize(user),
    0
  );



  useEffect(() => {
    setOutstandingOffers(applyFilters(fullOutstanding));
  }, [searchTerm, minFamily, maxFamily, fullOutstanding]);

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
      setFullOutstanding((prev) => prev.filter((u) => u._id !== user._id));
      
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
      setFullOutstanding((prev) => prev.filter((u) => u._id !== user._id));
      
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
      setFullOutstanding((prev) => prev.filter((u) => u._id !== user._id));
      
      setOutstandingOffers((prev) => [...prev, user]);
      setOpenUser(null);
    } catch (e) {
      console.error(e);
      alert("Failed to create offer.");
    }
  };

  return (
    <div>
      <h1 className="dashboard-title">Manage: Offers</h1>

      {/* Season picker (simple) */}
      <div className="filters" style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>Season:</label>
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
        
        <div className="stat-card highlight">
          <strong>Total Members:</strong>{" "}
          {existingMembers + outOffers }
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <strong>Existing Memberships:</strong> {members.length}
        </div>
        <div className="stat-card">
          <strong>Outstanding Offers:</strong> {outstandingOffers?.length ?? 0}
        </div>
       
        <div className="stat-card highlight">
          <strong>Total Memberships:</strong>{" "}
          {members.length }
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
          <h2>Outstanding Offers</h2>

          <div className="scrollable-list">
            {outstandingOffers.length === 0 && <p>No current outstanding offers.</p>}
            {outstandingOffers.map((user) => (
              <li key={user._id} className="user-card">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong>
                      {user.name.first} {user.name.last}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <i>Offered At: </i>
                    <span>{fmtDate(user.raw.offeredAt)}</span>
                  </div>
                </div>

                <span>
                  <b>{familySize(user)}</b>
                </span>
                <button className="btn info" onClick={() => setOpenUser(user)}>
                  More
                </button>

                <button className="btn " onClick={() => setOpenUser(user)}>
                  Remind
                </button>

                
              </li>
            ))}
          </div>
        </div>

        
          
      </div>

      {/* TODO: REMIND */}
      <div className="send-container">
        <button
          onClick={handleReject}
          disabled={!outstandingOffers.length}
          className="btn-send"
        >
          Remind All
        </button>
      </div>

      <UserInfoCard
        open={!!openUser}
        onClose={() => setOpenUser(null)}
        user={openUser}
        context="offer"
        onOffer={handleOffer}
        onReject={handleReject}
        onDelete={handleDelete}
      />
    </div>
  );
}
