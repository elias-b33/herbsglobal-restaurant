import { Fragment, jsx as originalJsx, jsxs as originalJsxs } from "react/jsx-runtime-original";
import assets from "local-preview-assets";
import { localLink } from "./routes";

export { Fragment };

function localProps(type: unknown, props: Record<string, unknown> | null) {
  if (!props || typeof type !== "string") return props;
  if (type === "img" && typeof props.src === "string" && props.src.startsWith("/assets/")) {
    const src = assets[props.src.slice("/assets/".length)];
    if (!src) throw new Error(`Missing local image: ${props.src}`);
    return { ...props, src };
  }
  if (type === "a" && typeof props.href === "string") return { ...props, href: localLink(props.href, window.location.hash) };
  if (type === "main") return { ...props, tabIndex: -1 };
  return props;
}

export function jsx(type: unknown, props: Record<string, unknown> | null, key?: string) {
  return originalJsx(type, localProps(type, props), key);
}
export function jsxs(type: unknown, props: Record<string, unknown> | null, key?: string) {
  return originalJsxs(type, localProps(type, props), key);
}
