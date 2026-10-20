import L from "leaflet";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { formatClock, formatDateTime, formatDuration, shortPlace } from "../format";
import { riskColor, riskTextColor } from "../risk";
import type { Checkpoint, PlanResponse, RouteResult } from "../types";
import HeatmapLayer from "./HeatmapLayer";

export interface FitRequest {
  target: "all" | string;
  n: number;
}

interface Props {
  plan: PlanResponse | null;
  selectedId: string | null;
  focus: { routeId: string; mile: number } | null;
  fit: FitRequest;
  hour: number;
  onSelect: (routeId: string) => void;
  onFocus: (routeId: string, cp: Checkpoint) => void;
}

const ALT = "#8e8e93";
const INK = "#1d1d1f";

function fitOptions(): L.FitBoundsOptions {
  const wide = window.innerWidth > 720;
  return wide
    ? { paddingTopLeft: [408, 56], paddingBottomRight: [64, 120], maxZoom: 12 }
    : { paddingTopLeft: [32, 120], paddingBottomRight: [32, Math.round(window.innerHeight * 0.5)], maxZoom: 12 };
}

function fitTo(map: L.Map, routes: RouteResult[]) {
  if (!routes.length) return;
  map.fitBounds(L.latLngBounds(routes.flatMap((r) => r.geometry)), { ...fitOptions(), animate: true, duration: 0.8 });
}

function FitController({ plan, fit }: { plan: PlanResponse; fit: FitRequest }) {
  const map = useMap();
  useEffect(() => {
    fitTo(map, fit.target === "all" ? plan.routes : plan.routes.filter((r) => r.id === fit.target));
  }, [map, plan, fit]);
  return null;
}

function FocusPan({ target }: { target: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (!map.getBounds().pad(-0.15).contains(target)) map.panTo(target, { animate: true });
  }, [map, target]);
  return null;
}

function MapTools({ routes }: { routes: RouteResult[] }) {
  const map = useMap();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      L.DomEvent.disableClickPropagation(ref.current);
      L.DomEvent.disableScrollPropagation(ref.current);
    }
  }, []);
  return (
    <div ref={ref} className="map-tools glass">
      <button aria-label="Zoom in" onClick={() => map.zoomIn()}>
        +
      </button>
      <button aria-label="Zoom out" onClick={() => map.zoomOut()}>
        −
      </button>
      {routes.length > 0 && (
        <button aria-label="Fit route" title="Fit route" onClick={() => fitTo(map, routes)}>
          <svg
            viewBox="0 0 16 16"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" />
          </svg>
        </button>
      )}
    </div>
  );
}

const pointIcon = (kind: "a" | "b") =>
  L.divIcon({ className: "pt-wrap", html: `<span class="pt ${kind}"></span>`, iconSize: [18, 18], iconAnchor: [9, 9] });
const ICON_A = pointIcon("a");
const ICON_B = pointIcon("b");

const labelIcon = (n: number, route: RouteResult, selected: boolean) =>
  L.divIcon({
    className: "route-label",
    html: `<span class="${selected ? "sel" : ""}"><i>${n}</i><b>${formatDuration(route.duration_s)}</b></span>`,
    iconSize: [0, 0],
  });

function RouteLines({
  route,
  index,
  selected,
  onSelect,
  onFocus,
}: {
  route: RouteResult;
  index: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onFocus: (id: string, cp: Checkpoint) => void;
}) {
  const [hover, setHover] = useState(false);
  const labelAt = route.geometry[Math.floor(route.geometry.length * [0.5, 0.38, 0.62][index % 3])];
  const icon = useMemo(() => labelIcon(index + 1, route, selected), [index, route, selected]);
  const worst = route.summary.max_label;

  return (
    <>
      {selected ? (
        <>
          <Polyline
            positions={route.geometry}
            pathOptions={{ color: "#fff", weight: 13, opacity: 0.95, lineCap: "round", lineJoin: "round" }}
            interactive={false}
          />
          {route.segments.map((seg, i) => (
            <Polyline
              key={i}
              positions={seg.coords}
              pathOptions={{ color: riskColor(seg.level), weight: 7, opacity: 1, lineCap: "round", lineJoin: "round" }}
              interactive={false}
            />
          ))}
        </>
      ) : (
        <>
          <Polyline
            positions={route.geometry}
            pathOptions={{ color: "#fff", weight: 10, opacity: 0.9, lineCap: "round", lineJoin: "round" }}
            interactive={false}
          />
          <Polyline
            positions={route.geometry}
            pathOptions={{
              color: hover ? "#636366" : ALT,
              weight: hover ? 7 : 5,
              opacity: 1,
              lineCap: "round",
              lineJoin: "round",
            }}
            eventHandlers={{
              click: () => onSelect(route.id),
              mouseover: () => setHover(true),
              mouseout: () => setHover(false),
            }}
          >
            <Tooltip sticky direction="top" offset={[0, -8]} className="tip">
              {index + 1} · {formatDuration(route.duration_s)} · {Math.round(route.distance_mi)} mi · {worst}
            </Tooltip>
          </Polyline>
        </>
      )}

      {route.checkpoints.map((cp) => (
        <CircleMarker
          key={cp.mile}
          center={[cp.lat, cp.lon]}
          radius={selected ? 5 : 3}
          pathOptions={{ color: "#fff", weight: selected ? 2 : 1, fillColor: riskColor(cp.level), fillOpacity: 1 }}
          eventHandlers={{ click: () => (selected ? onFocus(route.id, cp) : onSelect(route.id)) }}
        >
          <Tooltip direction="top" offset={[0, -6]} className="tip">
            {Math.round(cp.mile)} mi · {cp.label} · {formatClock(cp.eta)}
          </Tooltip>
        </CircleMarker>
      ))}

      <Marker
        position={labelAt}
        icon={icon}
        zIndexOffset={selected ? 500 : 0}
        eventHandlers={{ click: () => onSelect(route.id) }}
      />
    </>
  );
}

