import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useFDStore } from '../store/fdStore';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck } from 'react-icons/fi';

const PACKAGES = [
  { coins: 1000,  pkr: 100,  label: 'Starter',  bonus: 0 },
  { coins: 5000,  pkr: 500,  label: 'Popular',   bonus: 500, hot: true },
  { coins: 10000, pkr: 1000, label: 'Value',     bonus: 1500 },
  { coins: 25000, pkr: 2500, label: 'Premium',   bonus: 5000 },
];

const TopUpPage: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { topUp, coins } = useFDStore();
  const [selected, setSelected] = useState<number | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !currentUser) setLocation('/login');
  }, [currentUser, loading]);

  if (loading || !currentUser) return null;

  const handlePurchase = () => {
    if (selected === null) return;
    const pkg = PACKAGES[selected];
    topUp(pkg.pkr);
    setSuccess(`+${(pkg.coins + pkg.bonus).toLocaleString()} Coins added to your wallet!`);
    setSelected(null);
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div>
        <main className="space-y-6">
          <div>
            <h1 className="text-3xl font-black">Top Up</h1>
            <p className="text-muted-foreground mt-1">Add Coins to your wallet</p>
          </div>

          {/* Balance */}
          <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-2xl font-black text-primary">{coins.toLocaleString()} FD</p>
            </div>
            <span className="text-3xl">🪙</span>
          </div>

          {/* Packages */}
          <div>
            <h3 className="font-bold mb-4">Select a Package</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PACKAGES.map((pkg, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelected(i)}
                  className={`relative rounded-2xl border-2 p-6 text-left transition-all ${
                    selected === i
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  {pkg.hot && (
                    <span className="absolute top-3 right-3 text-[10px] font-black bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Most Popular
                    </span>
                  )}
                  {selected === i && (
                    <div className="absolute top-3 left-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <FiCheck className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {pkg.bonus > 0 && (
                    <p className="text-xs font-bold text-emerald-400 mb-2">
                      🎁 +{pkg.bonus.toLocaleString()} Bonus Coins!
                    </p>
                  )}
                  <p className="text-3xl font-black">{(pkg.coins + pkg.bonus).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Coins
                    {pkg.bonus > 0 ? ` (${pkg.coins.toLocaleString()} + ${pkg.bonus.toLocaleString()} bonus)` : ''}
                  </p>
                  <p className="text-2xl font-black text-primary mt-3">₨{pkg.pkr.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{pkg.label} Pack</p>
                </motion.button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-5 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-emerald-400">Top-Up Successful!</p>
                  <p className="text-sm text-muted-foreground">{success}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={selected !== null ? { scale: 1.01 } : {}}
            whileTap={selected !== null ? { scale: 0.98 } : {}}
            onClick={handlePurchase}
            disabled={selected === null}
            className="w-full py-4 rounded-2xl font-black text-white text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
              boxShadow: selected !== null ? '0 8px 24px rgba(59,130,246,0.4)' : 'none',
            }}
          >
            {selected !== null
              ? `Purchase for ₨${PACKAGES[selected].pkr.toLocaleString()}`
              : 'Select a Package'}
          </motion.button>
          <p className="text-xs text-muted-foreground text-center">Simulated top-up for demo purposes</p>
        </main>
      </div>
    </div>
  );
};

export default TopUpPage;
