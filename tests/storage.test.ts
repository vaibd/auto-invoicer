import { describe, it, expect, afterEach, vi } from "vitest";
import {
  getSettings,
  saveSettings,
  clearAllData,
  hasSetup,
} from "@/lib/storage";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { installLocalStorage } from "./helpers";

afterEach(() => vi.unstubAllGlobals());

describe("getSettings", () => {
  it("returns defaults when nothing is stored", () => {
    installLocalStorage();
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("merges stored values over the defaults", () => {
    installLocalStorage();
    saveSettings({ ...DEFAULT_SETTINGS, currency: "INR", footerText: "Cheers" });
    const s = getSettings();
    expect(s.currency).toBe("INR");
    expect(s.footerText).toBe("Cheers");
    // untouched keys fall back to defaults
    expect(s.invoiceNumberPrefix).toBe(DEFAULT_SETTINGS.invoiceNumberPrefix);
  });

  it("returns defaults on corrupt JSON", () => {
    const store = installLocalStorage();
    store.set("invoicer-settings", "{not json");
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("strips prototype-polluting keys from stored data", () => {
    const store = installLocalStorage();
    store.set("invoicer-settings", '{"currency":"INR","__proto__":{"hacked":true}}');
    getSettings();
    expect(({} as Record<string, unknown>).hacked).toBeUndefined();
  });
});

describe("saveSettings + getSettings round-trip", () => {
  it("persists and reloads settings", () => {
    installLocalStorage();
    const custom = { ...DEFAULT_SETTINGS, lastInvoiceNumber: 12 };
    saveSettings(custom);
    expect(getSettings().lastInvoiceNumber).toBe(12);
  });
});

describe("clearAllData", () => {
  it("wipes stored settings back to defaults", () => {
    installLocalStorage();
    saveSettings({ ...DEFAULT_SETTINGS, currency: "INR" });
    clearAllData();
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

describe("hasSetup", () => {
  it("is false when nothing is stored", () => {
    installLocalStorage();
    expect(hasSetup()).toBe(false);
  });

  it("is false when no sender field has a value", () => {
    installLocalStorage();
    saveSettings(DEFAULT_SETTINGS); // sender field value is ""
    expect(hasSetup()).toBe(false);
  });

  it("is true once a sender field has a non-empty value", () => {
    installLocalStorage();
    saveSettings({
      ...DEFAULT_SETTINGS,
      sender: { fields: [{ id: "f1", label: "Name", value: "Acme", isBold: true }] },
    });
    expect(hasSetup()).toBe(true);
  });

  it("is false on corrupt JSON", () => {
    const store = installLocalStorage();
    store.set("invoicer-settings", "{broken");
    expect(hasSetup()).toBe(false);
  });
});
