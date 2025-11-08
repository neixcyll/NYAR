import { useEffect, useState } from "react";
import { Search, Home, Bell, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/cart-context";
import { supabase } from "@/lib/supabaseClient";

interface HeaderProps {
  cartItemCount: number;
  onSearchChange?: (query: string) => void;
}

export const Header = ({ cartItemCount, onSearchChange }: HeaderProps) => {
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const { cartCount } = useCart();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center overflow-hidden">
              <img src="bulat.png" alt="logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold text-foreground">FixieStore</span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cari produk fixie..."
                className="pl-10 bg-muted/50"
                onChange={(e) => onSearchChange?.(e.target.value)} // ✅ kirim query ke parent
              />
            </div>
          </div>

          {/* Navigation Icons */}
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <Home className="w-5 h-5" />
              </Button>
            </Link>

            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>

            {/* Keranjang */}
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {(cartItemCount || cartCount) > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs p-0"
                  >
                    {cartItemCount || cartCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Auth Buttons / User Info */}
            {!user &&
              location.pathname !== "/login" &&
              location.pathname !== "/register" && (
                <div className="flex items-center space-x-2">
                  <Link to="/login">
                    <Button variant="outline">Masuk</Button>
                  </Link>
                  <Link to="/register">
                    <Button>Daftar</Button>
                  </Link>
                </div>
              )}

            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  Halo, {user.user_metadata?.full_name || user.email}
                </span>
                <Button variant="destructive" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
