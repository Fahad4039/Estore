import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useFDStore, DAILY_SALE_MILESTONE, MILESTONE_REWARD, SALE_REWARD } from '../store/fdStore';
import { motion, AnimatePresence } from 'framer-motion';
import SignInGate from '../components/ui/SignInGate';

const BENEFITS = [
  { emoji: '🪙', title: `${SALE_REWARD.toLocaleString()} FD per Sale`, desc: 'Earn FD Coins on every confirmed sale you record' },
  { emoji: '🎯', title: '10,000 FD Daily Bonus', desc: 'Hit 10 sales in a single day to unlock the milestone reward' },
  { emoji: '📊', title: 'Live Sales Dashboard', desc: 'Track your daily performance and FD earnings in real time' },
  { emoji: '🏆', title: 'Seller Leaderboard', desc: 'Compete with top sellers for exclusive rewards' },
];

const SellerHubPage: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { isSeller, becomeSeller, recordSale, todaySales, totalSales, sellerCoinsEarned, resetDailyIfNeeded } = useFDStore();
  const [toast, setToast] = useState<{ msg: string; milestone: boolean } | null>(null);

  useEffect(() => { resetDailyIfNeeded(); }, []);

  if (loading) return null;

  // Guest gate
  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div>
          <main className="flex-1 min-w-0">
            <SignInGate feature="Seller Hub" description="Join as a seller and earn FD Coins on every sale." fullPage={false} />
          </main>
        </div>
      </div>
    );
  }

  const handleRecordSale = () => {
    const result = recordSale();
    setToast({
      msg: result.milestoneHit
        ? `🎯 Milestone! +${MILESTONE_REWARD.toLocaleString()} FD bonus for 10 sales today!`
        : `✅ Sale #${result.totalToday} recorded! +${SALE_REWARD.toLocaleString()} FD`,
      milestone: result.milestoneHit,
    });
    setTimeout(() => setToast(null), 3500);
  };

  const progress = Math.min((todaySales / DAILY_SALE_MILESTONE) * 100, 100);
  const remaining = Math.max(DAILY_SALE_MILESTONE - todaySales, 0);

  if (!isSeller) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div>
          <main className="space-y-6">
            <h1 className="text-3xl font-black">Seller Hub</h1>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-10 text-center border border-primary/20 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(139,92,246,0.08) 100%)' }}>
              <div className="text-6xl mb-4">🏪</div>
              <h2 className="text-2xl font-black mb-2">Become a Seller</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-8">
                Earn <strong className="text-primary">{SALE_REWARD.toLocaleString()} FD Coins</strong> per sale.
                Hit 10 daily sales for a <strong className="text-yellow-400">{MILESTONE_REWARD.toLocaleString()} FD bonus!</strong>
              </p>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={becomeSeller}
                className="px-10 py-4 rounded-2xl font-black text-white text-lg"
                style={{ background: 'linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)', boxShadow: '0 8px 24px rgba(59,130,246,0.4)' }}>
                Activate Seller Account →
              </motion.button>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BENEFITS.map(b => (
                <div key={b.title} className="bg-card border border-border rounded-2xl p-5">
                  <p className="text-3xl mb-3">{b.emoji}</p>
                  <p className="font-bold">{b.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{b.desc}</p>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div>
        <main className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-3xl font-black">Seller Hub</h1>
            <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-black">✓ Active Seller</span>
          </div>
          <AnimatePresence>
            {toast && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`rounded-2xl p-4 border ${toast.milestone ? 'bg-yellow-500/15 border-yellow-500/30' : 'bg-emerald-500/15 border-emerald-500/30'}`}>
                <p className={`font-bold ${toast.milestone ? 'text-yellow-400' : 'text-emerald-400'}`}>{toast.msg}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { emoji: '📦', label: "Today's Sales", value: todaySales, sub: `${remaining} more for bonus` },
              { emoji: '🏆', label: 'Total Sales', value: totalSales, sub: 'All time' },
              { emoji: '🪙', label: 'FD Earned', value: sellerCoinsEarned.toLocaleString(), sub: `≈ ₨${(sellerCoinsEarned * 0.1).toFixed(0)} PKR` },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
                <p className="text-2xl mb-2">{s.emoji}</p>
                <p className="text-3xl font-black">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
                <p className="text-xs text-primary mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Daily Milestone</h3>
              <span className="font-black text-primary text-sm">{todaySales} / {DAILY_SALE_MILESTONE}</span>
            </div>
            <div className="h-4 bg-secondary rounded-full overflow-hidden mb-3">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: progress >= 100 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#2563eb,#3b82f6)' }} />
            </div>
            <p className="text-sm text-muted-foreground">
              {progress >= 100 ? `🎉 Milestone achieved! +${MILESTONE_REWARD.toLocaleString()} FD bonus earned!`
                : `${remaining} more sale${remaining !== 1 ? 's' : ''} → unlock +${MILESTONE_REWARD.toLocaleString()} FD bonus`}
            </p>
          </div>
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleRecordSale}
            className="w-full py-5 rounded-2xl font-black text-white text-lg"
            style={{ background: 'linear-gradient(135deg,#059669 0%,#10b981 100%)', boxShadow: '0 8px 32px rgba(16,185,129,0.3)' }}>
            🛒 Record a Sale (+{SALE_REWARD.toLocaleString()} FD Coins)
          </motion.button>
        </main>
      </div>
    </div>
  );
};

export default SellerHubPage;
