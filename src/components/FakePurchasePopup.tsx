import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ShoppingBag } from "lucide-react";

// Realistic username parts
const FIRST_PARTS = [
  "alex", "jordan", "sam", "chris", "taylor", "morgan", "casey", "riley", "drew", "quinn",
  "jamie", "avery", "blake", "cameron", "devon", "emery", "frankie", "harper", "hayden", "jesse",
  "kai", "logan", "mason", "noah", "owen", "parker", "reese", "river", "sage", "skyler",
  "maria", "carlos", "ahmed", "yuki", "anna", "david", "elena", "felix", "grace", "henry",
  "ivan", "julia", "kevin", "lena", "marco", "nina", "oscar", "petra", "rafael", "sara",
  "tomas", "ursula", "victor", "wendy", "xavier", "yara", "zane", "mila", "leon", "iris",
];

const SUFFIXES = [
  "", "_x", ".real", "_official", "2k", "_", ".v", "_pro", "fx", "gg",
  "_alt", ".py", "dev", "_01", "xo", "_vip", ".io", "hq", "_inc", "zz",
];

function generateUsername(): string {
  const first = FIRST_PARTS[Math.floor(Math.random() * FIRST_PARTS.length)];
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  const useNumbers = Math.random() > 0.35;
  const num = useNumbers ? Math.floor(Math.random() * 999) + 1 : "";
  
  // Scramble: randomly capitalize 0-2 chars
  let name = first + num + suffix;
  if (Math.random() > 0.6) {
    const idx = Math.floor(Math.random() * name.length);
    name = name.substring(0, idx) + name[idx].toUpperCase() + name.substring(idx + 1);
  }
  return name;
}

interface FakeNotification {
  id: number;
  username: string;
  product: string;
  visible: boolean;
}

export default function FakePurchasePopup() {
  const [products, setProducts] = useState<string[]>([]);
  const [notification, setNotification] = useState<FakeNotification | null>(null);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("name")
        .eq("is_active", true);
      if (data && data.length > 0) {
        setProducts(data.map((p) => p.name));
      }
    };
    fetchProducts();
  }, []);

  const showNotification = useCallback(() => {
    if (products.length === 0) return;
    const product = products[Math.floor(Math.random() * products.length)];
    const username = generateUsername();
    const id = counter;
    setCounter((c) => c + 1);
    setNotification({ id, username, product, visible: true });

    // Hide after 4 seconds
    setTimeout(() => {
      setNotification((n) => (n?.id === id ? { ...n, visible: false } : n));
    }, 4000);

    // Remove after animation
    setTimeout(() => {
      setNotification((n) => (n?.id === id ? null : n));
    }, 4500);
  }, [products, counter]);

  useEffect(() => {
    if (products.length === 0) return;
    // First popup after 8-15 seconds
    const initialDelay = 8000 + Math.random() * 7000;
    const firstTimeout = setTimeout(showNotification, initialDelay);

    // Recurring every 15-30 seconds
    const interval = setInterval(() => {
      showNotification();
    }, 15000 + Math.random() * 15000);

    return () => {
      clearTimeout(firstTimeout);
      clearInterval(interval);
    };
  }, [products, showNotification]);

  if (!notification) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 max-w-[280px] rounded-xl bg-card border border-border shadow-lg p-3 flex items-center gap-3 transition-all duration-500 ${
        notification.visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0"
      }`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <ShoppingBag className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-foreground truncate">
          <span className="font-semibold">{notification.username}</span> just purchased
        </p>
        <p className="text-[11px] text-primary font-medium truncate">{notification.product}</p>
        <p className="text-[10px] text-muted-foreground">just now</p>
      </div>
    </div>
  );
}
