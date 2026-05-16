import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

export interface Address {
  id: string;
  label: "home" | "work" | "other";
  label_name: string | null;
  full_name: string;
  line_1: string;
  line_2: string | null;
  city: string;
  state: string | null;
  postcode: string;
  country_code: string;
  phone_number: string | null;
  is_default: boolean;
  created_at: string;
}

export interface CreateAddressInput {
  label: "home" | "work" | "other";
  label_name?: string;
  full_name: string;
  line_1: string;
  line_2?: string;
  city: string;
  state?: string;
  postcode: string;
  country_code?: string;
  phone_number?: string;
  is_default?: boolean;
}

const KEY = ["addresses"] as const;

export function useAddresses(enabled = true) {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const res = await api.get<any>("/users/me/addresses");
      return res.data as Address[];
    },
    enabled,
    staleTime: 60_000,
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAddressInput) =>
      api.post<any>("/users/me/addresses", input).then((r: any) => r.data as Address),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<CreateAddressInput> & { id: string }) =>
      api.put<any>(`/users/me/addresses/${id}`, data).then((r: any) => r.data as Address),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/me/addresses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Human-readable label display */
export function addressDisplayLabel(addr: Address): string {
  if (addr.label === "home") return "Home";
  if (addr.label === "work") return "Work";
  return addr.label_name ?? "Other";
}

/** Label badge colour */
export const LABEL_COLOURS: Record<string, { bg: string; color: string }> = {
  home: { bg: "#dbeafe", color: "#1d4ed8" },
  work: { bg: "#dcfce7", color: "#15803d" },
  other: { bg: "#f3f4f6", color: "#374151" },
};
