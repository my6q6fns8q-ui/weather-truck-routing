import { routeNumber, routesByRank } from "@/domain/plan";
import { useTranslate } from "@/i18n";
import {
  planActions,
  useFocus,
  useIsLoading,
  usePlan,
  useSelectedRouteId,
} from "@/store";
import RouteCard from "./RouteCard";

export default function RouteList() {
  const plan = usePlan();
  const selectedId = useSelectedRouteId();
  const focus = useFocus();
  const loading = useIsLoading();
  const t = useTranslate();
  if (!plan) return null;

  return (
    <section
      aria-label={t("routes.section")}
      className={loading ? "stale" : ""}
    >
      {plan.simulated_storm && (
        <p className="sim">{t("routes.simulatedStorm")}</p>
      )}
      {routesByRank(plan).map((route) => (
        <RouteCard
          key={route.id}
          route={route}
          number={routeNumber(plan, route)}
          selected={route.id === selectedId}
          focusMile={focus?.routeId === route.id ? focus.mile : null}
          onSelect={() => planActions.selectRoute(route.id)}
          onFocusCheckpoint={(checkpoint) =>
            planActions.focusCheckpoint(route, checkpoint)
          }
        />
      ))}
    </section>
  );
}
