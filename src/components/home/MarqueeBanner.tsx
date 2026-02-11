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

export default function MarqueeBanner() {
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
