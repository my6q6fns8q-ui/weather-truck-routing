import { useDraftOpen, usePlan } from "@/store";
import PlanErrorNotice from "./PlanErrorNotice";
import TripForm from "./TripForm";
import TripSummary from "./TripSummary";

export default function TripPanel() {
  const plan = usePlan();
  const open = useDraftOpen();

  return (
    <>
      <TripSummary />
      <div hidden={!!plan && !open}>
        <TripForm />
      </div>
      <PlanErrorNotice />
    </>
  );
}
