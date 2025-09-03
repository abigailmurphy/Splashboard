import React, { useMemo } from "react";

/**
 * MonthCalendar (React, JS)
 * Props:
 *  - year?: number (defaults to current year)
 *  - month?: number 0–11 (defaults to current month)
 *  - startOn?: 'sun' | 'mon' (default 'sun')
 *  - extraByDate?: { 'YYYY-MM-DD': string|number } small number/text shown bottom-right
 *  - onDayClick?: (date: Date) => void
 *
 * Usage:
 * <MonthCalendar
 *   year={2025}
 *   month={7}                 // August (0-based)
 *   startOn="sun"
 *   extraByDate={{ [formatKey(new Date(2025,7,5))]: 12 }}
 *   onDayClick={(d) => console.log(formatKey(d))}
 * />
 */

const styles = {
  wrap: { width: "100%", maxWidth: 960, margin: "0 auto" },
  weekdays: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "1px",
    background: "#e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 4,
  },
  weekday: {
    background: "#f3f4f6",
    color: "#4b5563",
    textTransform: "uppercase",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.04em",
    textAlign: "center",
    padding: "10px 0",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "1px",
    background: "#e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
  },
  cell: {
    position: "relative",
    background: "#ffffff",
    height: 110, // plenty of room for a second number
    padding: 8,
    border: "none",
    textAlign: "left",
    cursor: "pointer",
  },
  cellMuted: { background: "#f9fafb", color: "#9ca3af" },
  dayNum: { position: "absolute", top: 8, left: 8, fontWeight: 700, fontSize: 14 },
  mutedText: { color: "#9ca3af" },
  extraNum: { position: "absolute", bottom: 8, right: 8, fontSize: 12, opacity: 0.85 },
};

export default function MonthCalendar({
  year,
  month,
  startOn = "sun",
  extraByDate = {},
  onDayClick,
}) {
  
  const today = new Date();
  console.log(today)
  const y = today.getFullYear();
  const m =  today.getMonth();
  console.log(m);

  const weeks = useMemo(() => buildWeeks(y, m, startOn), [y, m, startOn]);
  const weekdayLabels = useMemo(() => getWeekdayLabels(startOn), [startOn]);

  return (
    <div style={styles.wrap} role="grid" aria-label="calendar">
      {/* Weekday headers */}
      <div style={styles.weekdays}>
        {weekdayLabels.map((w) => (
          <div key={w} style={styles.weekday}>
            {w}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={styles.grid}>
        {weeks.flat().map(({ date, inMonth }) => {
          const key = formatKey(date);
          const extra = extraByDate[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onDayClick && onDayClick(date)}
              style={{ ...styles.cell, ...(inMonth ? null : styles.cellMuted) }}
              aria-label={key}
            >
              <div
                style={{
                  ...styles.dayNum,
                  ...(inMonth ? null : styles.mutedText),
                }}
              >
                {date.getDate()}
              </div>

              {extra !== undefined && (
                <div style={styles.extraNum}>{String(extra)}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ----- helpers -----
function getWeekdayLabels(startOn) {
  const base = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return startOn === "mon" ? [...base.slice(1), base[0]] : base;
}

function buildWeeks(year, month, startOn) {
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = firstOfMonth.getDay(); // 0=Sun..6=Sat
  const offset = startOn === "mon" ? ((firstWeekday + 6) % 7) : firstWeekday;

  const totalCells = 42; // 6 rows, 7 cols
  const cells = [];
  const gridStart = new Date(year, month, 1 - offset);

  for (let i = 0; i < totalCells; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push({ date: d, inMonth: d.getMonth() === month });
  }

  const weeks = [];
  for (let i = 0; i < totalCells; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function formatKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
