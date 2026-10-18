export function routeFromHash(hash: string) {
  return new URL(hash.slice(1) || "/", "https://local-preview.invalid");
}

export function localLink(href: string, currentHash: string) {
  if (href.startsWith("//")) return href;
  if (href.startsWith("/")) return `#${href}`;
  if (href.startsWith("#")) {
    const route = routeFromHash(currentHash);
    return `#${route.pathname}${route.search}${href}`;
  }
  return href;
}
