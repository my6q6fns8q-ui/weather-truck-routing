import ForecastBar from "@/features/forecast/ForecastBar";
import PickBanner from "@/features/map/PickBanner";
import RouteMap from "@/features/map/RouteMap";
import RouteList from "@/features/routes/RouteList";
import TripPanel from "@/features/trip/TripPanel";
import { useDocumentLocale, useTranslate } from "@/i18n";
import { useLocale } from "@/store";
import LocaleSwitcher from "./LocaleSwitcher";

export default function App() {
  const locale = useLocale();
  const t = useTranslate();
  useDocumentLocale(locale);

  return (
    <div className="app">
      <RouteMap />
      <PickBanner />

      <aside className="panel glass">
        <header className="panel-head">
          <h1 className="brand">{t("app.brand")}</h1>
          <LocaleSwitcher />
        </header>
        <TripPanel />
        <RouteList />
      </aside>

      <ForecastBar />
    </div>
  );
}
