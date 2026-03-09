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
