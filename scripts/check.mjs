import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { ENVIRONMENTS } from "../src/progress.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(resolve(root, "index.html"), "utf8");
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, "HTML IDs must be unique");
assert.match(html, /<html lang="en">/, "The document must declare English");

let moduleCount = 0;
for (const folder of ["src", "scripts", "tests"]) {
  for (const entry of await readdir(resolve(root, folder))) {
    if (!entry.endsWith(".mjs")) continue;
    const file = resolve(root, folder, entry);
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
    const source = await readFile(file, "utf8");
    for (const match of source.matchAll(/\bfrom\s+['"](\.[^'"]+)['"]/g)) {
      await access(resolve(dirname(file), match[1]));
    }
    if (folder === "src") moduleCount++;
  }
}
for (const match of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)) {
  await access(resolve(root, match[1]));
}
const game = await readFile(resolve(root, "src/game.mjs"), "utf8");
for (const match of game.matchAll(/\$\(['"]([^'"]+)['"]\)/g)) {
  assert.ok(ids.includes(match[1]), `Missing HTML element: ${match[1]}`);
}
for (const environment of ENVIRONMENTS) {
  await access(resolve(root, "assets", environment.image + ".png"));
}
JSON.parse(await readFile(resolve(root, "assets/rocket.json"), "utf8"));
await access(resolve(root, "vendor/LICENSE"));
console.log(
  `Checked ${moduleCount} game modules, ${ids.length} HTML IDs, imports and game assets.`,
);
