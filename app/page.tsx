import type { Metadata } from "next";
import { HomeScreen } from "@/components/home-screen";

export const metadata: Metadata = { title: "African groceries, delivered" };

export default function HomePage() {
  return <HomeScreen />;
}
