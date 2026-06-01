import { NextResponse } from "next/server";

/**
 * USD->INR exchange rate proxy.
 *
 * Runs server-side so the browser's strict CSP (connect-src 'self') is never
 * involved. Upstream is a free, keyless endpoint; its response is cached for an
 * hour via the Data Cache (the rate moves slowly), while the handler itself
 * stays dynamic so clients always get a response.
 */
export async function GET() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`upstream ${res.status}`);

    const json = await res.json();
    const rate = json?.rates?.INR;
    if (typeof rate !== "number" || !isFinite(rate) || rate <= 0) {
      throw new Error("missing INR rate");
    }

    return NextResponse.json({
      rate,
      date:
        typeof json?.time_last_update_utc === "string"
          ? json.time_last_update_utc
          : new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "fx_unavailable" }, { status: 502 });
  }
}
