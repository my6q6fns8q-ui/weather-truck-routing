import { Popup } from "react-leaflet";
import type { ResolvedCheckpoint } from "@/domain/plan";
import { riskColor, riskTextColor } from "@/domain/risk";
import { riskMessageKey, useFormatter, useTranslate } from "@/i18n";

export default function CheckpointPopup({
  focused,
}: {
  focused: ResolvedCheckpoint;
}) {
  const { checkpoint, number } = focused;
  const t = useTranslate();
  const fmt = useFormatter();

  return (
    <Popup
      position={[checkpoint.lat, checkpoint.lon]}
      closeButton={false}
      autoPan={false}
    >
      <div className="popup">
        <strong>
          {t("map.routeNumber", { number })} · {fmt.miles(checkpoint.mile)}
        </strong>
        <span
          className="popup-risk"
          style={{
            background: riskColor(checkpoint.level),
            color: riskTextColor(checkpoint.level),
          }}
        >
          {t(riskMessageKey(checkpoint.level))}
        </span>
        <span>{fmt.dateTime(checkpoint.eta)}</span>
        <span>
          {t("weather.wind", { value: fmt.number(checkpoint.wind_mph) })} ·{" "}
          {t("weather.rain", { value: fmt.number(checkpoint.rain_in_hr) })} ·{" "}
          {t("weather.snow", { value: fmt.number(checkpoint.snow_in_hr) })}
        </span>
        {checkpoint.load_adjusted && (
          <span className="popup-reason">
            {checkpoint.reasons[checkpoint.reasons.length - 1]}
          </span>
        )}
      </div>
    </Popup>
  );
}
