import { Link } from "react-router-dom";

const CATEGORIES = [
  { label: "Gmail PVA", img: "https://ykoiozmlscyuizppduqk.supabase.co/storage/v1/object/public/product-images/1770762178566.png" },
  { label: "Outlook PVA", img: "/images/outlook-logo.jpg" },
  { label: "Facebook", img: "/images/facebook-logo.jpg" },
  { label: "Instagram", img: "/images/instagram-logo.jpg" },
  { label: "Twitter / X", img: "/images/twitter-logo.jpg" },
  { label: "Telegram", img: "/images/telegram-logo.jpg" },
  { label: "TikTok", img: "/images/tiktok-logo.jpg" },
  { label: "Services", img: "/images/services-logo.jpg" },
];

export default function CategoriesSection() {
  return (
    <section className="border-t border-border bg-card/50 px-4 py-14">
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-center text-xl sm:text-2xl font-bold text-foreground mb-8">
          Browse by Category
        </h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              to="/products"
              className="group flex flex-col items-center gap-2"
            >
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl border border-border bg-secondary overflow-hidden transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.12)]">
                <img src={cat.img} alt={cat.label} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors text-center">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
