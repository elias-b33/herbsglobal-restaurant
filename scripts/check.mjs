import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
await mkdir(".sites-runtime/checks", { recursive: true });
await build({ entryPoints: ["scripts/checks.ts"], outfile: ".sites-runtime/checks/checks.mjs", bundle: true, platform: "node", format: "esm", target: "node22" });
const result = spawnSync(process.execPath, ["--test", ".sites-runtime/checks/checks.mjs"], { stdio: "inherit" });
process.exit(result.status ?? 1);
