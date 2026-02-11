import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

export default function UrgencyBanner() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Simulate a believable daily order count (27-89)
    const base = new Date().getDate() * 3 + 15;
    const hour = new Date().getHours();
    setCount(base + Math.floor(hour * 1.3));
  }, []);

  return (
    <div className="bg-primary/10 border-b border-primary/20 py-2 px-4">
      <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-medium">
        <Zap className="h-3.5 w-3.5 text-warning fill-warning animate-pulse" />
        <span className="text-warning font-bold">{count} orders delivered today</span>
        <span className="text-muted-foreground">•</span>
        <span className="text-primary">Instant Telegram Delivery</span>
      </div>
    </div>
  );
}
