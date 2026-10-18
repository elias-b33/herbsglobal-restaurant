import { build } from "esbuild";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const folder = path.resolve(process.argv[2]);
const scratch = path.join(root, ".sites-runtime", "local-export-checks");
await mkdir(scratch, { recursive: true });
await build({ entryPoints: [path.join(root, "scripts", "local-preview", "checks.ts")], outfile: path.join(scratch, "checks.mjs"), bundle: true, platform: "node", format: "esm" });
const tests = spawnSync(process.execPath, ["--test", path.join(scratch, "checks.mjs")], { stdio: "inherit" });
assert.equal(tests.status, 0, "Local routing tests failed");

const html = await readFile(path.join(folder, "STARTA-HAR.html"), "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length, 1, "Exactly one inline app script is expected");
assert.doesNotMatch(html, /<script[^>]+src=/i);
assert.doesNotMatch(html, /<link[^>]+rel=["']stylesheet/i);
assert.match(html, /connect-src 'none'/);
assert.doesNotMatch(scripts[0][1], /api\.openai\.com|\/api\/assistant|sourceMappingURL|OPENAI_API_KEY|oai-authenticated-user-id/);
await writeFile(path.join(scratch, "app.js"), scripts[0][1]);
assert.equal(spawnSync(process.execPath, ["--check", path.join(scratch, "app.js")], { stdio: "inherit" }).status, 0);

let checked = 0;
for (const name of await readdir(path.join(root, "public", "assets"))) {
  const original = await readFile(path.join(root, "public", "assets", name));
  assert.ok(html.includes(original.toString("base64")), `The exact original bytes of ${name} must be embedded`);
  checked++;
}
console.log(`Verified ${checked} original images/fonts byte-for-byte, the inline JavaScript syntax, local navigation, and absence of API/server dependencies.`);
