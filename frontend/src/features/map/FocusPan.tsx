import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type { LatLng } from "@/domain/types";

const EDGE_PAD = -0.15;

export default function FocusPan({ target }: { target: LatLng }) {
  const map = useMap();

  useEffect(() => {
    if (!map.getBounds().pad(EDGE_PAD).contains(target))
      map.panTo(target, { animate: true });
  }, [map, target]);

  return null;
}
