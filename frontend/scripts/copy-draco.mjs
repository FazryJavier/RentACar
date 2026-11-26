// Copies the Draco decoder shipped with the installed `three` package to public/draco/, so the
// 3D viewer loads it from this site (never a CDN) and it always matches the three.js version.
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "node_modules", "three", "examples", "jsm", "libs", "draco", "gltf");
const target = join(root, "public", "draco");

if (!existsSync(source)) {
  console.error(`Draco decoder not found at ${source}. Run npm ci first.`);
  process.exit(1);
}

mkdirSync(target, { recursive: true });
for (const file of readdirSync(source)) {
  copyFileSync(join(source, file), join(target, file));
}
console.log(`Copied Draco decoder to public/draco (${readdirSync(target).length} files).`);
