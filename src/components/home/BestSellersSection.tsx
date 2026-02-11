import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import { TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
}

export default function BestSellersSection() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, description, price, image_url, stock")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(4);
      if (data) setProducts(data as Product[]);
    };
    fetch();
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="border-t border-border px-4 py-14">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Best Sellers</h2>
          </div>
          <Link to="/products">
            <Button variant="ghost" size="sm" className="text-primary text-xs">
              View All →
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {products.map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </div>
      </div>
    </section>
  );
}
