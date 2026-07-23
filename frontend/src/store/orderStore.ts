import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ordersApi } from '../lib/api';

export interface OrderItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  images: string[];
  quantity: number;
  category: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  date: string;
}

interface OrderStore {
  orders: Order[];
  addOrder: (order: { id: string; items: OrderItem[]; total: number; date: string }) => void;
  placeOrderApi: (data: {
    items: OrderItem[];
    total: number;
    shipping?: { name?: string; address?: string; city?: string; phone?: string };
    paymentMethod?: string;
  }) => Promise<string>;
  syncFromApi: () => Promise<void>;
  totalSpent: () => number;
  pendingCount: () => number;
  fulfilledCount: () => number;
  recentProducts: () => OrderItem[];
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],

      addOrder: ({ id, items, total, date }) =>
        set((s) => ({
          orders: [{ id, items, total, status: 'pending', date }, ...s.orders],
        })),

      placeOrderApi: async ({ items, total, shipping, paymentMethod }) => {
        // Try API first
        try {
          const res = await ordersApi.create({
            items: items.map((i) => ({
              productId: i.id,
              name: i.name,
              image: i.images?.[0],
              price: i.price,
              quantity: i.quantity,
            })),
            total,
            shipping,
            paymentMethod,
          });
          // Also save locally
          const date = new Date().toISOString();
          set((s) => ({
            orders: [{ id: res.orderId, items, total, status: 'pending', date }, ...s.orders],
          }));
          return res.orderId;
        } catch {
          // Fallback: create local order
          const id = `order-${Date.now()}`;
          const date = new Date().toISOString();
          set((s) => ({
            orders: [{ id, items, total, status: 'pending', date }, ...s.orders],
          }));
          return id;
        }
      },

      syncFromApi: async () => {
        try {
          const { orders } = await ordersApi.list();
          if (orders.length) {
            set({
              orders: orders.map((o: any) => ({
                id: o.id,
                total: Number(o.total),
                status: o.status,
                date: o.created_at,
                items: (o.items ?? []).map((i: any) => ({
                  id: i.product_id, name: i.name, brand: '',
                  price: Number(i.price), images: i.image ? [i.image] : [],
                  quantity: i.quantity, category: '',
                })),
              })),
            });
          }
        } catch {}
      },

      totalSpent: () => get().orders.reduce((sum, o) => sum + o.total, 0),
      pendingCount: () =>
        get().orders.filter((o) => o.status === 'pending' || o.status === 'processing').length,
      fulfilledCount: () => get().orders.filter((o) => o.status === 'delivered').length,
      recentProducts: () => {
        const seen = new Set<string>();
        const out: OrderItem[] = [];
        for (const order of get().orders) {
          for (const item of order.items) {
            if (!seen.has(item.id)) { seen.add(item.id); out.push(item); }
          }
          if (out.length >= 6) break;
        }
        return out;
      },
    }),
    { name: 'estore-orders' }
  )
);
