import type { Metadata } from "next";
import { BlogPostScreen } from "@/components/blog-screens";

export const metadata: Metadata = { title: "Story" };

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BlogPostScreen slug={slug} />;
}
