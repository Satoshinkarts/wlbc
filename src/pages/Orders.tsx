import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Package, Users, Info, Copy, CheckCheck, Eye, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product_id: string;
  products: { name: string } | null;
}

interface Order {
  id: string;
  status: string;
  total: number;
  shipping_address: string;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-warning/20 text-warning border-warning/30",
  confirmed: "bg-primary/20 text-primary border-primary/30",
  processing: "bg-primary/20 text-primary border-primary/30",
  shipped: "bg-success/20 text-success border-success/30",
  delivered: "bg-success/20 text-success border-success/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

const statusSteps = ["pending", "confirmed", "processing", "shipped", "delivered"];

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const isCancelled = currentStatus === "cancelled";
  const currentIdx = statusSteps.indexOf(currentStatus);

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-foreground mb-2">Status Timeline</p>
      {isCancelled ? (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <div className="h-3 w-3 rounded-full bg-destructive" />
          <span className="font-medium">Cancelled</span>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          {statusSteps.map((step, i) => {
            const isActive = i <= currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <div key={step} className="flex items-center gap-1 flex-1">
                <div className={`flex flex-col items-center gap-0.5 flex-1`}>
                  <div className={`h-2.5 w-2.5 rounded-full transition-colors ${
                    isCurrent ? "bg-primary ring-2 ring-primary/30" :
                    isActive ? "bg-primary" : "bg-muted"
                  }`} />
                  <span className={`text-[9px] capitalize ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {step}
                  </span>
                </div>
                {i < statusSteps.length - 1 && (
                  <div className={`h-0.5 flex-1 mt-[-12px] ${i < currentIdx ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [rPoints, setRPoints] = useState(0);
  const [copied, setCopied] = useState(false);

  // Order detail modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    const fetchData = async () => {
      const [ordersRes, profileRes, referralsRes] = await Promise.all([
        supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("profiles").select("referral_code").eq("user_id", user.id).maybeSingle(),
        supabase.from("referrals").select("id").eq("referrer_user_id", user.id).eq("credited", true),
      ]);
      setOrders((ordersRes.data as Order[]) || []);
      setReferralCode(profileRes.data?.referral_code || "");
      setRPoints(referralsRes.data?.length || 0);
      setLoading(false);
    };
    fetchData();
  }, [user, navigate]);

  const openOrder = async (order: Order) => {
    setSelectedOrder(order);
    setItemsLoading(true);
    const { data } = await supabase
      .from("order_items")
      .select("id, quantity, price, product_id, products(name)")
      .eq("order_id", order.id) as any;
    setOrderItems(data || []);
    setItemsLoading(false);
  };

  const printReceipt = () => {
    if (!selectedOrder) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const itemsHtml = orderItems.map(i =>
      `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${i.products?.name || "Item"}</td>
       <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
       <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">₱${Number(i.price).toFixed(2)}</td>
       <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">₱${(Number(i.price) * i.quantity).toFixed(2)}</td></tr>`
    ).join("");
    win.document.write(`<!DOCTYPE html><html><head><title>Receipt #${selectedOrder.id.slice(0, 8)}</title>
      <style>body{font-family:system-ui;max-width:400px;margin:40px auto;color:#333}
      table{width:100%;border-collapse:collapse}th{text-align:left;padding:6px 8px;border-bottom:2px solid #333;font-size:12px}
      td{font-size:12px}.total{font-size:16px;font-weight:bold;text-align:right;padding-top:12px}</style></head>
      <body><h2 style="text-align:center;margin-bottom:4px">WLBC Store</h2>
      <p style="text-align:center;color:#888;font-size:12px;margin-top:0">Receipt</p>
      <hr><p style="font-size:12px"><strong>Order:</strong> #${selectedOrder.id.slice(0, 8)}<br>
      <strong>Date:</strong> ${new Date(selectedOrder.created_at).toLocaleString()}<br>
      <strong>Telegram:</strong> ${selectedOrder.shipping_address || "—"}<br>
      <strong>Status:</strong> ${selectedOrder.status}</p>
      <table><thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${itemsHtml}</tbody></table>
      <p class="total">Total: ₱${Number(selectedOrder.total).toFixed(2)}</p>
      <hr><p style="text-align:center;font-size:10px;color:#999">Thank you for your purchase!</p>
      </body></html>`);
    win.document.close();
    win.print();
  };

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <h1 className="mb-4 text-2xl font-bold text-foreground">My Orders</h1>

      {/* Referral Card */}
      {referralCode && (
        <Card className="mb-4 bg-card border-border animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Referral Program</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-card border-border text-foreground max-w-[220px]">
                      <p className="text-xs">Share your code with friends. You earn 1 rPoint when they make their first purchase!</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                {rPoints} rPoints
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-secondary px-3 py-2 text-sm font-mono text-foreground tracking-wider">
                {referralCode}
              </code>
              <button onClick={copyCode} className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors">
                {copied ? <CheckCheck className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {rPoints > 0
                ? `You've successfully referred ${rPoints} customer${rPoints > 1 ? "s" : ""}!`
                : "Share your code and earn rPoints when friends purchase."}
            </p>
          </CardContent>
        </Card>
      )}

      {orders.length === 0 ? (
        <div className="py-20 text-center">
          <Package className="mx-auto mb-4 h-14 w-14 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="bg-card border-border animate-fade-in cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => openOrder(order)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
                <CardTitle className="text-xs font-mono text-muted-foreground">#{order.id.slice(0, 8)}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] ${statusColors[order.status] || "bg-secondary text-foreground"}`}>{order.status}</Badge>
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-[200px]">TG: {order.shipping_address}</p>
                  </div>
                  <p className="text-base font-bold text-primary">₱{Number(order.total).toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}>
        <DialogContent className="bg-card border-border max-w-sm mx-4 max-h-[90vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle className="text-foreground text-sm flex items-center justify-between">
              <span>Order #{selectedOrder?.id.slice(0, 8)}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={printReceipt} title="Print Receipt">
                <Printer className="h-3.5 w-3.5" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Status Timeline */}
              <StatusTimeline currentStatus={selectedOrder.status} />

              {/* Order Info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-bold text-primary text-sm">₱{Number(selectedOrder.total).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="text-foreground">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Telegram</p>
                  <p className="text-foreground font-medium">{selectedOrder.shipping_address || "—"}</p>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="text-xs">
                  <p className="text-muted-foreground">Notes</p>
                  <p className="text-foreground">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Items</p>
                {itemsLoading ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
                ) : (
                  <div className="space-y-1.5">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-xs bg-secondary rounded-lg px-3 py-2">
                        <div>
                          <p className="text-foreground font-medium">{item.products?.name || "Item"}</p>
                          <p className="text-muted-foreground">Qty: {item.quantity} × ₱{Number(item.price).toFixed(2)}</p>
                        </div>
                        <p className="text-foreground font-semibold">₱{(Number(item.price) * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
