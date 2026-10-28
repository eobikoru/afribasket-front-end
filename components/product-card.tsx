"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "@/components/toast";
import { errorText } from "@/lib/api";
import { countryName, labelOf, priceLabel, primaryImage, REGIONS, STORAGE } from "@/lib/labels";
import { formatUsd } from "@/lib/money";
import { useAddItem, useCart } from "@/lib/queries";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const add = useAddItem();
  const cart = useCart();
  const [note, setNote] = useState<string | null>(null);
  const image = primaryImage(product);
  const price = priceLabel(product);
  const needsVariant = product.variants.some((variant) => variant.isActive);
  const available = needsVariant
    ? product.variants.some((variant) => variant.isActive && variant.quantityAvailable > 0)
    : (product.inventory?.quantityAvailable ?? 0) > 0;
  const sellable = product.status === "available" && available;

  async function onAdd() {
    setNote(null);
    if (needsVariant) return;
    const inCart = cart.data?.items.find((line) => line.productId === product.id && !line.variantId)?.quantity ?? 0;
    const left = (product.inventory?.quantityAvailable ?? 0) - inCart;
    if (left < 1) {
      setNote(inCart > 0 ? "That's all that's on the shelf." : "Out of stock.");
      return;
    }
    try {
      await add.mutateAsync({ productId: product.id, quantity: 1 });
      toast("Added to cart");
    } catch (error) {
      setNote(errorText(error));
    }
  }

  return (
    <article className="flex flex-col">
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-well">
        {image ? (
          // Product photos come from the catalog host, which varies.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.url} alt={image.altText || product.name} className="h-full w-full object-contain p-4" />
        ) : (
          <span className="grid h-full place-items-center font-display text-4xl text-forest/30">{product.name.slice(0, 1)}</span>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-paper/95 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-forest">
          {labelOf(STORAGE, product.storageType)}
        </span>
      </Link>
      <div className="flex flex-1 flex-col pt-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-stone">
          {labelOf(REGIONS, product.region)} · {countryName(product.countryOfOrigin)}
        </p>
        <Link href={`/product/${product.slug}`} className="mt-1 font-medium leading-snug hover:text-leaf">
          {product.name}
        </Link>
        {product.ratingCount > 0 && product.ratingAverage != null ? (
          <p className="mt-1 text-xs text-stone">
            {product.ratingAverage.toFixed(1)} · {product.ratingCount} {product.ratingCount === 1 ? "review" : "reviews"}
          </p>
        ) : null}
        <p className="mt-2 text-lg tabular-nums">
          <span className="text-sm text-stone">{price.prefix}</span>
          {formatUsd(price.cents)}
          {product.compareAtPriceCents && product.compareAtPriceCents > product.priceCents ? (
            <span className="ml-2 text-sm text-stone line-through">{formatUsd(product.compareAtPriceCents)}</span>
          ) : null}
        </p>
        <div className="mt-3">
          {needsVariant ? (
            <Link href={`/product/${product.slug}`} className="inline-flex w-full items-center justify-center rounded-md bg-clay px-4 py-2.5 text-sm font-semibold text-white hover:bg-clay-deep">
              {sellable ? "Choose a size" : "View"}
            </Link>
          ) : (
            <button
              type="button"
              disabled={!sellable || add.isPending}
              onClick={() => void onAdd()}
              className="w-full rounded-md bg-clay px-4 py-2.5 text-sm font-semibold tracking-wide text-white hover:bg-clay-deep disabled:cursor-not-allowed disabled:bg-stone/40"
            >
              {sellable ? (add.isPending ? "Adding…" : "Add to cart") : product.status === "coming_soon" ? "Coming soon" : "Out of stock"}
            </button>
          )}
          {note ? <p className="mt-2 text-xs text-danger">{note}</p> : null}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
