import { describe, it, expect, afterEach, vi } from "vitest";
import { fetchUsdInrRate } from "@/lib/fx-rate";

afterEach(() => vi.unstubAllGlobals());

function mockFetch(impl: () => Partial<Response> & { json?: () => unknown }) {
  vi.stubGlobal("fetch", vi.fn(async () => impl() as Response));
}

describe("fetchUsdInrRate", () => {
  it("returns the rate and date on a valid response", async () => {
    mockFetch(() => ({ ok: true, json: async () => ({ rate: 83.2, date: "2026-05-20" }) }));
    await expect(fetchUsdInrRate()).resolves.toEqual({ rate: 83.2, date: "2026-05-20" });
  });

  it("defaults date to an empty string when absent", async () => {
    mockFetch(() => ({ ok: true, json: async () => ({ rate: 83.2 }) }));
    await expect(fetchUsdInrRate()).resolves.toEqual({ rate: 83.2, date: "" });
  });

  it("throws when the response is not ok", async () => {
    mockFetch(() => ({ ok: false, json: async () => ({}) }));
    await expect(fetchUsdInrRate()).rejects.toThrow("fx_unavailable");
  });

  it("throws when the rate is missing, non-numeric, or non-positive", async () => {
    mockFetch(() => ({ ok: true, json: async () => ({}) }));
    await expect(fetchUsdInrRate()).rejects.toThrow("fx_unavailable");

    mockFetch(() => ({ ok: true, json: async () => ({ rate: "83" }) }));
    await expect(fetchUsdInrRate()).rejects.toThrow("fx_unavailable");

    mockFetch(() => ({ ok: true, json: async () => ({ rate: 0 }) }));
    await expect(fetchUsdInrRate()).rejects.toThrow("fx_unavailable");
  });
});
