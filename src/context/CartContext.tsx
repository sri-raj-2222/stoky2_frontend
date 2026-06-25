'use client';

import { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string; // generated as slug-size
  slug: string;
  name: string;
  price: string; // e.g. "₹1,499"
  color: string;
  size: string;
  image: string;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  cartCount: number;
  cartSubtotal: number;
  isHydrated: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const parsePrice = (priceStr: string): number => {
  const clean = priceStr.replace(/[^\d.]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on client side mount
  useEffect(() => {
    const stored = localStorage.getItem('stoky_cart');
    if (stored) {
      try {
        setCartItems(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse cart items from storage:', e);
      }
    } else {
      // Seed with some default items if empty to showcase cheak/SKIMS aesthetic immediately
      setCartItems([
        {
          id: 'essential-black-M',
          slug: 'essential-black',
          name: 'Essential Tee — Black',
          price: '₹1,499',
          color: 'Obsidian Black',
          size: 'M',
          image: '/images/tshirt-black.png',
          quantity: 1,
        },
        {
          id: 'essential-white-L',
          slug: 'essential-white',
          name: 'Essential Tee — White',
          price: '₹1,499',
          color: 'Chalk White',
          size: 'L',
          image: '/images/tshirt-white.png',
          quantity: 1,
        }
      ]);
    }
    setIsHydrated(true);
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('stoky_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isHydrated]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart = (newItem: Omit<CartItem, 'quantity'>) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((item) => item.id === newItem.id);
      if (existingItemIndex > -1) {
        // Increment quantity
        const updated = [...prevItems];
        updated[existingItemIndex].quantity += 1;
        return updated;
      } else {
        // Add new item
        return [...prevItems, { ...newItem, quantity: 1 }];
      }
    });
    // Open drawer automatically when adding an item
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty < 1) return;
    setCartItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, quantity: qty } : item))
    );
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        cartCount,
        cartSubtotal,
        isHydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
