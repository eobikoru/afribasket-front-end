export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://afribasket-backend-1.onrender.com/api/v1";

export type Page<T> = {
  items: T[];
  page: number;
  perPage: number;
  total: number;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details: unknown;
  };
};

export type SocialLinks = {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
};

export type Settings = {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  freeShippingThresholdCents: number;
  coldPackSurchargeCents: number;
  announcementBar: string | null;
  socialLinks: SocialLinks;
  defaultMetaTitle: string | null;
  defaultMetaDescription: string | null;
  currency: "USD";
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  imagePublicId: string | null;
  linkUrl: string | null;
  sortOrder: number;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  level: number;
  sortOrder: number;
  imageUrl: string | null;
  imagePublicId: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  children: Category[];
};

export type Tag = { id: string; name: string; slug: string };

export type ProductImage = {
  id: string;
  productId: string;
  url: string;
  publicId: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
};

export type Variant = {
  id: string;
  productId: string;
  sku: string;
  barcode: string | null;
  options: Record<string, string>;
  title: string;
  priceCents: number | null;
  shippingWeightOz: number | null;
  netWeightOz: number | null;
  quantityAvailable: number;
  quantityReserved: number;
  quantityIncoming?: number;
  lowStockThreshold: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  warehouseLocation?: string | null;
  isActive: boolean;
  imageUrl: string | null;
  onHand: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  needsReorder: boolean;
};

export type Inventory = {
  id: string;
  quantityAvailable: number;
  quantityReserved: number;
  lowStockThreshold: number;
  onHand: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  needsReorder: boolean;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  barcode: string | null;
  shortDescription: string | null;
  description: string | null;
  brand: string | null;
  countryOfOrigin: string;
  region: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  status: string;
  isActive: boolean;
  isFeatured: boolean;
  storageType: string;
  perishable: boolean;
  shelfLifeDays: number | null;
  netWeightOz: number | null;
  shippingWeightOz: number;
  unitLabel: string;
  ingredients: string | null;
  allergenFlags: string[];
  dietaryTags: string[];
  attributes: Record<string, string | number | boolean> | null;
  metaTitle: string | null;
  metaDescription: string | null;
  category: { id: string; name: string; slug: string };
  tags: Tag[];
  images: ProductImage[];
  variants: Variant[];
  inventory: Inventory | null;
  ratingAverage: number | null;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductQuery = {
  page?: number;
  perPage?: number;
  q?: string;
  category?: string;
  tag?: string;
  country?: string;
  region?: string;
  storageType?: string;
  dietary?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: "true" | "false";
  featured?: "true" | "false";
  sort?: "newest" | "price_asc" | "price_desc" | "name_asc" | "name_desc";
};

export type Review = {
  id: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  customer: { firstName: string };
};

export type Customer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  marketingOptIn: boolean;
  isActive: boolean;
  defaultAddressId: string | null;
  createdAt: string;
};

export type Address = {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string | null;
  label: string | null;
};

export type AddressInput = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: "US";
  phone?: string;
  label?: string;
};

export type CartLine = {
  productId: string;
  variantId: string | null;
  name: string;
  sku: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  imageUrl: string | null;
  storageType: "ambient" | "refrigerated" | "frozen" | string;
  shippingWeightOz: number;
  requiresLot: boolean;
  available: number;
  purchasable: boolean;
  unavailableReason: string | null;
  taxCode: string;
};

export type Cart = {
  items: CartLine[];
  subtotalCents: number;
  currency: "USD";
};

export type ShippingMethod = "standard" | "expedited" | "overnight";
export type PaymentProvider = "stripe" | "paypal";
export type SubstitutionPreference = "contact_me" | "refund_item" | "best_substitute";

export type Breakdown = {
  lines: CartLine[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  currency: "USD";
  shippingExplanation: string;
  taxExplanation: string;
  allowedShippingMethods: ShippingMethod[];
};

export type PaymentSession = {
  provider: PaymentProvider;
  reference: string;
  approvalUrl: string | null;
  clientPayload: Record<string, unknown>;
};

export type CheckoutResult = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalCents: number;
  currency: "USD";
  reservationExpiresAt: string | null;
  payment: PaymentSession;
};

export type VerifyResult = {
  orderNumber: string;
  status?: string;
  paymentStatus?: string;
  result?: string;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string | null;
  variantId: string | null;
  name: string;
  sku: string;
  unitPriceCents: number;
  quantity: number;
  imageUrl: string | null;
  storageType: string;
  lineTotalCents: number;
  returnedQuantity?: number;
};

export type OrderNote = {
  id: string;
  orderId: string;
  body: string;
  isInternal: boolean;
  adminId: string | null;
  createdAt: string;
};

export type OrderAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
};

export type Order = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentProvider: string;
  email: string;
  customerName: string;
  phone: string | null;
  currency: string;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  refundedCents: number;
  couponCode: string | null;
  shippingMethod: string;
  shippingAddress: OrderAddress | null;
  billingAddress: OrderAddress | null;
  shippingExplanation: string;
  taxExplanation: string;
  taxState: string | null;
  taxRateBps: number | null;
  deliveryNote: string | null;
  substitutionPreference: string | null;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  items: OrderItem[];
  notes: OrderNote[];
};

export type AuthResult = {
  customer: Customer;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type BlogCard = {
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  status: string;
  publishedAt: string | null;
  viewCount: number;
  author: { id: string; name: string };
  category: { id?: string; name: string; slug: string; description?: string | null } | null;
  tags: { id?: string; name: string; slug: string }[];
};

export type BlogFaq = { question: string; answer: string; sortOrder: number };

export type BlogComment = {
  id: string;
  name: string;
  body: string;
  createdAt: string;
};

export type BlogPost = BlogCard & {
  bodyHtml: string;
  metaTitle: string | null;
  metaDescription: string | null;
  faqs: BlogFaq[];
  comments: BlogComment[];
  related: BlogCard[];
};

export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};
