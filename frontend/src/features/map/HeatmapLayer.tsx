import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import type { HeatPoint } from "@/domain/types";
import { HeatCanvasLayer } from "./HeatCanvasLayer";

interface Props {
  points: HeatPoint[];
  hour: number;
}

const HEAT_PANE = "heatPane";
const HEAT_PANE_Z = "350";

export default function HeatmapLayer({ points, hour }: Props) {
  const map = useMap();
  const layer = useRef<HeatCanvasLayer>();
  const hourRef = useRef(hour);
  hourRef.current = hour;

  useEffect(() => {
    if (!map.getPane(HEAT_PANE)) {
      const pane = map.createPane(HEAT_PANE);
      pane.style.zIndex = HEAT_PANE_Z;
      pane.style.pointerEvents = "none";
    }
    const created = (layer.current = new HeatCanvasLayer(points));
    created.setHour(hourRef.current);
    created.addTo(map);
    return () => {
      created.remove();
    };
  }, [map, points]);

  useEffect(() => {
    layer.current?.setHour(hour);
  }, [hour]);

  return null;
}
