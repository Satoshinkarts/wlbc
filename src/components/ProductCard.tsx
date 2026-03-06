import { ShoppingCart, Infinity, AlertTriangle } from "lucide-react";
import { usePhpToUsd } from "@/hooks/use-forex";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
}

export default function ProductCard({ id, name, description, price, image_url, stock }: ProductCardProps) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { convert } = usePhpToUsd();

  const isInfinite = stock === -1;
  const inStock = isInfinite || stock > 0;
  const isLowStock = !isInfinite && stock > 0 && stock <= 5;

  const handleAdd = () => {
    if (!user) { navigate("/auth"); return; }
    addItem({ id, name, price, image_url });
    toast.success(`${name} added to cart`);
  };

  const isFeatured = name.includes("PVA - Gmail");

  return (
    <Card
      className={`group overflow-hidden bg-card border-border transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_25px_hsl(var(--primary)/0.1)] hover:-translate-y-0.5 animate-fade-in cursor-pointer ${isFeatured ? "ring-2 ring-primary/50 border-primary/40 shadow-[0_0_15px_hsl(var(--primary)/0.2)]" : ""}`}
      onClick={() => navigate(`/products/${id}`)}
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {/* Badges */}
        <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1">
          {isFeatured && (
            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
              🔥 Best Seller
            </span>
          )}
          {isLowStock && (
            <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md flex items-center gap-0.5">
              <AlertTriangle className="h-2.5 w-2.5" /> Only {stock} left
            </span>
          )}
          {inStock && !isLowStock && !isInfinite && (
            <span className="bg-success/90 text-success-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
              ✓ In Stock
            </span>
          )}
        </div>

        {image_url ? (
          <img src={image_url} alt={name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No Image</div>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="text-sm font-semibold text-foreground truncate">{name}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{description}</p>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-primary">₱{price.toFixed(2)}</span>
            <span className="block text-[10px] text-muted-foreground">(~${convert(price).toFixed(2)})</span>
            {isInfinite && (
              <span className="inline-flex items-center text-[10px] text-success">
                <Infinity className="h-3 w-3 mr-0.5" />In Stock
              </span>
            )}
          </div>
          <Button size="sm" onClick={(e) => { e.stopPropagation(); handleAdd(); }} disabled={!inStock} className="bg-primary text-primary-foreground hover:bg-primary/90 h-7 px-2 text-xs">
            <ShoppingCart className="mr-1 h-3 w-3" />
            {inStock ? "Add" : "Out"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
