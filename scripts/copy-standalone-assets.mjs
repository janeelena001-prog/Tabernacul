// Copies static assets into the standalone output after `next build`.
// Replaces the `cp -r ...` steps that used to live in the `build` npm script:
// bun's built-in shell implements `cp` itself and rejects the -r flag
// ("cp: illegal option -- r", e.g. on Windows), so the copy is done here with
// node:fs instead, which works under bun on every platform.
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const standalone = path.join(root, ".next", "standalone");

if (!existsSync(standalone)) {
  console.error(
    `copy-standalone-assets: ${standalone} does not exist. ` +
      'next build must run with output:"standalone" in next.config.',
  );
  process.exit(1);
}

const copies = [
  { src: path.join(root, ".next", "static"), dest: path.join(standalone, ".next", "static") },
  { src: path.join(root, "public"), dest: path.join(standalone, "public") },
];

for (const { src, dest } of copies) {
  if (!existsSync(src)) {
    console.error(`copy-standalone-assets: source not found: ${src}`);
    process.exit(1);
  }
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(path.dirname(dest), { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log(`copy-standalone-assets: ${src} -> ${dest}`);
}
