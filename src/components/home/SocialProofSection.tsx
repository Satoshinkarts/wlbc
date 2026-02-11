import { useEffect, useState, useRef } from "react";
import { Package, Users, Star, Clock } from "lucide-react";

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const duration = 1500;
          const steps = 40;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="text-2xl sm:text-3xl font-extrabold text-foreground">
      {count.toLocaleString()}{suffix}
    </div>
  );
}

const STATS = [
  { icon: Package, label: "Orders Delivered", value: 10482, suffix: "+" },
  { icon: Users, label: "Happy Customers", value: 3200, suffix: "+" },
  { icon: Star, label: "5-Star Reviews", value: 1850, suffix: "+" },
  { icon: Clock, label: "Avg. Delivery", value: 5, suffix: " min" },
];

export default function SocialProofSection() {
  return (
    <section className="border-t border-border bg-secondary/30 px-4 py-14">
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-center text-xl sm:text-2xl font-bold text-foreground mb-10">
          Trusted by <span className="text-primary">Thousands</span> of Customers
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map(({ icon: Icon, label, value, suffix }) => (
            <div key={label} className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <AnimatedCounter target={value} suffix={suffix} />
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
