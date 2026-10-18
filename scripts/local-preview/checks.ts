import test from "node:test";
import assert from "node:assert/strict";
import { localLink, routeFromHash } from "./routes";

test("Every page stays inside the same local file", () => {
  const file = "file:///C:/A%20folder/STARTA-HAR.html";
  for (const href of ["/", "/menu", "/order", "/book"]) {
    const target = new URL(localLink(href, ""), file);
    assert.equal(target.protocol, "file:");
    assert.equal(target.pathname, new URL(file).pathname);
    assert.equal(routeFromHash(target.hash).pathname, href);
  }
});

test("Menu shortcuts preserve the search query and restaurant anchors", () => {
  const menu = routeFromHash(localLink("/menu?q=momo", "#/book"));
  assert.equal(menu.pathname, "/menu");
  assert.equal(menu.searchParams.get("q"), "momo");
  const about = routeFromHash(localLink("/#about", "#/menu"));
  assert.equal(about.pathname, "/");
  assert.equal(about.hash, "#about");
});

test("Basket, skip and top links preserve the active page", () => {
  for (const anchor of ["#basket", "#main", "#top"]) {
    const target = routeFromHash(localLink(anchor, "#/order"));
    assert.equal(target.pathname, "/order");
    assert.equal(target.hash, anchor);
  }
  const menu = routeFromHash(localLink("#main", "#/menu?q=curry#top"));
  assert.equal(menu.searchParams.get("q"), "curry");
  assert.equal(menu.hash, "#main");
});

test("External and telephone links are unchanged", () => {
  for (const href of ["https://example.com/map", "tel:+40734293050", "mailto:restaurant@example.com", "//example.com"]) {
    assert.equal(localLink(href, "#/order"), href);
  }
});
