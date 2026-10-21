import type { Product, Variant } from "./types";

export const REGIONS = [
  { value: "west_africa", label: "West Africa" },
  { value: "east_africa", label: "East Africa" },
  { value: "southern_africa", label: "Southern Africa" },
  { value: "north_africa", label: "North Africa" },
  { value: "pan_african", label: "Pan-African" },
] as const;

export const STORAGE = [
  { value: "ambient", label: "Pantry" },
  { value: "refrigerated", label: "Refrigerated" },
  { value: "frozen", label: "Frozen" },
] as const;

export const DIETARY = [
  { value: "halal", label: "Halal" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten_free", label: "Gluten free" },
  { value: "spicy", label: "Spicy" },
] as const;

export const ALLERGENS: Record<string, string> = {
  milk: "Milk",
  eggs: "Eggs",
  fish: "Fish",
  shellfish: "Shellfish",
  tree_nuts: "Tree nuts",
  peanuts: "Peanuts",
  wheat: "Wheat",
  soybeans: "Soybeans",
  sesame: "Sesame",
};

export const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price, low to high" },
  { value: "price_desc", label: "Price, high to low" },
  { value: "name_asc", label: "Name, A to Z" },
  { value: "name_desc", label: "Name, Z to A" },
] as const;

export const SHIPPING_METHODS = [
  { value: "standard", label: "Standard", detail: "The usual route for pantry goods." },
  { value: "expedited", label: "Expedited", detail: "A faster truck for anything that should not wait." },
  { value: "overnight", label: "Overnight", detail: "Next-day where the carrier offers it." },
] as const;

export const SUBSTITUTIONS = [
  { value: "contact_me", label: "Contact me", detail: "Call or text before swapping anything." },
  { value: "refund_item", label: "Refund the item", detail: "Leave it out and refund that line." },
  { value: "best_substitute", label: "Best substitute", detail: "Pick the closest thing on the shelf." },
] as const;

const COUNTRIES: Record<string, string> = {
  DZ: "Algeria",
  AO: "Angola",
  BJ: "Benin",
  BW: "Botswana",
  BF: "Burkina Faso",
  BI: "Burundi",
  CV: "Cabo Verde",
  CM: "Cameroon",
  CF: "Central African Republic",
  TD: "Chad",
  KM: "Comoros",
  CG: "Congo",
  CD: "DR Congo",
  CI: "Côte d’Ivoire",
  DJ: "Djibouti",
  EG: "Egypt",
  GQ: "Equatorial Guinea",
  ER: "Eritrea",
  SZ: "Eswatini",
  ET: "Ethiopia",
  GA: "Gabon",
  GM: "Gambia",
  GH: "Ghana",
  GN: "Guinea",
  GW: "Guinea-Bissau",
  KE: "Kenya",
  LS: "Lesotho",
  LR: "Liberia",
  LY: "Libya",
  MG: "Madagascar",
  MW: "Malawi",
  ML: "Mali",
  MR: "Mauritania",
  MU: "Mauritius",
  MA: "Morocco",
  MZ: "Mozambique",
  NA: "Namibia",
  NE: "Niger",
  NG: "Nigeria",
  RW: "Rwanda",
  ST: "São Tomé and Príncipe",
  SN: "Senegal",
  SC: "Seychelles",
  SL: "Sierra Leone",
  SO: "Somalia",
  ZA: "South Africa",
  SS: "South Sudan",
  SD: "Sudan",
  TZ: "Tanzania",
  TG: "Togo",
  TN: "Tunisia",
  UG: "Uganda",
  ZM: "Zambia",
  ZW: "Zimbabwe",
};

export function labelOf(list: readonly { value: string; label: string }[], value: string): string {
  return list.find((item) => item.value === value)?.label ?? value.replaceAll("_", " ");
}

export function countryName(code: string): string {
  const upper = code.toUpperCase();
  return COUNTRIES[upper] ?? upper;
}

export function primaryImage(product: Pick<Product, "images">) {
  return product.images.find((image) => image.isPrimary) ?? product.images[0] ?? null;
}

export function unitPrice(product: Pick<Product, "priceCents" | "variants">, variant?: Variant | null): number {
  return variant?.priceCents ?? product.priceCents;
}

export function availableCount(product: Pick<Product, "variants" | "inventory">, variant?: Variant | null): number {
  if (product.variants.length > 0) return variant?.quantityAvailable ?? 0;
  return product.inventory?.quantityAvailable ?? 0;
}

export function priceLabel(product: Pick<Product, "priceCents" | "variants">): { cents: number; prefix: string } {
  const active = product.variants.filter((variant) => variant.isActive);
  if (active.length === 0) return { cents: product.priceCents, prefix: "" };
  const prices = active.map((variant) => variant.priceCents ?? product.priceCents);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { cents: min, prefix: min !== max ? "From " : "" };
}

export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function formatWhenTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
