import type { Metadata } from "next";
import { ForgotScreen } from "@/components/auth-screens";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPage() {
  return <ForgotScreen />;
}
