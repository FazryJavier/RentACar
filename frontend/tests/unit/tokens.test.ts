// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { compile } from "@tailwindcss/node";
import { beforeAll, describe, expect, it } from "vitest";

const tokensPath = fileURLToPath(new URL("../../src/styles/tokens.css", import.meta.url));
const tokensCss = readFileSync(tokensPath, "utf8");

/** Declared value of a custom property in tokens.css (first declaration wins). */
function token(name: string): string | undefined {
  const match = new RegExp(`${name.replace(/[-]/g, "\\-")}\\s*:\\s*([^;]+);`).exec(tokensCss);
  return match?.[1]?.replace(/\s+/g, " ").trim();
}

/** Formatting-insensitive form: no spaces, no leading zero before a decimal point. */
function normalize(value: string | undefined): string | undefined {
  return value?.replace(/\s+/g, "").replace(/(^|[^\d])0\./g, "$1.");
}

/** Expected values, copied from the design system. Update both together. */
const COLORS: Record<string, string> = {
  "--color-bg": "#F7F5F6",
  "--color-surface": "#FFFFFF",
  "--color-surface-muted": "#EEF1F5",
  "--color-border": "#E2E6EC",
  "--color-border-strong": "#7A8392",
  "--color-navy-900": "#0F1A29",
  "--color-navy-800": "#1B2838",
  "--color-navy-700": "#2A3747",
  "--color-text-muted": "#484D56",
  "--color-text-subtle": "#5F6672",
  "--color-text-on-dark": "#FFFFFF",
  "--color-text-on-dark-muted": "#C9D1DC",
  "--color-accent": "#3A6DB0",
  "--color-accent-hover": "#2F5A93",
  "--color-accent-soft": "#AECAE5",
  "--color-accent-tint": "#DCE8F5",
  "--color-accent-wash": "#EEF4FB",
  "--color-success": "#1F7A4D",
  "--color-success-bg": "#E3F3EA",
  "--color-warning": "#9A4A07",
  "--color-warning-bg": "#FDF0DC",
  "--color-danger": "#C0362C",
  "--color-danger-bg": "#FBE6E4",
  "--color-info": "#2F5A93",
  "--color-info-bg": "#DCE8F5",
  "--color-map-maintenance": "#B45309",
  "--color-map-offline": "#8C95A4",
};

const SCALES: Record<string, string> = {
  "--space-1": "4px",
  "--space-2": "8px",
  "--space-3": "12px",
  "--space-4": "16px",
  "--space-5": "20px",
  "--space-6": "24px",
  "--space-7": "32px",
  "--space-8": "40px",
  "--space-9": "48px",
  "--space-10": "64px",
  "--space-11": "80px",
  "--space-12": "96px",
  "--space-13": "128px",
  "--spacing": "4px",
  "--radius-sm": "8px",
  "--radius-md": "12px",
  "--radius-lg": "20px",
  "--radius-xl": "32px",
  "--radius-full": "9999px",
  "--shadow-sm": "0 1px 2px rgba(15,26,41,.06), 0 1px 3px rgba(15,26,41,.08)",
  "--shadow-md": "0 8px 24px rgba(15,26,41,.08)",
  "--shadow-lg": "0 20px 48px rgba(15,26,41,.14)",
  "--shadow-accent": "0 10px 28px rgba(58,109,176,.28)",
  "--breakpoint-sm": "600px",
  "--breakpoint-md": "768px",
  "--breakpoint-lg": "1024px",
  "--breakpoint-xl": "1280px",
  "--breakpoint-2xl": "1536px",
  "--container-page": "1240px",
  "--z-decoration": "0",
  "--z-content": "1",
  "--z-sticky": "100",
  "--z-header": "200",
  "--z-dropdown": "300",
  "--z-sheet": "400",
  "--z-dialog": "500",
  "--z-toast": "600",
  "--motion-fast": "150ms",
  "--motion-base": "250ms",
  "--motion-slow": "400ms",
  "--motion-reveal": "600ms",
  "--ease-standard": "cubic-bezier(.2,0,0,1)",
  "--ease-emphasized": "cubic-bezier(.16,1,.3,1)",
  "--focus-ring": "0 0 0 3px var(--color-surface), 0 0 0 5px var(--color-accent)",
};

