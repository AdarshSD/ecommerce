"use client";

import { Product } from "@/lib/api/products";
import ProductCard from "./ProductCard";

interface Props {
  products: Product[];
  currencySymbol?: string;
}

export default function ProductGrid({ products, currencySymbol = "$" }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} currencySymbol={currencySymbol} />
      ))}
    </div>
  );
}
