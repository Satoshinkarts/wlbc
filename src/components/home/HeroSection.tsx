import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Shield, Star, Users, Clock, CheckCircle, Crown } from "lucide-react";

function TrustBadges() {
  const badges = [
    { icon: CheckCircle, text: "Verified Accounts" },
    { icon: Clock, text: "Instant Delivery" },
    { icon: Shield, text: "Encrypted Checkout" },
    { icon: Users, text: "Active Since 2023" },
  ];
  return (
    <div className="flex flex-wrap justify-center gap-3 sm:gap-5">
      {badges.map(({ icon: Icon, text }) => (
        <div key={text} className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3.5 w-3.5 text-primary/70" />
          <span className="text-[11px] sm:text-xs font-medium">{text}</span>
        </div>
      ))}
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center px-4 py-14 sm:py-20 text-center">
      <div className="animate-fade-in space-y-6 max-w-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 glow-primary">
          <ShoppingBag className="h-7 w-7 text-primary" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl leading-tight">
            #1 Trusted Marketplace for{" "}
            <span className="text-primary">Verified Digital Accounts</span>{" "}
            in PH
          </h1>
          <p className="mx-auto max-w-lg text-sm sm:text-base text-muted-foreground leading-relaxed">
            Premium PVA emails, social media accounts & digital services at{" "}
            <span className="text-primary font-semibold">unbeatable PHP prices</span>.
            Delivered via Telegram in minutes.
          </p>
        </div>

        <TrustBadges />

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link to="/products">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-sm px-8 text-sm font-semibold">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Browse Products
            </Button>
          </Link>
          <Link to="/faq">
            <Button size="lg" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 px-8 text-sm">
              <Crown className="mr-2 h-4 w-4" />
              Become VIP
            </Button>
          </Link>
        </div>

        {/* Star rating */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <div className="flex -space-x-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-warning text-warning" />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            Rated <span className="text-foreground font-semibold">4.9/5</span> by our customers
          </span>
        </div>
      </div>
    </section>
  );
}
