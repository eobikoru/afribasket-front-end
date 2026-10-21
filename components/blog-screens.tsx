"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, controlClass, EmptyState, Field, Notice, Skeleton } from "@/components/ui";
import { api, errorText } from "@/lib/api";
import { formatWhen } from "@/lib/labels";
import { useSession } from "@/lib/queries";

export function BlogListScreen() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const categories = useQuery({ queryKey: ["blog", "categories"], queryFn: api.blogCategories });
  const posts = useQuery({
    queryKey: ["blog", { page, category }],
    queryFn: () => api.blogPosts({ page, perPage: 9, ...(category ? { category } : {}) }),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-clay">Journal</p>
      <h1 className="font-display mt-2 text-5xl text-forest">Notes from the market</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        <FilterChip active={!category} onClick={() => { setCategory(""); setPage(1); }}>All</FilterChip>
        {(categories.data ?? []).map((item) => (
          <FilterChip key={item.id} active={category === item.slug} onClick={() => { setCategory(item.slug); setPage(1); }}>
            {item.name}
          </FilterChip>
        ))}
      </div>
      {posts.isLoading ? <Skeleton className="mt-8 h-64" /> : null}
      {posts.isError ? <div className="mt-6"><Notice>{errorText(posts.error)}</Notice></div> : null}
      {posts.data && posts.data.items.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No stories yet." body="When the journal publishes, essays and pantry notes show up here." />
        </div>
      ) : null}
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {posts.data?.items.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="overflow-hidden rounded-lg bg-paper ring-1 ring-line">
            {post.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.coverImageUrl} alt="" className="aspect-[16/10] w-full object-cover" />
            ) : (
              <div className="cloth aspect-[16/10]" />
            )}
            <div className="p-4">
              <p className="text-xs uppercase tracking-wide text-stone">
                {post.category?.name ?? "Journal"} · {formatWhen(post.publishedAt)}
              </p>
              <h2 className="font-display mt-1 text-2xl leading-tight text-forest">{post.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-stone">{post.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
      {posts.data && posts.data.total > posts.data.perPage ? (
        <div className="mt-8 flex items-center justify-between">
          <Button tone="ghost" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
          <p className="text-sm text-stone">Page {posts.data.page}</p>
          <Button tone="ghost" disabled={page * posts.data.perPage >= posts.data.total} onClick={() => setPage((value) => value + 1)}>Next</Button>
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-full px-3 py-1.5 text-sm ${active ? "bg-forest text-cream" : "bg-paper ring-1 ring-line"}`}>
      {children}
    </button>
  );
}

export function BlogPostScreen({ slug }: { slug: string }) {
  const post = useQuery({ queryKey: ["blog", slug], queryFn: () => api.blogPost(slug) });
  const related = useQuery({ queryKey: ["blog", slug, "related"], queryFn: () => api.blogRelated(slug) });
  const session = useSession();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const comment = useMutation({
    mutationFn: (body: { name: string; email: string; body: string }) => api.blogComment(slug, body),
    onSuccess: async () => {
      setOk("Comment posted.");
      await queryClient.invalidateQueries({ queryKey: ["blog", slug] });
    },
  });

  if (post.isLoading) return <div className="mx-auto max-w-3xl px-4 py-10"><Skeleton className="h-96" /></div>;
  if (post.isError || !post.data) {
    return <div className="mx-auto max-w-xl px-4 py-16"><Notice>{errorText(post.error)}</Notice></div>;
  }
  const story = post.data;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/blog" className="text-sm text-leaf underline">Journal</Link>
      <p className="mt-4 text-xs uppercase tracking-[0.16em] text-stone">
        {story.category?.name ?? "Story"} · {formatWhen(story.publishedAt)} · {story.author.name}
      </p>
      <h1 className="font-display mt-2 text-5xl leading-[1.05] text-forest">{story.title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-stone">{story.excerpt}</p>
      {story.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={story.coverImageUrl} alt="" className="mt-6 aspect-[16/9] w-full rounded-lg object-cover" />
      ) : null}
      <div className="prose-market mt-8" dangerouslySetInnerHTML={{ __html: story.bodyHtml }} />
      {story.faqs.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-3xl text-forest">Questions</h2>
          <dl className="mt-4 grid gap-4">
            {story.faqs.map((faq) => (
              <div key={faq.question}>
                <dt className="font-medium">{faq.question}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-stone">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
      {story.tags.length > 0 ? (
        <p className="mt-6 text-sm text-stone">{story.tags.map((tag) => tag.name).join(" · ")}</p>
      ) : null}

      <section className="mt-12">
        <h2 className="font-display text-3xl text-forest">Comments</h2>
        <div className="mt-4 grid gap-4">
          {story.comments.length === 0 ? <p className="text-sm text-stone">Be the first to leave a note.</p> : null}
          {story.comments.map((item) => (
            <div key={item.id} className="border-b border-line pb-3">
              <p className="text-sm font-medium">{item.name}</p>
              <p className="mt-1 text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
        <form
          className="mt-6 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setError(null);
            setOk(null);
            comment.mutate(
              {
                name: String(data.get("name") ?? ""),
                email: String(data.get("email") ?? ""),
                body: String(data.get("body") ?? ""),
              },
              {
                onSuccess: () => event.currentTarget.reset(),
                onError: (reason) => setError(errorText(reason)),
              },
            );
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <input name="name" required className={controlClass} defaultValue={session.accessToken ? undefined : ""} />
            </Field>
            <Field label="Email">
              <input name="email" type="email" required className={controlClass} />
            </Field>
          </div>
          <Field label="Comment">
            <textarea name="body" required rows={4} className={controlClass} />
          </Field>
          {error ? <Notice>{error}</Notice> : null}
          {ok ? <Notice tone="ok">{ok}</Notice> : null}
          <Button type="submit" disabled={comment.isPending}>{comment.isPending ? "Posting…" : "Post comment"}</Button>
        </form>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl text-forest">Related</h2>
        {related.isError ? <p className="mt-3 text-sm text-danger">{errorText(related.error)}</p> : null}
        {related.data && related.data.length === 0 ? <p className="mt-3 text-sm text-stone">No related stories.</p> : null}
        <div className="mt-4 grid gap-3">
          {(related.data ?? []).map((item) => (
            <Link key={item.slug} href={`/blog/${item.slug}`} className="rounded-md bg-paper px-4 py-3 ring-1 ring-line">
              <span className="font-medium">{item.title}</span>
              <span className="mt-1 block text-sm text-stone">{item.excerpt}</span>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
