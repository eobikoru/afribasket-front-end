"use client";

import { useState } from "react";
import { Button, controlClass, Field, Notice } from "@/components/ui";
import { api, errorText } from "@/lib/api";
import { OrderBody } from "./order-view";
import type { Order } from "@/lib/types";

export function TrackScreen() {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-5xl text-forest">Track an order</h1>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-stone">
        Use the order number plus the email or phone from checkout. Signed-in customers can also open orders from their account.
      </p>
      <form
        className="mt-6 grid gap-4 sm:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const email = String(data.get("email") ?? "").trim();
          const phone = String(data.get("phone") ?? "").trim();
          if (!email && !phone) {
            setError("Enter the email or the phone on the order.");
            return;
          }
          setPending(true);
          setError(null);
          setOrder(null);
          try {
            const result = await api.track({
              orderNumber: String(data.get("orderNumber") ?? "").trim(),
              ...(email ? { email } : {}),
              ...(phone ? { phone } : {}),
            });
            setOrder(result);
          } catch (reason) {
            setError(errorText(reason));
          } finally {
            setPending(false);
          }
        }}
      >
        <Field label="Order number">
          <input name="orderNumber" required placeholder="AB-1001" className={controlClass} />
        </Field>
        <Field label="Email">
          <input name="email" type="email" autoComplete="email" className={controlClass} />
        </Field>
        <Field label="Phone" hint="Either email or phone is enough.">
          <input name="phone" autoComplete="tel" className={controlClass} />
        </Field>
        <div className="flex items-end">
          <Button type="submit" disabled={pending}>{pending ? "Looking…" : "Find order"}</Button>
        </div>
      </form>
      {error ? <div className="mt-4"><Notice>{error}</Notice></div> : null}
      {order ? <div className="mt-10"><OrderBody order={order} /></div> : null}
    </div>
  );
}
