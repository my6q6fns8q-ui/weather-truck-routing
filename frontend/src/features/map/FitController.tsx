import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import type { LatLng } from "@/domain/types";
import { fitMapTo } from "./fit";

export default function FitController({
  positions,
  nonce,
}: {
  positions: LatLng[];
  nonce: number;
}) {
  const map = useMap();
  const latest = useRef(positions);
  latest.current = positions;

  useEffect(() => {
    fitMapTo(map, latest.current);
  }, [map, nonce]);

  return null;
}
