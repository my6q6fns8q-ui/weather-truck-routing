import { useEffect, useRef, useState } from "react";
import { formatClock } from "../format";
import { RISK_LEVELS } from "../risk";

interface Props {
  start: string;
  maxHours: number;
  hour: number;
  tripHours: number | null;
  onChange: (hour: number) => void;
}

const PLAY_INTERVAL_MS = 450;

export default function ForecastSlider({ start, maxHours, hour, tripHours, onChange }: Props) {
  const [playing, setPlaying] = useState(false);
  const hourRef = useRef(hour);
  hourRef.current = hour;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => onChange(hourRef.current >= maxHours ? 0 : hourRef.current + 1), PLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [playing, maxHours, onChange]);

  const when = new Date(new Date(start).getTime() + hour * 3600_000);
  const tripPct = tripHours === null ? 0 : Math.min(100, (tripHours / maxHours) * 100);

  return (
    <div className="slider-bar glass">
      <button
        className="icon-btn"
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? "Pause forecast" : "Play forecast"}
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <div className="slider-main">
        <div className="slider-label">
          <strong>+{hour}h</strong> · {formatClock(when)}
        </div>
        <div className="slider-track">
          <div className="trip-window" style={{ width: `${tripPct}%` }} title="Selected route's driving time" />
          <input
            type="range"
            min={0}
            max={maxHours}
            step={1}
            value={hour}
            aria-label="Forecast hour after departure"
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </div>
        <div className="slider-ticks">
          {[0, 12, 24, 36, 48].map((h) => (
            <span key={h}>{h}h</span>
          ))}
        </div>
      </div>
      <div className="legend" aria-label="Risk legend">
        {RISK_LEVELS.map((r) => (
          <span key={r.level}>
            <i style={{ background: r.color }} />
            {r.label}
          </span>
        ))}
      </div>
    </div>
  );
}
