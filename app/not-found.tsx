import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="text-xs uppercase tracking-[0.18em] text-clay">404</p>
      <h1 className="font-display mt-2 text-5xl text-forest">That aisle doesn’t exist.</h1>
      <Link href="/shop" className="mt-6 inline-block text-leaf underline">
        Back to the shop
      </Link>
    </div>
  );
}
