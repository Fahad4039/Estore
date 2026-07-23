import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useFDStore, FD_TO_PKR } from '../store/fdStore';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiAlertCircle } from 'react-icons/fi';

const CashOutPage: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { coins, cashOut } = useFDStore();
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState<{ success: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (!loading && !currentUser) setLocation('/login');
  }, [currentUser, loading]);

  if (loading || !currentUser) return null;

  const numAmount = parseInt(amount) || 0;
  const pkrValue = numAmount * FD_TO_PKR;
  const canCashOut = numAmount >= 1000 && numAmount <= coins;

  const handleCashOut = () => {
    const res = cashOut(numAmount);
    if (res.success) {
      setResult({
        success: true,
        msg: `Successfully cashed out ${numAmount.toLocaleString()} Coins → ₨${res.pkr.toFixed(0)} PKR`,
      });
      setAmount('');
    } else {
      setResult({ success: false, msg: res.error || 'Cash out failed' });
    }
    setTimeout(() => setResult(null), 4000);
  };

  const quickAmounts = [1000, 5000, 10000].filter((v) => v <= coins);

  return (
    <div className="container mx-auto px-4 py-12">
      <div>
        <main className="space-y-6">
          <div>
            <h1 className="text-3xl font-black">Cash Out</h1>
            <p className="text-muted-foreground mt-1">Convert Coins to PKR</p>
          </div>

          {/* Balance */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 border border-primary/20"
            style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(37,99,235,0.04) 100%)' }}
          >
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className="text-4xl font-black text-primary mt-1">
              {coins.toLocaleString()}{' '}
              <span className="text-xl text-muted-foreground font-bold">FD</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">≈ ₨{(coins * FD_TO_PKR).toFixed(0)} PKR</p>
          </motion.div>

          {/* Form */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <h3 className="font-bold text-lg">Request Cash Out</h3>
            <div>
              <label className="block text-sm font-medium mb-2">Amount (Coins)</label>
              <input
                type="number"
                min="1000"
                max={coins}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Min. 1,000 Coins"
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="flex items-center justify-between mt-2 text-sm">
                <span className="text-muted-foreground">Min: 1,000 Coins</span>
                <button
                  onClick={() => setAmount(String(coins))}
                  className="text-primary hover:underline font-bold"
                >
                  Use Max ({coins.toLocaleString()} Coins)
                </button>
              </div>
            </div>

            {/* Live PKR preview */}
            {numAmount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-secondary/50 rounded-xl p-4 flex items-center justify-between"
              >
                <span className="text-muted-foreground text-sm">You'll receive</span>
                <span className="font-black text-emerald-400 text-xl">₨{pkrValue.toFixed(0)} PKR</span>
              </motion.div>
            )}

            {/* Quick amounts */}
            {quickAmounts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(String(v))}
                    className="px-4 py-2 bg-secondary hover:bg-secondary/70 rounded-xl text-sm font-bold transition-colors"
                  >
                    {v.toLocaleString()} Coins
                  </button>
                ))}
              </div>
            )}
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`rounded-2xl p-5 flex items-center gap-3 border ${
                  result.success
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                {result.success
                  ? <FiCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  : <FiAlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                <p className={`font-medium ${result.success ? 'text-emerald-400' : 'text-red-400'}`}>
                  {result.msg}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={canCashOut ? { scale: 1.01 } : {}}
            whileTap={canCashOut ? { scale: 0.98 } : {}}
            onClick={handleCashOut}
            disabled={!canCashOut}
            className="w-full py-4 rounded-2xl font-black text-white text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: canCashOut
                ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
                : 'rgba(255,255,255,0.05)',
              boxShadow: canCashOut ? '0 8px 24px rgba(239,68,68,0.3)' : 'none',
            }}
          >
            Cash Out {numAmount >= 1000 ? `${numAmount.toLocaleString()} FD` : ''}
          </motion.button>
          <p className="text-xs text-muted-foreground text-center">
            Minimum: 1,000 Coins = ₨100 PKR
          </p>
        </main>
      </div>
    </div>
  );
};

export default CashOutPage;
