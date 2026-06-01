import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  generateTemplateLabel,
  resolveForMonth,
  resolveTemplate,
  formatDate,
  formatDateRange,
} from "@/lib/date-templates";

describe("generateTemplateLabel", () => {
  it("describes today-relative ranges", () => {
    expect(generateTemplateLabel("today", "full")).toBe("Today");
    expect(generateTemplateLabel("today", "last-n", 7)).toBe("Last 7 days");
    expect(generateTemplateLabel("today", "first-n", 30)).toBe("Next 30 days");
  });

  it("describes month-relative ranges", () => {
    expect(generateTemplateLabel("previous", "full")).toBe("Previous month (full)");
    expect(generateTemplateLabel("current", "first-n", 10)).toBe(
      "Current month (first 10 days)"
    );
    expect(generateTemplateLabel("next", "last-n", 5)).toBe("Next month (last 5 days)");
  });

  it("uses sensible day defaults when none is given", () => {
    expect(generateTemplateLabel("today", "last-n")).toBe("Last 7 days");
    expect(generateTemplateLabel("previous", "first-n")).toBe(
      "Previous month (first 15 days)"
    );
  });
});

describe("resolveForMonth", () => {
  it("returns the full month with the correct last day (Feb 2024 is a leap year)", () => {
    const { from, to } = resolveForMonth(1, 2024, "full");
    expect(from).toEqual(new Date(2024, 1, 1));
    expect(to).toEqual(new Date(2024, 1, 29));
  });

  it("returns Feb 2026 (non-leap) ending on the 28th", () => {
    expect(resolveForMonth(1, 2026, "full").to).toEqual(new Date(2026, 1, 28));
  });

  it("splits the month into halves", () => {
    const first = resolveForMonth(4, 2026, "first-half");
    expect(first.from).toEqual(new Date(2026, 4, 1));
    expect(first.to).toEqual(new Date(2026, 4, 15));

    const last = resolveForMonth(4, 2026, "last-half");
    expect(last.from).toEqual(new Date(2026, 4, 16));
    expect(last.to).toEqual(new Date(2026, 4, 31));
  });
});

describe("resolveTemplate", () => {
  it("resolves a matching custom template ahead of builtins", () => {
    const { from, to } = resolveTemplate("my-custom", null, [
      {
        id: "my-custom",
        label: "Custom",
        isCustom: true,
        base: "today",
        mode: "last-n",
        days: 1,
      },
    ]);
    // last-n with 1 day => from === to === today (midnight)
    expect(from.getTime()).toBe(to.getTime());
  });

  it("returns a from <= to range for a builtin id", () => {
    const { from, to } = resolveTemplate("prev-full", null, []);
    expect(from.getTime()).toBeLessThanOrEqual(to.getTime());
  });

  it("falls back to the target full month for an unknown id", () => {
    const unknown = resolveTemplate("does-not-exist", null, []);
    const prevFull = resolveTemplate("prev-full", null, []);
    expect(unknown).toEqual(prevFull);
  });
});

describe("resolveTemplate builtin branches (clock fixed at 2026-05-20)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 20, 12, 0, 0)); // 20 May 2026, local
  });
  afterEach(() => vi.useRealTimers());

  // With defaultMonth = null the "target month" is the previous month (April 2026).
  const cases: Record<string, { from: Date; to: Date }> = {
    "prev-full": { from: new Date(2026, 3, 1), to: new Date(2026, 3, 30) },
    "last-15-days": { from: new Date(2026, 3, 16), to: new Date(2026, 3, 30) },
    "prev-2-months": { from: new Date(2026, 2, 1), to: new Date(2026, 3, 30) },
    "curr-first-15-days": { from: new Date(2026, 4, 1), to: new Date(2026, 4, 15) },
    "curr-last-15-days": { from: new Date(2026, 4, 17), to: new Date(2026, 4, 31) },
    "next-full": { from: new Date(2026, 5, 1), to: new Date(2026, 5, 30) },
    "next-last-15-days": { from: new Date(2026, 5, 16), to: new Date(2026, 5, 30) },
    "next-2-months": { from: new Date(2026, 5, 1), to: new Date(2026, 6, 31) },
  };

  for (const [id, expected] of Object.entries(cases)) {
    it(`resolves "${id}"`, () => {
      expect(resolveTemplate(id, null, [])).toEqual(expected);
    });
  }

  it("uses a provided defaultMonth in the current year", () => {
    // defaultMonth 0 = January -> prev-full spans the whole of Jan 2026
    expect(resolveTemplate("prev-full", 0, [])).toEqual({
      from: new Date(2026, 0, 1),
      to: new Date(2026, 0, 31),
    });
  });

  it("resolves a today-based custom 'last 7 days' template", () => {
    expect(
      resolveTemplate("c", null, [
        { id: "c", label: "Last 7", isCustom: true, base: "today", mode: "last-n", days: 7 },
      ])
    ).toEqual({ from: new Date(2026, 4, 14), to: new Date(2026, 4, 20) });
  });
});

describe("formatDate / formatDateRange", () => {
  it("formats a single date as 'Mon D, YYYY'", () => {
    expect(formatDate(new Date(2026, 4, 1))).toBe("May 1, 2026");
  });

  it("joins a range with an en dash", () => {
    expect(formatDateRange(new Date(2026, 4, 1), new Date(2026, 4, 15))).toBe(
      "May 1, 2026 – May 15, 2026"
    );
  });
});
