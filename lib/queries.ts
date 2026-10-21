"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { api } from "./api";
import { clearSession, setCartToken, setSession } from "./session";
import type { AppDispatch, RootState } from "./store";
import type { ProductQuery } from "./types";

export function useSession() {
  return useSelector((state: RootState) => state.session);
}

export function useSettings() {
  return useQuery({ queryKey: ["settings"], queryFn: api.settings, staleTime: 60_000 });
}

export function useBanners() {
  return useQuery({ queryKey: ["banners"], queryFn: api.banners, staleTime: 60_000 });
}

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: api.categories, staleTime: 60_000 });
}

export function useFeatured() {
  return useQuery({ queryKey: ["products", "featured"], queryFn: api.featured });
}

export function useProducts(query: ProductQuery) {
  return useQuery({ queryKey: ["products", query], queryFn: () => api.products(query) });
}

export function useProduct(slug: string) {
  return useQuery({ queryKey: ["product", slug], queryFn: () => api.productBySlug(slug), enabled: Boolean(slug) });
}

export function useRelated(id: string | undefined) {
  return useQuery({
    queryKey: ["product", id, "related"],
    queryFn: () => api.productRelated(id as string),
    enabled: Boolean(id),
  });
}

export function useReviews(productId: string | undefined, page: number) {
  return useQuery({
    queryKey: ["reviews", productId, page],
    queryFn: () => api.reviews(productId as string, page),
    enabled: Boolean(productId),
  });
}

export function useCart() {
  const { hydrated, accessToken, cartToken } = useSession();
  return useQuery({
    queryKey: ["cart", accessToken ? "customer" : "guest", cartToken],
    queryFn: api.cart,
    enabled: hydrated,
  });
}

export function useMe() {
  const { hydrated, accessToken } = useSession();
  return useQuery({
    queryKey: ["me"],
    queryFn: api.me,
    enabled: hydrated && Boolean(accessToken),
  });
}

export function useAddresses() {
  const { hydrated, accessToken } = useSession();
  return useQuery({
    queryKey: ["addresses"],
    queryFn: api.addresses,
    enabled: hydrated && Boolean(accessToken),
  });
}

export function useMyOrders(page: number) {
  const { hydrated, accessToken } = useSession();
  return useQuery({
    queryKey: ["orders", "me", page],
    queryFn: () => api.myOrders(page),
    enabled: hydrated && Boolean(accessToken),
  });
}

function useCartMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useAddItem() {
  return useCartMutation(api.addItem);
}

export function useSetQuantity() {
  return useCartMutation(api.setQuantity);
}

export function useRemoveItem() {
  return useCartMutation(({ productId, variantId }: { productId: string; variantId?: string | null }) =>
    api.removeItem(productId, variantId),
  );
}

export function useClearCart() {
  return useCartMutation(async () => api.clearCart());
}

export function useAuthDispatch() {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  return {
    save(result: { accessToken: string; refreshToken: string }) {
      dispatch(setSession(result));
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    async logout() {
      try {
        await api.logout();
      } catch {
        /* The local session still ends if the network call fails. */
      }
      dispatch(clearSession());
      queryClient.removeQueries({ queryKey: ["me"] });
      queryClient.removeQueries({ queryKey: ["addresses"] });
      queryClient.removeQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    clear() {
      dispatch(clearSession());
    },
    setCart(token: string | null) {
      dispatch(setCartToken(token));
    },
  };
}
