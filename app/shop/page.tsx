import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopScreen } from "@/components/shop-screen";
import { Skeleton } from "@/components/ui";

export const metadata: Metadata = { title: "Shop" };

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-10"><Skeleton className="h-96" /></div>}>
      <ShopScreen />
    </Suspense>
  );
}
