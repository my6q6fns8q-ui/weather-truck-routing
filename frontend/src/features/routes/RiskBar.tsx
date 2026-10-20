import { milesAtLevel, totalMilesByLevel } from "@/domain/plan";
import { RISK_SCALE } from "@/domain/risk";
import type { RouteResult } from "@/domain/types";
import { riskMessageKey, useFormatter, useTranslate } from "@/i18n";

export default function RiskBar({ route }: { route: RouteResult }) {
  const t = useTranslate();
  const fmt = useFormatter();
  const total = totalMilesByLevel(route) || 1;

  const description = RISK_SCALE.map((level) =>
    t("routes.riskShare", {
      label: t(riskMessageKey(level.level)),
      miles: fmt.number(Math.round(milesAtLevel(route, level))),
    }),
  ).join(", ");

  return (
    <div className="riskbar" role="img" aria-label={description}>
      {RISK_SCALE.map((level) => {
        const miles = milesAtLevel(route, level);
        return miles > 0 ? (
          <span
            key={level.level}
            style={{
              width: `${(miles / total) * 100}%`,
              background: level.color,
            }}
          />
        ) : null;
      })}
    </div>
  );
}
