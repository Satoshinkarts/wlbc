export default function HowItWorksSection() {
  const steps = [
    { step: "1", title: "Browse & Add", desc: "Pick from 50+ premium digital products and add to cart." },
    { step: "2", title: "Pay via QR", desc: "Scan the QR code with GCash, Maya, or any banking app." },
    { step: "3", title: "Get Delivered", desc: "Receive your accounts via Telegram within minutes." },
  ];

  return (
    <section className="border-t border-border bg-card/30 px-4 py-14">
      <div className="container mx-auto max-w-2xl">
        <h2 className="text-center text-xl sm:text-2xl font-bold text-foreground mb-10">
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {steps.map(({ step, title, desc }) => (
            <div key={step} className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold shadow-[0_0_20px_hsl(var(--primary)/0.2)]">
                {step}
              </div>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
