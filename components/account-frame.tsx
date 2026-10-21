"use client";

import Link from "next/link";
import { AccountNav } from "@/components/account-screens";

export function AccountFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <AccountNav />
      <div className="mt-8">{children}</div>
      <p className="mt-10 text-sm text-stone">
        Need a guest receipt? <Link href="/track" className="underline">Track with email or phone</Link>.
      </p>
    </div>
  );
}
