import type { Metadata } from "next";
import { TrackScreen } from "@/components/track-screen";

export const metadata: Metadata = { title: "Track order" };

export default function TrackPage() {
  return <TrackScreen />;
}
