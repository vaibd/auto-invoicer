import { Sheet, SheetColumn, SheetRow, BUILTIN_COLUMNS, InvoiceSnapshot } from "./types";
import { getFinancialYear } from "./financial-year";

/** YYYY-MM-DD (local). Mirrors the closure used for invoice filenames in page.tsx. */
export function formatDateCompact(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Compact date range for the ledger, e.g. "2026-05-01 – 2026-05-15". */
export function formatDateRangeCompact(from: Date, to: Date): string {
  return `${formatDateCompact(from)} – ${formatDateCompact(to)}`;
}

/** Parse a possibly-formatted numeric cell ("₹8,000" -> 8000). Returns NaN if empty/invalid. */
export function parseNum(s: string): number {
  const cleaned = String(s ?? "").replace(/[^0-9.\-]/g, "");
  return cleaned === "" ? NaN : Number(cleaned);
}

/** Platform fee = what you should have received (usd*rate) minus what you actually got (inr). */
export function computePlatformFees(usd: number, rate: number, inr: number): number {
  return usd * rate - inr;
}

/** Header super-row text: "ABC firm 2026-2027" (or just the FY when heading name is empty). */
export function getSheetHeader(firmName: string, date: Date = new Date()): string {
  const fy = getFinancialYear(date);
  const name = firmName.trim();
  return name ? `${name} ${fy}` : fy;
}

/** Normalize a possibly-partial/legacy sheet (shallow merge on load can leave it incomplete). */
export function ensureSheet(s: Partial<Sheet> | undefined | null): Sheet {
  const src: Partial<Sheet> = s && typeof s === "object" ? s : {};
  const existing =
    Array.isArray(src.columns) && src.columns.length > 0
      ? src.columns.map((c) => ({ ...c }))
      : BUILTIN_COLUMNS.map((c) => ({ ...c }));
  // Builtins always come first in canonical order (filling in any newly-added
  // ones, e.g. data predating "Date Range"), followed by custom columns.
  const byId = new Map(existing.map((c) => [c.id, c]));
  const builtinIds = new Set(BUILTIN_COLUMNS.map((c) => c.id));
  const orderedBuiltins = BUILTIN_COLUMNS.map((b) => byId.get(b.id) ?? { ...b });
  const customs = existing.filter((c) => !builtinIds.has(c.id));
  const rows = (Array.isArray(src.rows) ? src.rows : []).map((r) => {
    // Backfill the date range for older rows that have a snapshot but no value yet.
    if (r && r.invoice && !(r.values && r.values.dateRange)) {
      const from = new Date(r.invoice.from);
      const to = new Date(r.invoice.to);
      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        return {
          ...r,
          values: { ...r.values, dateRange: formatDateRangeCompact(from, to) },
        };
      }
    }
    return r;
  });
  return {
    firmName: typeof src.firmName === "string" ? src.firmName : "",
    columns: [...orderedBuiltins, ...customs],
    rows,
  };
}

let rowSeq = 0;
function newId(prefix: string): string {
  rowSeq += 1;
  return `${prefix}-${Date.now()}-${rowSeq}`;
}

export function createEmptyRow(columns: SheetColumn[]): SheetRow {
  const values: Record<string, string> = {};
  for (const c of columns) values[c.id] = "";
  return { id: newId("row"), values };
}

export function createCustomColumn(label = "New column"): SheetColumn {
  return { id: newId("col"), label, builtin: false };
}

/** Append a ledger row from a freshly-downloaded invoice (never mutates existing rows). */
export function appendInvoiceRow(
  sheet: Sheet,
  args: {
    invoiceName: string;
    date: Date;
    amountUsd: number;
    from?: Date;
    to?: Date;
    invoice?: InvoiceSnapshot;
  }
): Sheet {
  const row = createEmptyRow(sheet.columns);
  row.values.srNo = String(sheet.rows.length + 1);
  row.values.invoiceName = args.invoiceName;
  row.values.date = formatDateCompact(args.date);
  if (args.from && args.to) {
    row.values.dateRange = formatDateRangeCompact(args.from, args.to);
  }
  row.values.amountUsd = String(args.amountUsd);
  // amountInr / conversionRate / platformFees stay blank for manual entry + Run.
  if (args.invoice) row.invoice = args.invoice;
  return { ...sheet, rows: [...sheet.rows, row] };
}

/** Serialize to RFC-4180 CSV (CRLF line endings, every field quoted, "" escaping). */
export function sheetToCsv(sheet: Sheet): string {
  const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = sheet.columns.map((c) => esc(c.label)).join(",");
  const lines = sheet.rows.map((r) =>
    sheet.columns.map((c) => esc(r.values[c.id] ?? "")).join(",")
  );
  return [header, ...lines].join("\r\n");
}
