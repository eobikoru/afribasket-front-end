"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AddressFields, addressErrors, cleanAddress, emptyAddress } from "@/components/address-fields";
import { Button, controlClass, Field, Notice, Skeleton } from "@/components/ui";
import { allowedMethodsFrom, api, errorText } from "@/lib/api";
import { labelOf, SHIPPING_METHODS, STORAGE, SUBSTITUTIONS } from "@/lib/labels";
import { formatUsd } from "@/lib/money";
import { useAddresses, useCart, useMe, useSession } from "@/lib/queries";
import { rememberCheckout } from "@/lib/session";
import type { AddressInput, PaymentProvider, ShippingMethod, SubstitutionPreference } from "@/lib/types";

export function CheckoutScreen() {
  const session = useSession();
  const cart = useCart();
  const me = useMe();
  const addresses = useAddresses();
  const signedIn = Boolean(session.accessToken);
  const [addressId, setAddressId] = useState<string>("new");
  const [shipping, setShipping] = useState<AddressInput>(emptyAddress);
  const [billingSame, setBillingSame] = useState(true);
  const [billing, setBilling] = useState<AddressInput>(emptyAddress);
  const [method, setMethod] = useState<ShippingMethod>("standard");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [substitution, setSubstitution] = useState<SubstitutionPreference>("contact_me");
  const [provider, setProvider] = useState<PaymentProvider>("stripe");
  const [saveAddress, setSaveAddress] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (me.data) {
      setFirstName(me.data.firstName);
      setLastName(me.data.lastName);
      if (me.data.phone) setPhone(me.data.phone);
      if (me.data.defaultAddressId) setAddressId(me.data.defaultAddressId);
    }
  }, [me.data]);

  const cold = (cart.data?.items ?? []).some(
    (line) => line.purchasable && (line.storageType === "frozen" || line.storageType === "refrigerated"),
  );
  const saved = addresses.data?.find((item) => item.id === addressId);
  const shippingAddress: AddressInput | null = saved
    ? {
        line1: saved.line1,
        line2: saved.line2 ?? undefined,
        city: saved.city,
        state: saved.state,
        postalCode: saved.postalCode,
        country: "US",
        phone: saved.phone ?? undefined,
      }
    : addressReady(shipping)
      ? cleanAddress(shipping, Boolean(shipping.phone?.trim()))
      : null;

  const breakdownQuery = useQuery({
    queryKey: ["breakdown", shippingAddress, method, appliedCoupon, signedIn ? me.data?.email : email],
    queryFn: () =>
      api.breakdown({
        useCart: true,
        shippingAddress: shippingAddress as AddressInput,
        shippingMethod: method,
        ...(appliedCoupon ? { couponCode: appliedCoupon } : {}),
        ...(!signedIn && email.includes("@") ? { email } : {}),
      }),
    enabled: Boolean(shippingAddress) && Boolean(cart.data && cart.data.items.length > 0) && session.hydrated,
    retry: false,
  });

  const allowed = breakdownQuery.data?.allowedShippingMethods;
  const methods = SHIPPING_METHODS.filter((item) => {
    if (cold && item.value === "standard") return false;
    if (allowed && allowed.length > 0) return allowed.includes(item.value);
    return true;
  });

  useEffect(() => {
    if (cold && method === "standard") setMethod("expedited");
  }, [cold, method]);

  useEffect(() => {
    const fromError = allowedMethodsFrom(breakdownQuery.error);
    const next = breakdownQuery.data?.allowedShippingMethods ?? fromError;
    if (next && next.length > 0 && !next.includes(method)) setMethod(next[0]);
  }, [breakdownQuery.data, breakdownQuery.error, method]);

  const blocked = useMemo(() => {
    if (!cart.data) return "Loading your cart…";
    if (cart.data.items.length === 0) return "Your cart is empty.";
    if (cart.data.items.some((line) => !line.purchasable)) return "Remove unavailable items before checkout.";
    return null;
  }, [cart.data]);

  async function placeOrder() {
    setFormError(null);
    if (blocked) {
      setFormError(blocked);
      return;
    }
    const errors = saved ? {} : addressErrors(shipping, false);
    if (!signedIn) {
      if (!email.trim()) errors.email = "Enter an email.";
      if (!firstName.trim()) errors.firstName = "Enter a first name.";
      if (!lastName.trim()) errors.lastName = "Enter a last name.";
      if (!phone.trim()) errors.phone = "Enter a US phone number.";
    }
    if (!billingSame) Object.assign(errors, prefixErrors(addressErrors(billing, false), "billing"));
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    const ship = saved ? undefined : cleanAddress(shipping, Boolean(shipping.phone?.trim()));
    const bill = billingSame ? undefined : cleanAddress(billing, false);
    setSubmitting(true);
    try {
      if (signedIn && saveAddress && ship) {
        await api.createAddress(ship);
      }
      const result = signedIn
        ? await api.checkout({
            ...(saved ? { addressId: saved.id } : { shippingAddress: ship }),
            ...(phone.trim() ? { phone: phone.trim() } : {}),
            billingSameAsShipping: billingSame,
            ...(bill ? { billingAddress: bill } : {}),
            shippingMethod: method,
            ...(appliedCoupon ? { couponCode: appliedCoupon } : {}),
            paymentProvider: provider,
            ...(note.trim() ? { deliveryNote: note.trim() } : {}),
            substitutionPreference: substitution,
            useCart: true,
          })
        : await api.checkoutGuest({
            email: email.trim(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim(),
            shippingAddress: ship as AddressInput,
            billingSameAsShipping: billingSame,
            ...(bill ? { billingAddress: bill } : {}),
            shippingMethod: method,
            ...(appliedCoupon ? { couponCode: appliedCoupon } : {}),
            paymentProvider: provider,
            ...(note.trim() ? { deliveryNote: note.trim() } : {}),
            substitutionPreference: substitution,
            useCart: true,
          });
      rememberCheckout({
        orderNumber: result.orderNumber,
        reservationExpiresAt: result.reservationExpiresAt,
        email: signedIn ? me.data?.email : email.trim(),
        providerReference: result.payment.reference,
      });
      if (!result.payment.approvalUrl) {
        setFormError(`Order ${result.orderNumber} was created, but the payment page did not open. Contact support with that order number.`);
        return;
      }
      window.location.assign(result.payment.approvalUrl);
    } catch (error) {
      setFormError(errorText(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (!session.hydrated || cart.isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 lg:grid-cols-[1fr_20rem]">
      <div>
        <h1 className="font-display text-5xl text-forest">Checkout</h1>
        <p className="mt-2 text-sm text-stone">
          {signedIn ? (
            <>Signed in as {me.data?.email}.</>
          ) : (
            <>
              Checking out as a guest. <Link href="/login?next=/checkout" className="text-leaf underline">Sign in</Link> to use a saved address.
            </>
          )}
        </p>
        {cart.isError ? <div className="mt-4"><Notice>{errorText(cart.error)}</Notice></div> : null}
        {blocked && cart.data ? <div className="mt-4"><Notice>{blocked}</Notice></div> : null}

        {!signedIn ? (
          <section className="mt-8">
            <h2 className="font-display text-2xl text-forest">Contact</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Email" error={fieldErrors.email}>
                <input className={controlClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
              </Field>
              <Field label="Phone" error={fieldErrors.phone}>
                <input className={controlClass} value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" />
              </Field>
              <Field label="First name" error={fieldErrors.firstName}>
                <input className={controlClass} value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" />
              </Field>
              <Field label="Last name" error={fieldErrors.lastName}>
                <input className={controlClass} value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" />
              </Field>
            </div>
          </section>
        ) : (
          <section className="mt-8">
            <Field label="Phone for the carrier" hint="Optional if your account or address already has one.">
              <input className={controlClass} value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" />
            </Field>
          </section>
        )}

        <section className="mt-8">
          <h2 className="font-display text-2xl text-forest">Ship to</h2>
          {signedIn && (addresses.data?.length ?? 0) > 0 ? (
            <fieldset className="mt-4 grid gap-2">
              <legend className="sr-only">Saved addresses</legend>
              {addresses.data?.map((address) => (
                <label key={address.id} className={`flex cursor-pointer gap-3 rounded-md border px-3 py-3 ${addressId === address.id ? "border-forest bg-paper" : "border-line"}`}>
                  <input type="radio" name="address" checked={addressId === address.id} onChange={() => setAddressId(address.id)} />
                  <span>
                    <span className="block font-medium">{address.label || "Saved address"}</span>
                    <span className="block text-sm text-stone">
                      {address.line1}, {address.city}, {address.state} {address.postalCode}
                    </span>
                  </span>
                </label>
              ))}
              <label className={`flex cursor-pointer gap-3 rounded-md border px-3 py-3 ${addressId === "new" ? "border-forest bg-paper" : "border-line"}`}>
                <input type="radio" name="address" checked={addressId === "new"} onChange={() => setAddressId("new")} />
                <span>Use a new address</span>
              </label>
            </fieldset>
          ) : null}
          {!saved ? (
            <div className="mt-4">
              <AddressFields value={shipping} onChange={setShipping} errors={fieldErrors} showPhone={signedIn} />
              {signedIn ? (
                <label className="mt-3 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={saveAddress} onChange={(event) => setSaveAddress(event.target.checked)} />
                  Save this address
                </label>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="mt-8">
          <h2 className="font-display text-2xl text-forest">Shipping</h2>
          {cold ? <p className="mt-2 text-sm text-stone">Frozen or refrigerated carts can’t use standard shipping.</p> : null}
          <fieldset className="mt-3 grid gap-2">
            <legend className="sr-only">Shipping method</legend>
            {methods.map((item) => (
              <label key={item.value} className={`flex cursor-pointer gap-3 rounded-md border px-3 py-3 ${method === item.value ? "border-forest bg-paper" : "border-line"}`}>
                <input type="radio" name="method" checked={method === item.value} onChange={() => setMethod(item.value)} />
                <span>
                  <span className="font-medium">{item.label}</span>
                  <span className="mt-0.5 block text-sm text-stone">{item.detail}</span>
                </span>
              </label>
            ))}
          </fieldset>
        </section>

        <section className="mt-8">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={billingSame} onChange={(event) => setBillingSame(event.target.checked)} />
            Billing address is the same as shipping
          </label>
          {!billingSame ? (
            <div className="mt-4">
              <AddressFields value={billing} onChange={setBilling} errors={unprefix(fieldErrors)} />
            </div>
          ) : null}
        </section>

        <section className="mt-8 grid gap-4">
          <Field label="If something is missing">
            <select className={controlClass} value={substitution} onChange={(event) => setSubstitution(event.target.value as SubstitutionPreference)}>
              {SUBSTITUTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label} — {item.detail}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Delivery note" hint="Gate codes, leave-at-door, anything the driver should know.">
            <textarea className={controlClass} rows={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />
          </Field>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-2xl text-forest">Payment</h2>
          <p className="mt-1 text-sm text-stone">You’ll approve the charge on the provider’s page. We don’t take card numbers here.</p>
          <fieldset className="mt-3 grid gap-2 sm:grid-cols-2">
            <legend className="sr-only">Payment provider</legend>
            {(["stripe", "paypal"] as const).map((item) => (
              <label key={item} className={`cursor-pointer rounded-md border px-4 py-4 ${provider === item ? "border-forest bg-paper" : "border-line"}`}>
                <input className="sr-only" type="radio" name="provider" checked={provider === item} onChange={() => setProvider(item)} />
                <span className="block font-medium">{item === "stripe" ? "Stripe" : "PayPal"}</span>
                <span className="mt-1 block text-sm text-stone">{item === "stripe" ? "Card or Link" : "PayPal balance or Venmo"}</span>
              </label>
            ))}
          </fieldset>
        </section>

        {formError ? <div className="mt-6"><Notice>{formError}</Notice></div> : null}
        <Button className="mt-6 w-full sm:w-auto" disabled={submitting || Boolean(blocked)} onClick={() => void placeOrder()}>
          {submitting ? "Starting payment…" : `Continue to ${provider === "stripe" ? "Stripe" : "PayPal"}`}
        </Button>
      </div>

      <aside className="h-fit rounded-lg bg-paper p-5 ring-1 ring-line">
        <h2 className="font-medium">Order</h2>
        <ul className="mt-3 divide-y divide-line text-sm">
          {(cart.data?.items ?? []).map((line) => (
            <li key={`${line.productId}:${line.variantId ?? ""}`} className="flex justify-between gap-3 py-2">
              <span>
                {line.quantity} × {line.name}
                <span className="block text-xs uppercase text-stone">{labelOf(STORAGE, line.storageType)}</span>
              </span>
              <span className="tabular-nums">{formatUsd(line.lineTotalCents)}</span>
            </li>
          ))}
        </ul>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setAppliedCoupon(coupon.trim());
          }}
        >
          <label className="flex-1">
            <span className="sr-only">Coupon</span>
            <input className={controlClass} placeholder="Coupon" value={coupon} onChange={(event) => setCoupon(event.target.value)} />
          </label>
          <Button type="submit" tone="ghost">Apply</Button>
        </form>
        <BreakdownView
          loading={breakdownQuery.isFetching}
          error={breakdownQuery.error ? errorText(breakdownQuery.error) : null}
          data={breakdownQuery.data}
        />
      </aside>
    </div>
  );
}

function BreakdownView({
  loading,
  error,
  data,
}: {
  loading: boolean;
  error: string | null;
  data?: {
    subtotalCents: number;
    discountCents: number;
    shippingCents: number;
    taxCents: number;
    totalCents: number;
    currency: string;
    shippingExplanation: string;
    taxExplanation: string;
  };
}) {
  if (!data && loading) return <p className="mt-4 text-sm text-stone">Pricing shipping and tax…</p>;
  if (error && !data) return <p className="mt-4 text-sm text-danger">{error}</p>;
  if (!data) return <p className="mt-4 text-sm text-stone">Enter a US address to see shipping and tax.</p>;
  return (
    <dl className="mt-4 grid gap-2 text-sm">
      <Row label="Subtotal" value={formatUsd(data.subtotalCents)} />
      <Row label="Discount" value={formatUsd(data.discountCents)} />
      <Row label="Shipping" value={formatUsd(data.shippingCents)} />
      <Row label="Tax" value={formatUsd(data.taxCents)} />
      <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
        <dt className="font-medium">Total · {data.currency}</dt>
        <dd className="font-display text-3xl tabular-nums">{formatUsd(data.totalCents)}</dd>
      </div>
      <p className="text-xs leading-relaxed text-stone">{data.shippingExplanation}</p>
      <p className="text-xs leading-relaxed text-stone">{data.taxExplanation}</p>
    </dl>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-stone">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function addressReady(address: AddressInput) {
  return Boolean(address.line1.trim() && address.city.trim() && address.state && /^\d{5}(?:-\d{4})?$/.test(address.postalCode.trim()));
}

function prefixErrors(errors: Record<string, string>, prefix: string) {
  return Object.fromEntries(Object.entries(errors).map(([key, value]) => [`${prefix}.${key}`, value]));
}

function unprefix(errors: Record<string, string>) {
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(errors)) {
    if (key.startsWith("billing.")) next[key.slice(8)] = value;
  }
  return next;
}
