import { useEffect, useState } from "react";
import { MessageCircle, Star } from "lucide-react";

const TESTIMONIALS = [
  { name: "Mark D.", handle: "@markd_ph", text: "Super fast delivery! Got my Gmail PVAs in less than 3 minutes. Will definitely order again. 🔥", rating: 5, product: "Gmail PVA x10" },
  { name: "Jhay R.", handle: "@jhayR_dev", text: "Legit seller! Ordered FB accounts for my business, all working perfectly. Sulit na sulit!", rating: 5, product: "Facebook Accounts x5" },
  { name: "Ana S.", handle: "@ana_shopee", text: "First time buying digital accounts online and sobrang smooth ng process. GCash payment tapos Telegram delivery agad!", rating: 5, product: "Instagram Accounts x3" },
  { name: "Chris L.", handle: "@chrisl_mnl", text: "Been buying from WLBC for months now. Never had a problem. Best prices sa market talaga.", rating: 5, product: "Outlook PVA x20" },
  { name: "Ria M.", handle: "@ria_mm", text: "Grabe ang bilis! Less than 5 mins na-receive ko na. Plus may warranty pa. Solid! 💯", rating: 5, product: "Twitter / X Accounts x2" },
  { name: "Jake T.", handle: "@jaket99", text: "Tried other sellers before but WLBC is the most reliable. Responsive sa Telegram support.", rating: 4, product: "GMX Email x10" },
];

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Show 3 testimonials at a time on desktop, 1 on mobile
  const getVisible = () => {
    const indices = [];
    for (let i = 0; i < 3; i++) {
      indices.push((current + i) % TESTIMONIALS.length);
    }
    return indices;
  };

  const visible = getVisible();

  return (
    <section className="border-t border-border bg-card/30 px-4 py-14">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              What Our Customers Say
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">Real reviews from real Telegram buyers</p>
        </div>

        {/* Desktop: 3 cards */}
        <div className="hidden sm:grid sm:grid-cols-3 gap-4">
          {visible.map((idx) => (
            <TestimonialCard key={`${idx}-${current}`} testimonial={TESTIMONIALS[idx]} />
          ))}
        </div>

        {/* Mobile: 1 card */}
        <div className="sm:hidden">
          <TestimonialCard testimonial={TESTIMONIALS[current]} />
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 mt-6">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: typeof TESTIMONIALS[0] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-fade-in transition-all duration-300 hover:border-primary/20">
      {/* Telegram-style header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-bold">
          {testimonial.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
          <p className="text-[11px] text-primary">{testimonial.handle}</p>
        </div>
      </div>

      {/* Message bubble */}
      <div className="rounded-xl rounded-tl-sm bg-secondary/80 px-3.5 py-2.5 mb-3">
        <p className="text-xs text-foreground leading-relaxed">{testimonial.text}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
          {testimonial.product}
        </span>
        <div className="flex -space-x-0.5">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="h-3 w-3 fill-warning text-warning" />
          ))}
        </div>
      </div>
    </div>
  );
}
