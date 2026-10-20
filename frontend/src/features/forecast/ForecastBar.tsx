import { useEffect, useRef, useState } from "react";
import { tripHours } from "@/domain/plan";
import { useFormatter, useTranslate } from "@/i18n";
import { planActions, useHour, usePlan, useSelectedRoute } from "@/store";
import RiskLegend from "./RiskLegend";

const PLAY_INTERVAL_MS = 450;
const TICK_HOURS = [0, 12, 24, 36, 48];

export default function ForecastBar() {
  const plan = usePlan();
  const route = useSelectedRoute();
  const hour = useHour();
  const t = useTranslate();
  const fmt = useFormatter();
  const [playing, setPlaying] = useState(false);

  const hourRef = useRef(hour);
  hourRef.current = hour;
  const maxHours = plan?.heatmap.hours ?? 0;

  useEffect(() => {
    if (!playing || !maxHours) return;
    const id = setInterval(
      () =>
        planActions.setHour(
          hourRef.current >= maxHours ? 0 : hourRef.current + 1,
        ),
      PLAY_INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, [playing, maxHours]);

  if (!plan) return null;

  const when = new Date(
    new Date(plan.heatmap.start).getTime() + hour * 3600_000,
  );
  const tripWindowPct = route
    ? Math.min(100, (tripHours(route) / maxHours) * 100)
    : 0;

  return (
    <div className="slider-bar glass">
      <button
        className="icon-btn"
        onClick={() => setPlaying((value) => !value)}
        aria-label={playing ? t("forecast.pause") : t("forecast.play")}
      >
        {playing ? "❚❚" : "▶"}
      </button>

      <div className="slider-main">
        <div className="slider-label">
          <strong>{t("forecast.offset", { hours: hour })}</strong> ·{" "}
          {fmt.clock(when)}
        </div>
        <div className="slider-track">
          <div
            className="trip-window"
            style={{ width: `${tripWindowPct}%` }}
            title={t("forecast.tripWindow")}
          />
          <input
            type="range"
            min={0}
            max={maxHours}
            step={1}
            value={hour}
            aria-label={t("forecast.slider")}
            onChange={(event) =>
              planActions.setHour(Number(event.target.value))
            }
          />
        </div>
        <div className="slider-ticks">
          {TICK_HOURS.map((tick) => (
            <span key={tick}>{t("forecast.tick", { hours: tick })}</span>
          ))}
        </div>
      </div>

      <RiskLegend />
    </div>
  );
}
