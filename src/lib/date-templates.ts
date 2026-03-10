import { DateTemplate, CustomDateTemplate } from "./types";

export const BUILT_IN_TEMPLATES: DateTemplate[] = [
  { id: "prev-full", label: "Previous month (full)" },
  { id: "last-15-days", label: "Previous month (last 15 days)" },
  { id: "curr-first-15-days", label: "Current month (first 15 days)" },
  { id: "curr-last-15-days", label: "Current month (last 15 days)" },
  { id: "next-last-15-days", label: "Next month (first 15 days)" },
  { id: "next-full", label: "Next month (full)" },
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (templateId) {
    case "prev-full":
      return {
        from: new Date(year, month, 1),
        to: new Date(year, month, lastDay),
      };
    case "last-15-days": {
      const endOfPrev = new Date(year, month, lastDay);
      const startOfLast15 = new Date(year, month, lastDay - 14);
      return { from: startOfLast15, to: endOfPrev };
    }
    case "prev-2-months": {
      const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: twoMonthsAgo, to: prevMonthEnd };
    }
    case "curr-first-15-days": {
      const currMonth = today.getMonth();
      const currYear = today.getFullYear();
      return {
        from: new Date(currYear, currMonth, 1),
        to: new Date(currYear, currMonth, 15),
      };
    }
    case "curr-last-15-days": {
      const currMonth = today.getMonth();
      const currYear = today.getFullYear();
      const currLastDay = lastDayOfMonth(currYear, currMonth);
      return {
        from: new Date(currYear, currMonth, currLastDay - 14),
        to: new Date(currYear, currMonth, currLastDay),
      };
    }
    case "next-full": {
      const nextMonth = today.getMonth() + 1;
      const nextYear = today.getFullYear();
      const nextLastDay = lastDayOfMonth(nextYear, nextMonth);
      return {
        from: new Date(nextYear, nextMonth, 1),
        to: new Date(nextYear, nextMonth, nextLastDay),
      };
    }
    case "next-last-15-days": {
      const nextMonth = today.getMonth() + 1;
      const nextYear = today.getFullYear();
      const nextLastDay = lastDayOfMonth(nextYear, nextMonth);
      return {
        from: new Date(nextYear, nextMonth, nextLastDay - 14),
        to: new Date(nextYear, nextMonth, nextLastDay),
      };
    }
    case "next-2-months": {
      const nextStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const twoMonthsEnd = new Date(today.getFullYear(), today.getMonth() + 3, 0);
      return { from: nextStart, to: twoMonthsEnd };
    }
    default:
      return {
        from: new Date(year, month, 1),
        to: new Date(year, month, lastDay),
      };
  }
}

export type RangeType = "full" | "first-half" | "last-half";

export const RANGE_OPTIONS: { value: RangeType; label: string }[] = [
  { value: "full", label: "Full month" },
  { value: "first-half", label: "1st – 15th" },
  { value: "last-half", label: "16th – end" },
];

export function resolveForMonth(
  month: number,
  year: number,
  rangeType: RangeType
): { from: Date; to: Date } {
  const lastDay = lastDayOfMonth(year, month);

  switch (rangeType) {
    case "full":
      return {
        from: new Date(year, month, 1),
        to: new Date(year, month, lastDay),
      };
    case "first-half":
      return {
        from: new Date(year, month, 1),
        to: new Date(year, month, 15),
      };
    case "last-half":
      return {
        from: new Date(year, month, 16),
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
