import { describe, it, expect } from "vitest";
import {
  formatDateCompact,
  formatDateRangeCompact,
  parseNum,
  computePlatformFees,
  getSheetHeader,
  ensureSheet,
  createEmptyRow,
  createCustomColumn,
  appendInvoiceRow,
  sheetToCsv,
} from "@/lib/sheet";
import { BUILTIN_COLUMNS, type Sheet } from "@/lib/types";

describe("formatDateCompact", () => {
  it("formats as zero-padded YYYY-MM-DD in local time", () => {
    expect(formatDateCompact(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(formatDateCompact(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("formatDateRangeCompact", () => {
  it("joins two compact dates with an en dash", () => {
    expect(formatDateRangeCompact(new Date(2026, 4, 1), new Date(2026, 4, 15))).toBe(
      "2026-05-01 – 2026-05-15"
    );
  });
});

describe("parseNum", () => {
  it("strips currency symbols and separators", () => {
    expect(parseNum("₹8,000")).toBe(8000);
    expect(parseNum("$1,234.50")).toBe(1234.5);
  });

  it("preserves a leading negative sign", () => {
    expect(parseNum("-50")).toBe(-50);
  });

  it("returns NaN for empty or symbol-only input", () => {
    expect(parseNum("")).toBeNaN();
    expect(parseNum("₹")).toBeNaN();
  });
});

describe("computePlatformFees", () => {
  it("is the expected payout minus the actual payout", () => {
    // 100 USD * 83 = 8300 expected, 8000 received => 300 in fees
    expect(computePlatformFees(100, 83, 8000)).toBe(300);
  });

  it("can be zero or negative", () => {
    expect(computePlatformFees(100, 80, 8000)).toBe(0);
    expect(computePlatformFees(100, 80, 8100)).toBe(-100);
  });
});

describe("getSheetHeader", () => {
  it("appends the financial year to a non-empty firm name", () => {
    expect(getSheetHeader("Acme", new Date(2026, 5, 1))).toBe("Acme 2026-2027");
  });

  it("returns just the FY when the firm name is blank", () => {
    expect(getSheetHeader("   ", new Date(2026, 5, 1))).toBe("2026-2027");
  });
});

describe("ensureSheet", () => {
  it("returns a full builtin column set for an empty/missing sheet", () => {
    const s = ensureSheet(null);
    expect(s.columns.map((c) => c.id)).toEqual(BUILTIN_COLUMNS.map((c) => c.id));
    expect(s.rows).toEqual([]);
    expect(s.firmName).toBe("");
  });

  it("orders builtins first, then custom columns, backfilling new builtins", () => {
    const partial = {
      firmName: "X",
      columns: [
        { id: "col-1", label: "Custom", builtin: false },
        { id: "srNo", label: "Sr no", builtin: true },
      ],
      rows: [],
    };
    const s = ensureSheet(partial);
    const ids = s.columns.map((c) => c.id);
    expect(ids[0]).toBe("srNo"); // builtin pulled to the front
    expect(ids).toContain("dateRange"); // a builtin missing from input is backfilled
    expect(ids[ids.length - 1]).toBe("col-1"); // custom column last
  });

  it("backfills dateRange for legacy rows that have a snapshot but no value", () => {
    const s = ensureSheet({
      columns: BUILTIN_COLUMNS.map((c) => ({ ...c })),
      rows: [
        {
          id: "r1",
          values: {},
          invoice: {
            invoiceNumber: "INV-0001",
            invoiceDate: "2026-05-20",
            from: "2026-05-01",
            to: "2026-05-15",
            sender: { fields: [] },
            receiver: { fields: [] },
            products: [],
            currency: "USD",
            footerText: "",
          },
        },
      ],
    } as Partial<Sheet>);
    expect(s.rows[0].values.dateRange).toBe("2026-05-01 – 2026-05-15");
  });
});

describe("createEmptyRow / createCustomColumn", () => {
  it("creates a row with a blank cell per column and a unique id", () => {
    const cols = BUILTIN_COLUMNS;
    const a = createEmptyRow(cols);
    const b = createEmptyRow(cols);
    expect(Object.keys(a.values).sort()).toEqual(cols.map((c) => c.id).sort());
    expect(Object.values(a.values).every((v) => v === "")).toBe(true);
    expect(a.id).not.toBe(b.id);
  });

  it("creates custom columns that are non-builtin with unique ids", () => {
    const c = createCustomColumn("Notes");
    expect(c).toMatchObject({ label: "Notes", builtin: false });
    expect(createCustomColumn().id).not.toBe(c.id);
  });
});

describe("appendInvoiceRow", () => {
  const base: Sheet = {
    firmName: "",
    columns: BUILTIN_COLUMNS.map((c) => ({ ...c })),
    rows: [],
  };

  it("appends a row with an incrementing Sr no and the invoice fields", () => {
    const s1 = appendInvoiceRow(base, {
      invoiceName: "INV-0001",
      date: new Date(2026, 4, 20),
      amountUsd: 500,
      from: new Date(2026, 4, 1),
      to: new Date(2026, 4, 15),
    });
    expect(s1.rows).toHaveLength(1);
    expect(s1.rows[0].values.srNo).toBe("1");
    expect(s1.rows[0].values.invoiceName).toBe("INV-0001");
    expect(s1.rows[0].values.date).toBe("2026-05-20");
    expect(s1.rows[0].values.dateRange).toBe("2026-05-01 – 2026-05-15");
    expect(s1.rows[0].values.amountUsd).toBe("500");

    const s2 = appendInvoiceRow(s1, {
      invoiceName: "INV-0002",
      date: new Date(2026, 5, 20),
      amountUsd: 600,
    });
    expect(s2.rows[1].values.srNo).toBe("2");
    expect(s2.rows[1].values.dateRange).toBe(""); // no range supplied
  });

  it("does not mutate the original sheet", () => {
    appendInvoiceRow(base, { invoiceName: "X", date: new Date(2026, 0, 1), amountUsd: 1 });
    expect(base.rows).toHaveLength(0);
  });
});

describe("sheetToCsv", () => {
  it("quotes every field and uses CRLF line endings", () => {
    const sheet: Sheet = {
      firmName: "",
      columns: [
        { id: "srNo", label: "Sr no", builtin: true },
        { id: "invoiceName", label: "Invoice Name", builtin: true },
      ],
      rows: [{ id: "r1", values: { srNo: "1", invoiceName: "INV-0001" } }],
    };
    expect(sheetToCsv(sheet)).toBe(
      '"Sr no","Invoice Name"\r\n"1","INV-0001"'
    );
  });

  it("escapes embedded double quotes and leaves missing cells blank", () => {
    const sheet: Sheet = {
      firmName: "",
      columns: [{ id: "a", label: 'A "x"', builtin: false }, { id: "b", label: "B", builtin: false }],
      rows: [{ id: "r1", values: { a: 'say "hi"' } }],
    };
    expect(sheetToCsv(sheet)).toBe('"A ""x""","B"\r\n"say ""hi""",""');
  });
});
