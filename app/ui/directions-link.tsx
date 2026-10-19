"use client";

import { useEffect, useState, type ReactNode } from "react";
import { directions } from "../data/restaurant";

export default function DirectionsLink({ children, className }: { children: ReactNode; className?: string }) {
  const [href, setHref] = useState(directions.google);

  useEffect(() => {
    // iPadOS can identify itself as Macintosh. Keep a working web link before hydration.
    if (/iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)) setHref(directions.apple);
  }, []);

  return <a className={className} href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}
