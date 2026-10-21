"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui";
import { api, errorText } from "@/lib/api";
import { formatWhen, formatWhenTime, labelOf, SHIPPING_METHODS, STORAGE, SUBSTITUTIONS } from "@/lib/labels";
import { formatUsd } from "@/lib/money";
import { useSession } from "@/lib/queries";
import type { Order, OrderAddress } from "@/lib/types";

export function OrderScreen({ orderNumber }: { orderNumber: string }) {
  const params = useSearchParams();
  const email = params.get("email") ?? undefined;
  const session = useSession();
  const order = useQuery({
    queryKey: ["order", orderNumber, email, session.accessToken ? "in" : "out"],
    queryFn: () => api.order(orderNumber, email),
    enabled: session.hydrated,
    retry: false,
  });

  if (!session.hydrated || order.isLoading) return <div className="mx-auto max-w-3xl px-4 py-10"><Skeleton className="h-80" /></div>;
  if (order.isError || !order.data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-display text-4xl text-forest">Order not found.</h1>
        <p className="mt-3 text-sm text-stone">{errorText(order.error)} Guests need the email on the order.</p>
        <Link href={`/track`} className="mt-4 inline-block text-leaf underline">Track with email or phone</Link>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <OrderBody order={order.data} />
    </div>
  );
}

export function OrderBody({ order }: { order: Order }) {
  return (
    <article>
      <p className="text-xs uppercase tracking-[0.16em] text-stone">{formatWhen(order.createdAt)}</p>
      <h1 className="font-display mt-1 text-4xl text-forest">{order.orderNumber}</h1>
      <p className="mt-2 text-sm capitalize text-stone">
        {order.status.replaceAll("_", " ")} · payment {order.paymentStatus.replaceAll("_", " ")} · {order.paymentProvider}
      </p>
      <ol className="mt-6 grid gap-2 text-sm sm:grid-cols-4">
        <Step label="Placed" when={order.createdAt} done />
        <Step label="Paid" when={order.paidAt} done={Boolean(order.paidAt)} />
        <Step label="Shipped" when={order.shippedAt} done={Boolean(order.shippedAt)} />
        <Step label="Delivered" when={order.deliveredAt} done={Boolean(order.deliveredAt)} />
      </ol>
      {order.cancelledAt ? <p className="mt-3 text-sm text-danger">Cancelled {formatWhenTime(order.cancelledAt)}</p> : null}
      {order.trackingNumber ? (
        <p className="mt-4 text-sm">
          Tracking {order.trackingCarrier ? `${order.trackingCarrier.toUpperCase()} ` : ""}
          <span className="font-medium">{order.trackingNumber}</span>
        </p>
      ) : null}
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {order.items.map((item) => (
          <li key={item.id} className="flex gap-4 py-4">
            <div className="grid h-16 w-16 place-items-center bg-well">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" className="h-full w-full object-contain" />
              ) : null}
            </div>
            <div className="flex flex-1 justify-between gap-3">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs uppercase text-stone">{labelOf(STORAGE, item.storageType)} · {item.quantity} × {formatUsd(item.unitPriceCents)}</p>
              </div>
              <p className="tabular-nums">{formatUsd(item.lineTotalCents)}</p>
            </div>
          </li>
        ))}
      </ul>
      <dl className="mt-4 grid gap-1 text-sm">
        <Money label="Subtotal" cents={order.subtotalCents} />
        <Money label="Discount" cents={order.discountCents} />
        <Money label="Shipping" cents={order.shippingCents} />
        <Money label="Tax" cents={order.taxCents} />
        <div className="mt-2 flex justify-between border-t border-line pt-2 text-base">
          <dt>Total</dt>
          <dd className="font-display text-2xl tabular-nums">{formatUsd(order.totalCents)}</dd>
        </div>
        {order.refundedCents > 0 ? <Money label="Refunded" cents={order.refundedCents} /> : null}
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-stone">{order.shippingExplanation}</p>
      <p className="text-xs leading-relaxed text-stone">{order.taxExplanation}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <AddressBlock title="Shipping" address={order.shippingAddress} method={labelOf(SHIPPING_METHODS, order.shippingMethod)} />
        <AddressBlock title="Billing" address={order.billingAddress} />
      </div>
      {order.substitutionPreference ? (
        <p className="mt-4 text-sm text-stone">If something is missing: {labelOf(SUBSTITUTIONS, order.substitutionPreference)}</p>
      ) : null}
      {order.deliveryNote ? <p className="mt-2 text-sm">Note: {order.deliveryNote}</p> : null}
      {order.couponCode ? <p className="mt-2 text-sm">Coupon {order.couponCode}</p> : null}
      {order.notes.length > 0 ? (
        <div className="mt-6">
          <h2 className="font-medium">Notes</h2>
          <ul className="mt-2 grid gap-2 text-sm text-stone">
            {order.notes.map((note) => (
              <li key={note.id}>{note.body}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

function Step({ label, when, done }: { label: string; when: string | null; done: boolean }) {
  return (
    <li className={`rounded-md px-3 py-2 ${done ? "bg-forest text-cream" : "bg-well text-stone"}`}>
      <span className="block text-xs uppercase tracking-wide">{label}</span>
      <span className="text-sm">{when ? formatWhen(when) : "—"}</span>
    </li>
  );
}

function Money({ label, cents }: { label: string; cents: number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-stone">{label}</dt>
      <dd className="tabular-nums">{formatUsd(cents)}</dd>
    </div>
  );
}

function AddressBlock({ title, address, method }: { title: string; address: OrderAddress | null; method?: string }) {
  return (
    <div>
      <h2 className="text-sm font-medium">{title}</h2>
      {method ? <p className="text-xs uppercase tracking-wide text-stone">{method}</p> : null}
      {address ? (
        <p className="mt-1 text-sm text-stone">
          {address.line1}
          {address.line2 ? `, ${address.line2}` : ""}
          <br />
          {address.city}, {address.state} {address.postalCode}
          <br />
          {address.country}
        </p>
      ) : (
        <p className="mt-1 text-sm text-stone">—</p>
      )}
    </div>
  );
}
