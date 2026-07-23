import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useFDStore, FD_TO_PKR, CHECKIN_REWARDS } from '../store/fdStore';
import { useOrderStore } from '../store/orderStore';
import { useProductStore } from '../store/productStore';
import { Product } from '../data/products';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiShoppingBag, FiPackage, FiCheckCircle,
  FiArrowRight, FiStar, FiClock, FiHeart,
  FiShoppingCart, FiCalendar, FiCreditCard,
  FiTrendingUp, FiDollarSign, FiZap,
  FiEdit2, FiCheck, FiCamera, FiX,
} from 'react-icons/fi';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#1e3a8a 0%,#3730a3 40%,#581c87 100%)',
  'linear-gradient(135deg,#064e3b 0%,#065f46 40%,#047857 100%)',
  'linear-gradient(135deg,#7c2d12 0%,#92400e 40%,#b45309 100%)',
  'linear-gradient(135deg,#831843 0%,#9d174d 40%,#be185d 100%)',
  'linear-gradient(135deg,#0c4a6e 0%,#075985 40%,#0369a1 100%)',
];

/* ── animation helper ── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, type: 'spring' as const, stiffness: 360, damping: 30 },
});

/* ── tiny product card used in horizontal scroll ── */
const MiniProductCard: React.FC<{ p: { id: string; name: string; brand: string; price: number; images: string[]; category: string }; badge?: string }> = ({ p, badge }) => (
  <Link href={`/product/${p.id}`}>
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="flex-shrink-0 w-44 bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-primary/30 transition-colors"
    >
      <div className="relative h-36 bg-secondary/40 overflow-hidden">
        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
        {badge && (
          <span className="absolute top-2 left-2 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary text-primary-foreground shadow">
            {badge}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-[10px] text-muted-foreground font-semibold">{p.brand}</p>
        <p className="text-xs font-bold leading-snug line-clamp-2 mt-0.5">{p.name}</p>
        <p className="text-sm font-black text-primary mt-1.5">₨{p.price.toLocaleString()}</p>
      </div>
    </motion.div>
  </Link>
);

/* ── featured "must have" banner card ── */
const MustHaveCard: React.FC<{ p: Product }> = ({ p }) => (
  <Link href={`/product/${p.id}`}>
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="relative overflow-hidden rounded-3xl cursor-pointer"
      style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%)' }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
      <div className="absolute -right-8 -top-8 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute -right-4 bottom-0 w-48 h-48 bg-violet-500/20 rounded-full blur-2xl" />
      <div className="relative flex items-center gap-0 min-h-[140px]">
        <div className="flex-1 p-6 pr-0 z-10">
          <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full px-3 py-1 mb-3">
            Must Have
          </span>
          <h3 className="text-lg font-black text-white leading-tight line-clamp-2">{p.name}</h3>
          <p className="text-muted-foreground text-xs mt-1">{p.brand} · {p.category}</p>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xl font-black text-white">₨{p.price.toLocaleString()}</span>
            {p.originalPrice > p.price && (
              <span className="text-xs text-muted-foreground line-through">₨{p.originalPrice.toLocaleString()}</span>
            )}
            {p.discount > 0 && (
              <span className="text-xs font-bold text-emerald-400">-{p.discount}%</span>
            )}
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary border border-primary/30 bg-primary/10 rounded-xl px-3 py-1.5">
            Shop Now <FiArrowRight className="w-3 h-3" />
          </div>
        </div>
        <div className="w-36 h-36 flex-shrink-0 overflow-hidden rounded-2xl m-3 ml-0 shadow-2xl">
          <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
        </div>
      </div>
    </motion.div>
  </Link>
);

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
const DashboardPage: React.FC = () => {
  const { products } = useProductStore();
  const { currentUser, loading, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const { itemCount } = useCartStore();
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const { coins, checkInStreak, lastCheckInDate, isSeller, todaySales, resetDailyIfNeeded } = useFDStore();
  const { orders, totalSpent, pendingCount, fulfilledCount, recentProducts } = useOrderStore();

  /* editable profile state */
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [avatarIdx, setAvatarIdx] = useState<number>(() => {
    const s = localStorage.getItem('estore-avatar-idx'); return s ? parseInt(s) : 0;
  });
  const [customName, setCustomName] = useState<string>(() => localStorage.getItem('estore-profile-name') || '');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !currentUser) setLocation('/login');
    resetDailyIfNeeded();
  }, [currentUser, loading]);

  if (loading || !currentUser) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const alreadyCheckedIn = lastCheckInDate === todayStr;
  const nextReward = CHECKIN_REWARDS[checkInStreak % 7];

  const baseDisplayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
  const displayName = customName || baseDisplayName;
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const startEditName = () => {
    setEditedName(displayName);
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };
  const saveEditName = () => {
    const trimmed = editedName.trim();
    if (trimmed) { setCustomName(trimmed); localStorage.setItem('estore-profile-name', trimmed); }
    setEditingName(false);
  };
  const cycleAvatar = () => {
    const next = (avatarIdx + 1) % AVATAR_GRADIENTS.length;
    setAvatarIdx(next);
    localStorage.setItem('estore-avatar-idx', String(next));
  };

  /* ── product slices ── */
  const recentlyBought = recentProducts();
  const featured       = products.filter((p) => p.isFeatured).slice(0, 10);
  const trending       = products.filter((p) => p.isTrending).slice(0, 10);
  const mustHave       = products.find((p) => p.isBestSeller && p.isFeatured) || products[0];
  const flashDeals     = products.filter((p) => p.isFlashSale).slice(0, 8);

  return (
    <div className="min-h-screen pb-16">

      {/* ══════════════════════════════
          PROFILE BANNER — extends behind header
      ══════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#03040e 0%,#0a0720 30%,#0d1535 65%,#050e24 100%)', marginTop: '-60px', paddingTop: '60px' }}
      >
        {/* glow orbs */}
        <div className="absolute -top-10 -left-20 w-[520px] h-[520px] opacity-35 pointer-events-none rounded-full"
          style={{ background: 'radial-gradient(circle,#3b82f6 0%,#4f46e5 40%,transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute top-0 right-0 w-[420px] h-[420px] opacity-22 pointer-events-none rounded-full"
          style={{ background: 'radial-gradient(circle,#7c3aed 0%,#db2777 50%,transparent 70%)', filter: 'blur(70px)' }} />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[200px] opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse,#06b6d4 0%,transparent 70%)', filter: 'blur(50px)' }} />
        {/* grid */}
        <div className="absolute inset-0 opacity-[0.032] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        {/* rainbow shimmer at top */}
        <div className="absolute top-[60px] left-0 right-0 h-px opacity-40"
          style={{ background: 'linear-gradient(90deg,transparent,#3b82f6,#7c3aed,#06b6d4,transparent)' }} />

        <div className="relative container mx-auto px-4 pb-10">

          {/* ── WELCOME BAR (sits just below fixed header) ── */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, type: 'spring', stiffness: 320, damping: 28 }}
            className="pt-[76px] pb-6"
          >
            <div
              className="rounded-2xl px-5 py-4 flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)', backdropFilter: 'blur(12px)' }}
            >
              {/* mini avatar */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-lg"
                style={{ background: AVATAR_GRADIENTS[avatarIdx] }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-black text-white leading-tight">
                  Welcome back, {displayName.split(' ')[0]}!
                </p>
                <p className="text-xs text-white/45 mt-0.5">
                  View orders, manage wallet, and explore deals from your dashboard.
                </p>
              </div>
              <Link href="/checkin">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="flex-shrink-0 flex items-center gap-1.5 text-[10px] font-bold text-amber-300 border border-amber-400/25 bg-amber-400/10 rounded-full px-3 py-1.5 cursor-pointer hover:border-amber-400/45 transition-colors"
                >
                  <FiZap className="w-3 h-3" /> Daily Bonus
                </motion.div>
              </Link>
            </div>
          </motion.div>

          {/* ── AVATAR + PROFILE ── */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-7">

            {/* Editable Photo Avatar */}
            <motion.div {...fadeUp(0)} className="relative flex-shrink-0 group">
              {/* spinning conic ring */}
              <motion.div
                className="absolute -inset-1 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                style={{ background: 'conic-gradient(from 0deg,#3b82f6,#7c3aed,#db2777,#06b6d4,#3b82f6)', filter: 'blur(2px)', opacity: 0.75 }}
              />
              <div className="absolute -inset-0.5 rounded-full" style={{ background: '#050e24' }} />
              {/* circle */}
              <div
                className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center select-none shadow-2xl overflow-hidden cursor-pointer"
                style={{ background: AVATAR_GRADIENTS[avatarIdx] }}
                onClick={cycleAvatar}
                title="Click to change avatar color"
              >
                <div className="absolute inset-0 opacity-20"
                  style={{ backgroundImage: 'radial-gradient(circle at 30% 30%,rgba(255,255,255,0.6) 0%,transparent 50%)' }} />
                <span className="relative text-4xl font-black text-white tracking-tighter drop-shadow-lg">{initials}</span>
                {/* hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex flex-col items-center gap-1">
                    <FiCamera className="w-5 h-5 text-white" />
                    <span className="text-[9px] text-white font-bold">Change Color</span>
                  </div>
                </div>
              </div>
              {/* online dot */}
              <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-[#050e24] shadow-lg shadow-emerald-500/70" />
            </motion.div>

            {/* Editable Name + info */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <motion.div {...fadeUp(0.04)} className="inline-flex items-center gap-1.5 bg-blue-500/15 border border-blue-500/25 rounded-full px-3 py-1 mb-3">
                <FiCheckCircle className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Verified Account</span>
              </motion.div>

              {/* Editable display name */}
              <motion.div {...fadeUp(0.06)} className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <AnimatePresence mode="wait">
                  {editingName ? (
                    <motion.div
                      key="input"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className="flex items-center gap-2"
                    >
                      <input
                        ref={nameInputRef}
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEditName(); if (e.key === 'Escape') setEditingName(false); }}
                        className="text-2xl sm:text-3xl font-black text-white bg-transparent border-b-2 border-primary outline-none w-48 sm:w-64 tracking-tight leading-none"
                        maxLength={32}
                      />
                      <button onClick={saveEditName} className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-400 transition-colors">
                        <FiCheck className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                      <button onClick={() => setEditingName(false)} className="p-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-white/50 transition-colors">
                        <FiX className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div key="name" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 group/name">
                      <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">{displayName}</h1>
                      <button
                        onClick={startEditName}
                        className="opacity-0 group-hover/name:opacity-100 p-1.5 rounded-lg bg-white/8 hover:bg-white/18 text-white/50 hover:text-white transition-all"
                        title="Edit name"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.p {...fadeUp(0.09)} className="text-sm text-white/40 font-medium">{currentUser.email}</motion.p>
              <motion.div {...fadeUp(0.12)} className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mt-4">
                <div className="flex items-center gap-1.5 bg-yellow-500/15 border border-yellow-500/25 rounded-full px-3 py-1">
                  <FiStar className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs font-semibold text-yellow-300">Free Member</span>
                </div>
                <Link href="/membership">
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 cursor-pointer text-xs font-bold text-white/80 border border-white/15 hover:border-white/30 transition-colors"
                  >
                    Upgrade to VIP
                  </motion.div>
                </Link>
              </motion.div>
              <motion.div {...fadeUp(0.15)} className="flex justify-center sm:justify-start gap-3 mt-5">
                <Link href="/shop">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', boxShadow: '0 6px 28px rgba(124,58,237,0.5)' }}
                  >
                    <FiShoppingCart className="w-4 h-4" /> Shop Now
                  </motion.div>
                </Link>
                <Link href="/account/orders">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer border border-white/15 text-white/80 hover:border-white/30 hover:text-white transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <FiPackage className="w-4 h-4" /> My Orders
                  </motion.div>
                </Link>
              </motion.div>
            </div>
          </div>

          {/* ── KEY STATS ── */}
          <motion.div {...fadeUp(0.18)} className="grid grid-cols-3 gap-3 mt-8">
            {[
              { icon: FiCalendar,   label: 'Day Streak',    value: String(checkInStreak),  sub: alreadyCheckedIn ? 'Checked in today' : 'Check in today!', color: 'border-amber-500/30 bg-amber-500/10', iconColor: 'text-amber-400' },
              { icon: FiPackage,    label: 'Total Orders',  value: String(orders.length),  sub: `${pendingCount()} pending`, color: 'border-violet-500/30 bg-violet-500/10', iconColor: 'text-violet-400' },
              { icon: FiDollarSign, label: 'Total Spent',   value: `₨${totalSpent().toFixed(0)}`, sub: `${fulfilledCount()} delivered`, color: 'border-rose-500/30 bg-rose-500/10', iconColor: 'text-rose-400' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 + i * 0.05, type: 'spring' }}
                className={`rounded-2xl border p-4 backdrop-blur-sm ${s.color}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className={`w-3.5 h-3.5 flex-shrink-0 ${s.iconColor}`} />
                  <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">{s.label}</p>
                </div>
                <p className="text-2xl font-black text-white leading-none">{s.value}</p>
                <p className="text-[10px] text-white/45 mt-1">{s.sub}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ══════════════════════════════
          BODY
      ══════════════════════════════ */}
      <div className="container mx-auto px-4 py-8 space-y-10">

        {/* ── ORDER STATS CARDS ── */}
        <motion.div {...fadeUp(0.05)} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Available Balance — full blue card */}
          <Link href="/wallet">
            <motion.div whileHover={{ y: -4 }} className="relative overflow-hidden rounded-2xl p-5 cursor-pointer col-span-2 lg:col-span-1"
              style={{ background: 'linear-gradient(135deg,#1d4ed8 0%,#4f46e5 100%)', boxShadow: '0 8px 32px rgba(29,78,216,0.4)' }}
            >
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
              <FiCreditCard className="w-5 h-5 text-blue-200 mb-3" />
              <p className="text-3xl font-black text-white leading-none">{coins.toLocaleString()}</p>
              <p className="text-xs text-blue-300 font-semibold mt-1">≈ ₨{(coins * FD_TO_PKR).toFixed(0)} PKR</p>
              <p className="text-[9px] text-blue-200/60 mt-0.5 uppercase tracking-wider">Available Balance</p>
              <div className="mt-3 flex items-center gap-1 text-blue-200 text-xs font-bold">
                View Wallet <FiArrowRight className="w-3 h-3" />
              </div>
            </motion.div>
          </Link>

          <Link href="/account/orders">
            <motion.div whileHover={{ y: -4 }} className="rounded-2xl border border-amber-500/20 bg-card p-5 cursor-pointer hover:border-amber-500/40 transition-colors">
              <FiClock className="w-5 h-5 text-amber-400 mb-3" />
              <p className="text-3xl font-black text-amber-400 leading-none">{pendingCount()}</p>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Orders Pending</p>
            </motion.div>
          </Link>

          <Link href="/account/orders">
            <motion.div whileHover={{ y: -4 }} className="rounded-2xl border border-emerald-500/20 bg-card p-5 cursor-pointer hover:border-emerald-500/40 transition-colors">
              <FiCheckCircle className="w-5 h-5 text-emerald-400 mb-3" />
              <p className="text-3xl font-black text-emerald-400 leading-none">{fulfilledCount()}</p>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Orders Fulfilled</p>
            </motion.div>
          </Link>

          <Link href="/account/orders">
            <motion.div whileHover={{ y: -4 }} className="rounded-2xl border border-border bg-card p-5 cursor-pointer hover:border-primary/30 transition-colors">
              <FiPackage className="w-5 h-5 text-primary mb-3" />
              <p className="text-3xl font-black leading-none">{orders.length}</p>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Total Orders</p>
            </motion.div>
          </Link>
        </motion.div>

        {/* ── DAILY STREAK BANNER ── */}
        {!alreadyCheckedIn && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Link href="/checkin">
              <motion.div whileHover={{ scale: 1.01 }} className="relative overflow-hidden rounded-2xl p-5 flex items-center gap-4 cursor-pointer border border-amber-500/30"
                style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.14) 0%, rgba(251,191,36,0.04) 100%)' }}
              >
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl" />
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <FiCalendar className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-amber-400 text-base leading-none">Daily Streak Available!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Claim <span className="text-amber-400 font-bold">+{nextReward.toLocaleString()} Coins</span>
                    {checkInStreak > 0 && <span className="ml-1 text-muted-foreground">· {checkInStreak} day streak</span>}
                  </p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm text-amber-400 border border-amber-500/30 bg-amber-500/10">
                  Claim <FiArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            </Link>
          </motion.div>
        )}

        {/* ── MUST HAVE BANNER ── */}
        <motion.div {...fadeUp(0.08)}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black flex items-center gap-2">
              <FiZap className="w-5 h-5 text-primary" /> Must Have
            </h2>
          </div>
          <MustHaveCard p={mustHave} />
        </motion.div>

        {/* ── ORDER HISTORY PRODUCTS ── */}
        {recentlyBought.length > 0 && (
          <motion.div {...fadeUp(0.1)}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black flex items-center gap-2">
                <FiPackage className="w-5 h-5 text-primary" /> Order History
              </h2>
              <Link href="/account/orders" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                View All <FiArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {recentlyBought.map((p) => (
                <MiniProductCard key={p.id} p={p} badge="Ordered" />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── FLASH DEALS ── */}
        {flashDeals.length > 0 && (
          <motion.div {...fadeUp(0.12)}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black flex items-center gap-2">
                <FiZap className="w-5 h-5 text-rose-400" />
                <span>Flash Deals</span>
                <span className="text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/25 rounded-full px-2 py-0.5 uppercase tracking-wider">Limited</span>
              </h2>
              <Link href="/shop" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                See All <FiArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {flashDeals.map((p) => (
                <MiniProductCard key={p.id} p={p} badge={`-${p.discount}%`} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── YOU MAY ALSO LIKE ── */}
        <motion.div {...fadeUp(0.14)}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black flex items-center gap-2">
              <FiTrendingUp className="w-5 h-5 text-primary" /> You May Also Like
            </h2>
            <Link href="/shop" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
              Browse All <FiArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {trending.map((p) => (
              <MiniProductCard key={p.id} p={p} badge={p.isBestSeller ? 'Best Seller' : undefined} />
            ))}
          </div>
        </motion.div>

        {/* ── FEATURED PICKS ── */}
        <motion.div {...fadeUp(0.16)}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black flex items-center gap-2">
              <FiStar className="w-5 h-5 text-yellow-400" /> Featured Picks
            </h2>
            <Link href="/shop" className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
              See All <FiArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {featured.map((p) => (
              <MiniProductCard key={p.id} p={p} badge={p.isNew ? 'New' : undefined} />
            ))}
          </div>
        </motion.div>

        {/* ── BOTTOM UTILITY ROW ── */}
        <motion.div {...fadeUp(0.18)} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: FiHeart,        label: 'Wishlist',      value: wishlistCount,  href: '/wishlist',     color: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/20 hover:border-rose-500/40' },
            { icon: FiShoppingCart, label: 'Cart Items',    value: itemCount(),    href: '/cart',         color: 'text-primary',    bg: 'bg-primary/10',    border: 'border-primary/20 hover:border-primary/40' },
            { icon: FiShoppingBag,  label: 'Seller Hub',    value: isSeller ? todaySales : 0, href: '/seller-hub', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20 hover:border-violet-500/40' },
            { icon: FiPackage,      label: 'Order History', value: orders.length,  href: '/account/orders', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20 hover:border-emerald-500/40' },
          ].map((s) => (
            <Link key={s.href} href={s.href}>
              <motion.div whileHover={{ y: -3 }} className={`rounded-2xl border ${s.border} bg-card p-5 cursor-pointer transition-colors`}>
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className={`text-3xl font-black ${s.color} leading-none`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1.5">{s.label}</p>
              </motion.div>
            </Link>
          ))}
        </motion.div>

      </div>
    </div>
  );
};

export default DashboardPage;
