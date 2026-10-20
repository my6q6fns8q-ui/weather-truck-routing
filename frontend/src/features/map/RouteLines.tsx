import { useMemo, useState } from "react";
import { riskColor } from "@/domain/risk";
import type { RouteResult } from "@/domain/types";
import { riskMessageKey, useFormatter, useTranslate } from "@/i18n";
import { CircleMarker, Marker, Polyline, Tooltip } from "react-leaflet";
import { planActions } from "@/store";
import { ROUTE_COLORS, routeLabelIcon } from "./icons";

interface Props {
  route: RouteResult;
  number: number;
  selected: boolean;
}

const LABEL_POSITIONS = [0.5, 0.38, 0.62];

export default function RouteLines({ route, number, selected }: Props) {
  const [hover, setHover] = useState(false);
  const t = useTranslate();
  const fmt = useFormatter();

  const labelAt =
    route.geometry[
      Math.floor(route.geometry.length * LABEL_POSITIONS[(number - 1) % 3])
    ];
  const icon = useMemo(
    () => routeLabelIcon(number, route, selected),
    [number, route, selected],
  );

  return (
    <>
      {selected ? (
        <>
          <Polyline
            positions={route.geometry}
            pathOptions={{
              color: ROUTE_COLORS.casing,
              weight: 13,
              opacity: 0.95,
              lineCap: "round",
              lineJoin: "round",
            }}
            interactive={false}
          />
          {route.segments.map((segment, index) => (
            <Polyline
              key={index}
              positions={segment.coords}
              pathOptions={{
                color: riskColor(segment.level),
                weight: 7,
                opacity: 1,
                lineCap: "round",
                lineJoin: "round",
              }}
              interactive={false}
            />
          ))}
        </>
      ) : (
        <>
          <Polyline
            positions={route.geometry}
            pathOptions={{
              color: ROUTE_COLORS.casing,
              weight: 10,
              opacity: 0.9,
              lineCap: "round",
              lineJoin: "round",
            }}
            interactive={false}
          />
          <Polyline
            positions={route.geometry}
            pathOptions={{
              color: hover
                ? ROUTE_COLORS.alternateHover
                : ROUTE_COLORS.alternate,
              weight: hover ? 7 : 5,
              opacity: 1,
              lineCap: "round",
              lineJoin: "round",
            }}
            eventHandlers={{
              click: () => planActions.selectRoute(route.id),
              mouseover: () => setHover(true),
              mouseout: () => setHover(false),
            }}
          >
            <Tooltip sticky direction="top" offset={[0, -8]} className="tip">
              {number} · {fmt.duration(route.duration_s)} ·{" "}
              {fmt.miles(route.distance_mi)} ·{" "}
              {t(riskMessageKey(route.summary.max_level))}
            </Tooltip>
          </Polyline>
        </>
      )}

      {route.checkpoints.map((checkpoint) => (
        <CircleMarker
          key={checkpoint.mile}
          center={[checkpoint.lat, checkpoint.lon]}
          radius={selected ? 5 : 3}
          pathOptions={{
            color: ROUTE_COLORS.casing,
            weight: selected ? 2 : 1,
            fillColor: riskColor(checkpoint.level),
            fillOpacity: 1,
          }}
          eventHandlers={{
            click: () =>
              selected
                ? planActions.focusCheckpoint(route, checkpoint)
                : planActions.selectRoute(route.id),
          }}
        >
          <Tooltip direction="top" offset={[0, -6]} className="tip">
            {t("map.checkpointAt", {
              miles: fmt.miles(checkpoint.mile),
              risk: t(riskMessageKey(checkpoint.level)),
              eta: fmt.clock(checkpoint.eta),
            })}
          </Tooltip>
        </CircleMarker>
      ))}

      <Marker
        position={labelAt}
        icon={icon}
        zIndexOffset={selected ? 500 : 0}
        title={t("map.routeNumber", { number })}
        eventHandlers={{ click: () => planActions.selectRoute(route.id) }}
      />
    </>
  );
}
