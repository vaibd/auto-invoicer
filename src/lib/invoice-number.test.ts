import { describe, it, expect } from "vitest";
import {
  formatInvoiceNumber,
  parseInvoiceNum,
  splitInvoiceNumber,
} from "@/lib/invoice-number";

describe("formatInvoiceNumber", () => {
  it("applies the default prefix and pad width", () => {
    expect(formatInvoiceNumber(3)).toBe("INV-0003");
  });

  it("honours a custom prefix and pad width", () => {
    expect(formatInvoiceNumber(42, "BILL/", 6)).toBe("BILL/000042");
  });

  it("does not truncate numbers longer than the pad width", () => {
    expect(formatInvoiceNumber(123456, "INV-", 4)).toBe("INV-123456");
  });

  it("supports a zero pad width and empty prefix", () => {
    expect(formatInvoiceNumber(7, "", 0)).toBe("7");
  });
});

describe("parseInvoiceNum", () => {
  it("extracts the trailing counter", () => {
    expect(parseInvoiceNum("INV-0003")).toBe(3);
    expect(parseInvoiceNum("BILL/000042")).toBe(42);
  });

  it("returns the trailing run of digits, ignoring earlier digits", () => {
    expect(parseInvoiceNum("2026-INV-0009")).toBe(9);
  });

  it("returns null when there is no trailing number", () => {
    expect(parseInvoiceNum("DRAFT")).toBeNull();
    expect(parseInvoiceNum("INV-0003-final")).toBeNull();
  });
});

describe("splitInvoiceNumber", () => {
  it("splits prefix, number, and pad width", () => {
    expect(splitInvoiceNumber("INV-0003")).toEqual({
      prefix: "INV-",
      num: 3,
      pad: 4,
    });
  });

  it("derives the pad width from the digit count", () => {
    expect(splitInvoiceNumber("X-42")).toEqual({ prefix: "X-", num: 42, pad: 2 });
  });

  it("falls back to a null number and default pad when there are no digits", () => {
    expect(splitInvoiceNumber("DRAFT")).toEqual({
      prefix: "DRAFT",
      num: null,
      pad: 4,
    });
  });

  it("round-trips with formatInvoiceNumber", () => {
    const { prefix, num, pad } = splitInvoiceNumber("INV-0007");
    expect(formatInvoiceNumber(num!, prefix, pad)).toBe("INV-0007");
  });
});
