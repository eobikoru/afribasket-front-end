import type { Metadata } from "next";
import { AccountFrame } from "@/components/account-frame";
import { AddressesScreen } from "@/components/account-screens";

export const metadata: Metadata = { title: "Addresses" };

export default function AddressesPage() {
  return (
    <AccountFrame>
      <AddressesScreen />
    </AccountFrame>
  );
}
