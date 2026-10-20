import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Place } from "@/domain/types";

vi.mock("@/services/places", () => ({
  MIN_QUERY_LENGTH: 3,
  reverseGeocode: vi.fn(),
  searchPlaces: vi.fn(),
}));

import { reverseGeocode } from "@/services/places";
import { appStore } from "./appStore";
import { initialState } from "./state";
import * as tripActions from "./trip.actions";

const named = (label: string): Place => ({ label, lat: 41.5, lon: -88.1 });

describe("picking endpoints on the map", () => {
  beforeEach(() => {
    appStore.setState(initialState("en"));
    vi.mocked(reverseGeocode).mockReset();
  });

  it("names the clicked point and moves on to the destination", async () => {
    vi.mocked(reverseGeocode).mockResolvedValue(named("Joliet, Illinois"));

    await tripActions.pickPoint(41.5, -88.1);

    const state = appStore.getState();
    expect(state.draft.origin?.label).toBe("Joliet, Illinois");
    expect(state.picking).toBe("destination");
    expect(state.naming).toBeNull();
  });

  it("keeps the coordinates as a label when naming fails", async () => {
    vi.mocked(reverseGeocode).mockRejectedValue(new Error("offline"));

    await tripActions.pickPoint(41.5, -88.1);

    expect(appStore.getState().draft.origin?.label).toBe("41.5000, -88.1000");
    expect(appStore.getState().naming).toBeNull();
  });

  it("stops picking once both endpoints are set", async () => {
    vi.mocked(reverseGeocode).mockResolvedValue(named("Joliet, Illinois"));
    await tripActions.pickPoint(41.5, -88.1);
    await tripActions.pickPoint(35.1, -90.0);

    expect(appStore.getState().picking).toBeNull();
    expect(appStore.getState().fit.nonce).toBeGreaterThan(0);
  });

  it("does not rename an endpoint the user changed while naming was in flight", async () => {
    let settle: (place: Place) => void = () => {};
    vi.mocked(reverseGeocode).mockReturnValueOnce(
      new Promise((resolve) => (settle = resolve)),
    );

    const picking = tripActions.pickPoint(41.5, -88.1);
    tripActions.setPlace("origin", named("Picked from search"));
    settle(named("Late answer"));
    await picking;

    expect(appStore.getState().draft.origin?.label).toBe("Picked from search");
  });

  it("moves the flow along when a place comes from search instead of the map", () => {
    tripActions.choosePlace("origin", named("Chicago, Illinois"));
    expect(appStore.getState().picking).toBe("destination");

    tripActions.choosePlace("destination", named("Memphis, Tennessee"));
    expect(appStore.getState().picking).toBeNull();
  });

  it("swaps start and destination", () => {
    tripActions.setPlace("origin", named("A"));
    tripActions.setPlace("destination", named("B"));

    tripActions.swapEndpoints();

    const { draft } = appStore.getState();
    expect([draft.origin?.label, draft.destination?.label]).toEqual(["B", "A"]);
  });
});
