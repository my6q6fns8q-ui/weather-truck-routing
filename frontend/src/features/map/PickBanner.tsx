import { useTranslate } from "@/i18n";
import {
  planActions,
  tripActions,
  useDraft,
  usePicking,
  usePlan,
} from "@/store";

export default function PickBanner() {
  const picking = usePicking();
  const draft = useDraft();
  const plan = usePlan();
  const t = useTranslate();

  if (picking) {
    const step = picking === "origin" ? 1 : 2;
    return (
      <div className="pick-banner glass" role="status">
        <span>
          <strong>
            {t(picking === "origin" ? "pick.origin" : "pick.destination")}
          </strong>
          <small>{t("pick.step", { step })}</small>
        </span>
        <button className="ghost" onClick={tripActions.cancelPicking}>
          {t("pick.cancel")}
        </button>
      </div>
    );
  }

  if (!plan && draft.origin && draft.destination) {
    return (
      <div className="pick-banner glass" role="status">
        <span>
          <strong>{t("pick.ready")}</strong>
          <small>{t("pick.dragHint")}</small>
        </span>
        <button className="ghost strong" onClick={planActions.submitPlan}>
          {t("pick.planNow")}
        </button>
      </div>
    );
  }

  return null;
}
