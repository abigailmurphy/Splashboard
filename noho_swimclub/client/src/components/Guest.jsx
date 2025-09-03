import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./guest.css";

function fmtDayLabel(yyyy_mm_dd) {
  const [y, m, d] = yyyy_mm_dd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function GuestSignupPage() {
  const [season, setSeason] = useState(null);
  const [perDayCap, setPerDayCap] = useState(25);
  const [perUserMax, setPerUserMax] = useState(5);
  const [days, setDays] = useState([]);         // { day, cap, used, remaining }
  const [mine, setMine] = useState([]);         // { day, guests }
  const [draftGuests, setDraftGuests] = useState({}); // { [day]: number }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const mineMap = useMemo(() => {
    const m = new Map();
    mine.forEach(x => m.set(x.day, x.guests));
    return m;
  }, [mine]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [avail, my] = await Promise.all([
        axios.get("http://localhost:4000/guest/availability", { withCredentials: true }),
        axios.get("http://localhost:4000/guest/mine",         { withCredentials: true }),
      ]);
      setSeason(avail.data.season);
      setPerDayCap(avail.data.perDayCap);
      setPerUserMax(avail.data.perUserMax);
      setDays(avail.data.days || []);
      setMine(my.data.items || []);
      const dg = {};
      (my.data.items || []).forEach(it => { dg[it.day] = it.guests; });
      setDraftGuests(dg);
    } catch (e) {
      console.error("loadAll failed", e);
      alert("Failed to load guest signups.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // Live updates via SSE
  useEffect(() => {
    if (!season) return;
    const es = new EventSource(`http://localhost:4000/guest/stream?season=${season}`, { withCredentials: true });

    es.addEventListener("day", (e) => {
      const m = JSON.parse(e.data); // { season, day, used, cap, remaining, ver }
      setDays(prev => prev.map(d => d.day === m.day ? { ...d, used: m.used, cap: m.cap, remaining: m.remaining } : d));
    });

    es.addEventListener("seasonCap", (e) => {
      const m = JSON.parse(e.data); // { season, cap }
      setPerDayCap(m.cap);
      setDays(prev => prev.map(d => ({ ...d, cap: m.cap, remaining: Math.max(m.cap - d.used, 0) })));
    });

    es.addEventListener("ping", () => {});
    es.onerror = () => {/* optional: show "reconnecting…" */};

    return () => es.close();
  }, [season]);

  const saveGuests = async (day) => {
    const guests = Number(draftGuests[day] ?? 0);
    if (!Number.isInteger(guests) || guests < 0 || guests > perUserMax) {
      return alert(`Guests must be 0..${perUserMax}.`);
    }
    setSaving(true);
    try {
      await axios.put("http://localhost:4000/guest/signup", { day, guests, season }, { withCredentials: true });
      // Actor will also get SSE, but reflect immediately:
      setMine(prev => {
        const next = prev.filter(x => x.day !== day);
        if (guests > 0) next.push({ day, guests });
        return next;
      });
    } catch (e) {
      alert(e?.response?.data?.error || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading…</p>;

  return (
    
    
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
        <table className="guest-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th style={{ textAlign: "left", padding: "10px 12px" }}>Day</th>
              <th style={{ textAlign: "left", padding: "10px 12px" }}>Remaining</th>
              <th style={{ textAlign: "left", padding: "10px 12px" }}>Used / Cap</th>
              <th style={{ textAlign: "left", padding: "10px 12px" }}>My Guests</th>
            </tr>
          </thead>
          <tbody>
            {days.map(d => {
              const mineVal = mineMap.get(d.day) ?? 0;
              const draft = draftGuests[d.day] ?? mineVal;
              const changed = Number(draft) !== Number(mineVal);

              return (
                <tr key={d.day} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 12px" }}>{fmtDayLabel(d.day)}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                    {d.remaining}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    {d.used} / {d.cap}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input
                        type="number"
                        min={0}
                        max={perUserMax}
                        value={draft}
                        onChange={e =>
                          setDraftGuests(m => ({ ...m, [d.day]: e.target.value }))
                        }
                        style={{ width: 90 }}
                      />
                      <button
                        disabled={saving || !changed}
                        onClick={() => saveGuests(d.day)}
                      >
                        {changed ? "Save" : "✓"}
                      </button>
                      {mineVal > 0 && (
                        <button
                          disabled={saving}
                          onClick={() => {
                            setDraftGuests(m => ({ ...m, [d.day]: 0 }));
                            saveGuests(d.day);
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>


      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>My Signups</h3>
        {mine.length === 0 ? <p>No signups yet.</p> : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
            {mine.sort((a,b)=>a.day.localeCompare(b.day)).map(it => (
              <li key={it.day} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{fmtDayLabel(it.day)}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Guests: {it.guests}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setDraftGuests(m => ({ ...m, [it.day]: it.guests }))}>Edit</button>
                  <button onClick={() => { setDraftGuests(m => ({ ...m, [it.day]: 0 })); saveGuests(it.day); }}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
