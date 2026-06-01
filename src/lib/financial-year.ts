/**
 * Indian financial year for a date — runs April → March.
 * Apr–Dec (month >= 3) => `${y}-${y+1}`; Jan–Mar => `${y-1}-${y}`.
 * e.g. 2026-06-01 => "2026-2027", 2026-02-15 => "2025-2026".
 */
export function getFinancialYear(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth(); // 0 = Jan
  return m >= 3 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}
