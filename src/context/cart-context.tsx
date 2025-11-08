// context/cart-context.tsx
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface CartContextType {
  cartCount: number;
  fetchCart: () => Promise<void>; // ✅ tambahkan baris ini
  addToCart: (productId: string) => Promise<void>;
}


const CartContext = createContext<CartContextType>({
  cartCount: 0,
  fetchCart: async () => {}, // default kosong
  addToCart: async () => {}, // default kosong
});

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartCount, setCartCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    };
    getUser();
  }, []);

  const fetchCartCount = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("cart_items")
      .select("id", { count: "exact" })
      .eq("user_id", userId);
    setCartCount(data?.length || 0);
  };

  const addToCart = async (productId: string) => {
    if (!userId) return;
    await supabase.from("cart_items").insert([{ user_id: userId, product_id: productId }]);
    await fetchCartCount(); // update badge
  };

  useEffect(() => {
    if (userId) fetchCartCount();
  }, [userId]);

  return (
    <CartContext.Provider value={{ cartCount, addToCart, fetchCart: fetchCartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
