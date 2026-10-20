import { useMemo } from "react";
import { Marker, Tooltip } from "react-leaflet";
import type { LatLng, RouteResult } from "@/domain/types";
import { riskMessageKey, useTranslate } from "@/i18n";
import { TRUCK_ICONS } from "./icons";

interface Props {
  start: string;
  route: RouteResult;
  hour: number;
}

export default function TruckMarker({ start, route, hour }: Props) {
  const t = useTranslate();
  const etas = useMemo(
    () => route.checkpoints.map((checkpoint) => Date.parse(checkpoint.eta)),
    [route],
  );

  const at = Date.parse(start) + hour * 3600_000;
  if (at < etas[0] || at > etas[etas.length - 1]) return null;

  const index = Math.max(
    1,
    etas.findIndex((eta) => eta >= at),
  );
  const from = route.checkpoints[index - 1];
  const to = route.checkpoints[index];
  const span = etas[index] - etas[index - 1];
  const progress = span === 0 ? 0 : (at - etas[index - 1]) / span;

  const position: LatLng = [
    from.lat + (to.lat - from.lat) * progress,
    from.lon + (to.lon - from.lon) * progress,
  ];
  const nearest = progress < 0.5 ? from : to;

  return (
    <Marker
      position={position}
      icon={TRUCK_ICONS[nearest.level]}
      zIndexOffset={1000}
      interactive={false}
    >
      <Tooltip permanent direction="bottom" offset={[0, 10]} className="tip">
        {t(riskMessageKey(nearest.level))}
      </Tooltip>
    </Marker>
  );
}
