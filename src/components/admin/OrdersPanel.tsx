import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Trash2, Loader2, Upload, TrendingUp, CalendarDays, Filter,
  DollarSign, BarChart3, Users, Eye, KeyRound, FileUp, X, Image,
  Minus,
} from "lucide-react";

interface Order {
  id: string;
  user_id: string;
  status: string;
  total: number;
  shipping_address: string;
  created_at: string;
  notes: string | null;
  remit: number;
  payment_proof_path: string;
  delivery_file_path: string;
}

interface Profile {
  user_id: string;
  full_name: string;
  email: string;
}

interface OrdersPanelProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  profiles: Profile[];
}

export default function OrdersPanel({ orders, setOrders, profiles }: OrdersPanelProps) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterUser, setFilterUser] = useState("all");

  // Order detail modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  // Customer detail modal
  const [customerModal, setCustomerModal] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resettingPw, setResettingPw] = useState(false);

  // Delivery upload
  const deliveryFileRef = useRef<HTMLInputElement>(null);
  const [deliveryFile, setDeliveryFile] = useState<File | null>(null);
  const [delivering, setDelivering] = useState(false);

  // Remit editing
  const [editingRemit, setEditingRemit] = useState<string | null>(null);
  const [remitValue, setRemitValue] = useState("");

  const getProfileName = (userId: string) => {
    const p = profiles.find((pr) => pr.user_id === userId);
    return p ? (p.full_name || p.email) : userId.slice(0, 8);
  };

  const getProfile = (userId: string) => profiles.find((pr) => pr.user_id === userId);

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (filterUser !== "all" && o.user_id !== filterUser) return false;
    if (dateFrom && new Date(o.created_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(o.created_at) > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const totalSales = filteredOrders.reduce((sum, o) => sum + (o.status !== "cancelled" ? Number(o.total) : 0), 0);
  const totalRemit = filteredOrders.reduce((sum, o) => sum + (o.status !== "cancelled" ? Number(o.remit || 0) : 0), 0);
  const totalOrders = filteredOrders.length;
  const pendingOrders = filteredOrders.filter((o) => o.status === "pending").length;
  const uniqueUsers = new Set(filteredOrders.map((o) => o.user_id)).size;
  const profit = totalSales - totalRemit;

  const orderUsers = Array.from(new Set(orders.map((o) => o.user_id)));

  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    toast.success("Order updated");
  };

  const deleteOrder = async (id: string) => {
    const { error: itemsErr } = await supabase.from("order_items").delete().eq("order_id", id);
    if (itemsErr) { toast.error(itemsErr.message); return; }
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setOrders((prev) => prev.filter((o) => o.id !== id));
    if (selectedOrder?.id === id) setSelectedOrder(null);
    toast.success("Order deleted");
  };

  const viewReceipt = async (order: Order) => {
    setSelectedOrder(order);
    setReceiptUrl(null);
    if (order.payment_proof_path) {
      setReceiptLoading(true);
      try {
        const { data } = await supabase.functions.invoke("admin-actions", {
          body: { action: "get_receipt_url", proofPath: order.payment_proof_path },
        });
        if (data?.url) setReceiptUrl(data.url);
        else toast.error("Receipt not found");
      } catch { toast.error("Failed to load receipt"); }
      setReceiptLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!customerModal || !newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setResettingPw(true);
    try {
      const { data } = await supabase.functions.invoke("admin-actions", {
        body: { action: "reset_password", userId: customerModal.user_id, newPassword },
      });
      if (data?.success) {
        toast.success("Password reset successfully");
        setNewPassword("");
      } else {
        toast.error(data?.error || "Failed to reset password");
      }
    } catch { toast.error("Failed to reset password"); }
    setResettingPw(false);
  };

  const handleDelivery = async (order: Order) => {
    if (!deliveryFile) { toast.error("Please select a file to upload"); return; }
    setDelivering(true);
    try {
      const ext = deliveryFile.name.split(".").pop();
      const filePath = `${order.user_id}/${order.id}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("delivery-files").upload(filePath, deliveryFile, { upsert: true });
      if (uploadErr) throw uploadErr;

      // Update order status and delivery file path
      const { error: updateErr } = await supabase.from("orders").update({
        status: "delivered",
        delivery_file_path: filePath,
      }).eq("id", order.id);
      if (updateErr) throw updateErr;

      // Get item details for the notification
      const { data: itemsData } = await supabase
        .from("order_items")
        .select("quantity, product_id, products(name)")
        .eq("order_id", order.id) as any;

      const itemList = itemsData?.map((i: any) => `${i.products?.name || "Item"} x${i.quantity}`).join(", ") || "Items";

      // Notify via Telegram
      await supabase.functions.invoke("admin-actions", {
        body: {
          action: "notify_delivery",
          orderId: order.id,
          telegram: order.shipping_address,
          orderTitle: itemList,
          deliveryFileUrl: filePath,
        },
      });

      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: "delivered", delivery_file_path: filePath } : o));
      setSelectedOrder((prev) => prev ? { ...prev, status: "delivered", delivery_file_path: filePath } : null);
      setDeliveryFile(null);
      toast.success("Order marked as delivered & notification sent!");
    } catch (err: any) {
      toast.error(err.message || "Delivery failed");
    }
    setDelivering(false);
  };

  const saveRemit = async (orderId: string) => {
    const val = parseFloat(remitValue) || 0;
    const { error } = await supabase.from("orders").update({ remit: val }).eq("id", orderId);
    if (error) { toast.error(error.message); return; }
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, remit: val } : o));
    setSelectedOrder((prev) => prev ? { ...prev, remit: val } : null);
    setEditingRemit(null);
    toast.success("Remit saved");
  };

  return (
    <div className="space-y-4">
      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="bg-card border-border p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="h-3.5 w-3.5 text-primary" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sales</p>
          </div>
          <p className="text-base font-bold text-foreground">₱{totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </Card>
        <Card className="bg-card border-border p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Minus className="h-3.5 w-3.5 text-destructive" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Remit</p>
          </div>
          <p className="text-base font-bold text-foreground">₱{totalRemit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </Card>
        <Card className="bg-card border-border p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Profit</p>
          </div>
          <p className={`text-base font-bold ${profit >= 0 ? "text-primary" : "text-destructive"}`}>₱{profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </Card>
        <Card className="bg-card border-border p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Orders</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-base font-bold text-foreground">{totalOrders}</p>
            <span className="text-[10px] text-muted-foreground">{pendingOrders} pending · {uniqueUsers} users</span>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border p-3">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold text-foreground">Filters</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-secondary border-border text-foreground text-xs h-8 w-32" />
            <span className="text-xs text-muted-foreground">–</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-secondary border-border text-foreground text-xs h-8 w-32" />
          </div>
          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="w-40 bg-secondary border-border text-foreground text-xs h-8">
              <SelectValue placeholder="All users" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all" className="text-foreground text-xs">All users</SelectItem>
              {orderUsers.map((uid) => (
                <SelectItem key={uid} value={uid} className="text-foreground text-xs">{getProfileName(uid)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(dateFrom || dateTo || filterUser !== "all") && (
            <Button variant="ghost" size="sm" className="text-xs h-8 text-muted-foreground" onClick={() => { setDateFrom(""); setDateTo(""); setFilterUser("all"); }}>
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Order list */}
      <div className="space-y-2">
        {filteredOrders.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No orders match filters.</p>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="bg-card border-border p-3 animate-fade-in">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1" onClick={() => viewReceipt(order)} role="button" tabIndex={0}>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8)}</p>
                    {order.payment_proof_path && <Image className="h-3 w-3 text-primary" />}
                  </div>
                  <p
                    className="text-[11px] text-primary/80 hover:underline cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      const prof = getProfile(order.user_id);
                      if (prof) setCustomerModal(prof);
                    }}
                  >
                    {getProfileName(order.user_id)}
                  </p>
                  <p className="text-sm font-bold text-primary">₱{Number(order.total).toFixed(2)}</p>
                  {Number(order.remit) > 0 && (
                    <p className="text-[10px] text-muted-foreground">Remit: ₱{Number(order.remit).toFixed(2)}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[180px]">TG: {order.shipping_address}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Select value={order.status} onValueChange={(v) => updateOrderStatus(order.id, v)}>
                    <SelectTrigger className="w-[100px] bg-secondary border-border text-foreground text-[11px] h-7">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((s) => (
                        <SelectItem key={s} value={s} className="text-foreground text-xs">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => viewReceipt(order)}>
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteOrder(order.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* ─── Order Detail / Receipt Modal ─── */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => { if (!open) { setSelectedOrder(null); setReceiptUrl(null); setDeliveryFile(null); } }}>
        <DialogContent className="bg-card border-border max-w-sm mx-4 max-h-[90vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle className="text-foreground text-sm flex items-center justify-between">
              Order #{selectedOrder?.id.slice(0, 8)}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-3">
              {/* Order info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p
                    className="text-primary cursor-pointer hover:underline font-medium"
                    onClick={() => {
                      const prof = getProfile(selectedOrder.user_id);
                      if (prof) setCustomerModal(prof);
                    }}
                  >
                    {getProfileName(selectedOrder.user_id)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-semibold text-foreground capitalize">{selectedOrder.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-bold text-primary">₱{Number(selectedOrder.total).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Remit (Cost)</p>
                  {editingRemit === selectedOrder.id ? (
                    <div className="flex gap-1">
                      <Input type="number" value={remitValue} onChange={(e) => setRemitValue(e.target.value)} className="bg-secondary border-border text-foreground text-xs h-6 w-20 px-1" />
                      <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => saveRemit(selectedOrder.id)}>Save</Button>
                    </div>
                  ) : (
                    <p
                      className="font-medium text-foreground cursor-pointer hover:text-primary"
                      onClick={() => { setEditingRemit(selectedOrder.id); setRemitValue(String(selectedOrder.remit || 0)); }}
                    >
                      ₱{Number(selectedOrder.remit || 0).toFixed(2)} ✏️
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Telegram</p>
                  <p className="text-foreground">{selectedOrder.shipping_address || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="text-foreground">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              {selectedOrder.notes && (
                <div className="text-xs">
                  <p className="text-muted-foreground">Notes</p>
                  <p className="text-foreground">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Receipt */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Image className="h-3.5 w-3.5 text-primary" /> Payment Receipt
                </p>
                {receiptLoading ? (
                  <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                ) : receiptUrl ? (
                  <img src={receiptUrl} alt="Payment receipt" className="w-full rounded-lg border border-border" />
                ) : (
                  <p className="text-xs text-muted-foreground py-4 text-center">No receipt uploaded</p>
                )}
              </div>

              {/* Delivery upload (shown when not yet delivered) */}
              {selectedOrder.status !== "delivered" && (
                <div className="space-y-2 border-t border-border pt-3">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <FileUp className="h-3.5 w-3.5 text-primary" /> Mark as Delivered
                  </p>
                  <div
                    onClick={() => deliveryFileRef.current?.click()}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-3 text-xs transition ${
                      deliveryFile ? "border-primary/50 bg-primary/5 text-primary" : "border-border bg-secondary text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    {deliveryFile ? deliveryFile.name : "Upload delivery file"}
                  </div>
                  <input ref={deliveryFileRef} type="file" className="hidden" onChange={(e) => setDeliveryFile(e.target.files?.[0] || null)} />
                  <Button
                    size="sm"
                    disabled={!deliveryFile || delivering}
                    onClick={() => handleDelivery(selectedOrder)}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
                  >
                    {delivering ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <FileUp className="mr-1.5 h-3 w-3" />}
                    Deliver & Notify Telegram
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Customer Detail Modal ─── */}
      <Dialog open={!!customerModal} onOpenChange={(open) => { if (!open) { setCustomerModal(null); setNewPassword(""); } }}>
        <DialogContent className="bg-card border-border max-w-xs mx-4 p-4">
          <DialogHeader>
            <DialogTitle className="text-foreground text-sm">Customer Details</DialogTitle>
          </DialogHeader>
          {customerModal && (
            <div className="space-y-3">
              <div className="space-y-1.5 text-xs">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="text-foreground font-medium">{customerModal.full_name || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="text-foreground">{customerModal.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">User ID</p>
                  <p className="text-foreground font-mono text-[10px]">{customerModal.user_id}</p>
                </div>
              </div>
              <div className="border-t border-border pt-3 space-y-2">
                <Label className="text-xs text-foreground flex items-center gap-1.5">
                  <KeyRound className="h-3 w-3 text-primary" /> Reset Password
                </Label>
                <Input
                  type="password"
                  placeholder="New password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-secondary border-border text-foreground text-xs h-8"
                />
                <Button size="sm" disabled={resettingPw || newPassword.length < 6} onClick={resetPassword} className="w-full text-xs" variant="destructive">
                  {resettingPw ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <KeyRound className="mr-1.5 h-3 w-3" />}
                  Reset Password
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
