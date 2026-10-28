"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "run" | "done";

const listeners = new Set<(phase: "start") => void>();

export function beginRoute() {
  listeners.forEach((listener) => listener("start"));
}

function isSamePage(url: URL) {
  return url.pathname === window.location.pathname && url.search === window.location.search;
}

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [phase, setPhase] = useState<Phase>("idle");
  const seen = useRef(false);

  useEffect(() => {
    const start = () => setPhase("run");
    listeners.add(start);
    return () => {
      listeners.delete(start);
    };
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin || isSamePage(url)) return;
      setPhase("run");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!seen.current) {
      seen.current = true;
      return;
    }
    setPhase((current) => (current === "run" ? "done" : current));
  }, [pathname, search]);

  useEffect(() => {
    if (phase === "idle") return;
    const delay = phase === "done" ? 320 : 8000;
    const timer = window.setTimeout(() => setPhase(phase === "done" ? "idle" : "done"), delay);
    return () => window.clearTimeout(timer);
  }, [phase]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-[3px]" role="progressbar" aria-hidden={phase === "idle"}>
      <div data-state={phase} className="route-bar h-full w-full bg-clay" />
    </div>
  );
}
