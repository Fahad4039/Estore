import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useFDStore, FD_TO_PKR } from '../store/fdStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useCartStore } from '../store/cartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit2, FiCheck, FiX, FiShield, FiMail } from 'react-icons/fi';

// Backward-compat shim — legacy imports won't break
export const AccountSidebar: React.FC<{ activePath?: string }> = () => null;

const AccountPage: React.FC = () => {
  const { currentUser, loading, setCurrentUser } = useAuth();
  const [, setLocation] = useLocation();
  const { coins } = useFDStore();
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const { itemCount } = useCartStore();
  const [nameEdit, setNameEdit] = useState(false);
  const [nameVal, setNameVal] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && !currentUser) setLocation('/login');
    if (currentUser) setNameVal(currentUser.displayName || '');
  }, [currentUser, loading]);

  if (loading || !currentUser) return null;

  const initials = (currentUser.displayName || currentUser.email || 'U')
    .split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  const memberSince = (currentUser as any).createdAt
    ? new Date((currentUser as any).createdAt).toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })
    : 'Recently';

  const handleSave = () => {
    if (currentUser && nameVal.trim()) {
      setCurrentUser({ ...currentUser, displayName: nameVal.trim() });
    }
    setNameEdit(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div>
        <main className="space-y-6">
          <h1 className="text-3xl font-black">My Profile</h1>

          {/* Profile hero */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-primary/20 p-8 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(37,99,235,0.03) 100%)' }}
          >
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-black text-3xl shadow-lg shadow-primary/30 flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                {nameEdit ? (
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      autoFocus
                      value={nameVal}
                      onChange={(e) => setNameVal(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                      className="bg-background/60 border border-primary/30 rounded-xl px-3 py-1.5 text-xl font-black focus:outline-none focus:ring-2 focus:ring-primary/50 w-full max-w-xs"
                    />
                    <button
                      onClick={handleSave}
                      className="p-2 rounded-xl bg-primary text-primary-foreground hover:opacity-80 flex-shrink-0"
                    >
                      <FiCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setNameEdit(false)}
                      className="p-2 rounded-xl bg-secondary hover:bg-secondary/70 flex-shrink-0"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-black truncate">
                      {currentUser.displayName || currentUser.email?.split('@')[0] || 'My Account'}
                    </h2>
                    <button
                      onClick={() => setNameEdit(true)}
                      className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                  <FiMail className="w-3.5 h-3.5" /> {currentUser.email}
                </p>
                <p className="text-xs text-muted-foreground/50 mt-1">Member since {memberSince}</p>
                <AnimatePresence>
                  {saved && (
                    <motion.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-emerald-400 text-xs mt-2 font-bold"
                    >
                      ✓ Profile updated
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { emoji: '🪙', label: 'FD Coins', value: coins.toLocaleString(), color: 'text-primary', sub: `₨${(coins * FD_TO_PKR).toFixed(0)} PKR` },
              { emoji: '❤️', label: 'Wishlist', value: wishlistCount, color: 'text-rose-400', sub: 'Saved items' },
              { emoji: '🛒', label: 'Cart', value: itemCount(), color: 'text-amber-400', sub: 'In cart' },
              { emoji: '📦', label: 'Orders', value: 0, color: 'text-blue-400', sub: 'Purchases' },
            ].map((s) => (
              <div key={s.label} className="bg-card border border-border rounded-2xl p-4 text-center">
                <p className="text-xl mb-1">{s.emoji}</p>
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                <p className="text-[10px] text-muted-foreground/50">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Settings form */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <FiShield className="w-5 h-5 text-primary" /> Account Settings
            </h3>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium mb-1.5">Display Name</label>
                {nameEdit ? (
                  <div className="flex gap-2">
                    <input
                      value={nameVal}
                      onChange={(e) => setNameVal(e.target.value)}
                      className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                    <button
                      onClick={handleSave}
                      className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-secondary/30 rounded-xl px-4 py-2.5 border border-border">
                    <span className="text-sm">{currentUser.displayName || '—'}</span>
                    <button
                      onClick={() => setNameEdit(true)}
                      className="text-primary text-xs font-bold hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email Address</label>
                <div className="flex items-center justify-between bg-secondary/30 rounded-xl px-4 py-2.5 border border-border">
                  <span className="text-sm text-muted-foreground">{currentUser.email}</span>
                  <span className="text-[10px] text-muted-foreground/40">Cannot change</span>
                </div>
              </div>
              <button className="px-5 py-2.5 bg-secondary hover:bg-secondary/70 border border-border rounded-xl text-sm font-bold transition-colors">
                Change Password
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AccountPage;
