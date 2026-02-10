import { ShoppingCart, Infinity } from "lucide-react";
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

  const isInfinite = stock === -1;
  const inStock = isInfinite || stock > 0;

  const handleAdd = () => {
    if (!user) { navigate("/auth"); return; }
    addItem({ id, name, price, image_url });
    toast.success(`${name} added to cart`);
  };

  return (
    <Card className="group overflow-hidden bg-card border-border hover:border-primary/30 transition-all duration-300 animate-fade-in">
      <div className="aspect-square overflow-hidden bg-secondary">
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
            {isInfinite && (
              <span className="ml-1.5 inline-flex items-center text-[10px] text-success">
                <Infinity className="h-3 w-3 mr-0.5" />In Stock
              </span>
            )}
          </div>
          <Button size="sm" onClick={handleAdd} disabled={!inStock} className="bg-primary text-primary-foreground hover:bg-primary/90 h-7 px-2 text-xs">
            <ShoppingCart className="mr-1 h-3 w-3" />
            {inStock ? "Add" : "Out"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
