export interface Field {
  id: string;
  label: string;
  value: string;
  isBold?: boolean;
}

export interface Party {
  fields: Field[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface DateTemplate {
  id: string;
  label: string;
  isCustom?: boolean;
}

export type TemplateBase = "previous" | "current" | "next" | "today";
export type TemplateMode = "full" | "first-n" | "last-n";

export interface CustomDateTemplate extends DateTemplate {
  isCustom: true;
  base: TemplateBase;
  mode: TemplateMode;
  days?: number; // for first-n and last-n modes
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  from: Date;
  to: Date;
  sender: Party;
  receiver: Party;
  products: Product[];
  currency: string;
  footerText: string;
}

// --- Sheet (ledger) model ---

export type BuiltinColumnId =
  | "srNo"
  | "invoiceName"
  | "date"
  | "dateRange"
  | "amountInr"
  | "amountUsd"
  | "conversionRate"
  | "platformFees";

export interface SheetColumn {
  id: string; // a BuiltinColumnId, or `col-${timestamp}` for custom columns
  label: string;
  builtin: boolean;
}

/** A self-contained copy of the invoice that produced a ledger row, so the exact
 *  same PDF can be re-downloaded later. Dates are stored as ISO strings (JSON-safe). */
export interface InvoiceSnapshot {
  invoiceNumber: string;
  invoiceDate: string;
  from: string;
  to: string;
  sender: Party;
  receiver: Party;
  products: Product[];
  currency: string;
  footerText: string;
}

export interface SheetRow {
  id: string;
  values: Record<string, string>; // keyed by SheetColumn.id; always strings
  invoice?: InvoiceSnapshot; // present for rows auto-created on invoice download
}

export interface Sheet {
  firmName: string;
  columns: SheetColumn[];
  rows: SheetRow[];
}

export const BUILTIN_COLUMNS: SheetColumn[] = [
  { id: "srNo", label: "Sr no", builtin: true },
  { id: "invoiceName", label: "Invoice Name", builtin: true },
  { id: "date", label: "Date", builtin: true },
  { id: "dateRange", label: "Date Range", builtin: true },
  { id: "amountInr", label: "Amount (INR)", builtin: true },
  { id: "amountUsd", label: "Amount (USD)", builtin: true },
  { id: "conversionRate", label: "Rate (USD→INR)", builtin: true },
  { id: "platformFees", label: "Platform fees", builtin: true },
];

export const DEFAULT_SHEET: Sheet = {
  firmName: "",
  columns: BUILTIN_COLUMNS.map((c) => ({ ...c })),
  rows: [],
};

export interface UserSettings {
  sender: Party;
  receiver: Party;
  products: Product[];
  defaultTemplateId: string;
  defaultMonth: number | null; // 0-11, null = use previous month
  customTemplates: CustomDateTemplate[];
  lastInvoiceNumber: number;
  invoiceNumberPrefix: string; // text before the trailing counter, e.g. "INV-"
  invoiceNumberPadLength: number; // zero-pad width of the counter, e.g. 4 -> 0001
  includeFyInFilename: boolean; // prefix the PDF filename with the short FY, e.g. "26-27 "
  currency: string;
  footerText: string;
  sheet: Sheet;
}

export const DEFAULT_SENDER_FIELDS: Field[] = [
  { id: "field-1", label: "", value: "", isBold: true },
];

export const DEFAULT_RECEIVER_FIELDS: Field[] = [
  { id: "field-1", label: "", value: "", isBold: true },
];

export const DEFAULT_SETTINGS: UserSettings = {
  sender: { fields: DEFAULT_SENDER_FIELDS },
  receiver: { fields: DEFAULT_RECEIVER_FIELDS },
  products: [],
  defaultTemplateId: "last-15-days",
  defaultMonth: null,
  customTemplates: [],
  lastInvoiceNumber: 0,
  invoiceNumberPrefix: "INV-",
  invoiceNumberPadLength: 4,
  includeFyInFilename: false,
  currency: "USD",
  footerText: "Thank you for your business!",
  sheet: DEFAULT_SHEET,
};
