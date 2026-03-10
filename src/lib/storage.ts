import { UserSettings, DEFAULT_SETTINGS } from "./types";
import { safeMerge } from "./sanitize";

const STORAGE_KEY = "invoicer-settings";

export function getSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return safeMerge(DEFAULT_SETTINGS, JSON.parse(raw));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function clearAllData(): void {
  localStorage.clear();
}

export function hasSetup(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const settings: UserSettings = JSON.parse(raw);
    return settings.sender.fields.some((f) => f.value.trim() !== "");
  } catch {
    return false;
  }
}
