import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterScreen } from "@/components/auth-screens";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterScreen />
    </Suspense>
  );
}
