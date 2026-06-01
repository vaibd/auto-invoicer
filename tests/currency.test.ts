import { describe, it, expect } from "vitest";
import { formatCurrency, getCurrencySymbol, CURRENCIES } from "@/lib/currency";

describe("getCurrencySymbol", () => {
  it("returns the symbol for a known currency", () => {
    expect(getCurrencySymbol("USD")).toBe("$");
    expect(getCurrencySymbol("INR")).toBe("₹");
    expect(getCurrencySymbol("EUR")).toBe("€");
  });

  it("falls back to the code itself for an unknown currency", () => {
    expect(getCurrencySymbol("XYZ")).toBe("XYZ");
    expect(getCurrencySymbol("")).toBe("");
  });

  it("has a symbol for every currency in the list", () => {
    for (const c of CURRENCIES) {
      expect(getCurrencySymbol(c.code)).toBe(c.symbol);
    }
  });
});

describe("formatCurrency", () => {
  it("formats USD with the dollar symbol and two decimals", () => {
    expect(formatCurrency(1234.5, "USD")).toBe("$1,234.50");
  });

  it("formats zero and negative amounts", () => {
    expect(formatCurrency(0, "USD")).toBe("$0.00");
    expect(formatCurrency(-50, "USD")).toBe("-$50.00");
  });

  it("respects currency-specific fraction digits (JPY has none)", () => {
    expect(formatCurrency(1000, "JPY")).toBe("¥1,000");
  });
});
