import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

export default function Cart() {
  const { items, removeItem, updateQuantity, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center px-4 py-20">
        <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold text-foreground">Your cart is empty</h2>
        <p className="mt-2 text-muted-foreground">Browse our products and add items to your cart.</p>
        <Link to="/products">
          <Button className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
            Browse Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-foreground">Shopping Cart</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <Card key={item.id} className="flex items-center gap-4 bg-card border-border p-4 animate-fade-in">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No Img</div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{item.name}</h3>
                <p className="text-sm text-primary">${item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 border-border" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-foreground">{item.quantity}</span>
                <Button variant="outline" size="icon" className="h-8 w-8 border-border" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <p className="w-20 text-right font-semibold text-foreground">${(item.price * item.quantity).toFixed(2)}</p>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>

        <Card className="h-fit bg-card border-border p-6">
          <h3 className="text-lg font-semibold text-foreground">Order Summary</h3>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-2">
              <div className="flex justify-between text-lg font-bold text-foreground">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <Link to="/checkout">
            <Button className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-sm">
              Proceed to Checkout
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
