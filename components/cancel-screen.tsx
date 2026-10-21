"use client";

import Link from "next/link";
import { formatWhenTime } from "@/lib/labels";
import { recallCheckout } from "@/lib/session";

export function CancelScreen() {
  const memory = recallCheckout();
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-display text-5xl text-forest">Payment cancelled.</h1>
      <p className="mt-4 leading-relaxed text-stone">
        {memory?.orderNumber
          ? `Order ${memory.orderNumber} is still open.`
          : "No charge was completed."}{" "}
        The items stay reserved
        {memory?.reservationExpiresAt ? ` until ${formatWhenTime(memory.reservationExpiresAt)}` : " for a short window"}
        , then return to the shelf if the order isn’t paid.
      </p>
      <div className="mt-8 flex gap-4 text-sm">
        <Link href="/shop" className="rounded-md bg-clay px-4 py-2.5 font-semibold text-white">
          Return to the shop
        </Link>
        <Link href="/track" className="self-center text-leaf underline">
          Track an order
        </Link>
      </div>
    </div>
  );
}
