import { shallowEqual } from "@/lib/store";
import { useAppStore } from "./appStore";
import {
  selectFocusedCheckpoint,
  selectIsLoading,
  selectSelectedRoute,
} from "./selectors";

export const useLocale = () => useAppStore((state) => state.locale);
export const usePlan = () => useAppStore((state) => state.plan);
export const useDraft = () => useAppStore((state) => state.draft);
export const useDraftOpen = () => useAppStore((state) => state.draftOpen);
export const usePicking = () => useAppStore((state) => state.picking);
export const useNaming = () => useAppStore((state) => state.naming);

export const usePlanError = () =>
  useAppStore((state) => state.error, shallowEqual);

export const useIsLoading = () => useAppStore(selectIsLoading);

export const useSelectedRouteId = () =>
  useAppStore((state) => state.selectedRouteId);

export const useSelectedRoute = () => useAppStore(selectSelectedRoute);
export const useFocus = () => useAppStore((state) => state.focus, shallowEqual);

export const useFocusedCheckpoint = () =>
  useAppStore(selectFocusedCheckpoint, shallowEqual);

export const useFit = () => useAppStore((state) => state.fit, shallowEqual);
export const useHour = () => useAppStore((state) => state.hour);
