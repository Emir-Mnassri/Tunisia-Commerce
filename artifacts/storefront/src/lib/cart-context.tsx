import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl: string | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem("tunisian_boutique_cart");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("tunisian_boutique_cart", JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: CartItem) => {
    setItems((current) => {
      const existing = current.find((i) => i.productId === newItem.productId);
      if (existing) {
        return current.map((i) =>
          i.productId === newItem.productId
            ? { ...i, quantity: i.quantity + newItem.quantity, totalPrice: (i.quantity + newItem.quantity) * i.unitPrice }
            : i
        );
      }
      return [...current, newItem];
    });
  };

  const removeItem = (productId: number) => {
    setItems((current) => current.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((current) =>
      current.map((i) =>
        i.productId === productId ? { ...i, quantity, totalPrice: quantity * i.unitPrice } : i
      )
    );
  };

  const clearCart = () => setItems([]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
