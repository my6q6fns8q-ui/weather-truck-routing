import { useState } from "react";
import { defaultDeparture } from "../format";
import type { Place, TripInput } from "../types";
import PlaceInput from "./PlaceInput";

interface Props {
  loading: boolean;
  onSubmit: (input: TripInput) => void;
}

const INTERVALS = [10, 25, 50];

export default function TripForm({ loading, onSubmit }: Props) {
  const [origin, setOrigin] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [departure, setDeparture] = useState(defaultDeparture);
  const [load, setLoad] = useState("34000");
  const [interval, setIntervalMi] = useState(25);
  const [storm, setStorm] = useState(false);

  const loadNum = Number(load);
  const loadValid = load !== "" && Number.isFinite(loadNum) && loadNum >= 0 && loadNum <= 120000;
  const ready = origin && destination && departure && loadValid && !loading;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination || !loadValid) return;
    onSubmit({
      origin,
      destination,
      departure: new Date(departure).toISOString(),
      load_lb: loadNum,
      interval_mi: interval,
      simulate_storm: storm,
    });
  };

  return (
    <form className="card trip-form" onSubmit={submit}>
      <PlaceInput label="From" value={origin} onChange={setOrigin} />
      <PlaceInput label="To" value={destination} onChange={setDestination} />
      <div className="row">
        <label className="field">
          <span>Departs</span>
          <input type="datetime-local" required value={departure} onChange={(e) => setDeparture(e.target.value)} />
        </label>
        <label className="field">
          <span>Load (lb)</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={120000}
            step={500}
            value={load}
            aria-invalid={!loadValid}
            onChange={(e) => setLoad(e.target.value)}
          />
        </label>
      </div>
      <fieldset className="field">
        <legend>Every</legend>
        <div className="segmented">
          {INTERVALS.map((mi) => (
            <label key={mi} className={mi === interval ? "on" : ""}>
              <input type="radio" name="interval" checked={mi === interval} onChange={() => setIntervalMi(mi)} />
              {mi} mi
            </label>
          ))}
        </div>
      </fieldset>
      <label className="switch">
        <span>Simulate storm</span>
        <input type="checkbox" role="switch" checked={storm} onChange={(e) => setStorm(e.target.checked)} />
        <i aria-hidden="true" />
      </label>
      <button className="primary" type="submit" disabled={!ready}>
        {loading ? "Planning…" : "Plan"}
      </button>
    </form>
  );
}
