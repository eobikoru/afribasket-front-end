import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderScreen } from "@/components/order-view";

export const metadata: Metadata = { title: "Order" };

export default async function OrderPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  return (
    <Suspense>
      <OrderScreen orderNumber={orderNumber} />
    </Suspense>
  );
}
