import { api } from "./client";

export interface StoreConfig {
  id: string;
  version: number;
  store_name: string;
  store_tagline: string | null;
  logo_url: string | null;
  primary_colour: string;
  secondary_colour: string;
  accent_colour: string;
  background_colour: string;
  surface_colour: string;
  text_primary_colour: string;
  text_secondary_colour: string;
  border_colour: string;
  font_family: string;
  hero_image_url: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  homepage_sections: HomepageSection[];
  currency_code: string;
  currency_symbol: string;
  product_type_label: string;
  product_type_label_plural: string;
  linked_entity_label: string;
  linked_entity_label_plural: string;
  category_label: string;
  category_label_plural: string;
  support_email: string | null;
  shipping_policy: string | null;
  return_policy: string | null;
  tax_rate: number;
  flat_shipping_rate: number;
  free_shipping_threshold: number | null;
}

export interface HomepageSection {
  id: string;
  type: string;
  is_visible: boolean;
  display_order: number;
  title: string | null;
  subtitle: string | null;
  limit: number;
  category_id: string | null;
  entity_id: string | null;
}

export async function fetchStoreConfig(): Promise<StoreConfig> {
  const res = await api.get<any>("/config/store");
  return res.data;
}
