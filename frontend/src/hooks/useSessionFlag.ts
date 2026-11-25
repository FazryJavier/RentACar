"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
/** Fallback when sessionStorage is unavailable (private mode, blocked storage). */
const memory = new Map<string, boolean>();
const STORAGE = () => window.sessionStorage;

function read(key: string): boolean {
  try {
    return STORAGE().getItem(key) === "1";
  } catch {
    // Storage blocked: use the value remembered for this page instead.
    return memory.get(key) ?? false;
  }
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/**
 * A boolean flag kept for the browser session (`sessionStorage`), falling back to memory when
 * storage throws. Returns `false` during server rendering.
 */
export function useSessionFlag(key: string): [boolean, (value: boolean) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => false,
  );

  const setValue = useCallback(
    (next: boolean) => {
      memory.set(key, next);
      try {
        window.sessionStorage.setItem(key, next ? "1" : "0");
      } catch {
        // Storage blocked: the in-memory value still applies to this page.
      }
      listeners.forEach((listener) => listener());
    },
    [key],
  );

  return [value, setValue];
}
