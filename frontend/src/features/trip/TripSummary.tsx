import { useFormatter, useTranslate } from "@/i18n";
import { shortPlace } from "@/lib/format";
import { tripActions, useDraftOpen, usePlan } from "@/store";

export default function TripSummary() {
  const plan = usePlan();
  const open = useDraftOpen();
  const fmt = useFormatter();
  const t = useTranslate();
  if (!plan) return null;

  return (
    <button
      className="summary"
      onClick={tripActions.toggleDraft}
      aria-expanded={open}
      aria-label={t("trip.editDetails")}
    >
      <span>
        <strong>
          {shortPlace(plan.origin.label)} → {shortPlace(plan.destination.label)}
        </strong>
        <small>
          {fmt.clock(plan.departure)} · {fmt.pounds(plan.load_lb)}
        </small>
      </span>
      <i className={`chev${open ? " up" : ""}`} aria-hidden="true" />
    </button>
  );
}
