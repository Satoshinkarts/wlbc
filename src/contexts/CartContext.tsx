import { createContext, useContext, useState, ReactNode } from "react";
import { getDiscount } from "@/lib/pricing";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  subtotal: number;
  discount: number;
  discountPct: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const PVA_GMAIL_NAME = "PVA - Gmail";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) return removeItem(id);
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity } : i));
  };

  const clearCart = () => setItems([]);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Volume discount only applies to PVA - Gmail items
  const pvaUnits = items
    .filter((i) => i.name === PVA_GMAIL_NAME)
    .reduce((sum, i) => sum + i.quantity, 0);
  const pvaSubtotal = items
    .filter((i) => i.name === PVA_GMAIL_NAME)
    .reduce((sum, i) => sum + i.price * i.quantity, 0);

  const discountPct = getDiscount(pvaUnits);
  const discount = pvaSubtotal * discountPct;
  const total = subtotal - discount;

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      total,
      subtotal,
      discount,
      discountPct,
      itemCount,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
