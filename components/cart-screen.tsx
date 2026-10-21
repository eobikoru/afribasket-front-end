"use client";

import Link from "next/link";
import { errorText } from "@/lib/api";
import { labelOf, STORAGE } from "@/lib/labels";
import { formatUsd } from "@/lib/money";
import { useCart, useClearCart, useRemoveItem, useSetQuantity, useSettings } from "@/lib/queries";
import { Button, EmptyState, Notice, Skeleton } from "./ui";

export function CartScreen() {
  const cart = useCart();
  const settings = useSettings();
  const setQty = useSetQuantity();
  const remove = useRemoveItem();
  const clear = useClearCart();

  if (cart.isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (cart.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Notice>{errorText(cart.error)}</Notice>
      </div>
    );
  }

  const items = cart.data?.items ?? [];
  const cold = items.some((line) => line.storageType === "frozen" || line.storageType === "refrigerated");
  const gap =
    settings.data && cart.data ? settings.data.freeShippingThresholdCents - cart.data.subtotalCents : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-5xl text-forest">Your cart</h1>
      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="The basket is empty."
            body="Add groceries from the shop. Quantities stay with this browser until you sign in, then they move onto your account."
            action={
              <Link href="/shop" className="rounded-md bg-clay px-4 py-2.5 text-sm font-semibold text-white">
                Shop the market
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_18rem]">
          <ul className="divide-y divide-line border-y border-line">
            {items.map((line) => (
              <li key={`${line.productId}:${line.variantId ?? ""}`} className="flex gap-4 py-5">
                <div className="grid h-24 w-24 shrink-0 place-items-center bg-well">
                  {line.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={line.imageUrl} alt="" className="h-full w-full object-contain p-2" />
                  ) : (
                    <span className="font-display text-2xl text-forest/30">{line.name.slice(0, 1)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium leading-snug">{line.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-stone">{labelOf(STORAGE, line.storageType)}</p>
                    </div>
                    <p className="tabular-nums">{formatUsd(line.lineTotalCents)}</p>
                  </div>
                  <p className="mt-1 text-sm text-stone">{formatUsd(line.unitPriceCents)} each</p>
                  {!line.purchasable && line.unavailableReason ? (
                    <p className="mt-2 text-sm text-danger">{line.unavailableReason}</p>
                  ) : null}
                  <div className="mt-3 flex items-center gap-3">
                    <label className="text-sm">
                      <span className="sr-only">Quantity for {line.name}</span>
                      <input
                        type="number"
                        min={1}
                        max={Math.max(1, line.available)}
                        defaultValue={line.quantity}
                        key={`${line.productId}-${line.variantId}-${line.quantity}`}
                        className="w-20 rounded-md border border-line bg-paper px-2 py-1.5"
                        onChange={(event) => {
                          const quantity = Number(event.target.value);
                          if (!Number.isInteger(quantity) || quantity < 1) return;
                          void setQty.mutateAsync({ productId: line.productId, variantId: line.variantId, quantity });
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="text-sm text-stone underline"
                      onClick={() => void remove.mutate({ productId: line.productId, variantId: line.variantId })}
                    >
                      Remove
                    </button>
                  </div>
                  {(setQty.error || remove.error) && (setQty.variables?.productId === line.productId || remove.variables?.productId === line.productId) ? (
                    <p className="mt-2 text-sm text-danger">{errorText(setQty.error ?? remove.error)}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          <aside className="h-fit rounded-lg bg-paper p-5 ring-1 ring-line">
            <p className="text-sm text-stone">Subtotal</p>
            <p className="font-display text-4xl tabular-nums text-forest">{formatUsd(cart.data?.subtotalCents ?? 0)}</p>
            <p className="mt-2 text-xs leading-relaxed text-stone">
              Shipping and tax are calculated at checkout. This subtotal comes from the server.
            </p>
            {gap != null && gap > 0 && !cold ? (
              <p className="mt-3 text-sm">Add {formatUsd(gap)} of pantry goods for free shipping.</p>
            ) : null}
            {cold ? (
              <p className="mt-3 text-sm">This cart has cold items, so standard shipping isn’t available.</p>
            ) : null}
            <Link href="/checkout" className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-clay px-4 py-3 text-sm font-semibold text-white hover:bg-clay-deep">
              Checkout
            </Link>
            <Button tone="ghost" className="mt-2 w-full" disabled={clear.isPending} onClick={() => void clear.mutate()}>
              Clear cart
            </Button>
            {clear.error ? <p className="mt-2 text-sm text-danger">{errorText(clear.error)}</p> : null}
          </aside>
        </div>
      )}
    </div>
  );
}
