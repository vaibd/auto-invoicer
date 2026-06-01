export interface FxResult {
  rate: number;
  date: string;
}

/**
 * Fetch the current USD->INR rate via our same-origin API route.
 * The route proxies a public FX API server-side so the browser CSP
 * (connect-src 'self') isn't violated. Throws on any failure.
 */
export async function fetchUsdInrRate(): Promise<FxResult> {
  const res = await fetch("/api/fx-rate", { cache: "no-store" });
  if (!res.ok) throw new Error("fx_unavailable");
  const json = await res.json();
  if (typeof json?.rate !== "number" || !isFinite(json.rate) || json.rate <= 0) {
    throw new Error("fx_unavailable");
  }
  return { rate: json.rate, date: typeof json.date === "string" ? json.date : "" };
}
