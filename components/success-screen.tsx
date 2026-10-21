"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Notice } from "@/components/ui";
import { api, errorText } from "@/lib/api";
import { formatWhenTime } from "@/lib/labels";
import { formatUsd } from "@/lib/money";
import { recallCheckout } from "@/lib/session";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Order, VerifyResult } from "@/lib/types";

const DONE = new Set(["completed", "refunded", "partially_refunded", "failed"]);

export function SuccessScreen() {
  const params = useSearchParams();
  const memory = recallCheckout();
  const orderNumber = params.get("order") || memory?.orderNumber || "";
  const providerReference = params.get("session_id") || params.get("token") || memory?.providerReference;
  const [attempts, setAttempts] = useState(0);
  const [verify, setVerify] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const settled = verify?.paymentStatus ? DONE.has(verify.paymentStatus) : false;

  useEffect(() => {
    if (!orderNumber || settled || attempts >= 8) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      api
        .verify({ orderNumber, ...(providerReference ? { providerReference } : {}) })
        .then((result) => {
          if (cancelled) return;
          setVerify(result);
          setAttempts((value) => value + 1);
          if (result.paymentStatus === "completed") {
            void queryClient.invalidateQueries({ queryKey: ["cart"] });
          }
        })
        .catch((reason) => {
          if (!cancelled) setError(errorText(reason));
        });
    }, attempts === 0 ? 300 : 2500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [orderNumber, providerReference, attempts, settled, queryClient]);

  const order = useQuery({
    queryKey: ["order", orderNumber, memory?.email],
    queryFn: () => api.order(orderNumber, memory?.email),
    enabled: Boolean(orderNumber) && verify?.paymentStatus === "completed",
    retry: false,
  });

  if (!orderNumber) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-display text-4xl text-forest">We don’t have an order number.</h1>
        <p className="mt-3 text-stone">If you just paid, use the order number from your email on the tracking page.</p>
        <Link href="/track" className="mt-6 inline-block text-leaf underline">Track an order</Link>
      </div>
    );
  }

  const pending = !verify || verify.paymentStatus === "pending";
  const failed = verify?.paymentStatus === "failed";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-clay">Order {orderNumber}</p>
      <h1 className="font-display mt-2 text-5xl text-forest">
        {verify?.paymentStatus === "completed" ? "Payment received." : failed ? "Payment didn’t go through." : "Confirming payment."}
      </h1>
      {error ? <div className="mt-4"><Notice>{error}</Notice></div> : null}
      {pending && !error ? (
        <p className="mt-4 leading-relaxed text-stone">
          The payment provider tells us when the charge is finished. This page checks a few times. The webhook is the record that counts.
          {memory?.reservationExpiresAt ? ` Your items stay reserved until ${formatWhenTime(memory.reservationExpiresAt)}.` : " Your items stay reserved for a short window."}
        </p>
      ) : null}
      {failed ? (
        <p className="mt-4 text-stone">The reservation will release if payment isn’t completed. You can track the order with the email you used at checkout.</p>
      ) : null}
      {attempts >= 8 && pending ? (
        <div className="mt-4">
          <Notice tone="quiet">Still waiting on the provider. You can leave this page and track the order in a minute.</Notice>
          <button type="button" className="mt-3 text-sm text-leaf underline" onClick={() => setAttempts(0)}>
            Check again
          </button>
        </div>
      ) : null}
      {order.data ? <OrderSummary order={order.data} /> : null}
      <div className="mt-8 flex gap-4 text-sm">
        <Link href={`/orders/${orderNumber}${memory?.email ? `?email=${encodeURIComponent(memory.email)}` : ""}`} className="text-leaf underline">
          View order
        </Link>
        <Link href="/shop" className="text-stone underline">Back to the shop</Link>
      </div>
    </div>
  );
}

function OrderSummary({ order }: { order: Order }) {
  return (
    <div className="mt-8 rounded-lg bg-paper p-5 ring-1 ring-line">
      <p className="text-sm text-stone">
        {order.status} · payment {order.paymentStatus}
      </p>
      <p className="font-display mt-1 text-3xl tabular-nums">{formatUsd(order.totalCents)}</p>
      <ul className="mt-4 divide-y divide-line text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between py-2">
            <span>{item.quantity} × {item.name}</span>
            <span className="tabular-nums">{formatUsd(item.lineTotalCents)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
