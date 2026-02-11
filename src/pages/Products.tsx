import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Search, Loader2, RefreshCw } from "lucide-react";
import { usePhpToUsd } from "@/hooks/use-forex";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  category: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { rate, apiUpdated, loading: forexLoading } = usePhpToUsd();

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setProducts((data as Product[]) || []);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const filtered = products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aFeatured = a.name.includes("PVA - Gmail") ? -1 : 0;
      const bFeatured = b.name.includes("PVA - Gmail") ? -1 : 0;
      return aFeatured - bFeatured;
    });

  return (
    <div className="px-4 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-foreground">Products</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Browse our collection</p>
        {rate && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <RefreshCw className="h-3 w-3" />
            <span>
              1 PHP = ${rate.toFixed(4)} USD
              {apiUpdated && (
                <> · Updated {new Date(apiUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</>
              )}
            </span>
          </div>
        )}
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground text-sm">
          {products.length === 0 ? "No products available yet." : "No products match your search."}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      )}
    </div>
  );
}
