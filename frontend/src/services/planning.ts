import type { PlanResponse, TripInput } from "@/domain/types";
import { request } from "./http";

export const planTrip = (input: TripInput, signal?: AbortSignal) =>
  request<PlanResponse>("/plan/", { method: "POST", body: input, signal });
