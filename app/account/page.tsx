import type { Metadata } from "next";
import { AccountFrame } from "@/components/account-frame";
import { ProfileScreen } from "@/components/account-screens";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <AccountFrame>
      <ProfileScreen />
    </AccountFrame>
  );
}
