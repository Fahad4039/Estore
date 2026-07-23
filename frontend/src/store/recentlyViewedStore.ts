import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '../data/products';

interface RecentlyViewedStore {
  items: Product[];
  addItem: (product: Product) => void;
  clearItems: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product) =>
        set((state) => ({
          items: [product, ...state.items.filter((i) => i.id !== product.id)].slice(0, 8),
        })),
      clearItems: () => set({ items: [] }),
    }),
    { name: 'estore-recently-viewed' }
  )
);
