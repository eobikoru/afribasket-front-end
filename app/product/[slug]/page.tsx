import type { Metadata } from "next";
import { ProductScreen } from "@/components/product-screen";

export const metadata: Metadata = { title: "Product" };

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductScreen slug={slug} />;
}
