import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import type { HeatPoint } from "../types";
import { HeatCanvasLayer } from "./HeatCanvasLayer";

interface Props {
  points: HeatPoint[];
  hour: number;
}

export default function HeatmapLayer({ points, hour }: Props) {
  const map = useMap();
  const layer = useRef<HeatCanvasLayer>();
  const hourRef = useRef(hour);
  hourRef.current = hour;

  useEffect(() => {
    if (!map.getPane("heatPane")) {
      const pane = map.createPane("heatPane");
      pane.style.zIndex = "350";
      pane.style.pointerEvents = "none";
    }
    const l = (layer.current = new HeatCanvasLayer(points));
    l.setHour(hourRef.current);
    l.addTo(map);
    return () => {
      l.remove();
    };
  }, [map, points]);

  useEffect(() => {
    layer.current?.setHour(hour);
  }, [hour]);

  return null;
}
