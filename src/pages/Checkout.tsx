import { useState, useRef, useEffect, useCallback } from "react";
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
import { Loader2, Upload, CheckCircle, AlertTriangle, Clock, QrCode, Wallet } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import qrPaymentImage from "@/assets/qr-payment.jpg";
import qrCryptoImage from "@/assets/qr-crypto-usdt.jpg";

const PAYMENT_TIMEOUT = 10 * 60;

type PaymentMethod = "qr_ph" | "crypto_usdt";

const PAYMENT_METHODS: { value: PaymentMethod; label: string; qr: string; details: string }[] = [
  { value: "qr_ph", label: "QR PH (GCash / Maya)", qr: qrPaymentImage, details: "Scan with your e-wallet or banking app" },
  { value: "crypto_usdt", label: "Crypto – USDT (BEP20)", qr: qrCryptoImage, details: "Send USDT to: 0xa6beff28a67f5b147f57d8a21f9953dce9602290 · BNB Smart Chain" },
];

function PaymentTimer({ onExpire }: { onExpire: () => void }) {
  const [seconds, setSeconds] = useState(PAYMENT_TIMEOUT);

  useEffect(() => {
    if (seconds <= 0) { onExpire(); return; }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, onExpire]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const pct = (seconds / PAYMENT_TIMEOUT) * 100;
  const isLow = seconds < 120;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className={`h-4 w-4 ${isLow ? "text-destructive animate-pulse" : "text-warning"}`} />
          <span className={`text-sm font-semibold ${isLow ? "text-destructive" : "text-warning"}`}>
            {mins}:{secs.toString().padStart(2, "0")}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">Payment window</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${isLow ? "bg-destructive" : "bg-warning"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Checkout() {
  const { items, total, subtotal, discount, discountPct, clearCart, itemCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("qr_ph");
  const [expired, setExpired] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB"); return; }
    setProofFile(file || null);
  };

  const handleExpire = useCallback(() => {
    setExpired(true);
    toast.error("Payment window expired. Please try again.");
  }, []);

  useEffect(() => {
    if (!user) navigate("/auth");
    else if (items.length === 0) navigate("/cart");
  }, [user, items, navigate]);

  if (!user || items.length === 0) return null;

  const placeOrder = () => {
    if (!address.trim()) { toast.error("Please enter your Telegram username"); return; }
    if (!proofFile) { toast.error("Payment proof is required. Please upload your proof of payment."); return; }
    if (expired) { toast.error("Payment window expired. Please refresh and try again."); return; }
    setShowConfirm(true);
  };

  const confirmOrder = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      // Server-side validated order creation
      const { data: orderId, error: orderErr } = await supabase.rpc("validate_and_create_order", {
        _items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
        _shipping_address: address,
        _notes: notes,
      });
      if (orderErr) throw orderErr;

      let proofPath = "";
      if (proofFile) {
        const ext = proofFile.name.split(".").pop();
        proofPath = `${user.id}/${orderId}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("payment-proofs").upload(proofPath, proofFile);
        if (uploadErr) throw uploadErr;
      }

      try {
        await supabase.functions.invoke("notify-order", {
          body: {
            orderId,
            total,
            items: items.length,
            telegram: address,
            proofPath,
            itemDetails: items.map((i) => ({ name: i.name, quantity: i.quantity })),
          },
        });
      } catch { /* non-blocking */ }

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
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-foreground">Checkout</h1>

      <div className="space-y-4">
        {/* Timer */}
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-3">
            <PaymentTimer onExpire={handleExpire} />
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 px-4 pb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground truncate mr-2">{item.name} × {item.quantity}</span>
                <span className="text-foreground shrink-0">₱{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal ({itemCount} units)</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Discount ({(discountPct * 100).toFixed(0)}% off)</span>
                  <span>-₱{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-foreground">
                <span>Total</span>
                <span className="text-primary">₱{total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger className="bg-secondary border-border text-foreground text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(() => {
              const method = PAYMENT_METHODS.find((m) => m.value === paymentMethod)!;
              return (
                <div className="flex flex-col items-center">
                  <div className="w-48 h-48 rounded-xl overflow-hidden bg-white p-2 mb-3">
                    <img src={method.qr} alt={`${method.label} QR`} className="w-full h-full object-contain" />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">{method.details}</p>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Payment Proof - REQUIRED */}
        <Card className={`bg-card border-border ${!proofFile ? "border-warning/50" : "border-success/50"}`}>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              Upload Payment Proof
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">Required</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div
              onClick={() => fileRef.current?.click()}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed p-4 transition-colors ${
                proofFile ? "border-success/50 bg-success/5" : "border-border bg-secondary hover:border-primary/50"
              }`}
            >
              <Upload className={`h-5 w-5 ${proofFile ? "text-success" : "text-muted-foreground"}`} />
              <span className={`text-sm ${proofFile ? "text-success" : "text-muted-foreground"}`}>
                {proofFile ? proofFile.name : "Tap to upload payment screenshot"}
              </span>
            </div>
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
            <p className="mt-2 text-[11px] text-muted-foreground">Max 5MB · JPG, PNG, PDF</p>
          </CardContent>
        </Card>

        {/* Telegram Username */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground">Telegram Username</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="@yourusername"
              required
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground text-sm"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">We'll deliver your digital goods via Telegram. For support, contact <a href="https://t.me/nitmirr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@nitmirr</a></p>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-foreground">Notes (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions..."
              rows={2}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground text-sm"
            />
          </CardContent>
        </Card>

        <Button
          onClick={placeOrder}
          disabled={loading || expired}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-sm py-5 text-base"
        >
          {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
          {expired ? "Payment Expired" : `Place Order — ₱${total.toFixed(2)}`}
        </Button>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-card border-border mx-4 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground text-base">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Confirm Your Order
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              Your order of <strong className="text-foreground">₱{total.toFixed(2)}</strong> will be submitted for processing. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
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
