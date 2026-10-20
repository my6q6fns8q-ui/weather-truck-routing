import { useCallback, useRef, useState } from "react";
import { ApiError, planTrip } from "./api";
import ForecastSlider from "./components/ForecastSlider";
import RouteCard from "./components/RouteCard";
import TripForm from "./components/TripForm";
import { formatClock, shortPlace } from "./format";
import MapView, { type FitRequest } from "./map/MapView";
import type { Checkpoint, PlanResponse, TripInput } from "./types";

export default function App() {
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ routeId: string; mile: number } | null>(null);
  const [fit, setFit] = useState<FitRequest>({ target: "all", n: 0 });
  const [hour, setHour] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController>();

  const submit = useCallback(async (input: TripInput) => {
    abort.current?.abort();
    const ctl = (abort.current = new AbortController());
    setLoading(true);
    setError(null);
    try {
      const result = await planTrip(input, ctl.signal);
      setPlan(result);
      setSelectedId(result.recommended_route_id);
      setFocus(null);
      setHour(0);
      setEditing(false);
      setFit((f) => ({ target: "all", n: f.n + 1 }));
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof ApiError ? err.message : "Something went wrong planning this trip.");
    } finally {
      if (abort.current === ctl) setLoading(false);
    }
  }, []);

  const select = useCallback((id: string) => {
    setSelectedId(id);
    setFocus(null);
    setFit((f) => ({ target: id, n: f.n + 1 }));
  }, []);
  const focusCheckpoint = useCallback((routeId: string, cp: Checkpoint) => setFocus({ routeId, mile: cp.mile }), []);

  const selected = plan?.routes.find((r) => r.id === selectedId) ?? null;
  const routesByRank = plan ? [...plan.routes].sort((a, b) => a.rank - b.rank) : [];

  return (
    <div className="app">
      <MapView
        plan={plan}
        selectedId={selectedId}
        focus={focus}
        fit={fit}
        hour={hour}
        onSelect={select}
        onFocus={focusCheckpoint}
      />

      <aside className="panel glass">
        <h1 className="brand">Route Wise</h1>

        {plan && (
          <button className="summary" onClick={() => setEditing((e) => !e)} aria-expanded={editing}>
            <span>
              <strong>
                {shortPlace(plan.origin.label)} → {shortPlace(plan.destination.label)}
              </strong>
              <small>
                {formatClock(plan.departure)} · {plan.load_lb.toLocaleString()} lb
              </small>
            </span>
            <i className={`chev${editing ? " up" : ""}`} aria-hidden="true" />
          </button>
        )}

        <div hidden={!!plan && !editing}>
          <TripForm loading={loading} onSubmit={submit} />
        </div>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {plan && (
          <section aria-label="Route options" className={loading ? "stale" : ""}>
            {plan.simulated_storm && <p className="sim">Simulated storm</p>}
            {routesByRank.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                index={plan.routes.indexOf(route)}
                selected={route.id === selectedId}
                focusMile={focus?.routeId === route.id ? focus.mile : null}
                onSelect={() => select(route.id)}
                onFocusCheckpoint={(cp) => focusCheckpoint(route.id, cp)}
              />
            ))}
          </section>
        )}
      </aside>

      {plan && (
        <ForecastSlider
          start={plan.heatmap.start}
          maxHours={plan.heatmap.hours}
          hour={hour}
          tripHours={selected ? selected.duration_s / 3600 : null}
          onChange={setHour}
        />
      )}
    </div>
  );
}
