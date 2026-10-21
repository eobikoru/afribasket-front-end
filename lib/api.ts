import { clearSession, setCartToken, setSession } from "./session";
import { store } from "./store";
import type {
  Address,
  AddressInput,
  ApiErrorBody,
  AuthResult,
  Banner,
  BlogCard,
  BlogCategory,
  BlogPost,
  Breakdown,
  Cart,
  Category,
  CheckoutResult,
  Customer,
  Order,
  Page,
  PaymentProvider,
  Product,
  ProductQuery,
  Review,
  Settings,
  ShippingMethod,
  SubstitutionPreference,
  VerifyResult,
} from "./types";
import { API_URL } from "./types";

export class ApiError extends Error {
  status: number;
  code: string;
  details: unknown;

  constructor(status: number, code: string, message: string, details: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    const details = fieldMessages(error.details);
    if (details && error.message === "Validation failed") return details;
    if (details && error.message) return `${error.message} ${details}`;
    return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}

function fieldMessages(details: unknown): string | null {
  if (!Array.isArray(details)) return null;
  const lines = details
    .map((item) => {
      if (!item || typeof item !== "object" || !("message" in item)) return null;
      const message = String((item as { message: unknown }).message);
      const path = "path" in item ? String((item as { path: unknown }).path) : "";
      return path && path !== "(root)" ? `${path}: ${message}` : message;
    })
    .filter((line): line is string => Boolean(line));
  return lines.length ? lines.join(" ") : null;
}

export function allowedMethodsFrom(error: unknown): ShippingMethod[] | null {
  if (!(error instanceof ApiError) || !error.details || typeof error.details !== "object") return null;
  const methods = (error.details as { allowedMethods?: unknown }).allowedMethods;
  if (!Array.isArray(methods)) return null;
  return methods.filter((method): method is ShippingMethod =>
    method === "standard" || method === "expedited" || method === "overnight",
  );
}

function apiBase(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return "/api/v1";
  }
  return API_URL;
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = store.getState().session.refreshToken;
  if (!refreshToken) return false;
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const response = await fetch(`${apiBase()}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.accessToken || !payload?.refreshToken) return false;
      store.dispatch(setSession({ accessToken: payload.accessToken, refreshToken: payload.refreshToken }));
      return true;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function ensureCartToken(): string {
  const existing = store.getState().session.cartToken;
  if (existing) return existing;
  const token = crypto.randomUUID();
  store.dispatch(setCartToken(token));
  return token;
}

function captureCartToken(response: Response) {
  const issued = response.headers.get("x-cart-token");
  if (issued && issued !== store.getState().session.cartToken) {
    store.dispatch(setCartToken(issued));
  }
}

function openLogin() {
  if (typeof window === "undefined") return;
  const here = `${window.location.pathname}${window.location.search}`;
  if (here.startsWith("/login") || here.startsWith("/register")) return;
  window.location.assign(`/login?next=${encodeURIComponent(here)}`);
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  cart?: boolean;
  signal?: AbortSignal;
  retry?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers();
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  const session = store.getState().session;
  if (options.auth && session.accessToken) headers.set("Authorization", `Bearer ${session.accessToken}`);
  if (options.cart) headers.set("x-cart-token", ensureCartToken());

  const response = await fetch(`${apiBase()}${path}`, {
    method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (options.cart) captureCartToken(response);

  if (response.status === 401 && options.auth && session.accessToken && !options.retry && !path.startsWith("/auth/")) {
    const refreshed = await refreshTokens();
    if (refreshed) return request<T>(path, { ...options, retry: true });
    store.dispatch(clearSession());
    openLogin();
    throw new ApiError(401, "UNAUTHORIZED", "Please sign in again.", null);
  }

  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => null)) as T | ApiErrorBody | null;
  if (!response.ok) {
    const error = payload && typeof payload === "object" && "error" in payload ? payload.error : null;
    throw new ApiError(
      response.status,
      error?.code ?? "REQUEST_FAILED",
      error?.message ?? "Request failed",
      error?.details ?? null,
    );
  }
  return payload as T;
}

function queryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

export const api = {
  settings: () => request<Settings>("/settings"),
  banners: () => request<Banner[]>("/banners"),
  categories: () => request<Category[]>("/categories"),
  products: (query: ProductQuery) => request<Page<Product>>(`/products${queryString(query)}`),
  featured: () => request<Product[]>("/products/featured"),
  productBySlug: (slug: string) => request<Product>(`/products/slug/${encodeURIComponent(slug)}`),
  productRelated: (id: string) => request<Product[]>(`/products/${encodeURIComponent(id)}/related`),
  reviews: (productId: string, page = 1, perPage = 8) =>
    request<Page<Review>>(`/products/${encodeURIComponent(productId)}/reviews${queryString({ page, perPage })}`),
  createReview: (productId: string, body: { rating: number; title: string; body: string }) =>
    request(`/products/${encodeURIComponent(productId)}/reviews`, { method: "POST", body, auth: true }),

  cart: () => request<Cart>("/cart", { auth: true, cart: true }),
  addItem: (body: { productId: string; variantId?: string | null; quantity: number }) =>
    request<Cart>("/cart/items", { method: "POST", body, auth: true, cart: true }),
  setQuantity: (body: { productId: string; variantId?: string | null; quantity: number }) =>
    request<Cart>("/cart/items", { method: "PATCH", body, auth: true, cart: true }),
  removeItem: (productId: string, variantId?: string | null) =>
    request<Cart>(`/cart/items${queryString({ productId, variantId: variantId ?? undefined })}`, {
      method: "DELETE",
      auth: true,
      cart: true,
    }),
  clearCart: () => request<Cart>("/cart", { method: "DELETE", auth: true, cart: true }),

  breakdown: (body: {
    useCart?: boolean;
    shippingAddress: AddressInput;
    shippingMethod: ShippingMethod;
    couponCode?: string;
    email?: string;
  }) => request<Breakdown>("/orders/breakdown", { method: "POST", body, auth: true, cart: true }),

  checkoutGuest: (body: GuestCheckoutBody) =>
    request<CheckoutResult>("/orders/checkout/guest", { method: "POST", body, cart: true }),
  checkout: (body: AuthCheckoutBody) =>
    request<CheckoutResult>("/orders/checkout", { method: "POST", body, auth: true, cart: true }),
  verify: (body: { orderNumber: string; providerReference?: string }) =>
    request<VerifyResult>("/orders/checkout/verify", { method: "POST", body }),
  track: (body: { orderNumber: string; email?: string; phone?: string }) =>
    request<Order>("/orders/track", { method: "POST", body }),
  myOrders: (page = 1, perPage = 10) =>
    request<Page<Order>>(`/orders/me${queryString({ page, perPage })}`, { auth: true }),
  order: (orderNumber: string, email?: string) =>
    request<Order>(`/orders/${encodeURIComponent(orderNumber)}${queryString({ email })}`, { auth: true }),

  register: (body: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    marketingOptIn: boolean;
    cartToken?: string;
  }) => request<AuthResult>("/auth/register", { method: "POST", body }),
  login: (body: { email: string; password: string; cartToken?: string }) =>
    request<AuthResult>("/auth/login", { method: "POST", body }),
  logout: () => {
    const refreshToken = store.getState().session.refreshToken;
    return request<{ ok: true }>("/auth/logout", { method: "POST", body: refreshToken ? { refreshToken } : {} });
  },
  forgotPassword: (email: string) =>
    request<{ message: string }>("/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (body: { token: string; password: string }) =>
    request<{ ok: true }>("/auth/reset-password", { method: "POST", body }),

  me: () => request<Customer>("/me", { auth: true }),
  updateMe: (body: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    marketingOptIn?: boolean;
    defaultAddressId?: string | null;
  }) => request<Customer>("/me", { method: "PATCH", body, auth: true }),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request<{ ok: true }>("/me/password", { method: "POST", body, auth: true }),
  addresses: () => request<Address[]>("/me/addresses", { auth: true }),
  createAddress: (body: AddressInput) => request<Address>("/me/addresses", { method: "POST", body, auth: true }),
  updateAddress: (id: string, body: Partial<AddressInput>) =>
    request<Address>(`/me/addresses/${encodeURIComponent(id)}`, { method: "PATCH", body, auth: true }),
  deleteAddress: (id: string) =>
    request<{ ok: true }>(`/me/addresses/${encodeURIComponent(id)}`, { method: "DELETE", auth: true }),

  blogPosts: (query: { page?: number; perPage?: number; category?: string; tag?: string }) =>
    request<Page<BlogCard>>(`/blog/posts${queryString(query)}`),
  blogPost: (slug: string) => request<BlogPost>(`/blog/posts/${encodeURIComponent(slug)}`),
  blogRelated: (slug: string) => request<BlogCard[]>(`/blog/posts/${encodeURIComponent(slug)}/related`),
  blogComment: (slug: string, body: { name: string; email: string; body: string }) =>
    request(`/blog/posts/${encodeURIComponent(slug)}/comments`, { method: "POST", body, auth: true }),
  blogCategories: () => request<BlogCategory[]>("/blog/categories"),
};

type GuestCheckoutBody = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  shippingAddress: AddressInput;
  billingAddress?: AddressInput;
  billingSameAsShipping: boolean;
  shippingMethod: ShippingMethod;
  couponCode?: string;
  paymentProvider: PaymentProvider;
  deliveryNote?: string;
  substitutionPreference?: SubstitutionPreference;
  useCart: boolean;
};

type AuthCheckoutBody = {
  phone?: string;
  addressId?: string;
  shippingAddress?: AddressInput;
  billingAddress?: AddressInput;
  billingSameAsShipping: boolean;
  shippingMethod: ShippingMethod;
  couponCode?: string;
  paymentProvider: PaymentProvider;
  deliveryNote?: string;
  substitutionPreference?: SubstitutionPreference;
  useCart: boolean;
};
