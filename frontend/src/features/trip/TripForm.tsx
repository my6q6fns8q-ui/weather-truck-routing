import {
  INTERVALS_MI,
  isDraftReady,
  isLoadValid,
  MAX_LOAD_LB,
} from "@/domain/trip";
import { useTranslate } from "@/i18n";
import { planActions, tripActions, useDraft, useIsLoading } from "@/store";
import PlaceInput from "./PlaceInput";

export default function TripForm() {
  const draft = useDraft();
  const loading = useIsLoading();
  const t = useTranslate();

  const loadValid = isLoadValid(draft.loadLb);
  const ready = isDraftReady(draft) && !loading;

  return (
    <form
      className="trip-form"
      onSubmit={(event) => {
        event.preventDefault();
        planActions.submitPlan();
      }}
    >
      <PlaceInput target="origin" label={t("trip.from")} />
      <button
        type="button"
        className="swap"
        onClick={tripActions.swapEndpoints}
        aria-label={t("trip.swap")}
        title={t("trip.swap")}
      >
        ⇅
      </button>
      <PlaceInput target="destination" label={t("trip.to")} />

      <div className="row">
        <label className="field">
          <span>{t("trip.departs")}</span>
          <input
            type="datetime-local"
            required
            value={draft.departure}
            onChange={(event) => tripActions.setDeparture(event.target.value)}
          />
        </label>
        <label className="field">
          <span>{t("trip.load", { unit: t("units.lb") })}</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_LOAD_LB}
            step={500}
            value={draft.loadLb}
            aria-invalid={!loadValid}
            onChange={(event) => tripActions.setLoad(event.target.value)}
          />
        </label>
      </div>

      <fieldset className="field">
        <legend>{t("trip.every")}</legend>
        <div className="segmented">
          {INTERVALS_MI.map((miles) => (
            <label
              key={miles}
              className={miles === draft.intervalMi ? "on" : ""}
            >
              <input
                type="radio"
                name="interval"
                checked={miles === draft.intervalMi}
                onChange={() => tripActions.setInterval(miles)}
              />
              {t("trip.interval", { miles })}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="switch">
        <span>{t("trip.simulateStorm")}</span>
        <input
          type="checkbox"
          role="switch"
          checked={draft.simulateStorm}
          onChange={(event) =>
            tripActions.setSimulateStorm(event.target.checked)
          }
        />
        <i aria-hidden="true" />
      </label>

      <button className="primary" type="submit" disabled={!ready}>
        {loading ? t("trip.planning") : t("trip.plan")}
      </button>
    </form>
  );
}
