import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Tag, Copy, Calendar, Hash, Percent, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PromoCode {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  usage_limit: number | null;
  usage_count: number;
  min_order_total: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export default function PromoCodesPanel() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [minOrderTotal, setMinOrderTotal] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setCodes((data as PromoCode[]) || []);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) {
      toast.error("Code and discount value are required");
      return;
    }
    setSaving(true);
    try {
      const insertData: any = {
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        min_order_total: parseFloat(minOrderTotal || "0"),
      };
      if (usageLimit) insertData.usage_limit = parseInt(usageLimit);
      if (expiresAt) insertData.expires_at = new Date(expiresAt).toISOString();

      const { data, error } = await supabase.from("promo_codes").insert(insertData).select().single();
      if (error) throw error;
      setCodes((prev) => [data as PromoCode, ...prev]);
      setCode("");
      setDiscountValue("");
      setUsageLimit("");
      setMinOrderTotal("");
      setExpiresAt("");
      toast.success("Promo code created!");
    } catch (err: any) {
      toast.error(err.message?.includes("unique") ? "Code already exists" : err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase.from("promo_codes").update({ is_active: active }).eq("id", id);
    if (error) toast.error(error.message);
    else setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: active } : c)));
  };

  const deleteCode = async (id: string) => {
    const { error } = await supabase.from("promo_codes").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      setCodes((prev) => prev.filter((c) => c.id !== id));
      toast.success("Promo code deleted");
    }
  };

  const isExpired = (c: PromoCode) => c.expires_at && new Date(c.expires_at) < new Date();
  const isMaxedOut = (c: PromoCode) => c.usage_limit !== null && c.usage_count >= c.usage_limit;

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {/* Create form */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-foreground text-base flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            Create Promo Code
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Code</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SAVE20"
                required
                className="bg-secondary border-border text-foreground text-sm font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Discount Type</Label>
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as "percentage" | "fixed")}>
                <SelectTrigger className="bg-secondary border-border text-foreground text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (₱)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">
                Discount Value {discountType === "percentage" ? "(%)" : "(₱)"}
              </Label>
              <Input
                type="number"
                step="0.01"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "percentage" ? "e.g. 20" : "e.g. 50"}
                required
                className="bg-secondary border-border text-foreground text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Usage Limit <span className="text-muted-foreground text-[10px]">(blank = unlimited)</span></Label>
              <Input
                type="number"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="∞"
                className="bg-secondary border-border text-foreground text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Min Order Total (₱)</Label>
              <Input
                type="number"
                step="0.01"
                value={minOrderTotal}
                onChange={(e) => setMinOrderTotal(e.target.value)}
                placeholder="0"
                className="bg-secondary border-border text-foreground text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Expires At <span className="text-muted-foreground text-[10px]">(blank = never)</span></Label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="bg-secondary border-border text-foreground text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 glow-sm">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Create Code
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Codes list */}
      <div className="space-y-2">
        {codes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No promo codes yet</p>
        )}
        {codes.map((c) => {
          const expired = isExpired(c);
          const maxed = isMaxedOut(c);
          return (
            <Card key={c.id} className={`bg-card border-border p-3 animate-fade-in ${(!c.is_active || expired || maxed) ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-foreground">{c.code}</span>
                    <Badge variant="outline" className="text-[10px] border-border">
                      {c.discount_type === "percentage" ? (
                        <><Percent className="h-2.5 w-2.5 mr-0.5" />{c.discount_value}% off</>
                      ) : (
                        <>₱{Number(c.discount_value).toFixed(2)} off</>
                      )}
                    </Badge>
                    {!c.is_active && <Badge variant="secondary" className="text-[10px]">Disabled</Badge>}
                    {expired && <Badge variant="destructive" className="text-[10px]">Expired</Badge>}
                    {maxed && <Badge variant="destructive" className="text-[10px]">Maxed Out</Badge>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {c.usage_count}{c.usage_limit !== null ? `/${c.usage_limit}` : "/∞"} used
                    </span>
                    {c.min_order_total > 0 && <span>Min: ₱{Number(c.min_order_total).toFixed(2)}</span>}
                    {c.expires_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(c.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Switch checked={c.is_active} onCheckedChange={(v) => toggleActive(c.id, v)} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      navigator.clipboard.writeText(c.code);
                      toast.success("Code copied!");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteCode(c.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
