import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Upload, Package, ShoppingCart, Pencil, Tag } from "lucide-react";
import OrdersPanel from "@/components/admin/OrdersPanel";

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

interface DiscountTier {
  minQty: number;
  discountPct: number;
}

function ProductForm({
  initial,
  onSave,
  saving,
}: {
  initial?: Product;
  onSave: (data: {
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    is_active: boolean;
    imageFile: File | null;
    discountTiers: DiscountTier[];
  }) => void;
  saving: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [stock, setStock] = useState(initial ? String(initial.stock) : "");
  const [category, setCategory] = useState(initial?.category || "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showDiscount, setShowDiscount] = useState(false);
  const [tiers, setTiers] = useState<DiscountTier[]>([
    { minQty: 100, discountPct: 10 },
    { minQty: 200, discountPct: 15 },
    { minQty: 300, discountPct: 17 },
  ]);

  const addTier = () => setTiers((prev) => [...prev, { minQty: 0, discountPct: 0 }]);
  const removeTier = (i: number) => setTiers((prev) => prev.filter((_, idx) => idx !== i));
  const updateTier = (i: number, field: keyof DiscountTier, value: number) => {
    setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      toast.error("Name and price required");
      return;
    }
    onSave({
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock || "0"),
      category,
      is_active: isActive,
      imageFile,
      discountTiers: showDiscount ? tiers.filter((t) => t.minQty > 0 && t.discountPct > 0) : [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label className="text-foreground text-sm">Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required className="bg-secondary border-border text-foreground text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-foreground text-sm">Category</Label>
        <Input value={category} onChange={(e) => setCategory(e.target.value)} className="bg-secondary border-border text-foreground text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-foreground text-sm">Price (₱)</Label>
        <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required className="bg-secondary border-border text-foreground text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-foreground text-sm">Stock</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={stock === "-1" ? "" : stock}
            onChange={(e) => setStock(e.target.value)}
            disabled={stock === "-1"}
            placeholder={stock === "-1" ? "∞ Infinite" : "0"}
            className="bg-secondary border-border text-foreground text-sm"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <Switch checked={stock === "-1"} onCheckedChange={(checked) => setStock(checked ? "-1" : "0")} />
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">Infinite</span>
          </div>
        </div>
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label className="text-foreground text-sm">Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="bg-secondary border-border text-foreground text-sm" />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label className="text-foreground text-sm">Product Image</Label>
        <div onClick={() => fileRef.current?.click()} className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border bg-secondary p-3 hover:border-primary/50">
          <Upload className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{imageFile ? imageFile.name : initial?.image_url ? "Change image" : "Click to upload"}</span>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
      </div>

      {initial && (
        <div className="flex items-center gap-3 sm:col-span-2">
          <Switch checked={isActive} onCheckedChange={setIsActive} />
          <Label className="text-sm text-foreground">Active (visible to customers)</Label>
        </div>
      )}

      {/* Volume Discount Section */}
      <div className="sm:col-span-2 space-y-3">
        <div className="flex items-center gap-3">
          <Switch checked={showDiscount} onCheckedChange={setShowDiscount} />
          <Label className="text-sm text-foreground flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-primary" />
            Volume Discount (optional)
          </Label>
        </div>
        {showDiscount && (
          <div className="space-y-2 rounded-lg bg-secondary/50 p-3">
            {tiers.map((tier, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  type="number"
                  value={tier.minQty || ""}
                  onChange={(e) => updateTier(i, "minQty", parseInt(e.target.value) || 0)}
                  placeholder="Min qty"
                  className="bg-secondary border-border text-foreground text-sm w-24"
                />
                <span className="text-xs text-muted-foreground">units →</span>
                <Input
                  type="number"
                  value={tier.discountPct || ""}
                  onChange={(e) => updateTier(i, "discountPct", parseInt(e.target.value) || 0)}
                  placeholder="% off"
                  className="bg-secondary border-border text-foreground text-sm w-20"
                />
                <span className="text-xs text-muted-foreground">% off</span>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeTier(i)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addTier} className="text-xs border-border text-muted-foreground">
              <Plus className="mr-1 h-3 w-3" /> Add Tier
            </Button>
          </div>
        )}
      </div>

      <div className="sm:col-span-2">
        <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 glow-sm">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : initial ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {initial ? "Save Changes" : "Add Product"}
        </Button>
      </div>
    </form>
  );
}

export default function Admin() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/");
      toast.error("Access denied");
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchData = async () => {
      const [productsRes, ordersRes, profilesRes] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("user_id, full_name, email"),
      ]);
      setProducts((productsRes.data as Product[]) || []);
      setOrders((ordersRes.data as Order[]) || []);
      setProfiles((profilesRes.data as Profile[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [isAdmin]);

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleAdd = async (formData: any) => {
    setSaving(true);
    try {
      let image_url = "";
      if (formData.imageFile) {
        image_url = await uploadImage(formData.imageFile);
      }
      const { data, error } = await supabase
        .from("products")
        .insert({
          name: formData.name,
          description: formData.description,
          price: formData.price,
          stock: formData.stock,
          category: formData.category,
          image_url,
        })
        .select()
        .single();
      if (error) throw error;
      setProducts((prev) => [data as Product, ...prev]);
      toast.success("Product added!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (formData: any) => {
    if (!editProduct) return;
    setSaving(true);
    try {
      let image_url = editProduct.image_url;
      if (formData.imageFile) {
        image_url = await uploadImage(formData.imageFile);
      }
      const { data, error } = await supabase
        .from("products")
        .update({
          name: formData.name,
          description: formData.description,
          price: formData.price,
          stock: formData.stock,
          category: formData.category,
          is_active: formData.is_active,
          image_url,
        })
        .eq("id", editProduct.id)
        .select()
        .single();
      if (error) throw error;
      setProducts((prev) => prev.map((p) => (p.id === editProduct.id ? (data as Product) : p)));
      setShowEdit(false);
      setEditProduct(null);
      toast.success("Product updated!");
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

  if (authLoading || loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!isAdmin) return null;

  return (
    <div className="px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-foreground">Admin Dashboard</h1>

      <Tabs defaultValue="products">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="products" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm">
            <Package className="mr-1.5 h-4 w-4" />Products
          </TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm">
            <ShoppingCart className="mr-1.5 h-4 w-4" />Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-foreground text-base">Add New Product</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ProductForm onSave={handleAdd} saving={saving} />
            </CardContent>
          </Card>

          <div className="space-y-2">
            {products.map((p) => (
              <Card key={p.id} className="flex items-center justify-between bg-card border-border p-3 animate-fade-in">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">—</div>}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">₱{Number(p.price).toFixed(2)} · Stock: {p.stock === -1 ? "∞" : p.stock} {!p.is_active && <span className="text-destructive">· Hidden</span>}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => { setEditProduct(p); setShowEdit(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteProduct(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <OrdersPanel orders={orders} setOrders={setOrders} profiles={profiles} />
        </TabsContent>
      </Tabs>

      {/* Edit Product Dialog */}
      <Dialog open={showEdit} onOpenChange={(open) => { setShowEdit(open); if (!open) setEditProduct(null); }}>
        <DialogContent className="bg-card border-border max-w-md mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground text-base">Edit Product</DialogTitle>
          </DialogHeader>
          {editProduct && (
            <ProductForm initial={editProduct} onSave={handleEdit} saving={saving} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
