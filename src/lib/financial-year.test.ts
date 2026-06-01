import { describe, it, expect } from "vitest";
import { getFinancialYear, getFinancialYearShort } from "@/lib/financial-year";

// FY runs Apr -> Mar. Months are 0-indexed in the Date constructor.
describe("getFinancialYear", () => {
  it("treats April through December as the start of the FY", () => {
    expect(getFinancialYear(new Date(2026, 3, 1))).toBe("2026-2027"); // Apr
    expect(getFinancialYear(new Date(2026, 5, 1))).toBe("2026-2027"); // Jun
    expect(getFinancialYear(new Date(2026, 11, 31))).toBe("2026-2027"); // Dec
  });

  it("treats January through March as the tail of the previous FY", () => {
    expect(getFinancialYear(new Date(2026, 0, 1))).toBe("2025-2026"); // Jan
    expect(getFinancialYear(new Date(2026, 1, 15))).toBe("2025-2026"); // Feb
    expect(getFinancialYear(new Date(2026, 2, 31))).toBe("2025-2026"); // Mar
  });

  it("flips exactly at the Mar 31 -> Apr 1 boundary", () => {
    expect(getFinancialYear(new Date(2026, 2, 31))).toBe("2025-2026");
    expect(getFinancialYear(new Date(2026, 3, 1))).toBe("2026-2027");
  });
});

describe("getFinancialYearShort", () => {
  it("returns the two-digit form", () => {
    expect(getFinancialYearShort(new Date(2026, 5, 1))).toBe("26-27");
    expect(getFinancialYearShort(new Date(2026, 1, 15))).toBe("25-26");
  });

  it("pads century boundaries to two digits", () => {
    expect(getFinancialYearShort(new Date(2000, 3, 1))).toBe("00-01");
    expect(getFinancialYearShort(new Date(2000, 0, 1))).toBe("99-00");
  });
});