function CheckpointDetails({ index, cp }: { index: number; cp: Checkpoint }) {
  return (
    <div className="popup">
      <strong>
        Route {index + 1} · {Math.round(cp.mile)} mi
      </strong>
      <span className="popup-risk" style={{ background: riskColor(cp.level), color: riskTextColor(cp.level) }}>
        {cp.label}
      </span>
      <span>{formatDateTime(cp.eta)}</span>
      <span>
        {cp.wind_mph} mph · {cp.rain_in_hr} rain · {cp.snow_in_hr} snow
      </span>
      {cp.load_adjusted && <span className="popup-reason">{cp.reasons[cp.reasons.length - 1]}</span>}
    </div>
  );
}

const RoutesLayer = memo(function RoutesLayer({
  plan,
  selectedId,
  focus,
  onSelect,
  onFocus,
}: Pick<Props, "selectedId" | "focus" | "onSelect" | "onFocus"> & { plan: PlanResponse }) {
  const ordered = useMemo(
    () => [...plan.routes].sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId)),
    [plan, selectedId],
  );
  const focusRoute = focus ? plan.routes.find((r) => r.id === focus.routeId) : undefined;
  const focusCp = focusRoute?.checkpoints.find((c) => c.mile === focus!.mile);

  return (
    <>
      {ordered.map((route) => (
        <RouteLines
          key={route.id}
          route={route}
          index={plan.routes.indexOf(route)}
          selected={route.id === selectedId}
          onSelect={onSelect}
          onFocus={onFocus}
        />
      ))}
      <Marker position={[plan.origin.lat, plan.origin.lon]} icon={ICON_A}>
        <Tooltip permanent direction="top" offset={[0, -8]} className="tip place">
          {shortPlace(plan.origin.label)}
        </Tooltip>
      </Marker>
      <Marker position={[plan.destination.lat, plan.destination.lon]} icon={ICON_B}>
        <Tooltip permanent direction="top" offset={[0, -8]} className="tip place">
          {shortPlace(plan.destination.label)}
        </Tooltip>
      </Marker>
      {focusRoute && focusCp && (
        <>
          <FocusPan target={[focusCp.lat, focusCp.lon]} />
          <CircleMarker
            center={[focusCp.lat, focusCp.lon]}
            radius={10}
            pathOptions={{ color: INK, weight: 2, fill: false }}
          />
          <Popup position={[focusCp.lat, focusCp.lon]} closeButton={false} autoPan={false}>
            <CheckpointDetails index={plan.routes.indexOf(focusRoute)} cp={focusCp} />
          </Popup>
        </>
      )}
    </>
  );
});

const truckIcons = [0, 1, 2, 3, 4].map((level) =>
  L.divIcon({
    className: "truck-wrap",
    html: `<span class="truck" style="--c:${riskColor(level)}"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  }),
);

function TruckMarker({ start, route, hour }: { start: string; route: RouteResult; hour: number }) {
  const times = useMemo(() => route.checkpoints.map((c) => Date.parse(c.eta)), [route]);
  const t = Date.parse(start) + hour * 3600_000;
  if (t < times[0] || t > times[times.length - 1]) return null;
  let i = times.findIndex((x) => x >= t);
  if (i <= 0) i = 1;
  const a = route.checkpoints[i - 1];
  const b = route.checkpoints[i];
  const k = times[i] === times[i - 1] ? 0 : (t - times[i - 1]) / (times[i] - times[i - 1]);
  const pos: [number, number] = [a.lat + (b.lat - a.lat) * k, a.lon + (b.lon - a.lon) * k];
  const nearest = k < 0.5 ? a : b;
  return (
    <Marker position={pos} icon={truckIcons[nearest.level]} zIndexOffset={1000} interactive={false}>
      <Tooltip permanent direction="bottom" offset={[0, 10]} className="tip">
        {nearest.label}
      </Tooltip>
    </Marker>
  );
}

export default function MapView({ plan, selectedId, focus, fit, hour, onSelect, onFocus }: Props) {
  const selected = plan?.routes.find((r) => r.id === selectedId);
  return (
    <MapContainer className="map" center={[39.5, -98.35]} zoom={4} minZoom={3} preferCanvas zoomControl={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {plan && (
        <>
          <FitController plan={plan} fit={fit} />
          <HeatmapLayer points={plan.heatmap.points} hour={hour} />
          <RoutesLayer plan={plan} selectedId={selectedId} focus={focus} onSelect={onSelect} onFocus={onFocus} />
          {selected && <TruckMarker start={plan.heatmap.start} route={selected} hour={hour} />}
        </>
      )}
      <MapTools routes={plan ? (selected ? [selected] : plan.routes) : []} />
    </MapContainer>
  );
}
