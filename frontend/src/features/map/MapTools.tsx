import L from "leaflet";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { useTranslate } from "@/i18n";

interface Props {
  canFit: boolean;
  onFit: () => void;
}

export default function MapTools({ canFit, onFit }: Props) {
  const map = useMap();
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslate();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    L.DomEvent.disableClickPropagation(element);
    L.DomEvent.disableScrollPropagation(element);
  }, []);

  return (
    <div ref={ref} className="map-tools glass">
      <button aria-label={t("map.zoomIn")} onClick={() => map.zoomIn()}>
        +
      </button>
      <button aria-label={t("map.zoomOut")} onClick={() => map.zoomOut()}>
        −
      </button>
      {canFit && (
        <button
          aria-label={t("map.fitRoute")}
          title={t("map.fitRoute")}
          onClick={onFit}
        >
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
