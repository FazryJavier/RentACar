import { vi } from "vitest";

/** Shared state for the `next/navigation` mock used in component tests. */
export const nav = {
  pathname: "/",
  search: "",
  replace: vi.fn(),
  push: vi.fn(),
  reset(pathname = "/", search = "") {
    nav.pathname = pathname;
    nav.search = search;
    nav.replace.mockReset();
    nav.push.mockReset();
  },
};

export function navigationModule() {
  return {
    usePathname: () => nav.pathname,
    useSearchParams: () => new URLSearchParams(nav.search),
    useRouter: () => ({
      replace: nav.replace,
      push: nav.push,
      refresh: vi.fn(),
      back: vi.fn(),
      prefetch: vi.fn(),
    }),
  };
}
