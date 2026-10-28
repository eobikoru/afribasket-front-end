import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { Suspense } from "react";
import { Providers } from "@/components/providers";
import { RouteProgress } from "@/components/route-progress";
import { Shell } from "@/components/shell";
import { Toaster } from "@/components/toast";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: {
    default: "AfriBasket",
    template: "%s · AfriBasket",
  },
  description: "African groceries delivered across the United States.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${fraunces.variable} antialiased`}>
        <Providers>
          <Suspense fallback={null}>
            <RouteProgress />
          </Suspense>
          <Toaster />
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
