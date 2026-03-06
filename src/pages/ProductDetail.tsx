import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { usePhpToUsd } from "@/hooks/use-forex";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ShoppingCart,
  ArrowLeft,
  Infinity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Minus,
  Plus,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  category: string;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const { convert } = usePhpToUsd();
  const { addItem } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        setProduct(null);
      } else {
        setProduct(data as Product);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  const isInfinite = product?.stock === -1;
  const inStock = product ? isInfinite || product.stock > 0 : false;
  const isLowStock = product ? !isInfinite && product.stock > 0 && product.stock <= 5 : false;

  const handleAddToCart = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!product) return;
    for (let i = 0; i < qty; i++) {
      addItem({ id: product.id, name: product.name, price: product.price, image_url: product.image_url });
    }
    toast.success(`${qty}x ${product.name} added to cart`);
  };

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-4xl mx-auto">
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="px-4 py-20 text-center max-w-4xl mx-auto">
        <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Product Not Found</h1>
        <p className="text-sm text-muted-foreground mb-6">This product may no longer be available.</p>
        <Button onClick={() => navigate("/products")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
        <Link to="/products" className="hover:text-foreground transition-colors">Products</Link>
        <span>/</span>
        {product.category && (
          <>
            <Link
              to={`/products?category=${encodeURIComponent(product.category)}`}
              className="hover:text-foreground transition-colors"
            >
              {product.category}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary border border-border">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              No Image
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.name.includes("PVA - Gmail") && (
              <Badge className="bg-primary text-primary-foreground text-xs shadow-md">🔥 Best Seller</Badge>
            )}
            {isLowStock && (
              <Badge className="bg-destructive text-destructive-foreground text-xs shadow-md flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Only {product.stock} left
              </Badge>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {product.category && (
            <Badge variant="secondary" className="w-fit mb-2 text-xs">
              {product.category}
            </Badge>
          )}

          <h1 className="text-2xl font-bold text-foreground mb-1">{product.name}</h1>

          {/* Price */}
          <div className="mb-4">
            <span className="text-2xl font-bold text-primary">₱{product.price.toFixed(2)}</span>
            <span className="ml-2 text-sm text-muted-foreground">(~${convert(product.price).toFixed(2)} USD)</span>
          </div>

          {/* Availability */}
          <div className="flex items-center gap-2 mb-5">
            {isInfinite ? (
              <span className="inline-flex items-center gap-1 text-sm text-success font-medium">
                <Infinity className="h-4 w-4" /> Always In Stock
              </span>
            ) : inStock ? (
              <span className="inline-flex items-center gap-1 text-sm text-success font-medium">
                <CheckCircle2 className="h-4 w-4" /> In Stock ({product.stock} available)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm text-destructive font-medium">
                <XCircle className="h-4 w-4" /> Out of Stock
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-foreground mb-1">Description</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Quantity + Add to Cart */}
          <div className="mt-auto flex items-center gap-3">
            <div className="flex items-center border border-border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-r-none"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={!inStock}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center text-sm font-medium text-foreground">{qty}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-l-none"
                onClick={() => setQty((q) => q + 1)}
                disabled={!inStock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {inStock ? "Add to Cart" : "Out of Stock"}
            </Button>
          </div>

          {/* Volume discount hint for PVA Gmail */}
          {product.name === "PVA - Gmail" && (
            <p className="mt-3 text-xs text-muted-foreground bg-secondary/50 rounded-md p-2 border border-border">
              💡 Volume discounts: 100+ units = 10% off · 200+ = 15% off · 300+ = 17% off
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
