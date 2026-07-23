import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '../data/products';
import { cartApi } from '../lib/api';

export interface CartItem extends Product {
  quantity: number;
  cartItemId?: number;  // DB row id (used for API updates)
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  coupon: string | null;
  discount: number;
  applyCoupon: (code: string) => void;
  subtotal: () => number;
  total: () => number;
  itemCount: () => number;
  syncFromApi: () => Promise<void>;
}

const VALID_COUPONS: Record<string, number> = {
  QUANTUM10: 10,
  WELCOME15: 15,
  SAVE20: 20,
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      discount: 0,

      addItem: (product, qty = 1) => {
        set((state) => {
          const existing = state.items.find((item) => item.id === product.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: Math.min(item.quantity + qty, item.stock) }
                  : item
              ),
            };
          }
          return { items: [...state.items, { ...product, quantity: Math.min(qty, product.stock) }] };
        });
        // Async sync to API (fire and forget)
        cartApi.add(product.id, qty).catch(() => {});
      },

      removeItem: (id) => {
        const item = get().items.find((i) => i.id === id);
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
        if (item?.cartItemId) cartApi.remove(item.cartItemId).catch(() => {});
      },

      updateQuantity: (id, qty) => {
        const item = get().items.find((i) => i.id === id);
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: Math.max(1, Math.min(qty, item.stock)) } : item
          ),
        }));
        if (item?.cartItemId) cartApi.update(item.cartItemId, qty).catch(() => {});
      },

      clearCart: () => {
        set({ items: [], coupon: null, discount: 0 });
        cartApi.clear().catch(() => {});
      },

      applyCoupon: (code) => {
        const upperCode = code.toUpperCase();
        if (VALID_COUPONS[upperCode]) {
          set({ coupon: upperCode, discount: VALID_COUPONS[upperCode] });
        } else {
          set({ coupon: null, discount: 0 });
          throw new Error('Invalid coupon code');
        }
      },

      subtotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      total: () => {
        const state = get();
        return state.subtotal() * (1 - state.discount / 100);
      },

      itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      // Load cart from API (called after login)
      syncFromApi: async () => {
        try {
          const { items } = await cartApi.get();
          if (items.length) {
            // Merge: API is source of truth when logged in
            set({
              items: items.map((i: any) => ({
                id: i.productId, name: i.name, price: i.price,
                originalPrice: i.originalPrice, brand: i.brand,
                images: i.image ? [i.image] : [], stock: i.stock ?? 99,
                quantity: i.quantity, cartItemId: i.id,
                // minimal required fields
                category: 'Electronics' as const, rating: 0, reviewCount: 0, description: '',
                discount: 0, tags: [], specs: {}, specifications: {}, colors: [], sizes: [],
                isFeatured: false, isTrending: false, isBestSeller: false,
                isFlashSale: false, isNew: false, deliveryDays: 3,
              })),
            });
          }
        } catch {}
      },
    }),
    { name: 'estore-cart' }
  )
);
