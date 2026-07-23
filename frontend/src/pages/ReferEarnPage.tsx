import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useFDStore, DAILY_REFERRAL_MILESTONE, MILESTONE_REWARD, REFERRAL_REWARD } from '../store/fdStore';
import { motion, AnimatePresence } from 'framer-motion';
import SignInGate from '../components/ui/SignInGate';
import { FiCopy, FiCheck } from 'react-icons/fi';

const ReferEarnPage: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { addReferral, todayReferrals, totalReferrals, affiliateCoinsEarned, resetDailyIfNeeded } = useFDStore();
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ msg: string; milestone: boolean } | null>(null);

  useEffect(() => { resetDailyIfNeeded(); }, []);

  if (loading) return null;

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div>
          <main className="flex-1 min-w-0">
            <SignInGate feature="Refer & Earn" description="Sign in to get your referral link and start earning FD Coins." fullPage={false} />
          </main>
        </div>
      </div>
    );
  }

  const uid = (currentUser as any).uid?.slice(0, 8) || 'user1234';
  const referralLink = `https://estore.app/ref/${uid}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReferral = () => {
    const result = addReferral();
    setToast({
      msg: result.milestoneHit
        ? `🎯 Milestone! 10 referrals today = +${MILESTONE_REWARD.toLocaleString()} FD bonus!`
        : `✅ Referral #${result.totalToday} counted! +${REFERRAL_REWARD.toLocaleString()} FD earned`,
      milestone: result.milestoneHit,
    });
    setTimeout(() => setToast(null), 3500);
  };

  const progress = Math.min((todayReferrals / DAILY_REFERRAL_MILESTONE) * 100, 100);
  const remaining = Math.max(DAILY_REFERRAL_MILESTONE - todayReferrals, 0);

  return (
    <div className="container mx-auto px-4 py-12">
      <div>
        <main className="space-y-6">
          <div>
            <h1 className="text-3xl font-black">Refer & Earn</h1>
            <p className="text-muted-foreground mt-1">Invite friends, earn FD Coins on every referral</p>
          </div>
          <AnimatePresence>
            {toast && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`rounded-2xl p-4 border ${toast.milestone ? 'bg-yellow-500/15 border-yellow-500/30' : 'bg-emerald-500/15 border-emerald-500/30'}`}>
                <p className={`font-bold ${toast.milestone ? 'text-yellow-400' : 'text-emerald-400'}`}>{toast.msg}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-7 border border-violet-500/20 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.04) 100%)' }}>
            <div className="text-5xl mb-3">🤝</div>
            <h2 className="text-xl font-black">Invite & Earn FD Coins</h2>
            <p className="text-muted-foreground text-sm mt-1 max-w-md">
              Earn <span className="text-violet-400 font-bold">{REFERRAL_REWARD.toLocaleString()} FD</span> per referral.
              Bring 10 friends in a day for a <span className="text-yellow-400 font-bold">{MILESTONE_REWARD.toLocaleString()} FD bonus!</span>
            </p>
          </motion.div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold mb-3">Your Referral Link</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-secondary/50 rounded-xl px-4 py-3 text-sm font-mono truncate text-muted-foreground border border-border">
                {referralLink}
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm flex-shrink-0 transition-all"
                style={{ background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(37,99,235,0.15)', color: copied ? '#10b981' : '#3b82f6' }}>
                {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </motion.button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { emoji: '📅', label: "Today's Referrals", value: todayReferrals, sub: `${remaining} more for bonus` },
              { emoji: '👥', label: 'Total Referrals', value: totalReferrals, sub: 'All time' },
              { emoji: '🪙', label: 'FD Coins Earned', value: affiliateCoinsEarned.toLocaleString(), sub: `≈ ₨${(affiliateCoinsEarned * 0.1).toFixed(0)} PKR` },
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
              <span className="font-black text-primary text-sm">{todayReferrals} / {DAILY_REFERRAL_MILESTONE}</span>
            </div>
            <div className="h-4 bg-secondary rounded-full overflow-hidden mb-3">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: progress >= 100 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#7c3aed,#8b5cf6)' }} />
            </div>
            <p className="text-sm text-muted-foreground">
              {progress >= 100 ? `🎉 Daily bonus earned! +${MILESTONE_REWARD.toLocaleString()} FD`
                : `${remaining} more referral${remaining !== 1 ? 's' : ''} → +${MILESTONE_REWARD.toLocaleString()} FD bonus`}
            </p>
          </div>
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleReferral}
            className="w-full py-5 rounded-2xl font-black text-white text-lg"
            style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#8b5cf6 100%)', boxShadow: '0 8px 32px rgba(139,92,246,0.3)' }}>
            🤝 Simulate Referral (+{REFERRAL_REWARD.toLocaleString()} FD)
          </motion.button>
        </main>
      </div>
    </div>
  );
};

export default ReferEarnPage;
