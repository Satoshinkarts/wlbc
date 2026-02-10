import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Shield, Zap, Star, Users, Clock, CheckCircle } from "lucide-react";
import { useEffect, useState, useRef } from "react";

const PRODUCT_NAMES = [
  "📧 PVA Gmail Accounts",
  "📧 Outlook PVA",
  "📧 Hotmail PVA",
  "📧 GMX Email Accounts",
  "👤 Facebook Accounts",
  "💼 FB Business Managers",
  "🐦 Twitter / X Accounts",
  "📸 Instagram Accounts",
  "✈️ Telegram Services",
  "🎵 TikTok Followers",
  "🤖 ChatGPT GO Subscription",
  "🎧 Spotify Premium",
];

const DICE_FACES = [
  { label: "Gmail PVA", desc: "Phone Verified Accounts", img: "https://ykoiozmlscyuizppduqk.supabase.co/storage/v1/object/public/product-images/1770762178566.png" },
  { label: "Outlook PVA", desc: "Phone Verified Accounts", img: "/images/outlook-logo.jpg" },
  { label: "Hotmail PVA", desc: "Phone Verified Accounts", img: "/images/hotmail-logo.jpg" },
  { label: "Facebook", desc: "New & Business Manager", img: "/images/facebook-logo.jpg" },
  { label: "Instagram", desc: "Old & New Accounts", img: "/images/instagram-logo.jpg" },
  { label: "Twitter / X", desc: "Aged & Follower Accounts", img: "/images/twitter-logo.jpg" },
  { label: "GMX Email", desc: "New & Aged Accounts", img: "/images/gmx-logo.jpg" },
  { label: "Telegram", desc: "Numbers & Members", img: "/images/telegram-logo.jpg" },
  { label: "TikTok", desc: "Followers Package", img: "/images/tiktok-logo.jpg" },
  { label: "Services", desc: "Subscriptions & More", img: "/images/services-logo.jpg" },
];

function MarqueeBanner() {
  const items = [...PRODUCT_NAMES, ...PRODUCT_NAMES];
  return (
    <div className="marquee-wrapper bg-primary/5 border-b border-primary/10 py-2.5">
      <div className="marquee-track">
        {items.map((name, i) => (
          <span key={i} className="marquee-item text-xs sm:text-sm font-medium text-primary/80">
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

function DiceRoller() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setIsRolling(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % DICE_FACES.length);
        setIsRolling(false);
      }, 600);
    }, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const face = DICE_FACES[currentIndex];

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Featured Products</p>
      <div
        className={`relative h-28 w-28 sm:h-36 sm:w-36 rounded-2xl border border-border bg-card shadow-[0_0_30px_hsl(var(--primary)/0.1)] overflow-hidden ${
          isRolling ? "animate-dice-roll" : ""
        }`}
      >
        <img
          src={face.img}
          alt={face.label}
          className="h-full w-full object-cover"
        />
      </div>
      <div className={`text-center transition-opacity duration-300 ${isRolling ? "opacity-0" : "opacity-100"}`}>
        <p className="text-sm font-bold text-foreground">{face.label}</p>
        <p className="text-xs text-muted-foreground">{face.desc}</p>
      </div>
    </div>
  );
}

function TrustBadges() {
  const badges = [
    { icon: CheckCircle, text: "Verified Accounts" },
    { icon: Clock, text: "Fast Delivery" },
    { icon: Shield, text: "Secure Payments" },
    { icon: Users, text: "1,000+ Customers" },
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

export default function Index() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* Marquee */}
      <MarqueeBanner />

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:py-16 text-center">
        <div className="animate-fade-in space-y-5 max-w-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 glow-primary">
            <ShoppingBag className="h-7 w-7 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              WLBC Store
            </h1>
            <p className="mx-auto max-w-md text-sm sm:text-base text-muted-foreground leading-relaxed">
              Premium digital accounts & services. Fast delivery via Telegram. Trusted by thousands.
            </p>
          </div>

          {/* Trust badges */}
          <TrustBadges />

          {/* Dice showcase */}
          <DiceRoller />

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link to="/products">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-sm px-8 text-sm font-semibold">
                Browse Products
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary px-8 text-sm">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Social proof line */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <div className="flex -space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-warning text-warning" />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">Rated 4.9/5 by our customers</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-card/30 px-4 py-12">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-center text-lg font-bold text-foreground mb-8">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Browse & Add", desc: "Pick from 50+ premium digital products and add to cart." },
              { step: "2", title: "Pay via QR", desc: "Scan the QR code with GCash, Maya, or any banking app." },
              { step: "3", title: "Get Delivered", desc: "Receive your accounts via Telegram within minutes." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {step}
                </div>
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card/50 px-4 py-12">
        <div className="container mx-auto grid gap-6 sm:grid-cols-3 max-w-3xl">
          {[
            { icon: ShoppingBag, title: "50+ Products", desc: "Gmail, Facebook, Instagram, Twitter accounts and more." },
            { icon: Zap, title: "Instant Delivery", desc: "Digital goods delivered via Telegram in minutes." },
            { icon: Shield, title: "Secure & Trusted", desc: "QR PH payments with proof verification for every order." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center text-center animate-fade-in">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-5 text-center">
        <p className="text-xs text-muted-foreground">
          Need help? Contact us on Telegram: <a href="https://t.me/nitmirr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@nitmirr</a>
        </p>
      </footer>
    </div>
  );
}
