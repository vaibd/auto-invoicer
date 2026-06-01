import { describe, it, expect, afterEach, vi } from "vitest";
import { GET } from "@/app/api/fx-rate/route";

afterEach(() => vi.unstubAllGlobals());

function mockFetch(impl: () => Partial<Response> & { json?: () => unknown }) {
  vi.stubGlobal("fetch", vi.fn(async () => impl() as Response));
}

describe("GET /api/fx-rate", () => {
  it("returns the upstream INR rate and update time", async () => {
    mockFetch(() => ({
      ok: true,
      json: async () => ({ rates: { INR: 83.5 }, time_last_update_utc: "Tue, 20 May 2026" }),
    }));
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ rate: 83.5, date: "Tue, 20 May 2026" });
  });

  it("falls back to an ISO date when the upstream omits the timestamp", async () => {
    mockFetch(() => ({ ok: true, json: async () => ({ rates: { INR: 83.5 } }) }));
    const body = await (await GET()).json();
    expect(body.rate).toBe(83.5);
    expect(typeof body.date).toBe("string");
    expect(body.date.length).toBeGreaterThan(0);
  });

  it("responds 502 when the upstream call fails", async () => {
    mockFetch(() => ({ ok: false, status: 503, json: async () => ({}) }));
    const res = await GET();
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ error: "fx_unavailable" });
  });

  it("responds 502 when the INR rate is missing or invalid", async () => {
    mockFetch(() => ({ ok: true, json: async () => ({ rates: {} }) }));
    expect((await GET()).status).toBe(502);

    mockFetch(() => ({ ok: true, json: async () => ({ rates: { INR: -1 } }) }));
    expect((await GET()).status).toBe(502);
  });
});
