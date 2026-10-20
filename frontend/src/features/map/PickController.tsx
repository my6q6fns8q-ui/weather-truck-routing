import type { LeafletMouseEvent } from "leaflet";
import { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { type PickTarget, planActions, tripActions } from "@/store";

export default function PickController({
  picking,
}: {
  picking: PickTarget | null;
}) {
  const map = useMap();

  useMapEvents({
    click: (event: LeafletMouseEvent) => {
      if (event.propagatedFrom) return;
      if (picking) tripActions.pickPoint(event.latlng.lat, event.latlng.lng);
      else planActions.clearFocus();
    },
  });

  useEffect(() => {
    const container = map.getContainer();
    container.classList.toggle("picking", picking !== null);
    if (!picking) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") tripActions.cancelPicking();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      container.classList.remove("picking");
    };
  }, [map, picking]);

  return null;
}
