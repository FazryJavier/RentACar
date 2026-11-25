"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
const memory = new Map<string, boolean>();
const STORAGE = () => window.localStorage;

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

/** A per-browser boolean preference (`localStorage`, in-memory fallback); `false` on the server. */
export function useStoredFlag(key: string): [boolean, (value: boolean) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => false,
  );

  const setValue = useCallback(
    (next: boolean) => {
      memory.set(key, next);
      try {
        window.localStorage.setItem(key, next ? "1" : "0");
      } catch {
        // Storage blocked: the in-memory value still applies.
      }
      listeners.forEach((listener) => listener());
    },
    [key],
  );

  return [value, setValue];
}
