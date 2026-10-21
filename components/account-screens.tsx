"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AddressFields, addressErrors, cleanAddress, emptyAddress } from "@/components/address-fields";
import { Button, controlClass, Field, Notice, Skeleton } from "@/components/ui";
import { api, errorText } from "@/lib/api";
import { formatWhen } from "@/lib/labels";
import { formatUsd } from "@/lib/money";
import { useAddresses, useAuthDispatch, useMe, useMyOrders, useSession } from "@/lib/queries";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Address, AddressInput } from "@/lib/types";

export function AccountNav() {
  return (
    <nav className="flex gap-4 border-b border-line text-sm" aria-label="Account">
      <Link href="/account" className="border-b-2 border-transparent py-2 hover:border-forest">Profile</Link>
      <Link href="/account/addresses" className="border-b-2 border-transparent py-2 hover:border-forest">Addresses</Link>
      <Link href="/account/orders" className="border-b-2 border-transparent py-2 hover:border-forest">Orders</Link>
    </nav>
  );
}

export function useRequireCustomer() {
  const session = useSession();
  const router = useRouter();
  useEffect(() => {
    if (session.hydrated && !session.accessToken) router.replace("/login?next=/account");
  }, [session.hydrated, session.accessToken, router]);
  return session;
}

export function ProfileScreen() {
  const session = useRequireCustomer();
  const me = useMe();
  const auth = useAuthDispatch();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  if (!session.hydrated || me.isLoading) return <Skeleton className="h-64" />;
  if (me.isError) return <Notice>{errorText(me.error)}</Notice>;
  if (!me.data) return null;
  const customer = me.data;

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <form
        className="grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setError(null);
          setOk(null);
          try {
            const phone = String(data.get("phone") ?? "").trim();
            await api.updateMe({
              firstName: String(data.get("firstName") ?? ""),
              lastName: String(data.get("lastName") ?? ""),
              phone: phone ? phone : null,
              marketingOptIn: data.get("marketingOptIn") === "on",
            });
            await queryClient.invalidateQueries({ queryKey: ["me"] });
            setOk("Profile saved.");
          } catch (reason) {
            setError(errorText(reason));
          }
        }}
      >
        <h1 className="font-display text-4xl text-forest">Profile</h1>
        <p className="text-sm text-stone">{customer.email}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name">
            <input name="firstName" defaultValue={customer.firstName} required className={controlClass} />
          </Field>
          <Field label="Last name">
            <input name="lastName" defaultValue={customer.lastName} required className={controlClass} />
          </Field>
        </div>
        <Field label="Phone" hint="Leave blank to remove it. US numbers only.">
          <input name="phone" defaultValue={customer.phone ?? ""} className={controlClass} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="marketingOptIn" defaultChecked={customer.marketingOptIn} />
          Send me market notes
        </label>
        {error ? <Notice>{error}</Notice> : null}
        {ok ? <Notice tone="ok">{ok}</Notice> : null}
        <div className="flex gap-3">
          <Button type="submit">Save profile</Button>
          <Button
            tone="ghost"
            onClick={() => {
              void auth.logout().then(() => router.push("/"));
            }}
          >
            Sign out
          </Button>
        </div>
      </form>
      <PasswordForm onDone={() => {
        auth.clear();
        router.push("/login?next=/account");
      }} />
    </div>
  );
}

function PasswordForm({ onDone }: { onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="grid h-fit gap-4 rounded-lg bg-paper p-5 ring-1 ring-line"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const newPassword = String(data.get("newPassword") ?? "");
        if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
          setError("New password needs 8 characters, a letter, and a number.");
          return;
        }
        setError(null);
        try {
          await api.changePassword({
            currentPassword: String(data.get("currentPassword") ?? ""),
            newPassword,
          });
          onDone();
        } catch (reason) {
          setError(errorText(reason));
        }
      }}
    >
      <h2 className="font-display text-2xl text-forest">Password</h2>
      <p className="text-sm text-stone">Changing it signs you out of every device.</p>
      <Field label="Current password">
        <input name="currentPassword" type="password" required autoComplete="current-password" className={controlClass} />
      </Field>
      <Field label="New password">
        <input name="newPassword" type="password" required autoComplete="new-password" className={controlClass} />
      </Field>
      {error ? <Notice>{error}</Notice> : null}
      <Button type="submit" tone="forest">Update password</Button>
    </form>
  );
}

