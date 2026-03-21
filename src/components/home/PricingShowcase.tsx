import { Tag } from "lucide-react";
import { usePhpToUsd } from "@/hooks/use-forex";

const DEALS = [
  { name: "Gmail PVA", price: 10, original: 15, emoji: "📧" },
  { name: "Facebook Acct", price: 40, original: 60, emoji: "👤" },
  { name: "Instagram Acct", price: 12, original: 20, emoji: "📸" },
  { name: "Twitter / X", price: 150, original: 225, emoji: "🐦" },
  { name: "Outlook PVA", price: 5, original: 10, emoji: "📨" },
  { name: "Telegram Svc", price: 50, original: 75, emoji: "✈️" },
];

export default function PricingShowcase() {
  const { convert } = usePhpToUsd();

  return (
    <section className="border-t border-border px-4 py-14">
      <div className="container mx-auto max-w-xl">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Tag className="h-4 w-4 text-primary" />
          <p className="text-xs uppercase tracking-widest font-semibold text-primary">
            Presyong Pang-Masa 🇵🇭
          </p>
        </div>
        <p className="text-center text-sm text-muted-foreground mb-6">
          Prices that beat the competition — guaranteed.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DEALS.map((d) => (
            <div
              key={d.name}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-3 transition hover:border-primary/30 hover:shadow-[0_0_15px_hsl(var(--primary)/0.08)]"
            >
              <span className="text-lg">{d.emoji}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{d.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground line-through">₱{d.original}</span>
                  <span className="text-sm font-bold text-primary">₱{d.price.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">(~${convert(d.price).toFixed(2)})</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          Volume discounts up to <span className="text-primary font-semibold">17% off</span> — GCash & Maya accepted 🇵🇭
        </p>
      </div>
    </section>
  );
}
