import { Shield, CheckCircle, MessageCircle, RefreshCw, Lock, FileText } from "lucide-react";

const TRUST_ITEMS = [
  { icon: CheckCircle, title: "Manual Verification", desc: "Every account is hand-verified before delivery to guarantee quality." },
  { icon: Shield, title: "Warranty on Selected", desc: "Select products come with replacement warranty for your peace of mind." },
  { icon: MessageCircle, title: "Fast Telegram Support", desc: "Get instant help from our support team via Telegram 7 days a week." },
  { icon: Lock, title: "Encrypted Checkout", desc: "All payments are processed through secure, encrypted channels." },
  { icon: RefreshCw, title: "Clear Refund Policy", desc: "Transparent refund terms — no hidden clauses, no surprises." },
  { icon: FileText, title: "Order Receipts", desc: "Downloadable receipts for every transaction for your records." },
];

export default function TrustSection() {
  return (
    <section className="border-t border-border bg-card/30 px-4 py-14">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Why Choose <span className="text-primary">WLBC Store</span>?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            In an industry full of scams, we overcompensate with trust, quality, and transparency.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TRUST_ITEMS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_20px_hsl(var(--primary)/0.08)]"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
