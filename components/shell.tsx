"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatUsd } from "@/lib/money";
import { useCart, useCategories, useMe, useSession, useSettings } from "@/lib/queries";
import { Logo } from "./logo";

export function Shell({ children }: { children: React.ReactNode }) {
  const settings = useSettings();
  const categories = useCategories();
  const cart = useCart();
  const me = useMe();
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const count = cart.data?.items.reduce((sum, line) => sum + line.quantity, 0) ?? 0;
  const storeName = settings.data?.storeName || "AfriBasket";
  const announcement =
    settings.data?.announcementBar ||
    (settings.data
      ? `Free shipping on pantry orders over ${formatUsd(settings.data.freeShippingThresholdCents)} · US addresses only`
      : null);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-paper focus:px-3 focus:py-2">
        Skip to content
      </a>
      {announcement ? (
        <div className="bg-gold px-4 py-2 text-center text-[13px] font-medium tracking-wide text-forest-deep">
          {announcement}
        </div>
      ) : null}
      <header className="sticky top-0 z-40 bg-forest text-cream">
        <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center gap-3 px-4 sm:gap-5">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-md hover:bg-white/10 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="flex w-5 flex-col gap-1.5">
              <span className="h-px bg-cream" />
              <span className="h-px bg-cream" />
              <span className="h-px bg-cream" />
            </span>
          </button>
          <Link href="/" aria-label={storeName} className="shrink-0">
            <Logo />
          </Link>
          <SearchForm className="mx-auto hidden max-w-xl flex-1 lg:block" />
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-md hover:bg-white/10 lg:hidden"
              aria-label="Search"
              onClick={() => setSearchOpen((value) => !value)}
            >
              <SearchIcon />
            </button>
            <Link href={session.accessToken ? "/account" : "/login"} className="hidden items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-white/10 sm:flex">
              <UserIcon />
              <span className="max-w-28 truncate">{me.data ? me.data.firstName : "Account"}</span>
            </Link>
            <Link href="/cart" className="relative grid h-10 w-10 place-items-center rounded-md hover:bg-white/10" aria-label={`Cart, ${count} items`}>
              <BagIcon />
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-clay px-1 text-[10px] font-semibold text-white">
                {count}
              </span>
            </Link>
          </div>
        </div>
        <nav className="hidden border-t border-white/10 lg:block" aria-label="Shop">
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-2.5 text-sm text-cream/90">
            <Link href="/shop" className="hover:text-white">
              Shop all
            </Link>
            {(categories.data ?? []).slice(0, 6).map((category) => (
              <Link key={category.id} href={`/shop?category=${category.slug}`} className="hover:text-white">
                {category.name}
              </Link>
            ))}
            <Link href="/blog" className="ml-auto hover:text-white">
              Journal
            </Link>
            <Link href="/track" className="hover:text-white">
              Track order
            </Link>
          </div>
        </nav>
        {searchOpen ? (
          <div className="border-t border-white/10 px-4 py-3 lg:hidden">
            <SearchForm autoFocus onDone={() => setSearchOpen(false)} />
          </div>
        ) : null}
      </header>
      {open ? (
        <div className="fixed inset-0 z-30 bg-forest-deep/40 lg:hidden" onClick={() => setOpen(false)}>
          <div
            className="h-full w-[min(100%,20rem)] overflow-y-auto bg-paper px-5 py-6 text-ink"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-xs uppercase tracking-[0.16em] text-stone">Browse</p>
            <div className="mt-4 flex flex-col gap-3 text-lg">
              <Link href="/shop" onClick={() => setOpen(false)}>
                Shop all
              </Link>
              {(categories.data ?? []).map((category) => (
                <div key={category.id}>
                  <Link href={`/shop?category=${category.slug}`} onClick={() => setOpen(false)} className="font-medium">
                    {category.name}
                  </Link>
                  {category.children.length > 0 ? (
                    <div className="mt-2 flex flex-col gap-2 pl-3 text-base text-stone">
                      {category.children.map((child) => (
                        <Link key={child.id} href={`/shop?category=${child.slug}`} onClick={() => setOpen(false)}>
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 border-t border-line pt-5 text-base">
              <Link href="/blog" onClick={() => setOpen(false)}>Journal</Link>
              <Link href="/track" onClick={() => setOpen(false)}>Track an order</Link>
              <Link href={session.accessToken ? "/account" : "/login"} onClick={() => setOpen(false)}>
                {me.data ? `${me.data.firstName}'s account` : "Sign in"}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function SearchForm({ className = "", autoFocus, onDone }: { className?: string; autoFocus?: boolean; onDone?: () => void }) {
  const router = useRouter();
  return (
    <form
      className={className}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const q = String(data.get("q") ?? "").trim();
        router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
        onDone?.();
      }}
    >
      <label className="relative block">
        <span className="sr-only">Search the market</span>
        <input
          name="q"
          type="search"
          autoFocus={autoFocus}
          placeholder="Search palm oil, egusi, plantain…"
          className="w-full rounded-full border-0 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-cream placeholder:text-cream/55"
        />
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/70">
          <SearchIcon />
        </span>
      </label>
    </form>
  );
}

function Footer() {
  const settings = useSettings();
  const social = settings.data?.socialLinks ?? {};
  const links = [
    ["instagram", social.instagram],
    ["facebook", social.facebook],
    ["tiktok", social.tiktok],
    ["youtube", social.youtube],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <footer className="mt-16 bg-forest text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/75">
            {settings.data?.defaultMetaDescription || "African groceries delivered across the United States."}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-gold">Market</p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/shop">Shop</Link>
            <Link href="/blog">Journal</Link>
            <Link href="/track">Track an order</Link>
            <Link href="/account">Your account</Link>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-gold">Help</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-cream/85">
            {settings.data?.supportEmail ? <a href={`mailto:${settings.data.supportEmail}`}>{settings.data.supportEmail}</a> : null}
            {settings.data?.supportPhone ? <a href={`tel:${settings.data.supportPhone}`}>{settings.data.supportPhone}</a> : null}
            <p>We ship to US addresses, in USD.</p>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-gold">Elsewhere</p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            {links.length === 0 ? <p className="text-cream/60">Social links appear when the store publishes them.</p> : null}
            {links.map(([name, href]) => (
              <a key={name} href={href} className="capitalize" target="_blank" rel="noreferrer">
                {name}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-cream/60">
        © {new Date().getFullYear()} {settings.data?.storeName || "AfriBasket"}
      </div>
    </footer>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16.5 20 20.5" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.2c1.4-2.6 3.6-3.8 6.5-3.8s5.1 1.2 6.5 3.8" strokeLinecap="round" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6.5 8.5h11l-.8 11.2a1.5 1.5 0 0 1-1.5 1.3H8.8a1.5 1.5 0 0 1-1.5-1.3L6.5 8.5Z" />
      <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" strokeLinecap="round" />
    </svg>
  );
}
