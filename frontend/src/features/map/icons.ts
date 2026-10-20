import L from "leaflet";
import { riskColor } from "@/domain/risk";
import type { RouteResult } from "@/domain/types";
import { formatDuration } from "@/lib/format";

const endpointIcon = (kind: "a" | "b") =>
  L.divIcon({
    className: "pt-wrap",
    html: `<span class="pt ${kind}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

export const ORIGIN_ICON = endpointIcon("a");
export const DESTINATION_ICON = endpointIcon("b");

export const routeLabelIcon = (
  number: number,
  route: RouteResult,
  selected: boolean,
) =>
  L.divIcon({
    className: "route-label",
    html: `<span class="${selected ? "sel" : ""}"><i>${number}</i><b>${formatDuration(route.duration_s)}</b></span>`,
    iconSize: [0, 0],
  });

export const TRUCK_ICONS = [0, 1, 2, 3, 4].map((level) =>
  L.divIcon({
    className: "truck-wrap",
    html: `<span class="truck" style="--c:${riskColor(level)}"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  }),
);

export const ROUTE_COLORS = {
  alternate: "#8e8e93",
  alternateHover: "#636366",
  casing: "#ffffff",
  ink: "#1d1d1f",
};
