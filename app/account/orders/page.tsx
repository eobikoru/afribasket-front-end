import type { Metadata } from "next";
import { AccountFrame } from "@/components/account-frame";
import { OrdersScreen } from "@/components/account-screens";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <AccountFrame>
      <OrdersScreen />
    </AccountFrame>
  );
}
