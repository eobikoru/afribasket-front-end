import type { Metadata } from "next";
import { BlogListScreen } from "@/components/blog-screens";

export const metadata: Metadata = { title: "Journal" };

export default function BlogPage() {
  return <BlogListScreen />;
}
