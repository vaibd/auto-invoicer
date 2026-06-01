import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * True only after client-side hydration: returns false during SSR and on the
 * first client render (so the markup matches the server), then flips to true.
 *
 * Replaces the "setMounted(true) inside an effect" pattern with React's
 * recommended store-based approach, avoiding a synchronous setState-in-effect
 * cascading render. See https://react.dev/reference/react/useSyncExternalStore
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
