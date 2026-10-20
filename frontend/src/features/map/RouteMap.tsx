import { useMemo } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import type { LatLng } from "@/domain/types";
import {
  planActions,
  useDraft,
  useFit,
  useFocus,
  useHour,
  usePicking,
  usePlan,
  useSelectedRoute,
  useSelectedRouteId,
} from "@/store";
import EndpointMarkers from "./EndpointMarkers";
import { fitTargets } from "./fit";
import FitController from "./FitController";
import HeatmapLayer from "./HeatmapLayer";
import MapTools from "./MapTools";
import PickController from "./PickController";
import RoutesLayer from "./RoutesLayer";
import TruckMarker from "./TruckMarker";

const US_CENTER: LatLng = [39.5, -98.35];
const US_ZOOM = 4;
const MIN_ZOOM = 3;
const TILE_MAX_ZOOM = 19;
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export default function RouteMap() {
  const plan = usePlan();
  const draft = useDraft();
  const selectedId = useSelectedRouteId();
  const selected = useSelectedRoute();
  const focus = useFocus();
  const fit = useFit();
  const hour = useHour();
  const picking = usePicking();

  const positions = useMemo(
    () => fitTargets(plan, fit.target, draft),
    [plan, fit.target, draft],
  );
  const canFit = positions.length > 0;

  return (
    <MapContainer
      className="map"
      center={US_CENTER}
      zoom={US_ZOOM}
      minZoom={MIN_ZOOM}
      preferCanvas
      zoomControl={false}
    >
      <TileLayer
        attribution={ATTRIBUTION}
        url={TILE_URL}
        maxZoom={TILE_MAX_ZOOM}
      />
      <PickController picking={picking} />
      <FitController positions={positions} nonce={fit.nonce} />

      {plan && (
        <>
          <HeatmapLayer points={plan.heatmap.points} hour={hour} />
          <RoutesLayer plan={plan} selectedId={selectedId} focus={focus} />
          {selected && (
            <TruckMarker
              start={plan.heatmap.start}
              route={selected}
              hour={hour}
            />
          )}
        </>
      )}

      <EndpointMarkers />
      <MapTools
        canFit={canFit}
        onFit={() => planActions.fitTo(selected?.id ?? "all")}
      />
    </MapContainer>
  );
}
