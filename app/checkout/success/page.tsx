import type { Metadata } from "next";
import { Suspense } from "react";
import { SuccessScreen } from "@/components/success-screen";

export const metadata: Metadata = { title: "Order confirmation" };

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessScreen />
    </Suspense>
  );
}
