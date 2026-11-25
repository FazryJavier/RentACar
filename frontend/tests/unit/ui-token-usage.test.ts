// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = fileURLToPath(new URL("../../src/components/ui", import.meta.url));
const files = readdirSync(dir).filter((file) => file.endsWith(".tsx"));

describe("components/ui uses design tokens only", () => {
  it.each(files)("%s has no hex colours or arbitrary values", (file) => {
    const source = readFileSync(join(dir, file), "utf8");

    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    // `-[value]` not followed by `:` is an arbitrary value (e.g. `p-[13px]`); `data-[state=open]:` is a variant.
    expect(source).not.toMatch(/[a-z]-\[[^\]]*\](?!:)/);
  });
});
