import { useTranslate } from "@/i18n";
import { usePlanError } from "@/store";

export default function PlanErrorNotice() {
  const error = usePlanError();
  const t = useTranslate();
  if (!error) return null;

  return (
    <p className="error" role="alert">
      {error.kind === "message" ? t(error.key) : error.detail}
    </p>
  );
}
