"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/logo";
import { ProductGrid } from "@/components/product-card";
import { EmptyState, Skeleton } from "@/components/ui";
import { api, errorText } from "@/lib/api";
import { formatWhen } from "@/lib/labels";
import { formatUsd } from "@/lib/money";
import { useBanners, useCategories, useFeatured, useSettings } from "@/lib/queries";

export function HomeScreen() {
  const settings = useSettings();
  const banners = useBanners();
  const categories = useCategories();
  const featured = useFeatured();
  const posts = useBlogPosts(1);
  const description = settings.data?.defaultMetaDescription || "African groceries delivered across the United States.";

  return (
    <div>
      {banners.data && banners.data.length > 0 ? (
        <BannerRail banners={banners.data} />
      ) : (
        <section className="bg-cream">
          <div className="mx-auto grid max-w-6xl items-stretch gap-8 px-4 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:py-16">
            <div className="flex flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clay">US delivery · USD</p>
              <h1 className="font-display mt-4 max-w-xl text-5xl leading-[0.95] text-forest sm:text-6xl">
                The market, packed for your kitchen.
              </h1>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-stone">{description}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/shop" className="rounded-md bg-clay px-5 py-3 text-sm font-semibold text-white hover:bg-clay-deep">
                  Shop groceries
                </Link>
                <Link href="/track" className="rounded-md border border-forest/20 bg-paper px-5 py-3 text-sm font-semibold text-forest">
                  Track an order
                </Link>
              </div>
            </div>
            <div className="cloth relative min-h-72 overflow-hidden rounded-lg p-8 text-cream">
              <LogoMark className="h-16 w-16" />
              <p className="font-display mt-8 text-4xl leading-none">AfriBasket</p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/80">
                Palm oil, grains, peppers, frozen packs, and the jars that make a Sunday pot.
              </p>
              <dl className="mt-8 grid gap-4 text-sm">
                <div>
                  <dt className="text-gold">Ships to</dt>
                  <dd>US addresses only</dd>
                </div>
                {settings.data ? (
                  <>
                    <div>
                      <dt className="text-gold">Free shipping</dt>
                      <dd>Pantry orders from {formatUsd(settings.data.freeShippingThresholdCents)}</dd>
                    </div>
                    <div>
                      <dt className="text-gold">Cold pack</dt>
                      <dd>{formatUsd(settings.data.coldPackSurchargeCents)} when the cart needs ice</dd>
                    </div>
                  </>
                ) : null}
              </dl>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-clay">Aisles</p>
            <h2 className="font-display mt-1 text-3xl text-forest">Shop by shelf</h2>
          </div>
          <Link href="/shop" className="text-sm font-medium text-leaf">
            View all
          </Link>
        </div>
        {categories.isLoading ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-36" />
            ))}
          </div>
        ) : categories.isError ? (
          <p className="mt-6 text-sm text-danger">{errorText(categories.error)}</p>
        ) : (categories.data ?? []).length === 0 ? (
          <p className="mt-6 text-sm text-stone">Categories show up here once the market lists them.</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(categories.data ?? []).map((category, index) => (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className={`group relative flex min-h-36 flex-col justify-end overflow-hidden rounded-lg p-4 ${index % 3 === 0 ? "bg-forest text-cream" : "bg-paper text-ink ring-1 ring-line"}`}
              >
                {category.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={category.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80 transition group-hover:scale-[1.03]" />
                ) : null}
                <span className={`relative font-display text-2xl leading-none ${category.imageUrl ? "text-white drop-shadow" : ""}`}>
                  {category.name}
                </span>
                {category.description ? (
                  <span className={`relative mt-2 line-clamp-2 text-xs ${category.imageUrl ? "text-white/90" : "text-stone"}`}>
                    {category.description}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-clay">On the table</p>
            <h2 className="font-display mt-1 text-3xl text-forest">Featured this week</h2>
          </div>
        </div>
        <div className="mt-6">
          {featured.isLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square" />
              ))}
            </div>
          ) : featured.isError ? (
            <p className="text-sm text-danger">{errorText(featured.error)}</p>
          ) : (featured.data ?? []).length === 0 ? (
            <EmptyState
              title="The shelf is being set."
              body="Featured groceries appear here as soon as they’re marked in the catalog. The rest of the market is one aisle over."
              action={
                <Link href="/shop" className="rounded-md bg-forest px-4 py-2.5 text-sm font-semibold text-cream">
                  Browse the shop
                </Link>
              }
            />
          ) : (
            <ProductGrid products={featured.data ?? []} />
          )}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-4">
        <div className="grid gap-px overflow-hidden rounded-lg bg-line sm:grid-cols-3">
          {[
            ["Packed cold when it matters", settings.data ? `Refrigerated and frozen carts add a ${formatUsd(settings.data.coldPackSurchargeCents)} cold pack, and they ship expedited or overnight.` : "Cold groceries ship with a cold pack."],
            ["Priced by the kitchen, not the browser", "The server totals your cart, shipping, tax, and any coupon. What you pay is the number on the breakdown."],
            ["Pay on Stripe or PayPal", "We send you to the provider to approve payment. AfriBasket never asks for a card number on this page."],
          ].map(([title, body]) => (
            <div key={title} className="bg-paper px-5 py-6">
              <h3 className="font-display text-xl text-forest">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl text-forest">From the journal</h2>
          <Link href="/blog" className="text-sm font-medium text-leaf">
            All stories
          </Link>
        </div>
        {posts.isLoading ? (
          <Skeleton className="mt-6 h-40" />
        ) : (posts.data?.items.length ?? 0) === 0 ? (
          <p className="mt-4 text-sm text-stone">Recipes and pantry notes will land here.</p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {posts.data?.items.slice(0, 3).map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="overflow-hidden rounded-lg bg-paper ring-1 ring-line">
                {post.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.coverImageUrl} alt="" className="aspect-[16/10] w-full object-cover" />
                ) : (
                  <div className="cloth aspect-[16/10]" />
                )}
                <div className="p-4">
                  <p className="text-xs uppercase tracking-wide text-stone">{formatWhen(post.publishedAt)}</p>
                  <h3 className="font-display mt-1 text-2xl leading-tight text-forest">{post.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-stone">{post.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BannerRail({ banners }: { banners: { id: string; title: string; subtitle: string | null; imageUrl: string; linkUrl: string | null }[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % banners.length), 6500);
    return () => window.clearInterval(timer);
  }, [banners.length]);
  const banner = banners[index];
  const inner = (
    <div className="relative min-h-[22rem] overflow-hidden bg-forest sm:min-h-[26rem]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={banner.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-forest/85 via-forest/45 to-transparent" />
      <div className="relative mx-auto flex min-h-[22rem] max-w-6xl flex-col justify-end px-4 py-10 sm:min-h-[26rem]">
        <h1 className="font-display max-w-xl text-5xl leading-[0.95] text-cream sm:text-6xl">{banner.title}</h1>
        {banner.subtitle ? <p className="mt-4 max-w-md text-lg text-cream/85">{banner.subtitle}</p> : null}
        <span className="mt-6 inline-flex w-fit rounded-md bg-clay px-5 py-3 text-sm font-semibold text-white">Shop now</span>
      </div>
    </div>
  );
  return (
    <section aria-roledescription="carousel">
      {banner.linkUrl ? <a href={banner.linkUrl}>{inner}</a> : <Link href="/shop">{inner}</Link>}
      {banners.length > 1 ? (
        <div className="flex items-center justify-center gap-2 bg-forest py-3">
          {banners.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Show banner ${itemIndex + 1}`}
              className={`h-2.5 w-2.5 rounded-full ${itemIndex === index ? "bg-gold" : "bg-cream/40"}`}
              onClick={() => setIndex(itemIndex)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function useBlogPosts(page: number) {
  return useQuery({
    queryKey: ["blog", { page, perPage: 3 }],
    queryFn: () => api.blogPosts({ page, perPage: 3 }),
  });
}
