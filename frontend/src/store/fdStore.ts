import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FDTransaction {
  id: string;
  type: 'earn' | 'spend' | 'cashout' | 'topup' | 'checkin' | 'sale' | 'referral';
  amount: number;
  pkrValue: number;
  description: string;
  date: string;
}

export const FD_TO_PKR = 0.1; // 1000 FD = 100 PKR
export const DAILY_SALE_MILESTONE = 10;
export const DAILY_REFERRAL_MILESTONE = 10;
export const MILESTONE_REWARD = 10000;
export const SALE_REWARD = 500;
export const REFERRAL_REWARD = 500;
export const CHECKIN_REWARDS = [100, 150, 200, 250, 300, 400, 1000];

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function makeTx(
  type: FDTransaction['type'],
  amount: number,
  description: string,
): FDTransaction {
  return {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    amount,
    pkrValue: Math.abs(amount) * FD_TO_PKR,
    description,
    date: new Date().toISOString(),
  };
}

interface FDState {
  coins: number;
  transactions: FDTransaction[];
  // Check-in
  checkInStreak: number;
  lastCheckInDate: string | null;
  // Seller
  isSeller: boolean;
  todaySales: number;
  totalSales: number;
  sellerCoinsEarned: number;
  dailySaleMilestoneAwarded: boolean;
  sellerJoinedAt: string | null;
  // Affiliate
  todayReferrals: number;
  totalReferrals: number;
  affiliateCoinsEarned: number;
  dailyReferralMilestoneAwarded: boolean;
  // Reset tracking
  lastDailyReset: string | null;

  topUp: (pkr: number) => void;
  cashOut: (coins: number) => { success: boolean; pkr: number; error?: string };
  checkIn: () => { coinsEarned: number; streak: number; dayIndex: number } | null;
  becomeSeller: () => void;
  recordSale: () => { coinsEarned: number; milestoneHit: boolean; totalToday: number };
  addReferral: () => { coinsEarned: number; milestoneHit: boolean; totalToday: number };
  resetDailyIfNeeded: () => void;
}

export const useFDStore = create<FDState>()(
  persist(
    (set, get) => ({
      coins: 0,
      transactions: [],
      checkInStreak: 0,
      lastCheckInDate: null,
      isSeller: false,
      todaySales: 0,
      totalSales: 0,
      sellerCoinsEarned: 0,
      dailySaleMilestoneAwarded: false,
      sellerJoinedAt: null,
      todayReferrals: 0,
      totalReferrals: 0,
      affiliateCoinsEarned: 0,
      dailyReferralMilestoneAwarded: false,
      lastDailyReset: null,

      topUp: (pkr) => {
        const coins = Math.floor(pkr * 10);
        const tx = makeTx('topup', coins, `Top-up ₨${pkr.toLocaleString()} → ${coins.toLocaleString()} FD Coins`);
        set((s) => ({ coins: s.coins + coins, transactions: [tx, ...s.transactions].slice(0, 300) }));
      },

      cashOut: (coins) => {
        const { coins: balance } = get();
        if (coins < 1000) return { success: false, pkr: 0, error: 'Minimum cash-out is 1,000 FD Coins' };
        if (balance < coins) return { success: false, pkr: 0, error: 'Insufficient FD Coins balance' };
        const pkr = coins * FD_TO_PKR;
        const tx = makeTx('cashout', -coins, `Cash out ${coins.toLocaleString()} FD → ₨${pkr.toFixed(0)}`);
        set((s) => ({ coins: s.coins - coins, transactions: [tx, ...s.transactions].slice(0, 300) }));
        return { success: true, pkr };
      },

      checkIn: () => {
        const { lastCheckInDate, checkInStreak } = get();
        const today = todayStr();
        if (lastCheckInDate === today) return null;
        const prev = new Date();
        prev.setDate(prev.getDate() - 1);
        const prevStr = prev.toISOString().split('T')[0];
        const newStreak = lastCheckInDate === prevStr ? checkInStreak + 1 : 1;
        const dayIndex = (newStreak - 1) % 7;
        const coinsEarned = CHECKIN_REWARDS[dayIndex];
        const tx = makeTx('checkin', coinsEarned, `Day ${newStreak} check-in (+${coinsEarned.toLocaleString()} FD)`);
        set((s) => ({
          coins: s.coins + coinsEarned,
          checkInStreak: newStreak,
          lastCheckInDate: today,
          transactions: [tx, ...s.transactions].slice(0, 300),
        }));
        return { coinsEarned, streak: newStreak, dayIndex };
      },

      becomeSeller: () => {
        set({ isSeller: true, sellerJoinedAt: new Date().toISOString() });
      },

      recordSale: () => {
        get().resetDailyIfNeeded();
        const s0 = get();
        const newSales = s0.todaySales + 1;
        const milestoneHit = newSales === DAILY_SALE_MILESTONE && !s0.dailySaleMilestoneAwarded;
        const totalEarned = SALE_REWARD + (milestoneHit ? MILESTONE_REWARD : 0);
        const txs: FDTransaction[] = [
          makeTx('sale', SALE_REWARD, `Sale #${newSales} commission`),
          ...(milestoneHit
            ? [makeTx('earn', MILESTONE_REWARD, '🎯 10-Sales Daily Milestone Bonus!')]
            : []),
        ];
        set((s) => ({
          coins: s.coins + totalEarned,
          todaySales: newSales,
          totalSales: s.totalSales + 1,
          sellerCoinsEarned: s.sellerCoinsEarned + totalEarned,
          dailySaleMilestoneAwarded: milestoneHit ? true : s.dailySaleMilestoneAwarded,
          transactions: [...txs, ...s.transactions].slice(0, 300),
        }));
        return { coinsEarned: totalEarned, milestoneHit, totalToday: newSales };
      },

      addReferral: () => {
        get().resetDailyIfNeeded();
        const s0 = get();
        const newRefs = s0.todayReferrals + 1;
        const milestoneHit = newRefs === DAILY_REFERRAL_MILESTONE && !s0.dailyReferralMilestoneAwarded;
        const totalEarned = REFERRAL_REWARD + (milestoneHit ? MILESTONE_REWARD : 0);
        const txs: FDTransaction[] = [
          makeTx('referral', REFERRAL_REWARD, `Referral #${newRefs} bonus`),
          ...(milestoneHit
            ? [makeTx('earn', MILESTONE_REWARD, '🎯 10-Referrals Daily Milestone Bonus!')]
            : []),
        ];
        set((s) => ({
          coins: s.coins + totalEarned,
          todayReferrals: newRefs,
          totalReferrals: s.totalReferrals + 1,
          affiliateCoinsEarned: s.affiliateCoinsEarned + totalEarned,
          dailyReferralMilestoneAwarded: milestoneHit ? true : s.dailyReferralMilestoneAwarded,
          transactions: [...txs, ...s.transactions].slice(0, 300),
        }));
        return { coinsEarned: totalEarned, milestoneHit, totalToday: newRefs };
      },

      resetDailyIfNeeded: () => {
        const { lastDailyReset } = get();
        const today = todayStr();
        if (lastDailyReset === today) return;
        set({
          todaySales: 0,
          todayReferrals: 0,
          dailySaleMilestoneAwarded: false,
          dailyReferralMilestoneAwarded: false,
          lastDailyReset: today,
        });
      },
    }),
    { name: 'estore-fd-v1' },
  ),
);
