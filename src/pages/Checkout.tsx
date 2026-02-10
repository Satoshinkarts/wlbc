import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }
    setProofFile(file || null);
  };

  const placeOrder = async () => {
    if (!address.trim()) {
      toast.error("Please enter a shipping address");
      return;
    }
    setShowConfirm(true);
  };

  const confirmOrder = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      // Create order
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({ user_id: user.id, total, shipping_address: address, notes, status: "pending" })
        .select()
        .single();
      if (orderErr) throw orderErr;

      // Create order items
      const orderItems = items.map((i) => ({
        order_id: order.id,
        product_id: i.id,
        quantity: i.quantity,
        price: i.price,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
      if (itemsErr) throw itemsErr;

      // Upload payment proof
      if (proofFile) {
        const ext = proofFile.name.split(".").pop();
        const path = `${user.id}/${order.id}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("payment-proofs")
          .upload(path, proofFile);
        if (uploadErr) throw uploadErr;
      }

      // Trigger email notification via edge function
      try {
        await supabase.functions.invoke("notify-order", {
          body: { orderId: order.id, total, items: items.length },
        });
      } catch {
        // Non-blocking
      }

      clearCart();
      toast.success("Order placed successfully!");
      navigate("/orders");
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-foreground">Checkout</h1>

      <div className="space-y-6">
        {/* Order Summary */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.name} × {item.quantity}</span>
                <span className="text-foreground">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2">
              <div className="flex justify-between font-bold text-foreground">
                <span>Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Shipping Address</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your full shipping address..."
              required
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </CardContent>
        </Card>

        {/* Payment Proof */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Payment Proof</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">Upload a screenshot or photo of your payment (optional, max 5MB)</p>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border bg-secondary p-4 transition-colors hover:border-primary/50"
            >
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {proofFile ? proofFile.name : "Click to upload payment proof"}
              </span>
            </div>
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Order Notes (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions..."
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </CardContent>
        </Card>

        <Button onClick={placeOrder} disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-sm py-6 text-lg">
          {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
          Place Order — ${total.toFixed(2)}
        </Button>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Confirm Your Order
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action is final. Your order of <strong className="text-foreground">${total.toFixed(2)}</strong> will be submitted for processing. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground hover:bg-secondary">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmOrder} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Yes, Place Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
