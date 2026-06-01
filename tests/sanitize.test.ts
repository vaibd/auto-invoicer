import { describe, it, expect } from "vitest";
import {
  stripPrototypeKeys,
  safeMerge,
  sanitizeFilename,
  validateImportedSettings,
} from "@/lib/sanitize";
import { DEFAULT_SETTINGS } from "@/lib/types";

describe("stripPrototypeKeys", () => {
  it("passes through primitives unchanged", () => {
    expect(stripPrototypeKeys(5)).toBe(5);
    expect(stripPrototypeKeys("x")).toBe("x");
    expect(stripPrototypeKeys(null)).toBeNull();
  });

  it("removes dangerous keys at every depth", () => {
    const dirty = {
      a: 1,
      __proto__: { polluted: true },
      nested: { constructor: "bad", prototype: "bad", keep: "ok" },
    };
    const clean = stripPrototypeKeys(JSON.parse(JSON.stringify(dirty))) as Record<
      string,
      unknown
    >;
    expect(clean).toEqual({ a: 1, nested: { keep: "ok" } });
  });

  it("recurses through arrays", () => {
    const out = stripPrototypeKeys([{ constructor: "bad", ok: 1 }]) as unknown[];
    expect(out).toEqual([{ ok: 1 }]);
  });
});

describe("safeMerge", () => {
  it("overlays trusted defaults with untrusted values", () => {
    expect(safeMerge({ a: 1, b: 2 }, { b: 9 })).toEqual({ a: 1, b: 9 });
  });

  it("returns the defaults when the input is not a plain object", () => {
    const defaults = { a: 1 };
    expect(safeMerge(defaults, null)).toBe(defaults);
    expect(safeMerge(defaults, [1, 2])).toBe(defaults);
    expect(safeMerge(defaults, "nope")).toBe(defaults);
  });

  it("strips polluting keys before merging", () => {
    const merged = safeMerge(
      { a: 1 },
      JSON.parse('{"a":2,"__proto__":{"x":1}}')
    ) as Record<string, unknown>;
    expect(merged).toEqual({ a: 2 });
  });
});

describe("sanitizeFilename", () => {
  it("strips filesystem-dangerous characters", () => {
    expect(sanitizeFilename('in/v\\o:i*c?e"<>|')).toBe("invoice");
  });

  it("collapses repeated dashes and spaces", () => {
    expect(sanitizeFilename("a---b   c")).toBe("a-b c");
  });

  it("trims and falls back to 'invoice' when empty", () => {
    expect(sanitizeFilename("   ")).toBe("invoice");
    expect(sanitizeFilename("")).toBe("invoice");
  });

  it("truncates to 200 characters", () => {
    expect(sanitizeFilename("a".repeat(500))).toHaveLength(200);
  });
});

describe("validateImportedSettings", () => {
  const validSettings = {
    sender: { fields: [{ id: "f1", label: "Name", value: "Acme", isBold: true }] },
    receiver: { fields: [{ id: "f1", label: "Name", value: "Client" }] },
    products: [{ id: "p1", name: "Service", price: 100, quantity: 2 }],
  };

  it("accepts a minimal valid payload and fills defaults", () => {
    const res = validateImportedSettings(validSettings);
    expect(res.valid).toBe(true);
    if (res.valid) {
      expect(res.data.products).toHaveLength(1);
      expect(res.data.currency).toBe(DEFAULT_SETTINGS.currency);
      expect(res.data.invoiceNumberPrefix).toBe(DEFAULT_SETTINGS.invoiceNumberPrefix);
    }
  });

  it("rejects a non-object payload", () => {
    expect(validateImportedSettings(42).valid).toBe(false);
    expect(validateImportedSettings(null).valid).toBe(false);
    expect(validateImportedSettings([]).valid).toBe(false);
  });

  it("rejects a missing sender", () => {
    const res = validateImportedSettings({ ...validSettings, sender: undefined });
    expect(res.valid).toBe(false);
  });

  it("rejects products with a negative price or non-integer quantity", () => {
    expect(
      validateImportedSettings({
        ...validSettings,
        products: [{ id: "p", name: "x", price: -1, quantity: 1 }],
      }).valid
    ).toBe(false);
    expect(
      validateImportedSettings({
        ...validSettings,
        products: [{ id: "p", name: "x", price: 1, quantity: 1.5 }],
      }).valid
    ).toBe(false);
  });

  it("clamps an out-of-range defaultMonth back to the default", () => {
    const res = validateImportedSettings({ ...validSettings, defaultMonth: 99 });
    expect(res.valid).toBe(true);
    if (res.valid) expect(res.data.defaultMonth).toBe(DEFAULT_SETTINGS.defaultMonth);
  });

  it("accepts an explicit null defaultMonth", () => {
    const res = validateImportedSettings({ ...validSettings, defaultMonth: null });
    expect(res.valid).toBe(true);
    if (res.valid) expect(res.data.defaultMonth).toBeNull();
  });

  it("strips prototype-polluting keys from the payload", () => {
    const res = validateImportedSettings(
      JSON.parse(JSON.stringify({ ...validSettings, __proto__: { hacked: true } }))
    );
    expect(res.valid).toBe(true);
    expect(({} as Record<string, unknown>).hacked).toBeUndefined();
  });

  it("drops sheet cell keys that reference non-existent columns", () => {
    const res = validateImportedSettings({
      ...validSettings,
      sheet: {
        firmName: "Acme",
        columns: [{ id: "srNo", label: "Sr no", builtin: true }],
        rows: [{ id: "r1", values: { srNo: "1", ghost: "drop me" } }],
      },
    });
    expect(res.valid).toBe(true);
    if (res.valid) {
      expect(res.data.sheet.rows[0].values).toEqual({ srNo: "1" });
    }
  });
});
