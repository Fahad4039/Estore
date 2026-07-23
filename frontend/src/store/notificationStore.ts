import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotifType = 'order' | 'deal' | 'promo' | 'system';

export interface Notif {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: number; // epoch ms
  read: boolean;
}

const NOW = Date.now();

const SEED_NOTIFICATIONS: Notif[] = [
  {
    id: 'n1',
    type: 'deal',
    title: '⚡ Flash Sale is LIVE!',
    message: 'Up to 70% off on Electronics & Audio. Hurry — limited stock!',
    time: NOW - 4 * 60_000,
    read: false,
  },
  {
    id: 'n2',
    type: 'order',
    title: 'Order Confirmed',
    message: 'Your order has been placed and is being processed.',
    time: NOW - 22 * 60_000,
    read: false,
  },
  {
    id: 'n3',
    type: 'promo',
    title: 'New Arrivals Added',
    message: 'Latest smartphones & accessories just dropped. Check them out!',
    time: NOW - 2 * 3_600_000,
    read: false,
  },
  {
    id: 'n4',
    type: 'deal',
    title: 'Daily Check-in Bonus',
    message: 'Claim your daily streak reward and earn bonus coins today.',
    time: NOW - 5 * 3_600_000,
    read: true,
  },
  {
    id: 'n5',
    type: 'system',
    title: 'Welcome to ESTORE Premium',
    message: 'Complete your profile to unlock exclusive member deals.',
    time: NOW - 24 * 3_600_000,
    read: true,
  },
];

interface NotifStore {
  notifications: Notif[];
  unreadCount: () => number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (n: Omit<Notif, 'id' | 'read' | 'time'>) => void;
}

export const useNotifStore = create<NotifStore>()(
  persist(
    (set, get) => ({
      notifications: SEED_NOTIFICATIONS,

      unreadCount: () => get().notifications.filter((n) => !n.read).length,

      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),

      addNotification: (partial) =>
        set((s) => ({
          notifications: [
            {
              ...partial,
              id: `n${Date.now()}`,
              time: Date.now(),
              read: false,
            },
            ...s.notifications,
          ],
        })),
    }),
    { name: 'estore-notifs-v1' }
  )
);

/* ── helpers ── */
export const timeAgo = (ms: number): string => {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export const notifColor = (type: NotifType) => {
  switch (type) {
    case 'deal':   return { bg: 'bg-rose-500/15',   border: 'border-rose-500/25',   dot: 'bg-rose-400' };
    case 'order':  return { bg: 'bg-emerald-500/15', border: 'border-emerald-500/25', dot: 'bg-emerald-400' };
    case 'promo':  return { bg: 'bg-violet-500/15',  border: 'border-violet-500/25', dot: 'bg-violet-400' };
    case 'system': return { bg: 'bg-blue-500/15',    border: 'border-blue-500/25',   dot: 'bg-blue-400' };
  }
};
