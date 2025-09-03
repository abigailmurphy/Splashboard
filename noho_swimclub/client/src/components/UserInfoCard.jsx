import React, { useMemo } from "react";
import Modal from "./Modal";
import "./usercard.css";

// Pretty, cross-browser date+time with TZ label
function fmtDate(
  d,
  {
    withTime = false,
    withSeconds = false,
    timeZone = "America/New_York",
    locale,
  } = {}
) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);

  const base = { year: "numeric", month: "numeric", day: "numeric", timeZone };
  const time = withTime
    ? {
        hour: "numeric",
        minute: "2-digit",
        ...(withSeconds ? { second: "2-digit" } : {}),
        timeZoneName: "short",
      }
    : {};

  return new Intl.DateTimeFormat(locale, { ...base, ...time }).format(dt);
}

// pull fields regardless of “flat” or “snapshot” shape
function pickPersonFields(p) {
  const firstName = p.firstName ?? p.snapshot?.firstName ?? "";
  const lastName = p.lastName ?? p.snapshot?.lastName ?? "";
  const dob = p.dob ?? p.snapshot?.dob ?? null;
  return { firstName, lastName, dob };
}

function displayMPChild(p, idx) {
  const { firstName, lastName, dob } = pickPersonFields(p);
  const name = [firstName, lastName].filter(Boolean).join(" ");
  const dobTxt = dob ? ` (DOB: ${fmtDate(dob)})` : "";
  return (
    <li key={idx} className="ucard-row">
      <span>{name || "—"}</span>
      <span>{dobTxt}</span>
    </li>
  );
}

function computeFamilySizeFromMP(user) {
  const mp = Array.isArray(user?.membershipPeople) ? user.membershipPeople : [];
  return mp.length; // Self + selected spouse/children
}

