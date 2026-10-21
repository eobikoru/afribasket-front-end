import type { Metadata } from "next";
import { CancelScreen } from "@/components/cancel-screen";

export const metadata: Metadata = { title: "Payment cancelled" };

export default function CancelPage() {
  return <CancelScreen />;
}
