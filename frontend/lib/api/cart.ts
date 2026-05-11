import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

export interface CartItem {
  product_id: string;
  title: string;
  cover_thumbnail_url: string | null;
  quantity: number;
  unit_price: number;
  price_at_add: number;
  line_total: number;
  is_in_stock: boolean;
  stock_count: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  item_count: number;
  requires_login_for_checkout: boolean;
}

export function useCart() {
  return useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const res = await api.get<any>("/cart");
      return res.data as Cart;
    },
    staleTime: 0,
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { product_id: string; quantity?: number }) =>
      api.post<any>("/cart/items", vars).then((r: any) => r.data as Cart),
    onSuccess: (data) => {
      qc.setQueryData(["cart"], data);
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { product_id: string; quantity: number }) =>
      api.put<any>(`/cart/items/${vars.product_id}`, { quantity: vars.quantity }).then((r: any) => r.data as Cart),
    onSuccess: (data) => {
      qc.setQueryData(["cart"], data);
    },
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (product_id: string) =>
      api.delete<any>(`/cart/items/${product_id}`).then((r: any) => r.data as Cart),
    onSuccess: (data) => {
      qc.setQueryData(["cart"], data);
    },
  });
}

export function useMergeCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (strategy: string) =>
      api.post<any>("/cart/merge", { strategy }).then((r: any) => r.data as Cart),
    onSuccess: (data) => {
      qc.setQueryData(["cart"], data);
    },
  });
}
