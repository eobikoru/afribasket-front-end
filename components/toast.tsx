"use client";

import { useEffect, useState } from "react";

const EVENT = "afribasket:toast";

export function toast(message: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: message }));
}

export function Toaster() {
  const [items, setItems] = useState<{ id: number; message: string }[]>([]);

  useEffect(() => {
    const onToast = (event: Event) => {
      const message = (event as CustomEvent<string>).detail;
      if (!message) return;
      const id = Date.now() + Math.random();
      setItems((current) => [...current.slice(-2), { id, message }]);
      window.setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== id));
      }, 3600);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[70] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {items.map((item) => (
        <div
          key={item.id}
          className="pointer-events-auto flex items-center gap-2 rounded-full bg-forest px-4 py-2.5 text-sm font-medium text-cream shadow-lg"
        >
          <span className="grid h-5 w-5 place-items-center rounded-full bg-leaf text-[11px] text-cream" aria-hidden="true">
            ✓
          </span>
          {item.message}
        </div>
      ))}
    </div>
  );
}
