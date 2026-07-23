import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const TRENDING_SEARCHES = [
  'iPhone 15 Pro',
  'Sony Headphones',
  'Nike Air Max',
  'MacBook Pro',
  'PlayStation 5',
  'AirPods Pro',
  'Samsung 4K TV',
  'Gaming Chair',
  'Dyson Airwrap',
  'Apple Watch',
];

interface SearchStore {
  history: string[];
  trending: string[];
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  removeFromHistory: (query: string) => void;
}

export const useSearchStore = create<SearchStore>()(
  persist(
    (set) => ({
      history: [],
      trending: TRENDING_SEARCHES,
      addToHistory: (query) =>
        set((state) => ({
          history: [query, ...state.history.filter((h) => h !== query)].slice(0, 10),
        })),
      clearHistory: () => set({ history: [] }),
      removeFromHistory: (query) =>
        set((state) => ({
          history: state.history.filter((h) => h !== query),
        })),
    }),
    { name: 'estore-search-history' }
  )
);