export function AddressesScreen() {
  useRequireCustomer();
  const addresses = useAddresses();
  const me = useMe();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function makeDefault(id: string) {
    setError(null);
    try {
      await api.updateMe({ defaultAddressId: id });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    } catch (reason) {
      setError(errorText(reason));
    }
  }

  return (
    <div>
      <div className="flex items-end justify-between">
        <h1 className="font-display text-4xl text-forest">Addresses</h1>
        <Button onClick={() => setEditing("new")}>Add address</Button>
      </div>
      {error ? <div className="mt-4"><Notice>{error}</Notice></div> : null}
      {addresses.isLoading ? <Skeleton className="mt-6 h-40" /> : null}
      {addresses.isError ? <div className="mt-4"><Notice>{errorText(addresses.error)}</Notice></div> : null}
      <div className="mt-6 grid gap-3">
        {(addresses.data ?? []).map((address) => (
          <article key={address.id} className="rounded-lg bg-paper p-4 ring-1 ring-line">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{address.label || "Address"} {me.data?.defaultAddressId === address.id ? <span className="ml-2 text-xs uppercase text-leaf">Default</span> : null}</p>
                <p className="mt-1 text-sm text-stone">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                  <br />
                  {address.city}, {address.state} {address.postalCode}
                  <br />
                  {address.country}
                  {address.phone ? ` · ${address.phone}` : ""}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 text-sm">
                <button type="button" className="underline" onClick={() => setEditing(address)}>Edit</button>
                {me.data?.defaultAddressId !== address.id ? (
                  <button type="button" className="underline" onClick={() => void makeDefault(address.id)}>Make default</button>
                ) : null}
                <button
                  type="button"
                  className="text-danger underline"
                  onClick={async () => {
                    setError(null);
                    try {
                      await api.deleteAddress(address.id);
                      await queryClient.invalidateQueries({ queryKey: ["addresses"] });
                      await queryClient.invalidateQueries({ queryKey: ["me"] });
                    } catch (reason) {
                      setError(errorText(reason));
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
        {addresses.data && addresses.data.length === 0 ? <p className="text-sm text-stone">No saved addresses yet.</p> : null}
      </div>
      {editing ? (
        <AddressEditor
          address={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

function AddressEditor({ address, onClose }: { address: Address | null; onClose: () => void }) {
  const [value, setValue] = useState<AddressInput>(
    address
      ? {
          line1: address.line1,
          line2: address.line2 ?? "",
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: "US",
          phone: address.phone ?? "",
          label: address.label ?? "",
        }
      : emptyAddress,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const body = cleanAddress(value, Boolean(value.phone?.trim()));
      if (value.label?.trim()) body.label = value.label.trim();
      return address ? api.updateAddress(address.id, body) : api.createAddress(body);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["addresses"] });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      onClose();
    },
  });

  return (
    <form
      className="mt-6 rounded-lg bg-paper p-5 ring-1 ring-line"
      onSubmit={(event) => {
        event.preventDefault();
        const next = addressErrors(value, false);
        if (value.country !== "US") next.country = "AfriBasket only saves US addresses.";
        setErrors(next);
        if (Object.keys(next).length) return;
        setError(null);
        mutation.mutate(undefined, { onError: (reason) => setError(errorText(reason)) });
      }}
    >
      <h2 className="font-display text-2xl text-forest">{address ? "Edit address" : "New address"}</h2>
      <div className="mt-4">
        <AddressFields value={value} onChange={setValue} errors={errors} showLabel showPhone />
      </div>
      {error ? <div className="mt-3"><Notice>{error}</Notice></div> : null}
      <div className="mt-4 flex gap-3">
        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : "Save address"}</Button>
        <Button tone="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}

export function OrdersScreen() {
  useRequireCustomer();
  const [page, setPage] = useState(1);
  const orders = useMyOrders(page);
  return (
    <div>
      <h1 className="font-display text-4xl text-forest">Orders</h1>
      {orders.isLoading ? <Skeleton className="mt-6 h-40" /> : null}
      {orders.isError ? <div className="mt-4"><Notice>{errorText(orders.error)}</Notice></div> : null}
      {orders.data && orders.data.items.length === 0 ? <p className="mt-6 text-sm text-stone">No orders yet.</p> : null}
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {orders.data?.items.map((order) => (
          <li key={order.orderNumber}>
            <Link href={`/orders/${order.orderNumber}`} className="flex flex-wrap items-center justify-between gap-3 py-4 hover:text-leaf">
              <span>
                <span className="block font-medium">{order.orderNumber}</span>
                <span className="text-sm text-stone">{formatWhen(order.createdAt)} · {order.status} · {order.paymentStatus}</span>
              </span>
              <span className="tabular-nums">{formatUsd(order.totalCents)}</span>
            </Link>
          </li>
        ))}
      </ul>
      {orders.data && orders.data.total > orders.data.perPage ? (
        <div className="mt-4 flex gap-3">
          <Button tone="ghost" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
          <Button tone="ghost" disabled={page * orders.data.perPage >= orders.data.total} onClick={() => setPage((value) => value + 1)}>Next</Button>
        </div>
      ) : null}
    </div>
  );
}
