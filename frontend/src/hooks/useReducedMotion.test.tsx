import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReducedMotion } from "./useReducedMotion";

function mockMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();
  const media = {
    get matches() {
      return matches;
    },
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  };
  vi.spyOn(window, "matchMedia").mockImplementation(() => media as unknown as MediaQueryList);

  return {
    set(value: boolean) {
      matches = value;
      listeners.forEach((listener) => listener());
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useReducedMotion", () => {
  it("follows the media query as it changes", () => {
    const media = mockMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(true);

    act(() => media.set(false));
    expect(result.current).toBe(false);
  });

  it("returns false during server rendering", () => {
    const spy = vi.spyOn(window, "matchMedia");

    function Probe() {
      return <span>{String(useReducedMotion())}</span>;
    }

    expect(renderToString(<Probe />)).toContain("false");
    expect(spy).not.toHaveBeenCalled();
  });
});
