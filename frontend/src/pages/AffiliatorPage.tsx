import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import {
  FiTrendingUp, FiDollarSign, FiStar, FiArrowRight, FiAward,
  FiUsers, FiShoppingBag, FiCheckCircle, FiBarChart2, FiPercent,
  FiArrowUp, FiArrowDown, FiMinus,
} from 'react-icons/fi';
import { useProductStore } from '../store/productStore';
import { Product } from '../data/products';
import ProductCard from '../components/product/ProductCard';

// ─── Leaderboard data ─────────────────────────────────────────────────────────
const LEADERBOARD = [
  { rank: 1,  name: 'MarketingMike',  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face', sales: 142, commission: 2840, items: 8,  trend: '+18%', up: true,  category: 'Electronics', badge: 'Top Earner' },
  { rank: 2,  name: 'SalesStar_Ria',  avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face', sales: 118, commission: 2360, items: 6,  trend: '+12%', up: true,  category: 'Fashion',     badge: 'Rising Star' },
  { rank: 3,  name: 'PromoKing_Dan',  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face', sales: 97,  commission: 1940, items: 5,  trend: '+9%',  up: true,  category: 'Audio',       badge: 'Consistent' },
  { rank: 4,  name: 'ClickMaster',    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face', sales: 84,  commission: 1680, items: 4,  trend: '+5%',  up: true,  category: 'Gaming',      badge: null },
  { rank: 5,  name: 'ConvertQueen',   avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face', sales: 76,  commission: 1520, items: 7,  trend: '0%',   up: false, category: 'Beauty',      badge: null },
  { rank: 6,  name: 'SocialShop_Sam', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face', sales: 68,  commission: 1360, items: 3,  trend: '-2%',  up: false, category: 'Sports',      badge: null },
  { rank: 7,  name: 'InfluenceNick',  avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&h=200&fit=crop&crop=face', sales: 61,  commission: 1220, items: 5,  trend: '+7%',  up: true,  category: 'Electronics', badge: null },
  { rank: 8,  name: 'LinkLord_Amy',   avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face', sales: 54,  commission: 1080, items: 4,  trend: '+3%',  up: true,  category: 'Fashion',     badge: null },
  { rank: 9,  name: 'TrafficTom',     avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face', sales: 47,  commission: 940,  items: 3,  trend: '-4%',  up: false, category: 'Audio',       badge: null },
  { rank: 10, name: 'EarnMore_Zara',  avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&h=200&fit=crop&crop=face', sales: 39,  commission: 780,  items: 2,  trend: '+1%',  up: true,  category: 'Beauty',      badge: null },
];

// ─── commissionProducts is computed inside AffiliatorPage (see below) ──────────

// ─── Recent activity feed ─────────────────────────────────────────────────────
const RECENT_SALES = [
  { affiliate: 'MarketingMike', product: 'Premium Wireless Headphones', amount: 89,  commission: 17.80, time: '3 min ago' },
  { affiliate: 'SalesStar_Ria', product: 'Smart Watch Pro',             amount: 199, commission: 39.80, time: '11 min ago' },
  { affiliate: 'PromoKing_Dan', product: 'Bluetooth Speaker',           amount: 69,  commission: 13.80, time: '28 min ago' },
  { affiliate: 'ClickMaster',   product: 'Gaming Keyboard RGB',         amount: 129, commission: 25.80, time: '45 min ago' },
  { affiliate: 'ConvertQueen',  product: 'Wireless Earbuds',            amount: 79,  commission: 15.80, time: '1h ago' },
];

// ─── Podium card ──────────────────────────────────────────────────────────────
const PodiumCard: React.FC<{ entry: typeof LEADERBOARD[0]; position: 1 | 2 | 3 }> = ({ entry, position }) => {
  const config = {
    1: { height: 'h-48', bg: 'from-yellow-500/20 to-amber-600/10', border: 'border-yellow-500/40', label: '1st Place', glow: 'shadow-yellow-500/20', labelColor: 'text-yellow-400', size: 'w-24 h-24', ring: 'from-yellow-400 via-amber-400 to-yellow-600' },
    2: { height: 'h-36', bg: 'from-slate-400/20 to-slate-500/10', border: 'border-slate-400/40', label: '2nd Place', glow: 'shadow-slate-400/20', labelColor: 'text-slate-300', size: 'w-20 h-20', ring: 'from-slate-300 via-slate-400 to-slate-500' },
    3: { height: 'h-28', bg: 'from-amber-700/20 to-amber-800/10', border: 'border-amber-700/40', label: '3rd Place', glow: 'shadow-amber-700/20', labelColor: 'text-amber-600', size: 'w-18 h-18', ring: 'from-amber-600 via-amber-700 to-amber-800' },
  }[position];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position * 0.12, type: 'spring', stiffness: 120 }}
      className={`flex flex-col items-center justify-end ${config.height}`}
    >
      {/* Avatar */}
      <div className="flex flex-col items-center gap-2 mb-3">
        <div className={`rounded-full p-[2.5px] shadow-xl ${config.glow}`}
          style={{ background: `linear-gradient(135deg,var(--tw-gradient-stops))`, backgroundImage: `linear-gradient(135deg,${config.ring.replace('from-','').replace(' via-','').replace(' to-','')})` }}>
          <div className={`${config.size === 'w-24 h-24' ? 'w-24 h-24' : config.size === 'w-20 h-20' ? 'w-20 h-20' : 'w-16 h-16'} rounded-full overflow-hidden border-2 border-background`}>
            <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" />
          </div>
        </div>
        {entry.badge && (
          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${config.border} ${config.labelColor} bg-card`}>
            {entry.badge}
          </span>
        )}
        <p className="text-sm font-black text-foreground text-center leading-tight">{entry.name}</p>
        <p className="text-xs text-muted-foreground">{entry.category}</p>
        <p className={`text-base font-black ${config.labelColor}`}>${entry.commission.toLocaleString()}</p>
      </div>
      {/* Podium bar */}
      <div className={`w-full rounded-t-xl border-t border-x ${config.border} bg-gradient-to-b ${config.bg} flex items-center justify-center pt-3 pb-2`} style={{ minHeight: 48 }}>
        <span className={`text-xs font-black uppercase tracking-widest ${config.labelColor}`}>{config.label}</span>
      </div>
    </motion.div>
  );
};

// ─── Rank table row ───────────────────────────────────────────────────────────
const RankRow: React.FC<{ entry: typeof LEADERBOARD[0]; i: number }> = ({ entry, i }) => (
  <motion.div
    initial={{ opacity: 0, x: -16 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: i * 0.05 }}
    className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-secondary/30 transition-all"
  >
    <span className="w-7 text-center text-sm font-black text-muted-foreground flex-shrink-0">#{entry.rank}</span>
    <img src={entry.avatar} alt={entry.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-border" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-foreground truncate">{entry.name}</p>
      <p className="text-[10px] text-muted-foreground">{entry.category}</p>
    </div>
    <div className="hidden sm:flex flex-col items-end">
      <span className="text-xs font-bold text-foreground">{entry.sales} sales</span>
      <span className="text-[10px] text-muted-foreground">{entry.items} products</span>
    </div>
    <div className="flex flex-col items-end flex-shrink-0">
      <span className="text-sm font-black text-emerald-400">${entry.commission.toLocaleString()}</span>
      <span className="text-[10px] text-muted-foreground">this week</span>
    </div>
    <div className={`flex items-center gap-0.5 text-[10px] font-bold flex-shrink-0 w-12 justify-end ${entry.up ? 'text-emerald-400' : entry.trend === '0%' ? 'text-muted-foreground' : 'text-rose-400'}`}>
      {entry.up ? <FiArrowUp className="w-3 h-3" /> : entry.trend === '0%' ? <FiMinus className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />}
      {entry.trend}
    </div>
  </motion.div>
);

// ─── Commission product card overlay ─────────────────────────────────────────
const CommissionCard: React.FC<{ product: Product; i: number }> = ({ product, i }) => (
  <div className="relative">
    <ProductCard product={product} />
    <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1 pointer-events-none">
      <div className="px-2 py-0.5 rounded-md text-white text-[9px] font-black uppercase tracking-wide"
        style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
        20% Commission
      </div>
      <div className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white/80 text-[9px] font-semibold">
        PKR {(product.price * 0.2).toFixed(0)} per sale
      </div>
    </div>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const AffiliatorPage: React.FC = () => {
  const { products } = useProductStore();
  const commissionProducts = React.useMemo(() =>
    [...products]
      .filter(p => p.isBestSeller && p.category !== 'Digital')
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, 8),
    [products]
  );
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const top3 = LEADERBOARD.slice(0, 3);
  const rest  = LEADERBOARD.slice(3);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative py-20 overflow-hidden border-b border-border"
        style={{ background: 'linear-gradient(135deg,#04040f 0%,#080820 60%,#04040f 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-black uppercase tracking-widest mb-6">
              <FiAward className="w-3.5 h-3.5" /> Affiliate Leaderboard
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-tight mb-4">
              Top Affiliators<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">This Week</span>
            </h1>
            <p className="text-white/50 text-base max-w-md mx-auto mb-8">
              Earn 20% commission on every sale you drive. Share products, get paid weekly.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm">
                <FiPercent className="w-4 h-4 text-primary" /> 20% per sale
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm">
                <FiDollarSign className="w-4 h-4 text-emerald-400" /> Weekly payouts
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm">
                <FiUsers className="w-4 h-4 text-blue-400" /> 240+ active affiliators
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 space-y-16">

        {/* ── Period toggle ──────────────────────────────────────────────────── */}
        <div className="flex justify-center">
          <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
            {(['weekly', 'monthly'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all capitalize ${
                  period === p ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p === 'weekly' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Podium ─────────────────────────────────────────────────────────── */}
        <section>
          <div className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-1">Top 3</p>
            <h2 className="text-2xl md:text-3xl font-black text-foreground">Podium Leaders</h2>
          </div>
          <div className="max-w-lg mx-auto grid grid-cols-3 gap-3 items-end">
            <PodiumCard entry={top3[1]} position={2} />
            <PodiumCard entry={top3[0]} position={1} />
            <PodiumCard entry={top3[2]} position={3} />
          </div>
        </section>

        {/* ── Full rank table ────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-1">Rankings</p>
              <h2 className="text-2xl md:text-3xl font-black text-foreground">Full Leaderboard</h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><FiArrowUp className="w-3 h-3 text-emerald-400" /> Up</span>
              <span className="flex items-center gap-1"><FiArrowDown className="w-3 h-3 text-rose-400" /> Down</span>
            </div>
          </div>

          {/* Top 3 in table form */}
          <div className="space-y-2 mb-3">
            {top3.map((entry, i) => <RankRow key={entry.rank} entry={entry} i={i} />)}
          </div>
          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Positions 4–10</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="space-y-2">
            {rest.map((entry, i) => <RankRow key={entry.rank} entry={entry} i={i + 3} />)}
          </div>
        </section>

        {/* ── Recent sales feed ──────────────────────────────────────────────── */}
        <section>
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-400 mb-1">Live Feed</p>
            <h2 className="text-2xl md:text-3xl font-black text-foreground">Recent Sales</h2>
            <p className="text-sm text-muted-foreground mt-1">Real-time affiliate conversions — earn 20% on each</p>
          </div>
          <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
            {RECENT_SALES.map((sale, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/30 transition-colors">
                <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{sale.product}</p>
                  <p className="text-[11px] text-muted-foreground">by <span className="text-primary font-semibold">{sale.affiliate}</span></p>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className="text-sm font-black text-emerald-400">+PKR {sale.commission.toFixed(0)}</span>
                  <span className="text-[10px] text-muted-foreground">{sale.time}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Commission products ────────────────────────────────────────────── */}
        <section>
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-primary mb-1">Top Earners</p>
            <h2 className="text-2xl md:text-3xl font-black text-foreground">Most Sold Products</h2>
            <p className="text-sm text-muted-foreground mt-1">Promote these to maximise your weekly commission</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {commissionProducts.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <CommissionCard product={p} i={i} />
              </motion.div>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Link href="/shop"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-border bg-card hover:bg-secondary font-bold text-sm text-foreground transition-all hover:border-primary hover:text-primary group">
              Browse All Products
              <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* ── Stats strip ────────────────────────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: FiDollarSign, label: 'Total Paid Out',    value: '$128K+', sub: 'To affiliators',          color: '#10b981' },
              { icon: FiUsers,      label: 'Active Affiliators', value: '240+',   sub: 'This month',              color: '#3b82f6' },
              { icon: FiBarChart2,  label: 'Avg Commission',    value: '$485',   sub: 'Per affiliator / week',   color: '#8b5cf6' },
              { icon: FiStar,       label: 'Top Earner',        value: '$2,840', sub: 'MarketingMike this week', color: '#f59e0b' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="rounded-2xl border border-border bg-card p-5">
                <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: `${s.color}18` }}>
                  <s.icon style={{ color: s.color, width: 20, height: 20 }} />
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">{s.label}</p>
                <p className="text-2xl font-black text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Join CTA ───────────────────────────────────────────────────────── */}
        <section className="pb-4">
          <div className="rounded-3xl overflow-hidden relative border border-primary/20"
            style={{ background: 'linear-gradient(135deg,#040d2a 0%,#071440 50%,#040d2a 100%)' }}>
            <div className="absolute inset-0 opacity-[0.06]"
              style={{ backgroundImage: 'radial-gradient(#3b82f6 1px,transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 blur-[100px] pointer-events-none" />
            <div className="relative z-10 p-8 md:p-14 flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1 text-white max-w-lg">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-black uppercase tracking-widest mb-6">
                  <FiDollarSign className="w-3 h-3" /> Join Today
                </div>
                <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">Start Earning 20%<br />on Every Sale</h2>
                <p className="text-white/60 mb-8 leading-relaxed">Share product links, earn commission on every order that comes through your referral. No upfront cost. No limits.</p>
                <ul className="space-y-3 mb-8">
                  {['Instant affiliate link generation', 'Real-time earnings dashboard', 'Weekly PayPal payouts', 'Dedicated affiliate support'].map(b => (
                    <li key={b} className="flex items-center gap-3 text-white/80 text-sm">
                      <FiCheckCircle className="w-4 h-4 text-primary flex-shrink-0" /> {b}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-3">
                  <a href="#" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-white font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/30">
                    <FiArrowRight className="w-4 h-4" /> Join Affiliate Program
                  </a>
                  <Link href="/shop" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white/10 text-white font-bold hover:bg-white/15 transition-all border border-white/15">
                    Browse Products
                  </Link>
                </div>
              </div>
              <div className="hidden md:flex flex-col items-center gap-4">
                <div className="w-40 h-40 rounded-full flex items-center justify-center border border-primary/20"
                  style={{ background: 'radial-gradient(circle,rgba(37,99,235,0.15),transparent 70%)' }}>
                  <FiTrendingUp className="w-20 h-20 text-primary/30" />
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </motion.div>
  );
};

export default AffiliatorPage;
