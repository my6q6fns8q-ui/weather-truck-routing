import type { LatLng, Place } from "./types";

export const coordinateLabel = (lat: number, lon: number) =>
  `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

export const placeAt = (lat: number, lon: number): Place => ({
  label: coordinateLabel(lat, lon),
  lat,
  lon,
});

export const placePosition = (place: Place): LatLng => [place.lat, place.lon];

export const samePlace = (a: Place | null, b: Place | null) =>
  a === b ||
  (!!a && !!b && a.lat === b.lat && a.lon === b.lon && a.label === b.label);
