import { riskColor } from "@/domain/risk";
import type { Checkpoint, RouteResult } from "@/domain/types";
import { riskMessageKey, useFormatter, useTranslate } from "@/i18n";

interface Props {
  route: RouteResult;
  number: number;
  focusMile: number | null;
  onFocus: (checkpoint: Checkpoint) => void;
}

export default function CheckpointTable({
  route,
  number,
  focusMile,
  onFocus,
}: Props) {
  const t = useTranslate();
  const fmt = useFormatter();

  return (
    <div
      className="checkpoints"
      tabIndex={0}
      aria-label={t("routes.checkpointsOf", { number })}
    >
      <table>
        <thead>
          <tr>
            <th>{t("table.mile")}</th>
            <th>{t("table.eta")}</th>
            <th title={t("units.mph")}>{t("table.wind")}</th>
            <th title={t("units.inHr")}>{t("table.rain")}</th>
            <th title={t("units.inHr")}>{t("table.snow")}</th>
            <th>{t("table.risk")}</th>
          </tr>
        </thead>
        <tbody>
          {route.checkpoints.map((checkpoint) => (
            <tr
              key={checkpoint.mile}
              className={focusMile === checkpoint.mile ? "focus" : ""}
              onClick={() => onFocus(checkpoint)}
            >
              <td>{fmt.number(Math.round(checkpoint.mile))}</td>
              <td>{fmt.clock(checkpoint.eta)}</td>
              <td>{fmt.number(checkpoint.wind_mph)}</td>
              <td>{fmt.number(checkpoint.rain_in_hr)}</td>
              <td>{fmt.number(checkpoint.snow_in_hr)}</td>
              <td title={checkpoint.reasons.join("\n")}>
                <i
                  className="dot"
                  style={{ background: riskColor(checkpoint.level) }}
                />
                {t(riskMessageKey(checkpoint.level))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
