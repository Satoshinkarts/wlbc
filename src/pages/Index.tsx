import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Shield, Zap } from "lucide-react";
import { useEffect, useState, useRef } from "react";

const PRODUCT_NAMES = [
  "PVA - Gmail", "Outlook PVA", "Hotmail PVA", "GMX Accounts",
  "Facebook Accounts", "FB Business Manager", "Twitter / X Accounts",
  "Instagram Accounts", "Telegram Services", "TikTok Followers",
  "ChatGPT GO", "Spotify Premium",
];

const DICE_FACES = [
  { label: "Gmail", img: "https://ykoiozmlscyuizppduqk.supabase.co/storage/v1/object/public/product-images/1770762178566.png" },
  { label: "Outlook", img: "/images/outlook-logo.jpg" },
  { label: "Hotmail", img: "/images/hotmail-logo.jpg" },
  { label: "Facebook", img: "/images/facebook-logo.jpg" },
  { label: "Instagram", img: "/images/instagram-logo.jpg" },
  { label: "Twitter / X", img: "/images/twitter-logo.jpg" },
  { label: "GMX", img: "/images/gmx-logo.jpg" },
  { label: "Telegram", img: "/images/telegram-logo.jpg" },
  { label: "TikTok", img: "/images/tiktok-logo.jpg" },
  { label: "Services", img: "/images/services-logo.jpg" },
];

function MarqueeBanner() {
  const text = PRODUCT_NAMES.join("  •  ") + "  •  ";
  return (
    <div className="w-full overflow-hidden bg-primary/10 border-b border-primary/20 py-2">
      <div className="marquee-track flex whitespace-nowrap">
        <span className="marquee-content text-sm font-semibold text-primary tracking-wide">
          {text}
        </span>
        <span className="marquee-content text-sm font-semibold text-primary tracking-wide" aria-hidden>
          {text}
        </span>
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
      <div
        className={`relative h-28 w-28 sm:h-36 sm:w-36 rounded-2xl border-2 border-primary/30 bg-card shadow-lg overflow-hidden transition-transform duration-500 ${
          isRolling ? "animate-dice-roll" : ""
        }`}
      >
        <img
          src={face.img}
          alt={face.label}
          className="h-full w-full object-cover"
        />
      </div>
      <span className={`text-sm font-semibold text-primary transition-opacity duration-300 ${isRolling ? "opacity-0" : "opacity-100"}`}>
        {face.label}
      </span>
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
            Your Digital Store
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
