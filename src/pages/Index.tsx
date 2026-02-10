import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Shield, Zap } from "lucide-react";
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
    <div className="marquee-wrapper bg-primary/10 border-b border-primary/20 py-2.5">
      <div className="marquee-track">
        {items.map((name, i) => (
          <span key={i} className="marquee-item text-sm font-semibold text-primary">
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
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative h-32 w-32 sm:h-40 sm:w-40 rounded-2xl border-2 border-primary/30 bg-card shadow-[0_0_20px_hsl(var(--primary)/0.15)] overflow-hidden ${
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
        <p className="text-base font-bold text-foreground">{face.label}</p>
        <p className="text-xs text-muted-foreground">{face.desc}</p>
      </div>
    </div>
  );
}

export default function Index() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* Marquee */}
      <MarqueeBanner />

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="animate-fade-in space-y-6 max-w-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 glow-primary animate-pulse-glow">
            <ShoppingBag className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
            WLBC Store
          </h1>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground">
            Browse products, place orders, and track deliveries — all in one sleek, fast experience.
          </p>

          {/* Dice showcase */}
          <DiceRoller />

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
