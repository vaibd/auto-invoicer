import { getSettings, saveSettings } from "./storage";

export function getNextInvoiceNumber(): string {
  const settings = getSettings();
  const next = settings.lastInvoiceNumber + 1;
  saveSettings({ ...settings, lastInvoiceNumber: next });
  return formatInvoiceNumber(next, settings.invoiceNumberPrefix, settings.invoiceNumberPadLength);
}

export function formatInvoiceNumber(num: number, prefix = "INV-", pad = 4): string {
  return `${prefix}${String(num).padStart(pad, "0")}`;
}

export function peekNextInvoiceNumber(): string {
  const settings = getSettings();
  return formatInvoiceNumber(
    settings.lastInvoiceNumber + 1,
    settings.invoiceNumberPrefix,
    settings.invoiceNumberPadLength
  );
}

/** Parse the trailing number from an invoice number string (e.g. "INV-0003" → 3) */
export function parseInvoiceNum(invoiceNumber: string): number | null {
  const match = invoiceNumber.match(/(\d+)$/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

/** Split an invoice number into its prefix, trailing counter, and zero-pad width. */
export function splitInvoiceNumber(value: string): {
  prefix: string;
  num: number | null;
  pad: number;
} {
  const match = value.match(/^(.*?)(\d+)$/);
  if (!match) return { prefix: value, num: null, pad: 4 };
  return { prefix: match[1], num: parseInt(match[2], 10), pad: match[2].length };
}

/** Set the stored counter so the next peek/get continues from this number */
export function setLastInvoiceNumber(num: number): void {
  const settings = getSettings();
  saveSettings({ ...settings, lastInvoiceNumber: num });
}
