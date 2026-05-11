import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

export interface OrderItem {
  product_id: string;
  title: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Order {
  id: string;
  status: string;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  currency: string;
  payment_reference: string | null;
  payment_status: string;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  items: OrderItem[];
}

export function useOrders(page = 1) {
  return useQuery({
    queryKey: ["orders", page],
    queryFn: async () => {
      const res = await api.get<any>("/orders", { params: { page } });
      return res as unknown as { data: Order[]; meta: { total: number; page: number; page_size: number; total_pages: number } };
    },
    staleTime: 30_000,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: async () => {
      const res = await api.get<any>(`/orders/${id}`);
      return res.data as Order;
    },
  });
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { address_id: string; notes?: string }) =>
      api.post<any>("/orders", vars).then((r: any) => r.data as Order),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
