import { Link } from "react-router-dom";
import { Shield, Lock, MessageCircle } from "lucide-react";

export default function FooterSection() {
  return (
    <footer className="border-t border-border bg-card/50 px-4 py-10">
      <div className="container mx-auto max-w-4xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <h3 className="text-sm font-bold text-foreground mb-3">WLBC Store</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The #1 trusted marketplace for verified digital accounts in the Philippines.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">Quick Links</h4>
            <div className="flex flex-col gap-2">
              <Link to="/products" className="text-xs text-muted-foreground hover:text-primary transition-colors">Products</Link>
              <Link to="/faq" className="text-xs text-muted-foreground hover:text-primary transition-colors">FAQ</Link>
              <Link to="/orders" className="text-xs text-muted-foreground hover:text-primary transition-colors">My Orders</Link>
              <Link to="/settings" className="text-xs text-muted-foreground hover:text-primary transition-colors">Settings</Link>
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">Support</h4>
            <div className="flex flex-col gap-2">
              <a href="https://t.me/nitmirr" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> Telegram Support
              </a>
              <Link to="/faq" className="text-xs text-muted-foreground hover:text-primary transition-colors">Refund Policy</Link>
              <Link to="/faq" className="text-xs text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
            </div>
          </div>

          {/* Security */}
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">Security</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3 text-success" /> SSL Encrypted
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="h-3 w-3 text-success" /> Secure Payments
              </div>
              <p className="text-[10px] text-muted-foreground">GCash • Maya • Bank Transfer</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} WLBC Store. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <a href="https://t.me/nitmirr" target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline">
              @nitmirr
            </a>
            <span className="text-muted-foreground text-[10px]">•</span>
            <span className="text-[10px] text-muted-foreground">Bot-Powered Secure Fulfillment</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
