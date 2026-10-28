"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ProductGrid } from "@/components/product-card";
import { beginRoute } from "@/components/route-progress";
import { Button, EmptyState, Field, Notice, Skeleton } from "@/components/ui";
import { errorText } from "@/lib/api";
import { DIETARY, REGIONS, SORTS, STORAGE } from "@/lib/labels";
import { centsToDollarInput, dollarsToCents } from "@/lib/money";
import { useCategories, useProducts } from "@/lib/queries";
import type { Category, ProductQuery } from "@/lib/types";

export function ShopScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const categories = useCategories();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const query = useMemo(() => readQuery(params), [params]);
  const products = useProducts(query);
  const flat = flatten(categories.data ?? []);
  const start = products.data && products.data.total > 0 ? (products.data.page - 1) * products.data.perPage + 1 : 0;
  const end = products.data ? Math.min(products.data.page * products.data.perPage, products.data.total) : 0;

  function push(next: Record<string, string | undefined>, resetPage = true) {
    const search = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value) search.delete(key);
      else search.set(key, value);
    }
    if (resetPage) search.delete("page");
    const href = `/shop?${search.toString()}`;
    if (href !== `${window.location.pathname}${window.location.search}`) beginRoute();
    router.push(href);
  }

  const filters = (
    <form
      key={params.toString()}
      className="grid gap-5 rounded-2xl bg-paper px-5 py-6 ring-1 ring-line"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const min = dollarsToCents(String(data.get("min") ?? ""));
        const max = dollarsToCents(String(data.get("max") ?? ""));
        push({
          q: String(data.get("q") ?? "").trim() || undefined,
          category: String(data.get("category") ?? "") || undefined,
          region: String(data.get("region") ?? "") || undefined,
          storageType: String(data.get("storageType") ?? "") || undefined,
          dietary: String(data.get("dietary") ?? "") || undefined,
          country: String(data.get("country") ?? "").trim().toUpperCase() || undefined,
          min: min == null ? undefined : centsToDollarInput(min),
          max: max == null ? undefined : centsToDollarInput(max),
          inStock: data.get("inStock") ? "true" : undefined,
        });
        setFiltersOpen(false);
      }}
    >
      <Field label="Search">
        <input name="q" defaultValue={params.get("q") ?? ""} placeholder="Palm oil, egusi, plantain" className="shop-control" />
      </Field>
      <Field label="Category">
        <select name="category" defaultValue={params.get("category") ?? ""} className="shop-control">
          <option value="">All shelves</option>
          {flat.map((category) => (
            <option key={category.id} value={category.slug}>
              {"— ".repeat(category.level)}
              {category.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Region">
        <select name="region" defaultValue={params.get("region") ?? ""} className="shop-control">
          <option value="">Anywhere</option>
          {REGIONS.map((region) => (
            <option key={region.value} value={region.value}>
              {region.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Storage">
        <select name="storageType" defaultValue={params.get("storageType") ?? ""} className="shop-control">
          <option value="">Any</option>
          {STORAGE.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Diet">
        <select name="dietary" defaultValue={params.get("dietary") ?? ""} className="shop-control">
          <option value="">Any</option>
          {DIETARY.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Country of origin" hint="Two-letter code, such as NG or GH.">
        <input name="country" defaultValue={params.get("country") ?? ""} maxLength={2} className="shop-control uppercase tracking-[0.14em]" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min price">
          <input name="min" defaultValue={params.get("min") ?? ""} inputMode="decimal" placeholder="0" className="shop-control" />
        </Field>
        <Field label="Max price">
          <input name="max" defaultValue={params.get("max") ?? ""} inputMode="decimal" placeholder="50" className="shop-control" />
        </Field>
      </div>
      <label className="flex items-center gap-3 py-1 text-sm">
        <input type="checkbox" name="inStock" defaultChecked={params.get("inStock") === "true"} className="size-4 accent-forest" />
        In stock only
      </label>
      <Button type="submit" className="mt-1 w-full py-3">
        Apply filters
      </Button>
      <button
        type="button"
        className="justify-self-center text-sm text-stone underline underline-offset-4"
        onClick={() => {
          router.push("/shop");
          setFiltersOpen(false);
        }}
      >
        Clear
      </button>
    </form>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs uppercase tracking-[0.16em] text-stone">Home / Shop</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-5xl text-forest">Shop</h1>
        <label className="flex items-center gap-3 text-sm text-stone">
          <span>Sort</span>
          <select
            className="shop-control shop-sort"
            value={query.sort ?? "newest"}
            onChange={(event) => push({ sort: event.target.value === "newest" ? undefined : event.target.value })}
          >
            {SORTS.map((sort) => (
              <option key={sort.value} value={sort.value}>
                {sort.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[20rem_1fr]">
        <aside className="hidden lg:block">{filters}</aside>
        <div>
          <div className="mb-4 flex items-center justify-between gap-3 text-sm text-stone">
            <p>
              {products.data ? `Showing ${start}–${end} of ${products.data.total}` : "Loading the shelf…"}
            </p>
            <button type="button" className="rounded-md border border-line bg-paper px-3 py-1.5 lg:hidden" onClick={() => setFiltersOpen(true)}>
              Filters
            </button>
          </div>
          {products.isLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="aspect-[3/4]" />
              ))}
            </div>
          ) : products.isError ? (
            <Notice>{errorText(products.error)}</Notice>
          ) : products.data && products.data.items.length === 0 ? (
            <EmptyState title="Nothing on this shelf." body="Try a wider search, or clear the filters and start from the whole market." />
          ) : (
            <ProductGrid products={products.data?.items ?? []} />
          )}
          {products.data && products.data.total > products.data.perPage ? (
            <div className="mt-8 flex items-center justify-between">
              <Button
                tone="ghost"
                disabled={products.data.page <= 1}
                onClick={() => push({ page: String(products.data!.page - 1) }, false)}
              >
                Previous
              </Button>
              <p className="text-sm text-stone">
                Page {products.data.page} of {Math.ceil(products.data.total / products.data.perPage)}
              </p>
              <Button
                tone="ghost"
                disabled={products.data.page * products.data.perPage >= products.data.total}
                onClick={() => push({ page: String(products.data!.page + 1) }, false)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
      </div>
      {filtersOpen ? (
        <div className="fixed inset-0 z-40 bg-forest-deep/40 lg:hidden" onClick={() => setFiltersOpen(false)}>
          <div className="ml-auto h-full w-[min(100%,22rem)] overflow-y-auto bg-cream p-5" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl">Filters</h2>
              <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                Close
              </button>
            </div>
            {filters}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function readQuery(params: URLSearchParams): ProductQuery {
  const page = Number(params.get("page") ?? "1");
  const sort = params.get("sort");
  const region = params.get("region") ?? undefined;
  const storageType = params.get("storageType") ?? undefined;
  const dietary = params.get("dietary") ?? undefined;
  const minPrice = dollarsToCents(params.get("min") ?? "");
  const maxPrice = dollarsToCents(params.get("max") ?? "");
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    perPage: 12,
    q: params.get("q") || undefined,
    category: params.get("category") || undefined,
    tag: params.get("tag") || undefined,
    region: REGIONS.some((item) => item.value === region) ? region : undefined,
    storageType: STORAGE.some((item) => item.value === storageType) ? storageType : undefined,
    dietary: DIETARY.some((item) => item.value === dietary) ? dietary : undefined,
    country: params.get("country") || undefined,
    minPrice,
    maxPrice,
    inStock: params.get("inStock") === "true" ? "true" : undefined,
    sort: SORTS.some((item) => item.value === sort) ? (sort as ProductQuery["sort"]) : "newest",
  };
}

function flatten(categories: Category[], level = 0): Array<Category & { level: number }> {
  return categories.flatMap((category) => [{ ...category, level: category.level ?? level }, ...flatten(category.children ?? [], level + 1)]);
}
