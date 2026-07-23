import { create } from 'zustand';
import { Product } from '../data/products';

interface UIStore {
  isDrawerOpen: boolean;
  isSearchOpen: boolean;
  isQuickViewOpen: boolean;
  quickViewProduct: Product | null;
  cartAddedAt: number;
  wishlistAddedAt: number;
  headerGlowImage: string;
  openDrawer: () => void;
  closeDrawer: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
  triggerCartBlink: () => void;
  triggerWishlistBlink: () => void;
  setHeaderGlowImage: (url: string) => void;
  clearHeaderGlowImage: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isDrawerOpen: false,
  isSearchOpen: false,
  isQuickViewOpen: false,
  quickViewProduct: null,
  cartAddedAt: 0,
  wishlistAddedAt: 0,
  headerGlowImage: '',

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  openSearch: () => set({ isSearchOpen: true, isDrawerOpen: false }),
  closeSearch: () => set({ isSearchOpen: false }),
  openQuickView: (product) => set({ isQuickViewOpen: true, quickViewProduct: product }),
  closeQuickView: () => set({ isQuickViewOpen: false, quickViewProduct: null }),
  triggerCartBlink: () => set({ cartAddedAt: Date.now() }),
  triggerWishlistBlink: () => set({ wishlistAddedAt: Date.now() }),
  setHeaderGlowImage: (url) => set({ headerGlowImage: url }),
  clearHeaderGlowImage: () => set({ headerGlowImage: '' }),
}));
