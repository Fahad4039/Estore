import React, { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useFDStore, FD_TO_PKR } from '../store/fdStore';
import { motion } from 'framer-motion';
import { FiArrowUpCircle, FiArrowDownCircle, FiRefreshCw } from 'react-icons/fi';

const TYPE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  earn:     { label: 'Earned',    color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  checkin:  { label: 'Check-In',  color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  sale:     { label: 'Sale',      color: 'text-blue-400',    bg: 'bg-blue-500/10' },
  referral: { label: 'Referral',  color: 'text-violet-400',  bg: 'bg-violet-500/10' },
  topup:    { label: 'Top-Up',    color: 'text-cyan-400',    bg: 'bg-cyan-500/10' },
  cashout:  { label: 'Cash Out',  color: 'text-rose-400',    bg: 'bg-rose-500/10' },
  spend:    { label: 'Spent',     color: 'text-rose-400',    bg: 'bg-rose-500/10' },
};

const WalletPage: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { coins, transactions } = useFDStore();

  useEffect(() => {
    if (!loading && !currentUser) setLocation('/login');
  }, [currentUser, loading]);

  if (loading || !currentUser) return null;

  return (
    <div className="container mx-auto px-4 py-12">
      <div>
        <main className="space-y-6">
          <h1 className="text-3xl font-black">Coins</h1>

          {/* Balance hero */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-8 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 60%, #8b5cf6 100%)' }}
          >
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute right-10 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-2">Total Balance</p>
            <div className="flex items-end gap-3">
              <p className="text-6xl font-black text-white">{coins.toLocaleString()}</p>
              <p className="text-blue-200 text-lg mb-2 font-bold">Coins</p>
            </div>
            <p className="text-blue-200 mt-1 font-medium">≈ ₨{(coins * FD_TO_PKR).toFixed(0)} PKR</p>
            <p className="text-blue-300/60 text-xs mt-1">Exchange: 1,000 Coins = ₨100 PKR</p>
          </motion.div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/top-up">
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:border-emerald-500/40 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <FiArrowUpCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold">Top Up</p>
                  <p className="text-xs text-muted-foreground">Add Coins</p>
                </div>
              </motion.div>
            </Link>
            <Link href="/cashout">
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:border-rose-500/40 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-rose-500/15 flex items-center justify-center flex-shrink-0">
                  <FiArrowDownCircle className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <p className="font-bold">Cash Out</p>
                  <p className="text-xs text-muted-foreground">Convert to PKR</p>
                </div>
              </motion.div>
            </Link>
          </div>

          {/* Exchange info */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <FiRefreshCw className="w-4 h-4 text-primary" />
              <h3 className="font-bold">Exchange Rates</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[{ fd: '1,000', pkr: '100' }, { fd: '5,000', pkr: '500' }, { fd: '10,000', pkr: '1,000' }].map((r) => (
                <div key={r.fd} className="bg-secondary/50 rounded-xl p-3">
                  <p className="font-black text-primary">{r.fd}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">= ₨{r.pkr}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction history */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-lg">Recent Transactions</h3>
              <Link href="/statement" className="text-sm text-primary hover:underline font-medium">Full Statement →</Link>
            </div>
            {transactions.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-4xl mb-3">🪙</p>
                <p className="font-bold">No transactions yet</p>
                <p className="text-sm text-muted-foreground mt-1">Check in daily or complete sales to earn Coins</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {transactions.slice(0, 20).map((tx) => {
                  const cfg = TYPE_CFG[tx.type] || TYPE_CFG.earn;
                  return (
                    <div key={tx.id} className="px-5 py-4 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                        <span className={`text-xs font-black ${cfg.color}`}>{cfg.label.slice(0, 2)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-black text-sm ${tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} Coins
                        </p>
                        <p className="text-xs text-muted-foreground">₨{Math.abs(tx.pkrValue).toFixed(0)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default WalletPage;
