import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Shield, Zap } from "lucide-react";

export default function Index() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="animate-fade-in space-y-6 max-w-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 glow-primary animate-pulse-glow">
            <ShoppingBag className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
            Your Digital Store
          </h1>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground">
            Browse products, place orders, and track deliveries — all in one sleek, fast experience.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/products">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-sm px-8">
                Browse Products
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary px-8">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card/50 px-4 py-16">
        <div className="container mx-auto grid gap-8 sm:grid-cols-3">
          {[
            { icon: ShoppingBag, title: "Easy Shopping", desc: "Browse, add to cart, and checkout in seconds." },
            { icon: Zap, title: "Fast & Reliable", desc: "PWA-powered for lightning fast experience." },
            { icon: Shield, title: "Secure Payments", desc: "Upload payment proof with full order tracking." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center text-center animate-fade-in">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          Need help? Contact us on Telegram: <a href="https://t.me/nitmirr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@nitmirr</a>
        </p>
      </footer>
    </div>
  );
}
