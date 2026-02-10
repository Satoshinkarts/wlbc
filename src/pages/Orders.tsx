import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setOrders((data as Order[]) || []);
      setLoading(false);
    };
    fetch();
  }, [user, navigate]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-foreground">My Orders</h1>
      {orders.length === 0 ? (
        <div className="py-20 text-center">
          <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <p className="text-muted-foreground">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="bg-card border-border animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-mono text-muted-foreground">
                  #{order.id.slice(0, 8)}
                </CardTitle>
                <Badge className={statusColors[order.status] || "bg-secondary text-foreground"}>
                  {order.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                    <p className="mt-1 text-sm text-muted-foreground truncate max-w-xs">{order.shipping_address}</p>
                  </div>
                  <p className="text-lg font-bold text-primary">${Number(order.total).toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
