import { RISK_SCALE } from "@/domain/risk";
import { riskMessageKey, useTranslate } from "@/i18n";

export default function RiskLegend() {
  const t = useTranslate();
  return (
    <div className="legend" aria-label={t("forecast.legend")}>
      {RISK_SCALE.map((level) => (
        <span key={level.level}>
          <i style={{ background: level.color }} />
          {t(riskMessageKey(level.level))}
        </span>
      ))}
    </div>
  );
}
