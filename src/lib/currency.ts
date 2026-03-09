export interface Currency {
  code: string;
  symbol: string;
  label: string;
}

export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", label: "USD ($)" },
  { code: "EUR", symbol: "€", label: "EUR (€)" },
  { code: "GBP", symbol: "£", label: "GBP (£)" },
  { code: "JPY", symbol: "¥", label: "JPY (¥)" },
  { code: "CAD", symbol: "CA$", label: "CAD (CA$)" },
  { code: "AUD", symbol: "A$", label: "AUD (A$)" },
  { code: "CHF", symbol: "CHF", label: "CHF" },
  { code: "INR", symbol: "₹", label: "INR (₹)" },
  { code: "BRL", symbol: "R$", label: "BRL (R$)" },
  { code: "CNY", symbol: "¥", label: "CNY (¥)" },
  { code: "KRW", symbol: "₩", label: "KRW (₩)" },
  { code: "SEK", symbol: "kr", label: "SEK (kr)" },
  { code: "NOK", symbol: "kr", label: "NOK (kr)" },
  { code: "DKK", symbol: "kr", label: "DKK (kr)" },
  { code: "NZD", symbol: "NZ$", label: "NZD (NZ$)" },
  { code: "MXN", symbol: "MX$", label: "MXN (MX$)" },
  { code: "ZAR", symbol: "R", label: "ZAR (R)" },
  { code: "SGD", symbol: "S$", label: "SGD (S$)" },
  { code: "HKD", symbol: "HK$", label: "HKD (HK$)" },
];

export function formatCurrency(amount: number, code: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
  }).format(amount);
}

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}