export default function UserInfoCard({
  open,
  onClose,
  user,
  context = "waitlist",
  onOffer,
  onReject,
  onDelete,
  onRevoke,
}) {
  const snap = user?.raw || user || {};
  const mp = Array.isArray(user?.membershipPeople) ? user.membershipPeople : [];

  const getType = (p) => p.type ?? p.role;
  const spouseMP = mp.find((p) => getType(p) === "Spouse");
  const childrenMP = mp.filter((p) => getType(p) === "Child");

  const fullName = useMemo(() => {
    const f = user?.name?.first || "";
    const l = user?.name?.last || "";
    return [f, l].filter(Boolean).join(" ");
  }, [user]);

  // Address — prefer snapshot on record, fallback to legacy flat fields if present
  const addr = useMemo(() => {
    const a = snap.address || {};
    const street = a.street ?? user?.address ?? "";
    const city = a.city ?? user?.city ?? "";
    const state = a.state ?? user?.state ?? "";
    const zip = a.zipCode ?? user?.zipCode ?? "";
    const line1 = [street, city].filter(Boolean).join(", ");
    const line2 = [state, zip].filter(Boolean).join(" ");
    return [line1, line2].filter(Boolean).join(" • ");
  }, [snap, user]);

  // Contact phones — prefer record snapshot, fallback to legacy
  const cell =  snap.cell ?? user?.cell ?? "";
  const cell2 = snap.cell2 ?? user?.cell2 ?? "";
  const homePhone = snap.homePhone ?? user?.homePhone ?? "";
  const workPhone = snap.workPhone ?? user?.workPhone ?? "";

  // Status badge — prefer season status from record; show user flags only as fallback
  const statusLabel = (() => {
    const s = snap.status;
    if (s) {
      // map to display text
      switch (s) {
        case "accepted":
          return "Member";
        case "offered":
          return "Offer";
        case "submitted":
        case "waitlist":
          return "Applied";
        case "revoked":
          return "Revoked";
        case "rejected":
          return "Rejected";
        case "expired":
          return "Expired";
        case "draft":
          return "Draft";
        default:
          return s;
      }
    }
    // fallback to user flags if no record status
    if (user?.isMember) return "Member";
    if (user?.hasOffer) return "Offer";
    if (user?.appliedMember || user?.hasApplied) return "Applied";
    return "User";
  })();

  const statusClass = (() => {
    const s = snap.status;
    if (s === "accepted" || user?.isMember) return "badge-green";
    if (s === "offered" || user?.hasOffer) return "badge-purple";
    if (s === "submitted" || s === "waitlist" || user?.appliedMember || user?.hasApplied) return "badge-amber";
    if (s === "revoked" || s === "rejected" || s === "expired") return "badge-gray";
    if (s === "draft") return "badge-gray";
    return "badge-gray";
  })();

  const spouseEmail = spouseMP?.semail || ""; // spouse email comes from roster

  const familySize = computeFamilySizeFromMP(user);

  return (
    <Modal isOpen={open} onClose={onClose} ariaLabel={`User info for ${fullName}`}>
      <div className="ucard">
        <header className="ucard-header">
          <div>
            <h2 className="ucard-title">{fullName || "—"}</h2>
            <p className="ucard-sub">
              {user?.email ? <span>{user.email}</span> : null}
              {cell ? <span> • {cell}</span> : null}
              {snap?.membershipType || user?.membershipType ? (
                <span> • {snap.membershipType || user.membershipType}</span>
              ) : null}
            </p>
          </div>
          <div className={`badge ${statusClass}`}>{statusLabel}</div>
        </header>

        <section className="ucard-grid">
          <div className="ucard-section">
            <h3>Household</h3>
            <div className="ucard-row">
              <span>Family Size</span>
              <strong>{familySize}</strong>
            </div>
            <div className="ucard-row">
              <span>Application Date</span>
              <strong>{fmtDate(user?.applicationDate, { withTime: true })}</strong>
            </div>
            <div className="ucard-row">
              <span>Offer Date</span>
              <strong>{fmtDate(user?.raw.offeredAt, { withTime: true })}</strong>
            </div>
            <div className="ucard-row">
              <span>Has Offer</span>
              <strong>
                {String(
                  snap?.status === "offered" ||
                    user?.hasOffer ||
                    (snap?.user && snap.user.hasOffer) ||
                    false
                )}
              </strong>
            </div>
            <div className="ucard-row">
              <span>Has Applied</span>
              <strong>
                {String(
                  ["submitted", "waitlist", "accepted", "offered", "draft"].includes(snap?.status) ||
                    user?.appliedMember ||
                    user?.hasApplied ||
                    (snap?.user && snap.user.appliedMember) ||
                    false
                )}
              </strong>
            </div>
            
            
          </div>

          <div className="ucard-section">
            <h3>Address</h3>
            <div className="ucard-text">{addr || "—"}</div>
            <div><br /></div>

            <h3>Additional Contact</h3>
            <div className="ucard-row">
              <span>Primary Cell</span>
              <strong>{cell || "—"}</strong>
            </div>
            <div className="ucard-row">
              <span>Cell 2</span>
              <strong>{cell2 || "—"}</strong>
            </div>
            <div className="ucard-row">
              <span>Home Phone</span>
              <strong>{homePhone || "—"}</strong>
            </div>
            <div className="ucard-row">
              <span>Work Phone</span>
              <strong>{workPhone || "—"}</strong>
            </div>
          </div>

          <div className="ucard-section">
            <h3>Spouse on Membership</h3>
            {spouseMP ? (
              <>
                {(() => {
                  const { firstName, lastName } = pickPersonFields(spouseMP);
                  return (
                    <>
                      <div className="ucard-row">
                        <span>Name</span>
                        <strong>{[firstName, lastName].filter(Boolean).join(" ") || "—"}</strong>
                      </div>
                      <div className="ucard-row">
                        <span>Spouse Email</span>
                        <strong>{spouseEmail || "—"}</strong>
                      </div>
                    </>
                  );
                })()}
              </>
            ) : (
              <div className="ucard-text">None on file</div>
            )}
          </div>

          <div className="ucard-section">
            <h3>Children on Membership</h3>
            {childrenMP.length ? (
              <ul className="ucard-list">{childrenMP.map(displayMPChild)}</ul>
            ) : (
              <div className="ucard-text">None on file</div>
            )}
          </div>
        </section>

        <footer className="ucard-actions">
          {context === "waitlist" ? (
            <div className="ucard-actions-group">
              <span className="group-label">More actions</span>
              <div className="group-buttons">
                <button className="btn primary" onClick={() => onOffer?.(user)}>
                  Offer membership
                </button>
                <button className="btn warning" onClick={() => onReject?.(user)}>
                  Reject request
                </button>
                <button className="btn danger" onClick={() => onDelete?.(user)}>
                  Delete user
                </button>
              </div>
            </div>
          ) : null}

          {context === "member" ? (
            <div className="ucard-actions-group">
              <span className="group-label">More actions</span>
              <div className="group-buttons">
                <button className="btn danger" onClick={() => onRevoke?.(user)}>
                  Revoke membership
                </button>
              </div>
            </div>
          ) : null}

          {context === "offer" ? (
            <div className="ucard-actions-group">
              <span className="group-label">More actions</span>
              <div className="group-buttons">
                <button className="btn primary" onClick={() => onRevoke?.(user)}>
                  Override Offer
                </button>
                <button className="btn danger" onClick={() => onRevoke?.(user)}>
                  Revoke Offer
                </button>
              </div>
            </div>
          ) : null}
        </footer>
      </div>
    </Modal>
  );
}
