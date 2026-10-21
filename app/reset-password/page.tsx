import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetScreen } from "@/components/auth-screens";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPage() {
  return (
    <Suspense>
      <ResetScreen />
    </Suspense>
  );
}
