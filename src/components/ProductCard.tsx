import { ShoppingCart } from "lucide-react";
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

  const handleAdd = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    addItem({ id, name, price, image_url });
    toast.success(`${name} added to cart`);
  };

  return (
    <Card className="group overflow-hidden bg-card border-border hover:border-primary/30 transition-all duration-300 animate-fade-in">
      <div className="aspect-square overflow-hidden bg-secondary">
        {image_url ? (
          <img src={image_url} alt={name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground truncate">{name}</h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-primary">${price.toFixed(2)}</span>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={stock <= 0}
            className="bg-primary text-primary-foreground hover:bg-primary/90 glow-sm"
          >
            <ShoppingCart className="mr-1 h-4 w-4" />
            {stock <= 0 ? "Out of Stock" : "Add"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
