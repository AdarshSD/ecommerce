import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

export interface Product {
  id: string;
  title: string;
  isbn: string | null;
  price: number;
  original_price: number | null;
  rating: number | null;
  reviews_count: number;
  format: string | null;
  cover_image_url: string | null;
  cover_thumbnail_url: string | null;
  cover_full_url: string | null;
  is_in_stock: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  is_recommended: boolean;
  is_new_arrival: boolean;
  bestseller_rank: number | null;
  badge: string | null;
  tags: string[];
  published_at: string | null;
  year: number | null;
  pages: number | null;
  created_at: string;
  primary_author: string | null;
  primary_genre: string | null;
  description?: string | null;
  long_description?: string | null;
  page_count?: number | null;
  language?: string;
  publisher?: string | null;
  categories?: { id: string; name: string; slug: string }[];
  linked_entities?: { id: string; name: string; profile_image_url: string | null }[];
}

export interface ProductsResponse {
  data: Product[];
  meta: { total: number; page: number; page_size: number; total_pages: number };
}

export interface ProductFilters {
  page?: number;
  page_size?: number;
  sort?: string;
  category_id?: string;
  entity_id?: string;
  min_price?: number;
  max_price?: number;
  format?: string;
  in_stock?: boolean;
  is_featured?: boolean;
  is_recommended?: boolean;
  is_bestseller?: boolean;
  is_new_arrival?: boolean;
  search?: string;
}

export const productKeys = {
  all: () => ["products"] as const,
  list: (filters: ProductFilters) => ["products", "list", filters] as const,
  detail: (id: string) => ["products", "detail", id] as const,
  section: (sectionId: string) => ["products", "section", sectionId] as const,
};

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      const res = await api.get<any>("/products", { params: filters });
      return res as unknown as ProductsResponse;
    },
    staleTime: 60_000,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const res = await api.get<any>(`/products/${id}`);
      return res.data as Product;
    },
    staleTime: 60_000,
  });
}

export function useSectionProducts(sectionId: string, enabled = true) {
  return useQuery({
    queryKey: productKeys.section(sectionId),
    queryFn: async () => {
      const res = await api.get<any>(`/products/section/${sectionId}`);
      return res.data as Product[];
    },
    staleTime: 60_000,
    enabled,
  });
}
