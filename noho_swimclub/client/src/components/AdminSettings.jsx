import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminSettingsPage() {
  // season = the season you're viewing/editing in the form
  const [season, setSeason] = useState(null);
  // currentSeason = the backend's current working season
  const [currentSeason, setCurrentSeason] = useState(null);

  const [cost, setCost] = useState({ individualPerPerson: 260, familyFlat: 620 });
  const [deadlines, setDeadlines] = useState({
    offerResponseDays: 14,
    returnResponseDays: 21,
    hardOfferDeadline: "",
    hardReturnDeadline: "",
  });

  // 1) On mount, get the backend working season and load that season's settings
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

  // 2) Whenever "season" changes, load that season's settings
  useEffect(() => {
    if (!season) return;
    axios.get(`http://localhost:4000/settings/public?season=${season}`).then(r => {
      if (r.data?.cost) setCost(r.data.cost);
      if (r.data?.deadlines) {
        const dl = r.data.deadlines;
        setDeadlines({
          offerResponseDays: dl.offerResponseDays ?? 14,
          returnResponseDays: dl.returnResponseDays ?? 21,
          hardOfferDeadline: dl.hardOfferDeadline ? dl.hardOfferDeadline.slice(0, 10) : "",
          hardReturnDeadline: dl.hardReturnDeadline ? dl.hardReturnDeadline.slice(0, 10) : "",
        });
      }
    });
  }, [season]);

  const save = async () => {
    const payload = {
      cost,
      deadlines: {
        ...deadlines,
        hardOfferDeadline: deadlines.hardOfferDeadline || null,
        hardReturnDeadline: deadlines.hardReturnDeadline || null,
      },
      visible: true,
    };
    await axios.put(`http://localhost:4000/settings/admin/${season}`, payload, { withCredentials: true });
    alert(`Settings saved for ${season}.`);
  };

  // 3) Promote the currently viewed season to be the working season
  const makeWorkingSeason = async () => {
    if (!season) return;
    const r = await axios.patch(
      "http://localhost:4000/settings/working-season",
      { workingSeason: String(season) },
      { withCredentials: true }
    );
    const ws = String(r.data?.workingSeason ?? season);
    setCurrentSeason(ws);       // update banner
    setSeason(ws);              // optionally jump view to it
    alert(`Working season set to ${ws}.`);
  };

  return (
    <div style={{ maxWidth: 680, margin: "20px auto", padding: 16 }}>
      <h1>Season Settings</h1>

      {/* Working season banner from backend */}
      <div style={{
        margin: "12px 0 20px",
        padding: "10px 12px",
        borderRadius: 8,
        background: "#eef6ff",
        border: "1px solid #cfe3ff",
        fontWeight: 600
      }}>
        Current working season: <span style={{ fontWeight: 800 }}>{currentSeason ?? "—"}</span>
      </div>

      {/* Controls for viewing/editing a season */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
        <label>View/Edit Season (YYYY)
          <input
            value={season ?? ""}
            onChange={e => setSeason(e.target.value)}
            placeholder="e.g., 2025"
          />
        </label>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <button
            onClick={() => setSeason(currentSeason)}
            style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 700 }}
            disabled={!currentSeason}
            title="Switch the editor back to the backend's working season"
          >
            Reset to Working Season
          </button>
        </div>

        <fieldset style={{ gridColumn: "1 / -1" }}>
          <legend>Costs</legend>
          <label>Individual (per person)
            <input
              type="number"
              value={cost.individualPerPerson}
              onChange={e => setCost(c => ({ ...c, individualPerPerson: Number(e.target.value) }))}
            />
          </label>
          <label>Family (flat)
            <input
              type="number"
              value={cost.familyFlat}
              onChange={e => setCost(c => ({ ...c, familyFlat: Number(e.target.value) }))}
            />
          </label>
        </fieldset>

        <fieldset style={{ gridColumn: "1 / -1" }}>
          <legend>Deadlines</legend>
          <label>Offer response (days)
            <input
              type="number"
              value={deadlines.offerResponseDays}
              onChange={e => setDeadlines(d => ({ ...d, offerResponseDays: Number(e.target.value) }))}
            />
          </label>
          <label>Returning response (days)
            <input
              type="number"
              value={deadlines.returnResponseDays}
              onChange={e => setDeadlines(d => ({ ...d, returnResponseDays: Number(e.target.value) }))}
            />
          </label>
          <label>Hard offer deadline (YYYY-MM-DD)
            <input
              type="date"
              value={deadlines.hardOfferDeadline}
              onChange={e => setDeadlines(d => ({ ...d, hardOfferDeadline: e.target.value }))}
            />
          </label>
          <label>Hard returning deadline (YYYY-MM-DD)
            <input
              type="date"
              value={deadlines.hardReturnDeadline}
              onChange={e => setDeadlines(d => ({ ...d, hardReturnDeadline: e.target.value }))}
            />
          </label>
        </fieldset>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={save}
            style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 700 }}
          >
            Save Settings for {season ?? "—"}
          </button>

          <button
            onClick={makeWorkingSeason}
            style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 700 }}
            title="Make the currently viewed season the site's working season"
            disabled={!season}
          >
            Make Working Season
          </button>
        </div>
      </div>
    </div>
  );
}
