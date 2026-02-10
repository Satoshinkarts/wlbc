import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, LogOut, Shield, Package, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    navigate("/");
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/" onClick={closeMenu} className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground hover:text-primary transition-colors">
          <Package className="h-5 w-5 text-primary" />
          <span>Store</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          <Link to="/products">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-sm">
              Products
            </Button>
          </Link>
          {user ? (
            <>
              <Link to="/orders">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-sm">Orders</Button>
              </Link>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-sm">
                    <Shield className="mr-1 h-4 w-4" />Admin
                  </Button>
                </Link>
              )}
              <Link to="/cart" className="relative">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <Badge className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary p-0 text-[10px] text-primary-foreground">{itemCount}</Badge>
                  )}
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-muted-foreground hover:text-destructive h-8 w-8">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-sm text-sm">
                <User className="mr-1 h-4 w-4" />Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile nav */}
        <div className="flex sm:hidden items-center gap-2">
          {user && (
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary p-0 text-[10px] text-primary-foreground">{itemCount}</Badge>
                )}
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-t border-border bg-card/95 backdrop-blur-xl px-4 py-3 space-y-1 animate-fade-in">
          <Link to="/products" onClick={closeMenu} className="block rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary">Products</Link>
          {user ? (
            <>
              <Link to="/orders" onClick={closeMenu} className="block rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary">My Orders</Link>
              {isAdmin && (
                <Link to="/admin" onClick={closeMenu} className="block rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary">
                  <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />Admin</span>
                </Link>
              )}
              <button onClick={handleSignOut} className="w-full text-left rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-secondary">Sign Out</button>
            </>
          ) : (
            <Link to="/auth" onClick={closeMenu} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-primary">Sign In</Link>
          )}
        </div>
      )}
    </nav>
  );
}
