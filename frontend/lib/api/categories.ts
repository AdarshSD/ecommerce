import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

export interface Category {
  id: string;
  name: string;
  slug: string;
  product_count: number;
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get<any>("/categories");
      return res.data as Category[];
    },
    staleTime: 300_000,
  });
}
