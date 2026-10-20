import { placeAt, samePlace } from "@/domain/place";
import type { IntervalMi, TripDraft } from "@/domain/trip";
import type { Place } from "@/domain/types";
import { reverseGeocode } from "@/services/places";
import { getState, setState } from "./appStore";
import { nextFit, type PickTarget } from "./state";

function patchDraft(patch: Partial<TripDraft>) {
  setState((state) => ({
    draft: { ...state.draft, ...patch },
    ...(state.status === "error"
      ? {
          status: state.plan ? ("ready" as const) : ("idle" as const),
          error: null,
        }
      : null),
  }));
}

export const openDraft = () => setState({ draftOpen: true });

export const toggleDraft = () =>
  setState((state) => ({ draftOpen: !state.draftOpen }));

export const setDeparture = (departure: string) => patchDraft({ departure });
export const setLoad = (loadLb: string) => patchDraft({ loadLb });

export const setInterval = (intervalMi: IntervalMi) =>
  patchDraft({ intervalMi });

export const setSimulateStorm = (simulateStorm: boolean) =>
  patchDraft({ simulateStorm });

export const setPlace = (target: PickTarget, place: Place | null) =>
  patchDraft({ [target]: place });

const advanceFrom = (
  draft: TripDraft,
  target: PickTarget,
): PickTarget | null =>
  target === "origin" && !draft.destination ? "destination" : null;

export const swapEndpoints = () =>
  patchDraft({
    origin: getState().draft.destination,
    destination: getState().draft.origin,
  });

export function choosePlace(target: PickTarget, place: Place) {
  setPlace(target, place);
  setState((state) =>
    state.picking === target
      ? { picking: advanceFrom(state.draft, target) }
      : {},
  );
}

export const startPicking = (target: PickTarget) =>
  setState({ picking: target });

export const cancelPicking = () => setState({ picking: null });

export async function pickPoint(lat: number, lon: number) {
  const target = getState().picking;
  if (target) await dropPin(target, lat, lon, { advance: true });
}

export const movePin = (target: PickTarget, lat: number, lon: number) =>
  dropPin(target, lat, lon, { advance: false });

async function dropPin(
  target: PickTarget,
  lat: number,
  lon: number,
  { advance }: { advance: boolean },
) {
  const pending = placeAt(lat, lon);
  setPlace(target, pending);
  setState((state) => ({
    picking: advance ? advanceFrom(state.draft, target) : state.picking,
    naming: target,
    fit:
      state.plan || !bothSet(state.draft)
        ? state.fit
        : nextFit(state.fit, "all"),
  }));

  try {
    const named = await reverseGeocode(lat, lon, { lang: getState().locale });
    if (named && samePlace(getState().draft[target], pending))
      setPlace(target, named);
  } catch {
  } finally {
    if (getState().naming === target) setState({ naming: null });
  }
}

const bothSet = (draft: TripDraft) => !!draft.origin && !!draft.destination;
