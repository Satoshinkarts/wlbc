import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, RefreshCw, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import { usePhpToUsd } from "@/hooks/use-forex";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  category: string;
}

const ITEMS_PER_PAGE = 12;

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { rate, apiUpdated } = usePhpToUsd();

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [maxPrice, setMaxPrice] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      const prods = (data as Product[]) || [];
      setProducts(prods);
      const mp = Math.ceil(Math.max(...prods.map(p => p.price), 100));
      setMaxPrice(mp);
      setPriceRange([0, mp]);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
    return cats.sort();
  }, [products]);

  const filtered = useMemo(() => {
    return products
      .filter((p) => {
        const q = debouncedSearch.toLowerCase();
        if (q && !p.name.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
        if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
        if (inStockOnly && p.stock === 0) return false;
        if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
        return true;
      })
      .sort((a, b) => {
        const aFeatured = a.name.includes("PVA - Gmail") ? -1 : 0;
        const bFeatured = b.name.includes("PVA - Gmail") ? -1 : 0;
        return aFeatured - bFeatured;
      });
  }, [products, debouncedSearch, selectedCategory, inStockOnly, priceRange]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, selectedCategory, inStockOnly, priceRange]);

  const hasActiveFilters = selectedCategory !== "all" || inStockOnly || priceRange[0] > 0 || (maxPrice > 0 && priceRange[1] < maxPrice);

  const clearFilters = () => {
    setSelectedCategory("all");
    setInStockOnly(false);
    setPriceRange([0, maxPrice]);
    setSearch("");
  };

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto">
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

      {/* Search + Filter toggle */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          size="icon"
          className={showFilters ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground"}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-4 p-4 bg-card border-border animate-fade-in space-y-4">
          {/* Category chips */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">Category</p>
            <div className="flex flex-wrap gap-1.5">
              <Badge
                className={`cursor-pointer text-xs ${selectedCategory === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                onClick={() => setSelectedCategory("all")}
              >
                All
              </Badge>
              {categories.map(cat => (
                <Badge
                  key={cat}
                  className={`cursor-pointer text-xs ${selectedCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          {/* Price range */}
          {maxPrice > 0 && (
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">
                Price Range: ₱{priceRange[0]} – ₱{priceRange[1]}
              </p>
              <Slider
                min={0}
                max={maxPrice}
                step={1}
                value={priceRange}
                onValueChange={(v) => setPriceRange(v as [number, number])}
                className="w-full"
              />
            </div>
          )}

          {/* In stock toggle */}
          <div className="flex items-center gap-2">
            <Switch checked={inStockOnly} onCheckedChange={setInStockOnly} />
            <Label className="text-xs text-foreground">In stock only</Label>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={clearFilters}>
              <X className="mr-1 h-3 w-3" /> Clear filters
            </Button>
          )}
        </Card>
      )}

      {/* Results info */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">{filtered.length} product{filtered.length !== 1 ? "s" : ""}</p>
        {hasActiveFilters && (
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">Filtered</Badge>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : paginated.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground text-sm">
          {products.length === 0 ? "No products available yet." : "No products match your filters."}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {paginated.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="border-border text-muted-foreground h-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="border-border text-muted-foreground h-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
