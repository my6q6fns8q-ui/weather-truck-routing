import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/planning", () => ({ planTrip: vi.fn() }));

import { ApiError } from "@/services/http";
import { planTrip } from "@/services/planning";
import { appStore } from "./appStore";
import { place, plan } from "./fixtures";
import * as planActions from "./plan.actions";
import { initialState } from "./state";
import * as tripActions from "./trip.actions";

const readyDraft = () => {
  tripActions.setPlace("origin", place("Chicago"));
  tripActions.setPlace("destination", place("Memphis", 35.15, -90.05));
};

describe("submitPlan", () => {
  beforeEach(() => {
    appStore.setState(initialState("en"));
    vi.mocked(planTrip).mockReset();
  });

  it("complains about the draft instead of calling the API", async () => {
    await planActions.submitPlan();

    expect(planTrip).not.toHaveBeenCalled();
    expect(appStore.getState().error).toEqual({
      kind: "message",
      key: "error.endpoints",
    });
  });

  it("selects the recommended route and closes the form", async () => {
    readyDraft();
    vi.mocked(planTrip).mockResolvedValue(plan());

    await planActions.submitPlan();

    const state = appStore.getState();
    expect(state.status).toBe("ready");
    expect(state.selectedRouteId).toBe("r2");
    expect(state.draftOpen).toBe(false);
    expect(state.picking).toBeNull();
  });

  it("keeps the API's own wording for a rejected request", async () => {
    readyDraft();
    vi.mocked(planTrip).mockRejectedValue(
      new ApiError("server", { status: 422, detail: "No route found." }),
    );

    await planActions.submitPlan();

    expect(appStore.getState().error).toEqual({
      kind: "detail",
      detail: "No route found.",
    });
    expect(appStore.getState().status).toBe("error");
  });

  it("translates a lost connection", async () => {
    readyDraft();
    vi.mocked(planTrip).mockRejectedValue(new ApiError("network"));

    await planActions.submitPlan();

    expect(appStore.getState().error).toEqual({
      kind: "message",
      key: "error.network",
    });
  });

  it("clears the complaint as soon as the draft changes", async () => {
    await planActions.submitPlan();
    tripActions.setLoad("30000");

    expect(appStore.getState().error).toBeNull();
    expect(appStore.getState().status).toBe("idle");
  });

  it("ignores a superseded request", async () => {
    readyDraft();
    vi.mocked(planTrip)
      .mockImplementationOnce(
        (_input, signal) =>
          new Promise((_resolve, reject) =>
            signal?.addEventListener("abort", () =>
              reject(
                Object.assign(new Error("aborted"), { name: "AbortError" }),
              ),
            ),
          ),
      )
      .mockResolvedValueOnce(plan());

    const stale = planActions.submitPlan();
    const fresh = planActions.submitPlan();
    await Promise.all([stale, fresh]);

    expect(appStore.getState().status).toBe("ready");
    expect(appStore.getState().error).toBeNull();
  });
});
