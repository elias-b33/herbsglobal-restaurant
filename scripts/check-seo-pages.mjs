import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// Read-only checks against a running server. No forms or provider APIs are called.
const base = new URL(process.argv[2] || "http://127.0.0.1:5187");
const launched = process.argv.includes("--public");
const canonical = "https://www.globalherbsrestaurantsandbar.com";
const menu = JSON.parse(await readFile(new URL("../app/data/menu.json", import.meta.url), "utf8"));
const rows = [];
for (const path of ["/", "/menu", "/menu?q=momo", "/?lang=ro", "/?lang=ne", "/menu?lang=ro", "/menu?lang=ne", "/order", "/book"]) {
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, 200, path);
  const html = await response.text();
  const metadata = name => html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`))?.[1];
  const url = new URL(path, base);
  const expectedIndex = launched && ["/", "/menu"].includes(url.pathname) && !url.search;
  assert.equal(metadata("robots")?.includes("noindex"), !expectedIndex, `Index policy for ${path}`);
  assert.match(html, /<title>[^<]+<\/title>/, `Title for ${path}`);
  assert.ok(metadata("description")?.length > 40, `Description for ${path}`);
  const target = html.match(/rel="canonical" href="([^"]*)"/)?.[1];
  assert.equal(new URL(target).href, new URL(url.pathname, canonical).href, `Canonical for ${path}`);
  assert.doesNotMatch(html, /<link[^>]+hreflang=/, "Unlisted translations must stay unadvertised");
  const scripts = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
  const graph = scripts.flatMap(value => value["@graph"] || []);
  if (["/", "/menu"].includes(url.pathname)) {
    assert.equal(graph.filter(value => value["@type"] === "Restaurant").length, 1);
    assert.equal(graph.find(value => value["@type"] === "Restaurant").telephone, "+40734293050");
  }
  if (url.pathname === "/menu") {
    const anchors = [...html.matchAll(/id="dish-([^"]+)"/g)].map(match => match[1]);
    assert.equal(anchors.length, menu.length, "All dishes must exist before JavaScript");
    for (const item of menu) assert.ok(anchors.includes(item.id));
    const schema = graph.find(value => value["@type"] === "Menu");
    if (url.searchParams.has("q")) assert.equal(schema, undefined);
    else {
      const items = schema.hasMenuSection.flatMap(section => section.hasMenuItem);
      assert.equal(items.length, menu.length);
      for (const dish of menu) {
        const item = items.find(value => value["@id"].endsWith(`#dish-${dish.id}`));
        assert.equal(item.offers.price, dish.price);
        assert.equal(item.offers.priceCurrency, "RON");
      }
    }
  }
  if (url.pathname === "/") {
    assert.equal((html.match(/<details(?:\s|>)/g) || []).length, 4);
    assert.match(html, /Str\. Nicolae Tonitza 13/);
  }
  rows.push({ path, status: response.status, index: expectedIndex, schemaBlocks: scripts.length });
}
for (const path of ["/robots.txt", "/sitemap.xml"]) {
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, 200, path);
  const text = await response.text();
  if (path === "/robots.txt") {
    assert.match(response.headers.get("content-type"), /text\/plain/);
    if (launched) assert.match(text, /User-agent: OAI-SearchBot\nAllow: \//);
    else assert.match(text, /User-agent: \*\nDisallow: \/\n/);
  } else {
    assert.match(response.headers.get("content-type"), /application\/xml/);
    const urls = [...text.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
    assert.deepEqual(urls, launched ? [`${canonical}/`, `${canonical}/menu`] : []);
  }
  rows.push({ path, status: response.status });
}
console.log(JSON.stringify({ checked: base.origin, pages: rows, result: "All HTTP/HTML SEO checks passed" }, null, 2));
