import { useCallback, useRef, useSyncExternalStore } from "react";

export type Patch<S> = Partial<S> | ((state: S) => Partial<S>);
export type Equality<T> = (a: T, b: T) => boolean;

export interface Store<S> {
  getState: () => S;
  setState: (patch: Patch<S>) => void;
  subscribe: (listener: () => void) => () => void;
}

export function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  )
    return false;
  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(
    (key) =>
      Object.hasOwn(b as object, key) &&
      Object.is(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      ),
  );
}

export function createStore<S extends object>(initial: S): Store<S> {
  let state = initial;
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    setState: (patch) => {
      const next = {
        ...state,
        ...(typeof patch === "function" ? patch(state) : patch),
      };
      if (shallowEqual(state, next)) return;
      state = next;
      for (const listener of [...listeners]) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export function createStoreHook<S extends object>(store: Store<S>) {
  return function useStore<T>(
    select: (state: S) => T,
    isEqual: Equality<T> = Object.is,
  ): T {
    const cache = useRef<{ state: S; value: T } | null>(null);

    const getSnapshot = useCallback(() => {
      const state = store.getState();
      const cached = cache.current;
      if (cached && cached.state === state) return cached.value;
      const value = select(state);
      const settled =
        cached && isEqual(cached.value, value) ? cached.value : value;
      cache.current = { state, value: settled };
      return settled;
    }, [select, isEqual]);

    return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
  };
}
