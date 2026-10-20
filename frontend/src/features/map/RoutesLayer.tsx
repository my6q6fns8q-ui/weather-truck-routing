import { memo } from "react";
import {
  type CheckpointRef,
  resolveCheckpoint,
  routeNumber,
  routesBySelection,
} from "@/domain/plan";
import type { PlanResponse } from "@/domain/types";
import { CircleMarker } from "react-leaflet";
import CheckpointPopup from "./CheckpointPopup";
import FocusPan from "./FocusPan";
import { ROUTE_COLORS } from "./icons";
import RouteLines from "./RouteLines";

interface Props {
  plan: PlanResponse;
  selectedId: string | null;
  focus: CheckpointRef | null;
}

const FOCUS_RING_RADIUS = 10;

const RoutesLayer = memo(function RoutesLayer({
  plan,
  selectedId,
  focus,
}: Props) {
  const focused = resolveCheckpoint(plan, focus);

  return (
    <>
      {routesBySelection(plan, selectedId).map((route) => (
        <RouteLines
          key={route.id}
          route={route}
          number={routeNumber(plan, route)}
          selected={route.id === selectedId}
        />
      ))}

      {focused && (
        <>
          <FocusPan target={[focused.checkpoint.lat, focused.checkpoint.lon]} />
          <CircleMarker
            center={[focused.checkpoint.lat, focused.checkpoint.lon]}
            radius={FOCUS_RING_RADIUS}
            pathOptions={{ color: ROUTE_COLORS.ink, weight: 2, fill: false }}
          />
          <CheckpointPopup focused={focused} />
        </>
      )}
    </>
  );
});

export default RoutesLayer;
