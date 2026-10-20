import { initialLocale } from "@/i18n/preference";
import { createStore, createStoreHook } from "@/lib/store";
import { type AppState, initialState } from "./state";

export const appStore = createStore<AppState>(initialState(initialLocale()));

export const useAppStore = createStoreHook(appStore);

export const { getState, setState } = appStore;
