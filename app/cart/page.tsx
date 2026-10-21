import type { Metadata } from "next";
import { CartScreen } from "@/components/cart-screen";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return <CartScreen />;
}
