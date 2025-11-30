
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import cartService, { Cart, AddToCartData } from '../services/cartService';
import { RootState } from '../store';

interface CartContextType {
  cart: Cart | null;
  cartCount: number;
  loading: boolean;
  error: string | null;
  refreshCart: () => Promise<void>;
  addToCart: (itemData: AddToCartData) => Promise<void>;
  updateQuantity: (listingId: string, quantity: number) => Promise<void>;
  removeItem: (listingId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // Fetch cart on mount and when user logs in
  useEffect(() => {
    if (isAuthenticated && user?.role === 'buyer') {
      refreshCart();
    } else {
      setCart(null);
      setCartCount(0);
    }
  }, [isAuthenticated, user]);

  const refreshCart = async () => {
    if (!isAuthenticated || user?.role !== 'buyer') {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await cartService.getCart();
      if (response.success) {
        setCart(response.data);
        setCartCount(response.data.itemCount);
      }
    } catch (err: any) {
      console.error('Error fetching cart:', err);
      setError(err.message || 'Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (itemData: AddToCartData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartService.addToCart(itemData);
      if (response.success) {
        setCart(response.data);
        setCartCount(response.data.itemCount);
      }
    } catch (err: any) {
      console.error('Error adding to cart:', err);
      setError(err.message || 'Failed to add item to cart');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (listingId: string, quantity: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartService.updateCartItem(listingId, quantity);
      if (response.success) {
        setCart(response.data);
        setCartCount(response.data.itemCount);
      }
    } catch (err: any) {
      console.error('Error updating cart item:', err);
      setError(err.message || 'Failed to update cart item');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (listingId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartService.removeFromCart(listingId);
      if (response.success) {
        setCart(response.data);
        setCartCount(response.data.itemCount);
      }
    } catch (err: any) {
      console.error('Error removing from cart:', err);
      setError(err.message || 'Failed to remove item from cart');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartService.clearCart();
      if (response.success) {
        setCart(response.data);
        setCartCount(0);
      }
    } catch (err: any) {
      console.error('Error clearing cart:', err);
      setError(err.message || 'Failed to clear cart');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value: CartContextType = {
    cart,
    cartCount,
    loading,
    error,
    refreshCart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
