import { getSettings, saveSettings } from "./storage";

export function getNextInvoiceNumber(): string {
  const settings = getSettings();
  const next = settings.lastInvoiceNumber + 1;
  saveSettings({ ...settings, lastInvoiceNumber: next });
  return formatInvoiceNumber(next);
}

export function formatInvoiceNumber(num: number): string {
  return `INV-${String(num).padStart(4, "0")}`;
}

export function peekNextInvoiceNumber(): string {
  const settings = getSettings();
  return formatInvoiceNumber(settings.lastInvoiceNumber + 1);
}

/** Parse the trailing number from an invoice number string (e.g. "INV-0003" → 3) */
export function parseInvoiceNum(invoiceNumber: string): number | null {
  const match = invoiceNumber.match(/(\d+)$/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

/** Set the stored counter so the next peek/get continues from this number */
export function setLastInvoiceNumber(num: number): void {
  const settings = getSettings();
  saveSettings({ ...settings, lastInvoiceNumber: num });
}
