"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductGrid } from "@/components/product-card";
import { toast } from "@/components/toast";
import { Button, controlClass, Field, Notice, Skeleton, Stars } from "@/components/ui";
import { errorText } from "@/lib/api";
import { ALLERGENS, availableCount, countryName, DIETARY, labelOf, REGIONS, STORAGE, unitPrice } from "@/lib/labels";
import { formatUsd } from "@/lib/money";
import { useAddItem, useCart, useProduct, useRelated, useReviews, useSession } from "@/lib/queries";
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Product, Variant } from "@/lib/types";

export function ProductScreen({ slug }: { slug: string }) {
  const product = useProduct(slug);
  const related = useRelated(product.data?.id);
  const [page, setPage] = useState(1);
  const reviews = useReviews(product.data?.id, page);

  if (product.isLoading) {
    return (
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-2">
        <Skeleton className="aspect-square" />
        <Skeleton className="h-80" />
      </div>
    );
  }
  if (product.isError || !product.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Notice>{errorText(product.error)}</Notice>
      </div>
    );
  }

  const item = product.data;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs uppercase tracking-[0.16em] text-stone">
        <Link href="/shop">Shop</Link>
        {" / "}
        <Link href={`/shop?category=${item.category.slug}`}>{item.category.name}</Link>
      </p>
      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Gallery product={item} />
        <BuyBox product={item} />
      </div>
      <section className="mt-14 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h2 className="font-display text-3xl text-forest">About this item</h2>
          {item.description ? <Description html={item.description} /> : null}
          {item.ingredients ? (
            <div className="mt-6">
              <h3 className="font-medium">Ingredients</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone">{item.ingredients}</p>
            </div>
          ) : null}
        </div>
        <dl className="grid content-start gap-3 text-sm">
          <Fact label="Storage" value={labelOf(STORAGE, item.storageType)} />
          <Fact label="Region" value={labelOf(REGIONS, item.region)} />
          <Fact label="Origin" value={countryName(item.countryOfOrigin)} />
          <Fact label="Unit" value={item.unitLabel.replaceAll("_", " ")} />
          {item.netWeightOz ? <Fact label="Net weight" value={`${item.netWeightOz} oz`} /> : null}
          {item.brand ? <Fact label="Brand" value={item.brand} /> : null}
          {item.perishable ? <Fact label="Shelf life" value={item.shelfLifeDays ? `${item.shelfLifeDays} days` : "Perishable"} /> : null}
          <Fact
            label="Diet"
            value={item.dietaryTags.length ? item.dietaryTags.map((tag) => labelOf(DIETARY, tag)).join(", ") : "—"}
          />
          <Fact
            label="Allergens"
            value={item.allergenFlags.length ? item.allergenFlags.map((flag) => ALLERGENS[flag] ?? flag).join(", ") : "None listed"}
          />
        </dl>
      </section>
      <section className="mt-14">
        <h2 className="font-display text-3xl text-forest">Reviews</h2>
        {item.ratingCount > 0 && item.ratingAverage != null ? (
          <p className="mt-2 flex items-center gap-2 text-sm text-stone">
            <Stars value={item.ratingAverage} />
            {item.ratingAverage.toFixed(1)} from {item.ratingCount}
          </p>
        ) : (
          <p className="mt-2 text-sm text-stone">No reviews yet. A review opens after a delivered order that includes this product.</p>
        )}
        <ReviewForm productId={item.id} slug={item.slug} />
        <div className="mt-6 grid gap-4">
          {reviews.isLoading ? <Skeleton className="h-24" /> : null}
          {reviews.isError ? <Notice>{errorText(reviews.error)}</Notice> : null}
          {reviews.data?.items.map((review) => (
            <article key={review.id} className="rounded-lg bg-paper p-4 ring-1 ring-line">
              <div className="flex items-center justify-between gap-3">
                <Stars value={review.rating} />
                <p className="text-xs text-stone">{new Date(review.createdAt).toLocaleDateString()}</p>
              </div>
              <h3 className="mt-2 font-medium">{review.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-stone">{review.body}</p>
              <p className="mt-2 text-xs text-stone">{review.customer.firstName}</p>
            </article>
          ))}
          {reviews.data && reviews.data.total > reviews.data.perPage ? (
            <div className="flex gap-3">
              <Button tone="ghost" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
                Newer
              </Button>
              <Button tone="ghost" disabled={page * reviews.data.perPage >= reviews.data.total} onClick={() => setPage((value) => value + 1)}>
                Older
              </Button>
            </div>
          ) : null}
        </div>
      </section>
      <section className="mt-14">
        <h2 className="font-display text-3xl text-forest">Goes with</h2>
        <div className="mt-6">
          {related.isLoading ? <Skeleton className="h-48" /> : null}
          {related.isError ? <Notice>{errorText(related.error)}</Notice> : null}
          {related.data && related.data.length === 0 ? <p className="text-sm text-stone">Nothing related is listed yet.</p> : null}
          {related.data && related.data.length > 0 ? <ProductGrid products={related.data} /> : null}
        </div>
      </section>
    </div>
  );
}

