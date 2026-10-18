import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.resolve(process.argv[2] ?? path.join(root, "outputs", "global-herbs-local"));
const support = path.join(root, "scripts", "local-preview");
const imageTypes = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };
const assets = {};
for (const name of (await readdir(path.join(root, "public", "assets"))).sort()) {
  const mime = imageTypes[path.extname(name)];
  if (mime) assets[name] = `data:${mime};base64,${(await readFile(path.join(root, "public", "assets", name))).toString("base64")}`;
}

const result = await build({
  absWorkingDir: root,
  entryPoints: [path.join(support, "entry.tsx")],
  bundle: true,
  write: false,
  minify: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  legalComments: "inline",
  metafile: true,
  plugins: [{
    name: "self-contained-local-preview",
    setup(build) {
      build.onResolve({ filter: /^react\/jsx-runtime$/ }, () => ({ path: path.join(support, "jsx-runtime.ts") }));
      build.onResolve({ filter: /^react\/jsx-runtime-original$/ }, () => ({ path: require.resolve("react/jsx-runtime") }));
      build.onResolve({ filter: /^local-preview-assets$/ }, () => ({ path: "images", namespace: "local-preview" }));
      build.onLoad({ filter: /.*/, namespace: "local-preview" }, () => ({ contents: `export default ${JSON.stringify(assets)};`, loader: "js" }));
      build.onResolve({ filter: /^\.\/assistant$/ }, args => path.basename(args.importer) === "chrome.tsx" ? { path: path.join(support, "assistant.tsx") } : undefined);
      build.onLoad({ filter: /app[\\/]ui[\\/]menu\.tsx$/ }, async args => {
        let contents = await readFile(args.path, "utf8");
        const search = "new URLSearchParams(window.location.search)";
        if (!contents.includes(search)) throw new Error("The menu search adapter needs updating before export.");
        contents = contents.replace(search, 'new URLSearchParams(new URL(window.location.hash.slice(1) || "/", "https://local-preview.invalid").search)');
        return { contents, loader: "tsx", resolveDir: path.dirname(args.path) };
      });
    },
  }],
});

if (Object.keys(result.metafile.inputs).some(name => name.includes("assistant-server") || name.includes("app/api/") || name.endsWith("app/ui/assistant.tsx"))) throw new Error("Server or live AI code must not be included in this file preview.");
let css = await readFile(path.join(root, "app", "globals.css"), "utf8");
for (const match of [...css.matchAll(/url\(['"]?\/assets\/([^'"\)]+)['"]?\)/g)]) {
  const data = await readFile(path.join(root, "public", "assets", match[1]));
  css = css.replace(match[0], `url('data:font/woff2;base64,${data.toString("base64")}')`);
}
if (/url\(['"]?\//.test(css)) throw new Error("An unembedded CSS resource remains.");
const script = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'">
<title>Global Herbs · Local preview</title><meta name="description" content="Self-contained local preview of Global Herbs. No installation or internet connection is needed.">
<link rel="icon" href="${assets["logo-original.webp"]}"><style>${css.replace(/<\/style/gi, "<\\/style")}</style></head>
<body><div id="root"></div><noscript style="display:block;padding:40px;font-family:Arial,sans-serif">Open this file in a browser with JavaScript enabled, such as Chrome, Edge, Firefox or Safari.</noscript><script>${script}</script></body></html>`;

await mkdir(output, { recursive: true });
const target = path.join(output, "STARTA-HAR.html");
await writeFile(target, html, "utf8");
await writeFile(path.join(output, "LAS-MIG.txt"), `GLOBAL HERBS – LOKAL TESTVERSION\n\nSÅ ÖPPNAR DU SIDAN\n\n1. Om du fick en ZIP-fil: välj ”Extrahera alla” eller ”Packa upp”.\n2. Dubbelklicka på STARTA-HAR.html.\n3. Sidan öppnas i din webbläsare. Klart!\n\nOm filen öppnas i en textredigerare: högerklicka på den, välj ”Öppna med” och välj din webbläsare.\n\nIngen installation, inget konto, inga kommandon och ingen lokal server behövs.\nFilen innehåller sidan, samtliga originalbilder och typsnitten.\nDu kan använda själva webbplatsen utan internet.\n\nDET HÄR KAN DU TESTA\n- Startsidan, bildgalleriet, mobilmenyn och alla undersidor.\n- Menysökning, kategorier och favoriter.\n- Takeaway-menyn, antal, varukorg och granskning av en order.\n- Bokningsformuläret, datum, gäster och granskning av en bokning.\n- AI-panelens menygenvägar.\n\nDET HÄR ÄR EN FÖRHANDSVISNING\nInga beställningar, bokningar eller betalningar skickas.\nAI-svar är avstängda i den lokala filen. En riktig AI- och Wix-anslutning behöver aktiveras separat för den publicerade webbplatsen.\nKontaktuppgifter som skrivs i formulären skickas inte och sparas inte på någon server.\nVarukorg och favoriter sparas lokalt om webbläsaren tillåter det.\nKartor, sociala medier och andra externa länkar behöver internet.\n\nStäng webbläsarfliken när du är klar. Det finns ingen server att stänga av.\n\nVersion: 19 oktober 2026\n`, "utf8");

const licenses = ["THIRD-PARTY NOTICES", "React and React DOM are distributed under the MIT license."];
for (const name of ["react", "react-dom", "scheduler"]) {
  const location = path.join(root, "node_modules", name, "LICENSE");
  licenses.push(`\n--- ${name} ---\n${await readFile(location, "utf8")}`);
}
for (const filename of ["Noto-Sans-Devanagari-OFL.txt", "Noto-Serif-Devanagari-OFL.txt"]) licenses.push(`\n--- ${filename} ---\n${await readFile(path.join(root, "public", "licenses", filename), "utf8")}`);
licenses.push("\nRestaurant copy, images and original fonts originate from the Global Herbs website and are included for the restaurant owner's review. Source URLs are listed in BILDKALLOR.json.");
await writeFile(path.join(output, "LICENSER.txt"), licenses.join("\n"), "utf8");
await writeFile(path.join(output, "BILDKALLOR.json"), await readFile(path.join(root, "asset-sources.json")));
console.log(JSON.stringify({ html: target, bytes: Buffer.byteLength(html), embeddedImages: Object.keys(assets).length, embeddedFonts: 4, output }, null, 2));
