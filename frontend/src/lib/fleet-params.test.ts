import { describe, expect, it } from "vitest";
import {
  activeFilterCount,
  clearFilters,
  DEFAULT_PARAMS,
  parseFleetParams,
  toApiQuery,
  toPageQuery,
  withChanges,
} from "./fleet-params";

const parse = (query: string) => parseFleetParams(new URLSearchParams(query));

describe("parseFleetParams", () => {
  it("reads every supported parameter", () => {
    const params = parse(
      "branch=jakarta&pickup_at=2026-12-03T09:00:00%2B07:00&return_at=2026-12-05T09:00:00%2B07:00&category=suv,mpv&brand=toyota&fuel_type=diesel&transmission=automatic&seats_min=7&price_min=200000&price_max=800000&sort=-price&page=3&per_page=24&view=list",
    );

    expect(params).toEqual({
      branch: "jakarta",
      pickupAt: "2026-12-03T09:00:00+07:00",
      returnAt: "2026-12-05T09:00:00+07:00",
      category: ["suv", "mpv"],
      brand: ["toyota"],
      fuelType: ["diesel"],
      transmission: "automatic",
      seatsMin: 7,
      priceMin: 200000,
      priceMax: 800000,
      sort: "-price",
      page: 3,
      perPage: 24,
      view: "list",
    });
  });

  it("drops malformed values", () => {
    expect(
      parse(
        "seats_min=abc&view=tiles&sort=random&page=0&per_page=25&transmission=semi&fuel_type=coal,diesel&category=SUV!,mpv&pickup_at=besok&branch=../x",
      ),
    ).toEqual({ ...DEFAULT_PARAMS, fuelType: ["diesel"], category: ["mpv"] });
  });

  it("drops a maximum below the minimum", () => {
    expect(parse("price_min=500000&price_max=100000")).toMatchObject({
      priceMin: 500000,
      priceMax: null,
    });
  });
});

describe("serialising", () => {
  it("omits defaults in the page URL and keeps a stable order", () => {
    expect(toPageQuery(DEFAULT_PARAMS)).toBe("");
    expect(
      toPageQuery({ ...DEFAULT_PARAMS, sort: "price", category: ["suv"], branch: "jakarta" }),
    ).toBe("branch=jakarta&category=suv&sort=price");
  });

  it("maps to the API query with filter[...] keys", () => {
    const api = new URLSearchParams(
      toApiQuery({
        ...DEFAULT_PARAMS,
        branch: "jakarta",
        pickupAt: "2026-12-03T09:00:00+07:00",
        returnAt: "2026-12-04T09:00:00+07:00",
        category: ["suv", "mpv"],
        seatsMin: 5,
      }),
    );

    expect(Object.fromEntries(api)).toEqual({
      branch: "jakarta",
      pickup_at: "2026-12-03T09:00:00+07:00",
      return_at: "2026-12-04T09:00:00+07:00",
      "filter[category]": "suv,mpv",
      "filter[seats_min]": "5",
      sort: "popular",
      page: "1",
      per_page: "12",
    });
  });

  it("never sends dates without both dates and a branch", () => {
    const api = new URLSearchParams(
      toApiQuery({ ...DEFAULT_PARAMS, pickupAt: "2026-12-03T09:00:00+07:00" }),
    );
    expect(api.has("pickup_at")).toBe(false);
  });

  it("round-trips through the URL", () => {
    const params = {
      ...DEFAULT_PARAMS,
      brand: ["toyota", "honda"],
      priceMax: 900000,
      view: "list" as const,
    };
    expect(parse(toPageQuery(params))).toEqual(params);
  });
});

describe("changes", () => {
  it("resets the page unless the page changes", () => {
    const params = { ...DEFAULT_PARAMS, page: 4 };
    expect(withChanges(params, { sort: "price" }).page).toBe(1);
    expect(withChanges(params, { page: 5 }).page).toBe(5);
  });

  it("counts and clears filters but keeps the search", () => {
    const params = {
      ...DEFAULT_PARAMS,
      branch: "jakarta",
      category: ["suv", "mpv"],
      transmission: "manual" as const,
      priceMin: 1,
      priceMax: 2,
    };
    expect(activeFilterCount(params)).toBe(4);
    expect(clearFilters(params)).toEqual({ ...DEFAULT_PARAMS, branch: "jakarta" });
  });
});