function Gallery({ product }: { product: Product }) {
  const images = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const [active, setActive] = useState(images.find((image) => image.isPrimary)?.id ?? images[0]?.id);
  const current = images.find((image) => image.id === active) ?? images[0];
  return (
    <div>
      <div className="grid aspect-square place-items-center bg-well">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.url} alt={current.altText || product.name} className="h-full w-full object-contain p-6" />
        ) : (
          <span className="font-display text-7xl text-forest/25">{product.name.slice(0, 1)}</span>
        )}
      </div>
      {images.length > 1 ? (
        <div className="mt-3 flex gap-2">
          {images.map((image) => (
            <button key={image.id} type="button" onClick={() => setActive(image.id)} className={`h-16 w-16 overflow-hidden bg-well ring-2 ${image.id === current?.id ? "ring-forest" : "ring-transparent"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt={image.altText || ""} className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BuyBox({ product }: { product: Product }) {
  const activeVariants = product.variants.filter((variant) => variant.isActive);
  const [variantId, setVariantId] = useState(activeVariants[0]?.id ?? "");
  const variant = activeVariants.find((item) => item.id === variantId) ?? null;
  const price = unitPrice(product, variant);
  const available = availableCount(product, variant);
  const cart = useCart();
  const add = useAddItem();
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState<string | null>(null);
  const inCart =
    cart.data?.items.find((line) => line.productId === product.id && (line.variantId ?? "") === (variant?.id ?? ""))?.quantity ?? 0;
  const room = Math.max(0, available - inCart);
  const sellable = product.status === "available" && available > 0 && (activeVariants.length === 0 || Boolean(variant));

  async function onAdd() {
    setNote(null);
    if (activeVariants.length > 0 && !variant) {
      setNote("Choose a size or pack.");
      return;
    }
    if (qty > room) {
      setNote(room > 0 ? `Only ${room} more can be added.` : "That's all that's available.");
      return;
    }
    try {
      await add.mutateAsync({ productId: product.id, variantId: variant?.id, quantity: qty });
      toast("Added to cart");
    } catch (error) {
      setNote(errorText(error));
    }
  }

  return (
    <div>
      <h1 className="font-display text-4xl leading-tight text-forest sm:text-5xl">{product.name}</h1>
      {product.shortDescription ? <p className="mt-3 text-lg leading-relaxed text-stone">{product.shortDescription}</p> : null}
      <p className="mt-5 text-3xl tabular-nums">
        {formatUsd(price)}
        {product.compareAtPriceCents && product.compareAtPriceCents > price ? (
          <span className="ml-3 text-lg text-stone line-through">{formatUsd(product.compareAtPriceCents)}</span>
        ) : null}
      </p>
      {product.ratingCount > 0 && product.ratingAverage != null ? (
        <p className="mt-2 flex items-center gap-2 text-sm">
          <Stars value={product.ratingAverage} /> {product.ratingCount} reviews
        </p>
      ) : null}
      {activeVariants.length > 0 ? (
        <fieldset className="mt-6">
          <legend className="text-sm font-medium">Size or pack</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {activeVariants.map((item) => (
              <VariantButton key={item.id} variant={item} fallback={product.priceCents} selected={item.id === variant?.id} onSelect={() => setVariantId(item.id)} />
            ))}
          </div>
        </fieldset>
      ) : null}
      <p className="mt-4 text-sm text-stone">
        {product.status === "coming_soon"
          ? "Coming soon."
          : available > 0
            ? `${available} in stock${inCart ? ` · ${inCart} already in your cart` : ""}`
            : "Out of stock."}
        {variant?.isLowStock || product.inventory?.isLowStock ? " · Low stock" : ""}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <label className="text-sm">
          <span className="sr-only">Quantity</span>
          <input
            type="number"
            min={1}
            max={Math.max(1, room || 1)}
            value={qty}
            onChange={(event) => setQty(Math.max(1, Number(event.target.value) || 1))}
            className="w-20 rounded-md border border-line bg-paper px-3 py-2.5"
          />
        </label>
        <Button className="min-w-40" disabled={!sellable || add.isPending} onClick={() => void onAdd()}>
          {add.isPending ? "Adding…" : sellable ? "Add to cart" : product.status === "coming_soon" ? "Coming soon" : "Out of stock"}
        </Button>
      </div>
      {note ? <p className="mt-3 text-sm text-danger">{note}</p> : null}
      {product.tags.length > 0 ? (
        <p className="mt-6 text-sm text-stone">
          {product.tags.map((tag) => (
            <Link key={tag.id} href={`/shop?tag=${tag.slug}`} className="mr-3 underline">
              {tag.name}
            </Link>
          ))}
        </p>
      ) : null}
    </div>
  );
}

function VariantButton({
  variant,
  fallback,
  selected,
  onSelect,
}: {
  variant: Variant;
  fallback: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={variant.quantityAvailable < 1}
      className={`rounded-md border px-3 py-2 text-left text-sm disabled:opacity-40 ${selected ? "border-forest bg-forest text-cream" : "border-line bg-paper"}`}
    >
      <span className="block font-medium">{variant.title}</span>
      <span className="tabular-nums">{formatUsd(variant.priceCents ?? fallback)}</span>
    </button>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2">
      <dt className="text-stone">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function ReviewForm({ productId, slug }: { productId: string; slug: string }) {
  const session = useSession();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () => api.createReview(productId, { rating, title: title.trim(), body: body.trim() }),
    onSuccess: () => {
      setMessage("Review saved.");
      setTitle("");
      setBody("");
      void queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      void queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });

  if (!session.hydrated) return null;
  if (!session.accessToken) {
    return (
      <p className="mt-4 text-sm">
        <Link href={`/login?next=${encodeURIComponent(`/product/${slug}`)}`} className="font-medium text-leaf underline">
          Sign in
        </Link>{" "}
        to leave a review after a delivered order.
      </p>
    );
  }

  return (
    <form
      className="mt-5 grid max-w-xl gap-3 rounded-lg bg-paper p-4 ring-1 ring-line"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        mutation.mutate(undefined, { onError: (error) => setMessage(errorText(error)) });
      }}
    >
      <Field label="Rating">
        <select className={controlClass} value={rating} onChange={(event) => setRating(Number(event.target.value))}>
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} star{value === 1 ? "" : "s"}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Title">
        <input className={controlClass} value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} required />
      </Field>
      <Field label="Review">
        <textarea className={controlClass} rows={4} value={body} maxLength={4000} onChange={(event) => setBody(event.target.value)} required />
      </Field>
      {message ? <Notice tone={message === "Review saved." ? "ok" : "danger"}>{message}</Notice> : null}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving…" : "Publish review"}
      </Button>
    </form>
  );
}

function Description({ html }: { html: string }) {
  if (!/<\/?[a-z][\s\S]*>/i.test(html)) {
    return <p className="mt-4 whitespace-pre-line leading-relaxed text-ink/90">{html}</p>;
  }
  return <div className="prose-market mt-4 text-ink/90" dangerouslySetInnerHTML={{ __html: html }} />;
}
