import { useState } from "react";
import { exposedLevels, milesAtLevel } from "@/domain/plan";
import type { Checkpoint, RouteResult } from "@/domain/types";
import { useFormatter, useTranslate } from "@/i18n";
import CheckpointTable from "./CheckpointTable";
import RiskBar from "./RiskBar";

interface Props {
  route: RouteResult;
  number: number;
  selected: boolean;
  focusMile: number | null;
  onSelect: () => void;
  onFocusCheckpoint: (checkpoint: Checkpoint) => void;
}

export default function RouteCard({
  route,
  number,
  selected,
  focusMile,
  onSelect,
  onFocusCheckpoint,
}: Props) {
  const [open, setOpen] = useState(false);
  const t = useTranslate();
  const fmt = useFormatter();

  const exposed = exposedLevels(route);
  const showTable = selected && (open || focusMile !== null);

  return (
    <article className={`route${selected ? " selected" : ""}`}>
      <button className="route-head" onClick={onSelect} aria-pressed={selected}>
        <span className="route-num">{number}</span>
        <span className="route-body">
          <span className="route-title">
            <strong>{fmt.duration(route.duration_s)}</strong>
            {route.recommended && <em className="pill">{t("routes.best")}</em>}
          </span>
          <span className="route-sub">
            {fmt.miles(route.distance_mi)} · {fmt.clock(route.arrival)}
          </span>
          <RiskBar route={route} />
          {exposed.length > 0 && (
            <span className="route-miles">
              {exposed.map((level) => (
                <span key={level.level}>
                  <i style={{ background: level.color }} />
                  {fmt.miles(milesAtLevel(route, level))}
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
        <button
          className="link"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={showTable}
        >
          {showTable
            ? t("routes.hideCheckpoints")
            : t("routes.checkpoints", { count: route.checkpoints.length })}
        </button>
      )}

      {showTable && (
        <CheckpointTable
          route={route}
          number={number}
          focusMile={focusMile}
          onFocus={onFocusCheckpoint}
        />
      )}
    </article>
  );
}
