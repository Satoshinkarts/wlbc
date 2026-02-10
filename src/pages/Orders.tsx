import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Users, Info, Copy, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface Order {
  id: string;
  status: string;
  total: number;
  shipping_address: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-warning/20 text-warning border-warning/30",
  confirmed: "bg-primary/20 text-primary border-primary/30",
  processing: "bg-primary/20 text-primary border-primary/30",
  shipped: "bg-success/20 text-success border-success/30",
  delivered: "bg-success/20 text-success border-success/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [rPoints, setRPoints] = useState(0);
  const [copied, setCopied] = useState(false);

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

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-foreground">My Orders</h1>

      {/* Referral Card */}
      {referralCode && (
        <Card className="mb-4 bg-card border-border animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Referral Program</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-card border-border text-foreground max-w-[220px]">
                    <p className="text-xs">Share your code with friends. You earn 1 rPoint when they make their first purchase!</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                {rPoints} rPoints
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-secondary px-3 py-2 text-sm font-mono text-foreground tracking-wider">
                {referralCode}
              </code>
              <button
                onClick={copyCode}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
              >
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
            <Card key={order.id} className="bg-card border-border animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
                <CardTitle className="text-xs font-mono text-muted-foreground">#{order.id.slice(0, 8)}</CardTitle>
                <Badge className={`text-[10px] ${statusColors[order.status] || "bg-secondary text-foreground"}`}>{order.status}</Badge>
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
    </div>
  );
}
