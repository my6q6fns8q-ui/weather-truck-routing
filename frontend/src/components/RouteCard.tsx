import { useState } from "react";
import { formatClock, formatDuration, formatMiles } from "../format";
import { RISK_LEVELS, riskColor } from "../risk";
import type { Checkpoint, RouteResult } from "../types";

interface Props {
  route: RouteResult;
  index: number;
  selected: boolean;
  focusMile: number | null;
  onSelect: () => void;
  onFocusCheckpoint: (cp: Checkpoint) => void;
}

function RiskBar({ route }: { route: RouteResult }) {
  const miles = route.summary.miles_by_level;
  const total = Object.values(miles).reduce((a, b) => a + b, 0) || 1;
  return (
    <div
      className="riskbar"
      role="img"
      aria-label={RISK_LEVELS.map((r) => `${r.label} ${Math.round(miles[r.label])} miles`).join(", ")}
    >
      {RISK_LEVELS.map((r) =>
        miles[r.label] > 0 ? (
          <span key={r.level} style={{ width: `${(miles[r.label] / total) * 100}%`, background: r.color }} />
        ) : null,
      )}
    </div>
  );
}

export default function RouteCard({ route, index, selected, focusMile, onSelect, onFocusCheckpoint }: Props) {
  const [open, setOpen] = useState(false);
  const miles = route.summary.miles_by_level;
  const exposed = RISK_LEVELS.slice(2).filter((r) => miles[r.label] >= 0.5);
  const showTable = selected && (open || focusMile !== null);
  return (
    <article className={`route${selected ? " selected" : ""}`}>
      <button className="route-head" onClick={onSelect} aria-pressed={selected}>
        <span className="route-num">{index + 1}</span>
        <span className="route-body">
          <span className="route-title">
            <strong>{formatDuration(route.duration_s)}</strong>
            {route.recommended && <em className="pill">Best</em>}
          </span>
          <span className="route-sub">
            {formatMiles(route.distance_mi)} · {formatClock(route.arrival)}
          </span>
          <RiskBar route={route} />
          {exposed.length > 0 && (
            <span className="route-miles">
              {exposed.map((r) => (
                <span key={r.level} title={r.label}>
                  <i style={{ background: r.color }} />
                  {Math.round(miles[r.label])} mi
                </span>
              ))}
            </span>
          )}
          {route.recommended && route.recommendation_reason && (
            <span className="route-sub">{route.recommendation_reason}</span>
          )}
        </span>
      </button>
      {selected && (
        <button className="link" onClick={() => setOpen((o) => !o)} aria-expanded={showTable}>
          {showTable ? "Hide checkpoints" : `Checkpoints · ${route.checkpoints.length}`}
        </button>
      )}
      {showTable && (
        <div className="checkpoints" tabIndex={0} aria-label={`Route ${index + 1} checkpoints`}>
          <table>
            <thead>
              <tr>
                <th>Mi</th>
                <th>ETA</th>
                <th title="mph">Wind</th>
                <th title="in/hr">Rain</th>
                <th title="in/hr">Snow</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {route.checkpoints.map((cp) => (
                <tr
                  key={cp.mile}
                  className={focusMile === cp.mile ? "focus" : ""}
                  onClick={() => onFocusCheckpoint(cp)}
                >
                  <td>{Math.round(cp.mile)}</td>
                  <td>{formatClock(cp.eta)}</td>
                  <td>{cp.wind_mph}</td>
                  <td>{cp.rain_in_hr}</td>
                  <td>{cp.snow_in_hr}</td>
                  <td title={cp.reasons.join("\n")}>
                    <i className="dot" style={{ background: riskColor(cp.level) }} />
                    {cp.label}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}
