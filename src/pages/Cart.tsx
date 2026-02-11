import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Minus, Plus, Trash2, ShoppingBag, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { PRICING_TIERS } from "@/lib/pricing";
import { usePhpToUsd } from "@/hooks/use-forex";
import { RefreshCw } from "lucide-react";

export default function Cart() {
  const { items, removeItem, updateQuantity, total, subtotal, discount, discountPct, itemCount } = useCart();
  const { convert, rate, apiUpdated } = usePhpToUsd();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20">
        <ShoppingBag className="mb-4 h-14 w-14 text-muted-foreground" />
        <h2 className="text-xl font-bold text-foreground">Your cart is empty</h2>
        <p className="mt-2 text-sm text-muted-foreground">Browse our products and add items.</p>
        <Link to="/products">
          <Button className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-foreground">Cart</h1>
      {rate && (
        <div className="mb-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <RefreshCw className="h-3 w-3" />
          <span>
            1 PHP = ${rate.toFixed(4)} USD
            {apiUpdated && (
              <> · Updated {new Date(apiUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</>
            )}
          </span>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id} className="flex items-center gap-3 bg-card border-border p-3 animate-fade-in">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">No Img</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{item.name}</h3>
              <p className="text-xs text-primary">₱{item.price.toFixed(2)}/unit <span className="text-muted-foreground">(~${convert(item.price).toFixed(2)})</span></p>
              <div className="flex items-center gap-2 mt-1">
                <Button variant="outline" size="icon" className="h-6 w-6 border-border" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val > 0) updateQuantity(item.id, val);
                  }}
                  className="w-14 text-center text-sm text-foreground bg-secondary border border-border rounded-md h-6 px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <Button variant="outline" size="icon" className="h-6 w-6 border-border" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">₱{(item.price * item.quantity).toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground">(~${convert(item.price * item.quantity).toFixed(2)})</p>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive mt-1" onClick={() => removeItem(item.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Volume discount info */}
      <Card className="mt-4 bg-card border-border p-4">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Volume Pricing</span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {PRICING_TIERS.slice().reverse().map((tier) => (
            <span
              key={tier.minQty}
              className={`text-[11px] px-2 py-1 rounded ${
                itemCount >= tier.minQty && discountPct === tier.discount
                  ? "bg-primary/20 text-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {tier.label}
            </span>
          ))}
        </div>
      </Card>

      <Card className="mt-3 bg-card border-border p-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal ({itemCount} units)</span>
            <span>₱{subtotal.toFixed(2)} (~${convert(subtotal).toFixed(2)})</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-success">
              <span>Discount ({(discountPct * 100).toFixed(0)}% off)</span>
              <span>-₱{discount.toFixed(2)} (~-${convert(discount).toFixed(2)})</span>
            </div>
          )}
          <div className="border-t border-border pt-2">
            <div className="flex justify-between text-lg font-bold text-foreground">
              <span>Total</span>
              <span className="text-primary">₱{total.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">(~${convert(total).toFixed(2)})</span></span>
            </div>
          </div>
        </div>
        <Link to="/checkout">
          <Button className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-sm py-5">
            Proceed to Checkout
          </Button>
        </Link>
      </Card>
    </div>
  );
}
