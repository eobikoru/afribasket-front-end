export function formatUsd(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  return `${sign}$${dollars.toLocaleString("en-US")}.${remainder.toString().padStart(2, "0")}`;
}

export function dollarsToCents(value: string): number | undefined {
  const trimmed = value.trim().replace(/^\$/, "");
  if (!trimmed) return undefined;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return undefined;
  const [whole, fraction = ""] = trimmed.split(".");
  return Number(whole) * 100 + Number((fraction + "00").slice(0, 2));
}

export function centsToDollarInput(cents: number | undefined): string {
  if (cents == null) return "";
  const whole = Math.floor(cents / 100);
  const fraction = cents % 100;
  return fraction === 0 ? String(whole) : `${whole}.${fraction.toString().padStart(2, "0")}`;
}
