import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, LogOut, Shield, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground hover:text-primary transition-colors">
          <Package className="h-6 w-6 text-primary" />
          <span>Store</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/products">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Products
            </Button>
          </Link>

          {user ? (
            <>
              <Link to="/orders">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  My Orders
                </Button>
              </Link>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <Shield className="mr-1 h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              )}
              <Link to="/cart" className="relative">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary p-0 text-xs text-primary-foreground">
                      {itemCount}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-muted-foreground hover:text-destructive">
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-sm">
                <User className="mr-1 h-4 w-4" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