/** [token, min px, max px (same as min when fixed), line height, weight, letter spacing] */
const TYPE: [string, number, number, string, string, string][] = [
  ["display", 40, 64, "1.05", "800", "-0.02em"],
  ["h1", 32, 48, "1.1", "800", "-0.02em"],
  ["h2", 26, 36, "1.15", "700", "-0.01em"],
  ["h3", 20, 24, "1.25", "700", "0"],
  ["h4", 18, 18, "1.3", "600", "0"],
  ["body-lg", 18, 18, "1.6", "400", "0"],
  ["body", 16, 16, "1.6", "400", "0"],
  ["body-sm", 14, 14, "1.5", "400", "0"],
  ["caption", 12, 12, "1.4", "500", "0.01em"],
  ["price", 18, 20, "1.2", "700", "0"],
  ["price-lg", 28, 32, "1.1", "800", "-0.01em"],
];

const rem = (value: string) => Number(value.replace("rem", "")) * 16;

describe("design tokens", () => {
  it.each(Object.entries(COLORS))("%s equals the design system", (name, value) => {
    expect(token(name)?.toUpperCase()).toBe(value.toUpperCase());
  });

  it("aliases text colour to navy-900", () => {
    expect(token("--color-text")).toBe("var(--color-navy-900)");
  });

  it.each(Object.entries(SCALES))("%s equals the design system", (name, value) => {
    expect(normalize(token(name))).toBe(normalize(value));
  });

  it.each(TYPE)(
    "type token %s has the documented size, line height, weight and tracking",
    (name, min, max, lh, weight, tracking) => {
      const size = token(`--text-${name}`);
      expect(size).toBeDefined();

      if (min === max) {
        expect(rem(size as string)).toBe(min);
      } else {
        const clamp = /^clamp\(([\d.]+rem), ([\d.]+rem) \+ ([\d.]+)vw, ([\d.]+rem)\)$/.exec(
          size as string,
        );
        expect(clamp).not.toBeNull();
        expect(rem(clamp![1]!)).toBe(min);
        expect(rem(clamp![4]!)).toBe(max);
      }

      expect(token(`--text-${name}--line-height`)).toBe(lh);
      expect(token(`--text-${name}--font-weight`)).toBe(weight);
      expect(token(`--text-${name}--letter-spacing`)).toBe(tracking);
    },
  );

  it("uses Plus Jakarta Sans with the documented fallback stack", () => {
    expect(token("--font-sans")).toBe(
      'var(--font-plus-jakarta-sans), system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    );
  });
});

describe("tailwind theme", () => {
  let build: (candidates: string[]) => string;

  beforeAll(async () => {
    const compiler = await compile('@import "tailwindcss";\n@import "./src/styles/tokens.css";', {
      base: fileURLToPath(new URL("../../", import.meta.url)),
      onDependency: () => undefined,
    });
    build = compiler.build;
  });

  it("generates utilities only from design system tokens", () => {
    const css = build([
      "bg-surface",
      "bg-blue-500",
      "shadow-2xl",
      "rounded-3xl",
      "text-9xl",
      "ease-in-out",
    ]);

    expect(css).toContain(".bg-surface");
    expect(css).not.toContain(".bg-blue-500");
    expect(css).not.toContain(".shadow-2xl");
    expect(css).not.toContain(".rounded-3xl");
    expect(css).not.toContain(".text-9xl");
    expect(css).not.toContain(".ease-in-out");
  });

  it("maps token utilities to design system values", () => {
    const css = build(["bg-navy-900", "rounded-full", "rounded-lg", "shadow-md", "p-4"]);

    expect(css).toMatch(/--color-navy-900:\s*#0F1A29/i);
    expect(css).toMatch(/\.rounded-lg\s*\{\s*border-radius:\s*var\(--radius-lg\)/);
    expect(css).toMatch(/\.p-4\s*\{\s*padding:\s*calc\(var\(--spacing\) \* 4\)/);
  });

  it("uses design system breakpoints", () => {
    const css = build(["sm:p-4", "md:p-4"]);

    expect(css).toMatch(/@media \(width >= 600px\)/);
    expect(css).toMatch(/@media \(width >= 768px\)/);
  });
});
