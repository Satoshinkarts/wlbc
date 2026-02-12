import { useState, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Trash2, Loader2, Upload, TrendingUp, CalendarDays, Filter,
  DollarSign, BarChart3, Users, Eye, KeyRound, FileUp, Image,
  Minus, Download, StickyNote, ArchiveX, AlertTriangle,
  CheckSquare, Square, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  admin_notes: string;
}

interface Profile {
  user_id: string;
  full_name: string;
  email: string;
  is_vip: boolean;
}

interface OrdersPanelProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  profiles: Profile[];
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>;
}

// Simple sparkline-like bar chart
function MiniChart({ data, label }: { data: { date: string; value: number }[]; label: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
      <div className="flex items-end gap-[2px] h-16">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-primary/70 rounded-t-sm min-h-[2px] transition-all"
              style={{ height: `${(d.value / max) * 100}%` }}
              title={`${d.date}: ₱${d.value.toFixed(0)}`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[8px] text-muted-foreground">{data[0]?.date}</span>
        <span className="text-[8px] text-muted-foreground">{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

export default function OrdersPanel({ orders, setOrders, profiles, setProfiles }: OrdersPanelProps) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterUser, setFilterUser] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Order detail modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);

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

  // Admin notes
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");

  // Order items
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const getProfileName = (userId: string) => {
    const p = profiles.find((pr) => pr.user_id === userId);
    return p ? (p.full_name || p.email) : userId.slice(0, 8);
  };
  const getProfile = (userId: string) => profiles.find((pr) => pr.user_id === userId);

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (filterUser !== "all" && o.user_id !== filterUser) return false;
    if (filterStatus !== "all" && o.status !== filterStatus) return false;
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

  // Chart data - daily sales & profit
  const chartData = useMemo(() => {
    const dateMap: Record<string, { sales: number; profit: number }> = {};
    filteredOrders
      .filter(o => o.status !== "cancelled")
      .forEach(o => {
        const d = new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (!dateMap[d]) dateMap[d] = { sales: 0, profit: 0 };
        dateMap[d].sales += Number(o.total);
        dateMap[d].profit += Number(o.total) - Number(o.remit || 0);
      });
    return Object.entries(dateMap)
      .map(([date, v]) => ({ date, ...v }))
      .slice(-14);
  }, [filteredOrders]);

  // CSV Export
  const exportCSV = () => {
    const headers = ["Order ID", "Customer", "Status", "Total", "Remit", "Profit", "Telegram", "Date"];
    const rows = filteredOrders.map(o => [
      o.id.slice(0, 8),
      getProfileName(o.user_id),
      o.status,
      Number(o.total).toFixed(2),
      Number(o.remit || 0).toFixed(2),
      (Number(o.total) - Number(o.remit || 0)).toFixed(2),
      o.shipping_address || "",
      new Date(o.created_at).toLocaleString(),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  // Bulk selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelectedIds(new Set(filteredOrders.map((o) => o.id)));
  const deselectAll = () => setSelectedIds(new Set());
  const selectedCount = selectedIds.size;

  // Bulk status update
  const bulkUpdateStatus = async (status: string) => {
    if (selectedCount === 0) return;
    setBulkUpdating(true);
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("orders").update({ status }).in("id", ids);
    if (error) { toast.error(error.message); setBulkUpdating(false); return; }
    setOrders((prev) => prev.map((o) => ids.includes(o.id) ? { ...o, status } : o));
    setSelectedIds(new Set());
    setBulkUpdating(false);
    toast.success(`${ids.length} orders → ${status}`);
  };

  // Bulk cancel
  const bulkCancel = async () => {
    await bulkUpdateStatus("cancelled");
  };

  // Bulk export selected
  const bulkExportCSV = () => {
    const selected = filteredOrders.filter((o) => selectedIds.has(o.id));
    if (selected.length === 0) { toast.error("No orders selected"); return; }
    const headers = ["Order ID", "Customer", "Status", "Total", "Remit", "Profit", "Telegram", "Date"];
    const rows = selected.map(o => [
      o.id.slice(0, 8),
      getProfileName(o.user_id),
      o.status,
      Number(o.total).toFixed(2),
      Number(o.remit || 0).toFixed(2),
      (Number(o.total) - Number(o.remit || 0)).toFixed(2),
      o.shipping_address || "",
      new Date(o.created_at).toLocaleString(),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-selected-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${selected.length} orders exported!`);
  };

  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    toast.success("Order updated");
  };

  const softDelete = async (id: string) => {
    await updateOrderStatus(id, "cancelled");
  };

  const hardDelete = async (id: string) => {
    const { error: itemsErr } = await supabase.from("order_items").delete().eq("order_id", id);
    if (itemsErr) { toast.error(itemsErr.message); return; }
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setOrders((prev) => prev.filter((o) => o.id !== id));
    if (selectedOrder?.id === id) setSelectedOrder(null);
    toast.success("Order permanently deleted");
  };

  const viewReceipt = async (order: Order) => {
    setSelectedOrder(order);
    setMinimized(false);
    setReceiptUrl(null);
    setItemsLoading(true);

    // Load items and receipt in parallel
    const [_, itemsRes] = await Promise.all([
      (async () => {
        if (order.payment_proof_path) {
          setReceiptLoading(true);
          try {
            const { data } = await supabase.functions.invoke("admin-actions", {
              body: { action: "get_receipt_url", proofPath: order.payment_proof_path },
            });
            if (data?.url) setReceiptUrl(data.url);
          } catch { }
          setReceiptLoading(false);
        }
      })(),
      supabase
        .from("order_items")
        .select("id, quantity, price, product_id, products(name)")
        .eq("order_id", order.id) as any,
    ]);
    setOrderItems(itemsRes.data || []);
    setItemsLoading(false);
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
      if (data?.success) { toast.success("Password reset"); setNewPassword(""); }
      else toast.error(data?.error || "Failed");
    } catch { toast.error("Failed"); }
    setResettingPw(false);
  };

  const handleDelivery = async (order: Order) => {
    if (!deliveryFile) { toast.error("Select a file"); return; }
    setDelivering(true);
    try {
      const ext = deliveryFile.name.split(".").pop();
      const filePath = `${order.user_id}/${order.id}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("delivery-files").upload(filePath, deliveryFile, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { error: updateErr } = await supabase.from("orders").update({ status: "delivered", delivery_file_path: filePath }).eq("id", order.id);
      if (updateErr) throw updateErr;

      const { data: itemsData } = await supabase.from("order_items").select("quantity, product_id, products(name)").eq("order_id", order.id) as any;
      const itemList = itemsData?.map((i: any) => `${i.products?.name || "Item"} x${i.quantity}`).join(", ") || "Items";

      await supabase.functions.invoke("admin-actions", {
        body: { action: "notify_delivery", orderId: order.id, telegram: order.shipping_address, orderTitle: itemList, deliveryFileUrl: filePath },
      });

      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: "delivered", delivery_file_path: filePath } : o));
      setSelectedOrder((prev) => prev ? { ...prev, status: "delivered", delivery_file_path: filePath } : null);
      setDeliveryFile(null);
      toast.success("Delivered & notified!");
    } catch (err: any) { toast.error(err.message || "Delivery failed"); }
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

  const saveAdminNotes = async (orderId: string) => {
    const { error } = await supabase.from("orders").update({ admin_notes: notesValue }).eq("id", orderId);
    if (error) { toast.error(error.message); return; }
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, admin_notes: notesValue } : o));
    setSelectedOrder((prev) => prev ? { ...prev, admin_notes: notesValue } : null);
    setEditingNotes(null);
    toast.success("Notes saved");
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

      {/* Charts */}
      {chartData.length > 1 && (
        <div className="grid grid-cols-2 gap-2">
          <Card className="bg-card border-border p-3">
            <MiniChart data={chartData.map(d => ({ date: d.date, value: d.sales }))} label="Sales Trend" />
          </Card>
          <Card className="bg-card border-border p-3">
            <MiniChart data={chartData.map(d => ({ date: d.date, value: d.profit }))} label="Profit Trend" />
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-card border-border p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold text-foreground">Filters</p>
          </div>
          <Button variant="outline" size="sm" className="text-xs h-7 border-border text-muted-foreground" onClick={exportCSV}>
            <Download className="mr-1 h-3 w-3" /> Export CSV
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-secondary border-border text-foreground text-xs h-8 w-32" />
            <span className="text-xs text-muted-foreground">–</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-secondary border-border text-foreground text-xs h-8 w-32" />
          </div>
          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="w-36 bg-secondary border-border text-foreground text-xs h-8">
              <SelectValue placeholder="All users" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all" className="text-foreground text-xs">All users</SelectItem>
              {orderUsers.map((uid) => (
                <SelectItem key={uid} value={uid} className="text-foreground text-xs">{getProfileName(uid)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-28 bg-secondary border-border text-foreground text-xs h-8">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all" className="text-foreground text-xs">All status</SelectItem>
              {["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map(s => (
                <SelectItem key={s} value={s} className="text-foreground text-xs capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(dateFrom || dateTo || filterUser !== "all" || filterStatus !== "all") && (
            <Button variant="ghost" size="sm" className="text-xs h-8 text-muted-foreground" onClick={() => { setDateFrom(""); setDateTo(""); setFilterUser("all"); setFilterStatus("all"); }}>
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Order list */}
      <div className="space-y-2">
        {/* Select all header */}
        {filteredOrders.length > 0 && (
          <div className="flex items-center gap-2 px-1">
            <Checkbox
              checked={selectedCount > 0 && selectedCount === filteredOrders.length}
              onCheckedChange={(checked) => checked ? selectAll() : deselectAll()}
              className="border-border"
            />
            <span className="text-xs text-muted-foreground">
              {selectedCount > 0 ? `${selectedCount} selected` : "Select all"}
            </span>
            {selectedCount > 0 && selectedCount < filteredOrders.length && (
              <Button variant="ghost" size="sm" className="h-6 text-[10px] text-primary px-2" onClick={selectAll}>
                Select all {filteredOrders.length}
              </Button>
            )}
          </div>
        )}

        {filteredOrders.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No orders match filters.</p>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className={`bg-card border-border p-3 animate-fade-in transition-colors ${selectedIds.has(order.id) ? "ring-1 ring-primary/50 bg-primary/5" : ""}`}>
              <div className="flex items-start gap-2">
                <div className="pt-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(order.id)}
                    onCheckedChange={() => toggleSelect(order.id)}
                    className="border-border"
                  />
                </div>
                <div className="min-w-0 flex-1" onClick={() => viewReceipt(order)} role="button" tabIndex={0}>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8)}</p>
                    {order.payment_proof_path && <Image className="h-3 w-3 text-primary" />}
                    {order.admin_notes && <StickyNote className="h-3 w-3 text-warning" />}
                  </div>
                  <p
                    className="text-[11px] text-primary/80 hover:underline cursor-pointer flex items-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      const prof = getProfile(order.user_id);
                      if (prof) setCustomerModal(prof);
                    }}
                  >
                    {getProfileName(order.user_id)}
                    {getProfile(order.user_id)?.is_vip && (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[8px] px-1 py-0">👑 VIP</Badge>
                    )}
                  </p>
                  <p className="text-sm font-bold text-primary">₱{Number(order.total).toFixed(2)}</p>
                  {Number(order.remit) > 0 && (
                    <p className="text-[10px] text-muted-foreground">Remit: ₱{Number(order.remit).toFixed(2)} · Profit: ₱{(Number(order.total) - Number(order.remit)).toFixed(2)}</p>
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
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-warning" onClick={() => softDelete(order.id)} title="Cancel order">
                      <ArchiveX className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="Permanently delete">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-border max-w-xs">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-foreground text-sm flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" /> Delete Order
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground text-xs">
                            This permanently deletes order #{order.id.slice(0, 8)} and all its items. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="text-xs h-8">Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground text-xs h-8" onClick={() => hardDelete(order.id)}>
                            Delete Forever
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* ─── Bulk Action Floating Bar ─── */}
      {selectedCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-card border border-border rounded-xl p-3 shadow-lg animate-fade-in">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/20 text-primary text-xs">{selectedCount} selected</Badge>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={deselectAll}>
                <X className="mr-1 h-3 w-3" /> Clear
              </Button>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Select value={bulkStatus} onValueChange={(v) => { setBulkStatus(v); bulkUpdateStatus(v); }}>
                <SelectTrigger className="w-[120px] bg-secondary border-border text-foreground text-xs h-8">
                  <SelectValue placeholder="Set status..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {["pending", "confirmed", "processing", "shipped", "delivered"].map((s) => (
                    <SelectItem key={s} value={s} className="text-foreground text-xs capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-8 text-xs border-border text-muted-foreground" onClick={bulkExportCSV}>
                <Download className="mr-1 h-3 w-3" /> Export
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs border-border text-destructive hover:bg-destructive/10" onClick={bulkCancel}>
                <ArchiveX className="mr-1 h-3 w-3" /> Cancel All
              </Button>
            </div>
          </div>
          {bulkUpdating && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Updating...</span>
            </div>
          )}
        </div>
      )}

      {/* ─── Order Detail / Receipt Modal ─── */}
      <Dialog open={!!selectedOrder && !minimized} onOpenChange={(open) => { if (!open) { setSelectedOrder(null); setReceiptUrl(null); setDeliveryFile(null); } }}>
        <DialogContent className="bg-card border-border max-w-sm mx-4 max-h-[90vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle className="text-foreground text-sm flex items-center justify-between">
              <span>Order #{selectedOrder?.id.slice(0, 8)}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setMinimized(true)} title="Minimize">
                <Minus className="h-3 w-3" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-3">
              {/* Order info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="text-primary cursor-pointer hover:underline font-medium" onClick={() => { const prof = getProfile(selectedOrder.user_id); if (prof) setCustomerModal(prof); }}>
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
                    <p className="font-medium text-foreground cursor-pointer hover:text-primary" onClick={() => { setEditingRemit(selectedOrder.id); setRemitValue(String(selectedOrder.remit || 0)); }}>
                      ₱{Number(selectedOrder.remit || 0).toFixed(2)} ✏️
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Profit</p>
                  <p className={`font-bold ${(Number(selectedOrder.total) - Number(selectedOrder.remit || 0)) >= 0 ? "text-primary" : "text-destructive"}`}>
                    ₱{(Number(selectedOrder.total) - Number(selectedOrder.remit || 0)).toFixed(2)}
                  </p>
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

              {/* Order items */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">Items</p>
                {itemsLoading ? (
                  <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
                ) : (
                  <div className="space-y-1">
                    {orderItems.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-xs bg-secondary rounded px-2 py-1.5">
                        <span className="text-foreground">{item.products?.name || "Item"} ×{item.quantity}</span>
                        <span className="text-muted-foreground">₱{(Number(item.price) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedOrder.notes && (
                <div className="text-xs">
                  <p className="text-muted-foreground">Customer Notes</p>
                  <p className="text-foreground">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Admin Notes */}
              <div className="text-xs space-y-1.5">
                <p className="text-muted-foreground flex items-center gap-1"><StickyNote className="h-3 w-3" /> Admin Notes (internal)</p>
                {editingNotes === selectedOrder.id ? (
                  <div className="space-y-1.5">
                    <Textarea value={notesValue} onChange={(e) => setNotesValue(e.target.value)} rows={2} className="bg-secondary border-border text-foreground text-xs" placeholder="Internal notes..." />
                    <div className="flex gap-1">
                      <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => saveAdminNotes(selectedOrder.id)}>Save</Button>
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setEditingNotes(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <p
                    className="text-foreground cursor-pointer hover:text-primary"
                    onClick={() => { setEditingNotes(selectedOrder.id); setNotesValue(selectedOrder.admin_notes || ""); }}
                  >
                    {selectedOrder.admin_notes || "Click to add notes..."} ✏️
                  </p>
                )}
              </div>

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

              {/* Delivery upload */}
              {selectedOrder.status !== "delivered" && (
                <div className="space-y-2 border-t border-border pt-3">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <FileUp className="h-3.5 w-3.5 text-primary" /> Mark as Delivered
                  </p>
                  <div
                    onClick={() => deliveryFileRef.current?.click()}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-3 text-xs transition ${deliveryFile ? "border-primary/50 bg-primary/5 text-primary" : "border-border bg-secondary text-muted-foreground hover:border-primary/30"}`}
                  >
                    <Upload className="h-4 w-4" />
                    {deliveryFile ? deliveryFile.name : "Upload delivery file"}
                  </div>
                  <input ref={deliveryFileRef} type="file" className="hidden" onChange={(e) => setDeliveryFile(e.target.files?.[0] || null)} />
                  <Button size="sm" disabled={!deliveryFile || delivering} onClick={() => handleDelivery(selectedOrder)} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
                    {delivering ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <FileUp className="mr-1.5 h-3 w-3" />}
                    Deliver & Notify Telegram
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Minimized order bar */}
      {selectedOrder && minimized && (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-card border border-border rounded-xl p-3 shadow-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/20 text-primary text-[10px]">#{selectedOrder.id.slice(0, 8)}</Badge>
            <span className="text-xs text-foreground font-medium">₱{Number(selectedOrder.total).toFixed(2)}</span>
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-xs border-border" onClick={() => setMinimized(false)}>Expand</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => { setSelectedOrder(null); setMinimized(false); }}>
              Close
            </Button>
          </div>
        </div>
      )}

      {/* ─── Customer Detail Modal ─── */}
      <Dialog open={!!customerModal} onOpenChange={(open) => { if (!open) { setCustomerModal(null); setNewPassword(""); } }}>
        <DialogContent className="bg-card border-border max-w-xs mx-4 p-4">
          <DialogHeader>
            <DialogTitle className="text-foreground text-sm">Customer Details</DialogTitle>
          </DialogHeader>
          {customerModal && (
            <div className="space-y-3">
              <div className="space-y-1.5 text-xs">
                <div><p className="text-muted-foreground">Name</p><p className="text-foreground font-medium">{customerModal.full_name || "—"}</p></div>
                <div><p className="text-muted-foreground">Email</p><p className="text-foreground">{customerModal.email}</p></div>
                <div><p className="text-muted-foreground">User ID</p><p className="text-foreground font-mono text-[10px]">{customerModal.user_id}</p></div>
              </div>
              {/* VIP Toggle */}
              <div className="border-t border-border pt-3 flex items-center justify-between">
                <Label className="text-xs text-foreground flex items-center gap-1.5">
                  👑 VIP Status
                </Label>
                <Switch
                  checked={customerModal.is_vip}
                  onCheckedChange={async (checked) => {
                    const { error } = await supabase.from("profiles").update({ is_vip: checked }).eq("user_id", customerModal.user_id);
                    if (error) { toast.error(error.message); return; }
                    setCustomerModal({ ...customerModal, is_vip: checked });
                    setProfiles((prev) => prev.map((p) => p.user_id === customerModal.user_id ? { ...p, is_vip: checked } : p));
                    toast.success(checked ? "VIP status granted!" : "VIP status removed");
                  }}
                />
              </div>
              {customerModal.is_vip && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">👑 VIP Customer</Badge>
              )}
              <div className="border-t border-border pt-3 space-y-2">
                <Label className="text-xs text-foreground flex items-center gap-1.5">
                  <KeyRound className="h-3 w-3 text-primary" /> Reset Password
                </Label>
                <Input type="password" placeholder="New password (min 6 chars)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-secondary border-border text-foreground text-xs h-8" />
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
