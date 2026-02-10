import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Upload, Package, ShoppingCart } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  category: string;
  is_active: boolean;
}

interface Order {
  id: string;
  user_id: string;
  status: string;
  total: number;
  shipping_address: string;
  created_at: string;
}

export default function Admin() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // New product form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/");
      toast.error("Access denied");
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchData = async () => {
      const [productsRes, ordersRes] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
      ]);
      setProducts((productsRes.data as Product[]) || []);
      setOrders((ordersRes.data as Order[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [isAdmin]);

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) { toast.error("Name and price required"); return; }
    setSaving(true);
    try {
      let image_url = "";
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("product-images").upload(path, imageFile);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
        image_url = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from("products")
        .insert({ name, description, price: parseFloat(price), stock: parseInt(stock || "0"), category, image_url })
        .select()
        .single();
      if (error) throw error;
      setProducts((prev) => [data as Product, ...prev]);
      setName(""); setDescription(""); setPrice(""); setStock(""); setCategory(""); setImageFile(null);
      toast.success("Product added!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Product deleted");
  };

  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    toast.success("Order updated");
  };

  if (authLoading || loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-foreground">Admin Dashboard</h1>

      <Tabs defaultValue="products">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="products" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Package className="mr-2 h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6 space-y-6">
          {/* Add Product Form */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Add New Product</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addProduct} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-foreground">Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required className="bg-secondary border-border text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Category</Label>
                  <Input value={category} onChange={(e) => setCategory(e.target.value)} className="bg-secondary border-border text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Price</Label>
                  <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required className="bg-secondary border-border text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Stock</Label>
                  <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="bg-secondary border-border text-foreground" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-foreground">Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-secondary border-border text-foreground" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-foreground">Product Image</Label>
                  <div onClick={() => fileRef.current?.click()} className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border bg-secondary p-3 hover:border-primary/50">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{imageFile ? imageFile.name : "Click to upload"}</span>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 glow-sm">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Add Product
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Product List */}
          <div className="space-y-3">
            {products.map((p) => (
              <Card key={p.id} className="flex items-center justify-between bg-card border-border p-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">—</div>}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{p.name}</p>
                    <p className="text-sm text-muted-foreground">${Number(p.price).toFixed(2)} · Stock: {p.stock}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => deleteProduct(p.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-6 space-y-4">
          {orders.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">No orders yet.</p>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className="bg-card border-border p-4 animate-fade-in">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-sm text-muted-foreground">#{order.id.slice(0, 8)}</p>
                    <p className="font-bold text-primary">${Number(order.total).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                    <p className="mt-1 text-sm text-muted-foreground truncate max-w-xs">{order.shipping_address}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select value={order.status} onValueChange={(v) => updateOrderStatus(order.id, v)}>
                      <SelectTrigger className="w-36 bg-secondary border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((s) => (
                          <SelectItem key={s} value={s} className="text-foreground">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
