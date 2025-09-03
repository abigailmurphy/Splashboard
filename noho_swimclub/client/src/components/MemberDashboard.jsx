import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import MembershipInfo from "./Membership";
import "./modal.css";
import {useAuth} from "./Context";

function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return Number.isNaN(dt) ? String(d) : dt.toLocaleString();
}

function StatusBanner({ status }) {
  const map = {
    offered:   { cls: "banner banner-success", text: "🎉 Congratulations! You have a membership offer." },
    submitted: { cls: "banner banner-info",    text: "Thanks for applying! You're on the waitlist." },
    waitlist:  { cls: "banner banner-info",    text: "You're on the waitlist." },
    accepted:  { cls: "banner banner-green",   text: "✅ Welcome! Your membership is active." },
    draft:     { cls: "banner banner-muted",   text: "Draft application saved." },
    rejected:  { cls: "banner banner-warn",    text: "You have withdrawn your application." },
    revoked:   { cls: "banner banner-warn",    text: "Your offer was revoked." },
    expired:   { cls: "banner banner-warn",    text: "Your offer has expired." },
  };
  const b = map[status] || { cls: "banner banner-muted", text: "Membership" };
  return <div className={b.cls}>{b.text}</div>;
}

function RecordSummary({ record }) {
  const familySize = useMemo(
    () => (Array.isArray(record?.membershipPeople) ? record.membershipPeople.length : 0),
    [record]
  );

  const totalCost =
    record?.membershipType === "individual"
      ? `$${Math.max(1, familySize) * 250}`
      : record?.membershipType === "family"
      ? "$580"
      : "—";

  return (
    
    <div className="modal-panel">
      <h2 className="card-title">Your Application</h2>
      <div className="ucard-grid">
        <div className ="ucard-section">
          <div className="ucard-row"><span>Status</span><strong>{record?.status || "—"}</strong></div>
          <div className="ucard-row"><span>Season</span><strong>{record?.season || "—"}</strong></div>
          
          <div className="ucard-row"><span>Applied</span><strong>{fmtDate(record?.applicationDate)}</strong></div>
          {record?.offeredAt   ? <div className="ucard-row"><span>Offered</span><strong>{fmtDate(record.offeredAt)}</strong></div> : null}
          {record?.acceptedAt  ? <div className="ucard-row"><span>Accepted</span><strong>{fmtDate(record.acceptedAt)}</strong></div> : null}
        </div>
        <div className ="ucard-section">
          <div className="ucard-row"><span>Membership Type</span><strong>{record?.membershipType || "—"}</strong></div>
          <div className="ucard-row"><span>Family Size</span><strong>{familySize}</strong></div>
          <div className="ucard-row"><span>Estimated Cost</span><strong>{totalCost}</strong></div>
        </div>
      </div>
      <div className ="ucard-section">
      <h3 className="section-title">Members</h3>
      {Array.isArray(record?.membershipPeople) && record.membershipPeople.length ? (
        <ul className="list">
          {record.membershipPeople.map((p, i) => (
            <li key={i}>
              {p.type}: {p.firstName} {p.lastName}
              {p.dob ? ` — DOB: ${new Date(p.dob).toLocaleDateString()}` : ""}
              {p.semail ? ` — ${p.semail}` : ""}
            </li>
          ))}
        </ul>
      ) : (
        <p>—</p>
      )}
    </div>
    <div className ="ucard-section">
      <h3 className="section-title">Contact</h3>
      <p>
        {record?.address?.street ? `${record.address.street}, ` : ""}
        {record?.address?.city ? `${record.address.city}, ` : ""}
        {record?.address?.state ? `${record.address.state} ` : ""}
        {record?.address?.zipCode ? record.address.zipCode : ""}
      </p>
      <p>
        {record?.cell ? `Cell: ${record.cell}` : ""}
        {record?.cell2 ? ` • Cell 2: ${record.cell2}` : ""}
      </p>
      <p>
        {record?.homePhone ? `Home: ${record.homePhone}` : ""}
        {record?.workPhone ? ` • Work: ${record.workPhone}` : ""}
      </p>
    </div>
    </div>
    
  );
}

export default function Membership() {
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState(null);
  const [user, setUser] = useState(null);
  const { setHasApplied } = useAuth();

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:4000/membership/active", {
        withCredentials: true,
      });
      setRecord(res.data?.record || null);
      setUser(res.data?.user || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleWithdraw = async () => {
    if (!record?._id) return;
    if (!window.confirm("Are you sure you want to withdraw?")) return;
    await axios.post(
      "http://localhost:4000/membership/withdraw",
      { recordId: record._id },
      { withCredentials: true }
    );
    setHasApplied(false);
    
    await load();
  };

  const handleAccept = async () => {
    if (!record?._id) return;
    await axios.post(
      "http://localhost:4000/membership/offer/accept",
      { recordId: record._id },
      { withCredentials: true }
    );
    await load();
  };

  const handleDecline = async () => {
    if (!record?._id) return;
    if (!window.confirm("Decline this offer?")) return;
    await axios.post(
      "http://localhost:4000/membership/offer/decline",
      { recordId: record._id },
      { withCredentials: true }
    );
    await load();
  };

  if (loading) {
    return (
      <div className="page">
        <h1 className="dashboard-title">Membership</h1>
        <p>Loading…</p>
      </div>
    );
  }

  if (!record || record.status == "rejected") {
    return (
      <MembershipInfo/>
    );
  }

  return (
    
      
    
    <div style ={{display: "flex",flexDirection: "row", justifyContent:"space-between", padding:30}} >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <h1 className="dashboard-title">Membership</h1>
        <StatusBanner status={record.status} />
        <RecordSummary record={record} />
      </div>

      {/* CTAs */}
      
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "left"}}>
        <p style={{maxWidth:520}}>Swim Club membership is full for 2025, as we have been every year since 1985.
          All 2025 members and those top 10–15 people on the waitlist will receive an email
          with information for renewal/membership in mid-March of 2026 for the 2026 season.
          On or about April 5, another set of membership offers will be sent based on the
          number of openings we have. If we still have openings, another set of membership
          offers will be sent on or about April 26 until we are full.</p>

      {(record.status === "submitted" || record.status === "waitlist") && (
        <div className="actions">
          <button className="button-9" style ={{maxWidth:200}} onClick={handleWithdraw}>
            Withdraw Application
          </button>
        </div>
      )}

      {record.status === "offered" && (
        <div className="actions">
          <button className="button-9 bg-green-600 hover:bg-green-700" onClick={handleAccept}>
            Accept Offer
          </button>
          <button className="button-9 bg-red-600 hover:bg-red-700" onClick={handleDecline}>
            Decline Offer
          </button>
        </div>
      )}

      {record.status === "accepted" && (
        <div className="card">
          <h2 className="card-title">Member Dashboard</h2>
          <p>Welcome! We’ll show payment status, gate info, and passes here.</p>
        </div>
      )}
    
    </div>
    </div>
  );
}
