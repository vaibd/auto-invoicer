import { DateTemplate, CustomDateTemplate } from "./types";

export const BUILT_IN_TEMPLATES: DateTemplate[] = [
  { id: "prev-full", label: "Previous month (full)" },
  { id: "prev-first-15", label: "Previous month (1st–15th)" },
  { id: "prev-last-15", label: "Previous month (16th–end)" },
];

function getTargetMonth(
  defaultMonth: number | null
): { month: number; year: number } {
  const now = new Date();
  if (defaultMonth !== null) {
    // Use the default month in the current year (or previous year if the month is ahead)
    return { month: defaultMonth, year: now.getFullYear() };
  }
  // Previous calendar month
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { month: prev.getMonth(), year: prev.getFullYear() };
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function resolveTemplate(
  templateId: string,
  defaultMonth: number | null,
  customTemplates: CustomDateTemplate[]
): { from: Date; to: Date } {
  // Check custom templates first
  const custom = customTemplates.find((t) => t.id === templateId);
  if (custom) {
    return { from: new Date(custom.from), to: new Date(custom.to) };
  }

  const { month, year } = getTargetMonth(defaultMonth);
  const lastDay = lastDayOfMonth(year, month);

  switch (templateId) {
    case "prev-full":
      return {
        from: new Date(year, month, 1),
        to: new Date(year, month, lastDay),
      };
    case "prev-first-15":
      return {
        from: new Date(year, month, 1),
        to: new Date(year, month, 15),
      };
    case "prev-last-15":
      return {
        from: new Date(year, month, 16),
        to: new Date(year, month, lastDay),
      };
    default:
      return {
        from: new Date(year, month, 1),
        to: new Date(year, month, lastDay),
      };
  }
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateRange(from: Date, to: Date): string {
  return `${formatDate(from)} – ${formatDate(to)}`;
}
