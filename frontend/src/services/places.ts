import type { Place } from "@/domain/types";
import { request } from "./http";

export const MIN_QUERY_LENGTH = 3;

export interface PlacesQuery {
  lang?: string;
  signal?: AbortSignal;
}

export const searchPlaces = (q: string, { lang, signal }: PlacesQuery = {}) =>
  request<Place[]>("/geocode/", { query: { q, lang }, signal });

export const reverseGeocode = (
  lat: number,
  lon: number,
  { lang, signal }: PlacesQuery = {},
) =>
  request<Place | null>("/geocode/reverse/", {
    query: { lat, lon, lang },
    signal,
  });
