import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, ShoppingCart, Crown, DollarSign } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Order {
  id: string;
  user_id: string;
  status: string;
  total: number;
  created_at: string;
}

interface Profile {
  user_id: string;
  full_name: string;
  email: string;
  is_vip: boolean;
}

interface CustomerStat {
  userId: string;
  name: string;
  email: string;
  isVip: boolean;
  totalSpend: number;
  orderCount: number;
  avgOrderValue: number;
  lastOrder: string;
}

interface Props {
  orders: Order[];
  profiles: Profile[];
}

export default function CustomerAnalytics({ orders, profiles }: Props) {
  const stats = useMemo(() => {
    const completed = orders.filter((o) => o.status !== "cancelled");
    const byUser = new Map<string, { total: number; count: number; lastOrder: string }>();

    for (const o of completed) {
      const existing = byUser.get(o.user_id);
      if (existing) {
        existing.total += Number(o.total);
        existing.count += 1;
        if (o.created_at > existing.lastOrder) existing.lastOrder = o.created_at;
      } else {
        byUser.set(o.user_id, { total: Number(o.total), count: 1, lastOrder: o.created_at });
      }
    }

    const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

    const customers: CustomerStat[] = Array.from(byUser.entries()).map(([userId, data]) => {
      const profile = profileMap.get(userId);
      return {
        userId,
        name: profile?.full_name || "Unknown",
        email: profile?.email || "",
        isVip: profile?.is_vip || false,
        totalSpend: data.total,
        orderCount: data.count,
        avgOrderValue: data.total / data.count,
        lastOrder: data.lastOrder,
      };
    });

    customers.sort((a, b) => b.totalSpend - a.totalSpend);

    const totalCustomers = customers.length;
    const repeatBuyers = customers.filter((c) => c.orderCount > 1).length;
    const overallAvg = totalCustomers > 0
      ? customers.reduce((s, c) => s + c.avgOrderValue, 0) / totalCustomers
      : 0;
    const topSpender = customers[0];

    return { customers, totalCustomers, repeatBuyers, overallAvg, topSpender };
  }, [orders, profiles]);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-3.5 w-3.5" />
              <span className="text-[11px] uppercase tracking-wide">Customers</span>
            </div>
            <p className="text-xl font-bold text-foreground">{stats.totalCustomers}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-[11px] uppercase tracking-wide">Repeat Buyers</span>
            </div>
            <p className="text-xl font-bold text-foreground">{stats.repeatBuyers}</p>
            <p className="text-[10px] text-muted-foreground">
              {stats.totalCustomers > 0
                ? `${((stats.repeatBuyers / stats.totalCustomers) * 100).toFixed(0)}% retention`
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ShoppingCart className="h-3.5 w-3.5" />
              <span className="text-[11px] uppercase tracking-wide">Avg Order</span>
            </div>
            <p className="text-xl font-bold text-foreground">₱{stats.overallAvg.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Crown className="h-3.5 w-3.5" />
              <span className="text-[11px] uppercase tracking-wide">Top Spender</span>
            </div>
            <p className="text-sm font-bold text-foreground truncate">
              {stats.topSpender?.name || "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {stats.topSpender ? `₱${stats.topSpender.totalSpend.toFixed(0)}` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top buyers table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-foreground text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Top Buyers
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs pl-4">#</TableHead>
                <TableHead className="text-muted-foreground text-xs">Customer</TableHead>
                <TableHead className="text-muted-foreground text-xs text-right">Orders</TableHead>
                <TableHead className="text-muted-foreground text-xs text-right">Total Spend</TableHead>
                <TableHead className="text-muted-foreground text-xs text-right pr-4 hidden sm:table-cell">Avg Order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.customers.slice(0, 20).map((c, i) => (
                <TableRow key={c.userId} className="border-border">
                  <TableCell className="text-muted-foreground text-xs pl-4 w-8">{i + 1}</TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-foreground font-medium truncate max-w-[140px]">
                        {c.name}
                      </span>
                      {c.isVip && <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/50 text-primary">VIP</Badge>}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{c.email}</p>
                  </TableCell>
                  <TableCell className="text-sm text-foreground text-right tabular-nums">{c.orderCount}</TableCell>
                  <TableCell className="text-sm text-foreground text-right tabular-nums font-medium">
                    ₱{c.totalSpend.toFixed(0)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground text-right tabular-nums pr-4 hidden sm:table-cell">
                    ₱{c.avgOrderValue.toFixed(0)}
                  </TableCell>
                </TableRow>
              ))}
              {stats.customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground text-sm py-8">
                    No customer data yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
