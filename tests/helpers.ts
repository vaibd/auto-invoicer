import { vi } from "vitest";

/**
 * Install an in-memory localStorage + window onto globalThis so modules that
 * persist to localStorage can be exercised under the node test environment.
 * Call vi.unstubAllGlobals() in afterEach to tear it down.
 */
export function installLocalStorage(): Map<string, string> {
  const store = new Map<string, string>();
  const ls = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
  vi.stubGlobal("localStorage", ls);
  vi.stubGlobal("window", globalThis);
  return store;
}
