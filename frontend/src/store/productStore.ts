import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { products as INITIAL_PRODUCTS, Product } from '../data/products';
import { productsApi } from '../lib/api';

interface ProductStore {
  products: Product[];
  source: 'static' | 'mysql' | 'loading';
  addProduct:      (product: Product) => void;
  updateProduct:   (id: string, updates: Partial<Product>) => void;
  deleteProduct:   (id: string) => void;
  resetToDefaults: () => void;
  fetchFromApi:    () => Promise<void>;
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      products: INITIAL_PRODUCTS,
      source: 'static',

      fetchFromApi: async () => {
        try {
          const res = await productsApi.list();
          if (res.data?.length) {
            set({ products: res.data as Product[], source: res.source === 'mysql' ? 'mysql' : 'static' });
          }
        } catch {
          // API unavailable — keep current products (localStorage or static)
        }
      },

      addProduct: (product) => {
        set((s) => ({ products: [product, ...s.products] }));
        productsApi.create(product).catch(() => {});
      },

      updateProduct: (id, updates) => {
        set((s) => ({
          products: s.products.map((p) => p.id === id ? { ...p, ...updates } : p),
        }));
        productsApi.update(id, updates).catch(() => {});
      },

      deleteProduct: (id) => {
        set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
        productsApi.delete(id).catch(() => {});
      },

      resetToDefaults: () => {
        set({ products: INITIAL_PRODUCTS, source: 'static' });
      },
    }),
    { name: 'estore-products' }
  )
);
