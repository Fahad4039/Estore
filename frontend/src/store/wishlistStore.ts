import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '../data/products';
import { wishlistApi } from '../lib/api';

interface WishlistStore {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  toggleItem: (product: Product) => void;
  syncFromApi: () => Promise<void>;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        set((state) => {
          if (state.items.find((i) => i.id === product.id)) return state;
          return { items: [...state.items, product] };
        });
        wishlistApi.toggle(product.id).catch(() => {});
      },

      removeItem: (id) => {
        const exists = get().items.find((i) => i.id === id);
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
        if (exists) wishlistApi.toggle(id).catch(() => {});
      },

      isInWishlist: (id) => get().items.some((i) => i.id === id),

      toggleItem: (product) => {
        if (get().isInWishlist(product.id)) {
          get().removeItem(product.id);
        } else {
          get().addItem(product);
        }
      },

      syncFromApi: async () => {
        try {
          const { items } = await wishlistApi.get();
          if (items.length) {
            set({
              items: items.map((i: any) => ({
                id: i.id, name: i.name, price: i.price,
                originalPrice: i.originalPrice, rating: i.rating,
                images: i.image ? [i.image] : [], brand: i.brand,
                discount: i.discount ?? 0,
                // minimal fields
                category: 'Electronics' as const, reviewCount: 0, description: '',
                stock: 99, tags: [], specs: {}, specifications: {}, colors: [], sizes: [],
                isFeatured: false, isTrending: false, isBestSeller: false,
                isFlashSale: false, isNew: false, deliveryDays: 3,
              })),
            });
          }
        } catch {}
      },
    }),
    { name: 'estore-wishlist' }
  )
);
