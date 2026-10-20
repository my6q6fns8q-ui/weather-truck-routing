import { useEffect, useState } from "react";
import type { Place } from "@/domain/types";
import { useLocale } from "@/i18n";
import { isAbort } from "@/services/http";
import { MIN_QUERY_LENGTH, searchPlaces } from "@/services/places";

export type SearchStatus = "idle" | "loading" | "empty" | "error";

const DEBOUNCE_MS = 300;

export function usePlaceSearch(query: string, enabled: boolean) {
  const locale = useLocale();
  const [options, setOptions] = useState<Place[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");

  useEffect(() => {
    const q = query.trim();
    if (!enabled || q.length < MIN_QUERY_LENGTH) {
      setOptions([]);
      setStatus("idle");
      return;
    }

    setStatus("loading");
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const found = await searchPlaces(q, {
          lang: locale,
          signal: controller.signal,
        });
        setOptions(found);
        setStatus(found.length ? "idle" : "empty");
      } catch (error) {
        if (!isAbort(error)) setStatus("error");
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, enabled, locale]);

  return { options, status };
}
