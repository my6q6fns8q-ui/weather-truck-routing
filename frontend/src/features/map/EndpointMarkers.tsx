import type { LeafletEvent, Marker as LeafletMarker } from "leaflet";
import { Marker, Tooltip } from "react-leaflet";
import { placePosition } from "@/domain/place";
import type { Place } from "@/domain/types";
import { useTranslate } from "@/i18n";
import { shortPlace } from "@/lib/format";
import { type PickTarget, tripActions, useDraft } from "@/store";
import { DESTINATION_ICON, ORIGIN_ICON } from "./icons";

interface MarkerProps {
  target: PickTarget;
  place: Place;
  title: string;
}

function EndpointMarker({ target, place, title }: MarkerProps) {
  return (
    <Marker
      position={placePosition(place)}
      icon={target === "origin" ? ORIGIN_ICON : DESTINATION_ICON}
      draggable
      autoPan
      title={title}
      zIndexOffset={600}
      eventHandlers={{
        dragend: (event: LeafletEvent) => {
          const { lat, lng } = (event.target as LeafletMarker).getLatLng();
          tripActions.movePin(target, lat, lng);
        },
      }}
    >
      <Tooltip permanent direction="top" offset={[0, -8]} className="tip place">
        {shortPlace(place.label)}
      </Tooltip>
    </Marker>
  );
}

export default function EndpointMarkers() {
  const draft = useDraft();
  const t = useTranslate();

  return (
    <>
      {draft.origin && (
        <EndpointMarker
          target="origin"
          place={draft.origin}
          title={t("map.start")}
        />
      )}
      {draft.destination && (
        <EndpointMarker
          target="destination"
          place={draft.destination}
          title={t("map.destination")}
        />
      )}
    </>
  );
}
