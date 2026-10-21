"use client";

import { controlClass, Field } from "@/components/ui";
import { isUsState, US_STATES, ZIP } from "@/lib/states";
import type { AddressInput } from "@/lib/types";

export const emptyAddress: AddressInput = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
  phone: "",
  label: "",
};

export function addressErrors(address: AddressInput, requirePhone = false): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!address.line1.trim()) errors.line1 = "Enter a street address.";
  if (!address.city.trim()) errors.city = "Enter a city.";
  if (!isUsState(address.state)) errors.state = "Choose a US state, DC, or territory.";
  if (!ZIP.test(address.postalCode.trim())) errors.postalCode = "Use a ZIP or ZIP+4 code.";
  if (address.country !== "US") errors.country = "AfriBasket ships inside the United States only.";
  if (requirePhone && !address.phone?.trim()) errors.phone = "Enter a US phone number.";
  return errors;
}

export function cleanAddress(address: AddressInput, includePhone: boolean): AddressInput {
  return {
    line1: address.line1.trim(),
    ...(address.line2?.trim() ? { line2: address.line2.trim() } : {}),
    city: address.city.trim(),
    state: address.state.toUpperCase(),
    postalCode: address.postalCode.trim(),
    country: "US",
    ...(includePhone && address.phone?.trim() ? { phone: address.phone.trim() } : {}),
    ...(address.label?.trim() ? { label: address.label.trim() } : {}),
  };
}

export function AddressFields({
  value,
  onChange,
  errors,
  showLabel = false,
  showPhone = false,
}: {
  value: AddressInput;
  onChange: (next: AddressInput) => void;
  errors?: Record<string, string>;
  showLabel?: boolean;
  showPhone?: boolean;
}) {
  function set<K extends keyof AddressInput>(key: K, next: AddressInput[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="grid gap-4">
      {showLabel ? (
        <Field label="Label" hint="Home, office, or whatever you call it.">
          <input className={controlClass} value={value.label ?? ""} onChange={(event) => set("label", event.target.value)} maxLength={40} />
        </Field>
      ) : null}
      <Field label="Street address" error={errors?.line1}>
        <input className={controlClass} value={value.line1} onChange={(event) => set("line1", event.target.value)} autoComplete="address-line1" required />
      </Field>
      <Field label="Apartment, suite (optional)">
        <input className={controlClass} value={value.line2 ?? ""} onChange={(event) => set("line2", event.target.value)} autoComplete="address-line2" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" error={errors?.city}>
          <input className={controlClass} value={value.city} onChange={(event) => set("city", event.target.value)} autoComplete="address-level2" required />
        </Field>
        <Field label="State" error={errors?.state}>
          <select className={controlClass} value={value.state} onChange={(event) => set("state", event.target.value)} autoComplete="address-level1" required>
            <option value="">Select</option>
            {US_STATES.map(([code, name]) => (
              <option key={code} value={code}>
                {code} — {name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ZIP code" error={errors?.postalCode}>
          <input className={controlClass} value={value.postalCode} onChange={(event) => set("postalCode", event.target.value)} autoComplete="postal-code" inputMode="numeric" required />
        </Field>
        <Field label="Country" error={errors?.country} hint="We only deliver inside the US.">
          <select
            className={controlClass}
            value={value.country}
            onChange={(event) => {
              const next = event.target.value;
              if (next !== "US") return;
              set("country", "US");
            }}
          >
            <option value="US">United States</option>
          </select>
        </Field>
      </div>
      {showPhone ? (
        <Field label="Phone" error={errors?.phone} hint="A US number, so the carrier can reach you.">
          <input className={controlClass} value={value.phone ?? ""} onChange={(event) => set("phone", event.target.value)} autoComplete="tel" inputMode="tel" />
        </Field>
      ) : null}
    </div>
  );
}
