import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHeart, FiShare2, FiShoppingCart, FiTruck, FiShield,
  FiMinus, FiPlus, FiStar, FiX, FiZoomIn, FiChevronLeft,
  FiChevronRight, FiCheck, FiRefreshCw, FiTag, FiZap,
  FiPackage, FiPlay, FiMonitor, FiLayers, FiArrowRight,
  FiAward, FiTool, FiGlobe, FiMessageSquare, FiSmartphone,
  FiSend, FiCamera, FiThumbsUp, FiClock, FiPhone, FiMail,
} from 'react-icons/fi';
import ShareModal from '../components/product/ShareModal';
import { Product } from '../data/products';
import { useProductStore } from '../store/productStore';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useRecentlyViewedStore } from '../store/recentlyViewedStore';
import { useUIStore } from '../store/uiStore';
import ReviewStars from '../components/product/ReviewStars';
import ProductCard from '../components/product/ProductCard';
import { useToast } from '@/hooks/use-toast';

/* ─── Product Attributes config per category ─────────────────────── */
const PRODUCT_ATTRS: Record<string, { colors: string[]; sizes: string[]; types: string[] }> = {
  Electronics: {
    colors: ['Midnight Black', 'Pearl White', 'Slate Blue', 'Space Gray'],
    sizes: [],
    types: ['Standard', 'Pro', 'Ultra'],
  },
  Fashion: {
    colors: ['Jet Black', 'Off White', 'Navy Blue', 'Forest Green', 'Burgundy'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    types: ['Regular Fit', 'Slim Fit', 'Oversized'],
  },
  Audio: {
    colors: ['Matte Black', 'Pearl White', 'Midnight Blue'],
    sizes: [],
    types: ['Wired', 'Wireless', 'Pro Wireless'],
  },
  Gaming: {
    colors: ['Stealth Black', 'Arctic White', 'RGB Edition'],
    sizes: [],
    types: ['Standard', 'Pro', 'Tournament'],
  },
  Sports: {
    colors: ['Black', 'Navy', 'Red', 'White'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    types: ['Standard', 'Pro', 'Lightweight'],
  },
  Beauty: {
    colors: ['Classic Nude', 'Deep Rose', 'Berry Red', 'Coral Glow'],
    sizes: [],
    types: ['Regular', 'Long-lasting', 'Travel Size'],
  },
  Kitchen: {
    colors: ['Matte Black', 'Pearl White', 'Brushed Steel'],
    sizes: [],
    types: ['Standard', 'Deluxe', 'Professional'],
  },
  Home: {
    colors: ['White', 'Warm Beige', 'Slate Gray', 'Charcoal'],
    sizes: ['Small', 'Medium', 'Large'],
    types: ['Standard', 'Premium', 'Luxury'],
  },
  Digital: {
    colors: [],
    sizes: [],
    types: ['Basic', 'Standard', 'Premium', 'Enterprise'],
  },
};

const DEFAULT_ATTRS = { colors: ['Black', 'White'], sizes: [], types: ['Standard', 'Premium'] };

/* ─── Bulk discount tiers ─────────────────────────────────────────── */
const BULK_TIERS = [
  { min: 1,   max: 9,        label: '1–9 units',    pct: 0  },
  { min: 10,  max: 49,       label: '10–49 units',  pct: 5  },
  { min: 50,  max: 99,       label: '50–99 units',  pct: 15 },
  { min: 100, max: Infinity, label: '100+ units',   pct: 50 },
];

function getBulkTier(qty: number) {
  return BULK_TIERS.find((t) => qty >= t.min && qty <= t.max) ?? BULK_TIERS[0];
}

/* ─── Typing badge ───────────────────────────────────────────────── */
const TypingBadge: React.FC<{ text: string; bgStyle: React.CSSProperties }> = ({ text, bgStyle }) => {
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (visible < text.length) {
      timer = setTimeout(() => setVisible((v) => v + 1), 150);
    } else {
      timer = setTimeout(() => setVisible(0), 2200);
    }
    return () => clearTimeout(timer);
  }, [visible, text.length]);
  return (
    <span className="text-white text-[11px] font-black px-3 py-1 rounded-md shadow-md tracking-wide inline-block" style={bgStyle}>
      {text.slice(0, visible)}
    </span>
  );
};

const BADGE_PRIORITY = [
  { key: 'isNew',        text: 'NEW',         bgStyle: { background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' } },
  { key: 'isFlashSale',  text: 'FLASH SALE',  bgStyle: { background: 'linear-gradient(135deg,#dc2626,#b91c1c)' } },
  { key: 'isBestSeller', text: 'BEST SELLER', bgStyle: { background: 'linear-gradient(135deg,#d97706,#b45309)' } },
  { key: 'isTrending',   text: 'TRENDING',    bgStyle: { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' } },
];

/* ─── Compare Store ─────────────────────────────────────────────── */
const CompareStore = {
  items: [] as string[],
  add(id: string) { if (!this.items.includes(id) && this.items.length < 3) this.items.push(id); },
  has(id: string) { return this.items.includes(id); },
  remove(id: string) { this.items = this.items.filter((i) => i !== id); },
};

/* ─── Image Zoom Modal ────────────────────────────────────────────── */
const ImageZoomModal: React.FC<{ images: string[]; initialIndex: number; productName: string; onClose: () => void }> = ({
  images, initialIndex, productName, onClose,
}) => {
  const [idx, setIdx] = useState(initialIndex);
  const prev = useCallback(() => setIdx((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % images.length), [images.length]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [onClose, prev, next]);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md"
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10">
        <FiX className="w-6 h-6" />
      </button>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium">{idx + 1} / {images.length}</div>
      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white">
            <FiChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white">
            <FiChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
      <motion.img key={idx} src={images[idx]} alt={`${productName} ${idx + 1}`}
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
        className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()} />
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2" onClick={(e) => e.stopPropagation()}>
          {images.map((img, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === idx ? 'border-white scale-110' : 'border-white/30 opacity-60 hover:opacity-100'}`}>
              <img src={img} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

/* ─── Pulsing Save Badge ─────────────────────────────────────────── */
const SaveBadge: React.FC<{ amount: string }> = ({ amount }) => (
  <motion.div
    animate={{ scale: [1, 1.08, 1] }}
    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-sm text-white"
    style={{
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      boxShadow: '0 0 18px rgba(239,68,68,0.55), 0 2px 8px rgba(239,68,68,0.35)',
    }}
  >
    <FiTag className="w-3.5 h-3.5" />
    SAVE {amount}
  </motion.div>
);

/* ─── Color Swatch ──────────────────────────────────────────────── */
const COLOR_MAP: Record<string, string> = {
  'Midnight Black': '#0f0f0f',
  'Jet Black': '#111',
  'Matte Black': '#1a1a1a',
  'Stealth Black': '#131313',
  'Charcoal': '#374151',
  'Slate Gray': '#6b7280',
  'Pearl White': '#f9fafb',
  'Off White': '#fafaf5',
  'Arctic White': '#f0f4ff',
  'White': '#ffffff',
  'Warm Beige': '#d6cfc4',
  'Beige': '#f5f0e8',
  'Slate Blue': '#3b82f6',
  'Navy Blue': '#1e3a5f',
  'Navy': '#0f2558',
  'Midnight Blue': '#1e2d5f',
  'Space Gray': '#4b5563',
  'Brushed Steel': '#9ca3af',
  'Classic Nude': '#d4a88b',
  'Deep Rose': '#be185d',
  'Berry Red': '#991b1b',
  'Coral Glow': '#f97316',
  'Coral': '#f97316',
  'Red': '#dc2626',
  'Burgundy': '#7f1d1d',
  'Forest Green': '#14532d',
  'RGB Edition': 'linear-gradient(135deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f)',
  'Black': '#111',
};

function getSwatchBg(color: string): string {
  return COLOR_MAP[color] ?? '#888';
}

/* ─── Auto-scroll hook — lazy ref check so it works after async load ─ */
function useAutoScroll(ref: React.RefObject<HTMLDivElement | null>, colWidth: number, delay = 3000) {
  useEffect(() => {
    let paused = false;
    let listenersAdded = false;
    const id = setInterval(() => {
      const el = ref.current;
      if (!el) return;
      if (!listenersAdded) {
        el.addEventListener('mouseenter', () => { paused = true; });
        el.addEventListener('mouseleave', () => { paused = false; });
        listenersAdded = true;
      }
      if (paused) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;
      if (el.scrollLeft >= maxScroll - 8) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: colWidth, behavior: 'smooth' });
      }
    }, delay);
    return () => clearInterval(id);
  }, [ref, colWidth, delay]);
}

/* ─── Section heading (matches landing page style) ───────────────── */
const SectionHeading: React.FC<{ eyebrow: string; eyebrowColor?: string; title: string }> = ({
  eyebrow, eyebrowColor = 'text-primary', title,
}) => (
  <div className="mb-8">
    <p className={`${eyebrowColor} text-[11px] font-black uppercase tracking-[0.35em] mb-1`}>{eyebrow}</p>
    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">{title}</h2>
  </div>
);

/* ─── Review type ────────────────────────────────────────────────── */
type ReviewItem = {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  verified: boolean;
  images: string[];
  helpful: number;
};

/* ─── Live Chat Simulation ───────────────────────────────────────── */
const CHAT_MESSAGES = [
  { sender: 'seller', text: 'Hi! 👋 How can I help you today?' },
  { sender: 'buyer',  text: 'Is this item available?' },
  { sender: 'seller', text: 'Yes! ✅ In stock & ships in 24h 🚀' },
  { sender: 'seller', text: 'We also offer bulk discounts! 🎉' },
];

const TypingDots: React.FC = () => (
  <div className="flex items-center gap-1 px-3 py-2">
    {[0, 1, 2].map((i) => (
      <motion.div key={i} className="w-2 h-2 rounded-full bg-current"
        animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }} />
    ))}
  </div>
);

const LiveChatBubbles: React.FC = () => {
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (step < CHAT_MESSAGES.length) {
      if (!typing) { setTyping(true); t = setTimeout(() => { setTyping(false); setStep((s) => s + 1); }, 1200); }
    } else { t = setTimeout(() => setStep(0), 2800); }
    return () => clearTimeout(t);
  }, [step, typing]);
  return (
    <div className="space-y-2 min-h-[90px]">
      <AnimatePresence>
        {CHAT_MESSAGES.slice(0, step).map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className={`flex ${msg.sender === 'buyer' ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-xs font-medium px-3 py-1.5 rounded-2xl max-w-[85%] text-white ${msg.sender === 'seller' ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}
              style={{ background: msg.sender === 'seller' ? 'linear-gradient(135deg,#0070e0,#005bb5)' : 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: msg.sender === 'seller' ? '0 2px 12px rgba(0,112,224,0.35)' : '0 2px 12px rgba(124,58,237,0.35)' }}>
              {msg.text}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
      {typing && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
          <span className="text-white rounded-2xl rounded-tl-sm" style={{ background: 'linear-gradient(135deg,#0070e0,#005bb5)', boxShadow: '0 2px 12px rgba(0,112,224,0.35)' }}>
            <TypingDots />
          </span>
        </motion.div>
      )}
    </div>
  );
};

/* ─── Seller Section ─────────────────────────────────────────────── */
const SellerSection: React.FC<{ product: Product; onChatClick: (msg?: string) => void }> = ({ product, onChatClick }) => {
  const isVerified = product.rating >= 4.0;
  const sellerId = `@${product.brand.replace(/\s+/g, '').toLowerCase()}_official`;
  const soldCount = (product.reviewCount * 8).toLocaleString();
  return (
    <section className="py-10 border-b border-border overflow-hidden">
      <div className="container mx-auto px-4 max-w-4xl">
        <h3 className="text-xl font-black mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-primary rounded-full inline-block" />
          Meet the Seller
        </h3>
        <div className="relative rounded-3xl overflow-hidden border border-border/50"
          style={{ background: 'linear-gradient(135deg,rgba(0,112,224,0.07) 0%,rgba(124,58,237,0.07) 60%,rgba(34,197,94,0.04) 100%)', boxShadow: '0 8px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.05) inset' }}>
          {/* Glow blobs */}
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle,rgba(0,112,224,0.12) 0%,transparent 65%)', transform: 'translate(-30%,-30%)' }} />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle,rgba(124,58,237,0.12) 0%,transparent 65%)', transform: 'translate(30%,30%)' }} />
          <div className="relative flex flex-col lg:flex-row gap-6 p-6 md:p-8">
            {/* Left: Seller info */}
            <div className="flex items-start gap-5 flex-1">
              <div className="relative flex-shrink-0">
                <motion.div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-black"
                  style={{ background: 'linear-gradient(135deg,#0070e0,#7c3aed)', boxShadow: '0 0 0 3px rgba(0,112,224,0.35), 0 0 32px rgba(0,112,224,0.4)' }}
                  whileHover={{ scale: 1.08 }}>
                  {product.brand[0]}
                </motion.div>
                {/* Concentric pulse rings */}
                <motion.div className="absolute inset-0 rounded-full border-2 border-blue-400/70 pointer-events-none"
                  animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
                <motion.div className="absolute inset-0 rounded-full border border-violet-400/50 pointer-events-none"
                  animate={{ scale: [1, 1.45, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, delay: 0.55, repeat: Infinity, ease: 'easeInOut' }} />
                <motion.div className="absolute inset-0 rounded-full border border-green-400/30 pointer-events-none"
                  animate={{ scale: [1, 1.65, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2, delay: 1.1, repeat: Infinity, ease: 'easeInOut' }} />
                {/* Online dot */}
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-400 rounded-full border-2 border-background flex items-center justify-center">
                  <motion.div className="w-2 h-2 bg-white rounded-full"
                    animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4 className="font-black text-xl tracking-tight">{product.brand}</h4>
                  <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                    className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border ${isVerified ? 'bg-green-500/15 text-green-400 border-green-500/30 shadow-[0_0_12px_rgba(34,197,94,0.25)]' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
                    <FiShield className="w-3 h-3" strokeWidth={2.5} />
                    {isVerified ? 'VERIFIED SELLER' : 'UNVERIFIED'}
                  </motion.span>
                </div>
                <p className="text-xs text-muted-foreground mb-3 font-mono tracking-wide">{sellerId}</p>
                <div className="flex items-center gap-2 mb-3">
                  <ReviewStars rating={product.rating} size="sm" />
                  <span className="text-xs font-bold">{product.rating}</span>
                  <span className="text-xs text-muted-foreground">seller rating</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 mt-1">
                  {[
                    { value: soldCount, label: 'Items Sold', color: '#ffffff', glow: '' },
                    { value: '98%', label: 'Positive', color: '#4ade80', glow: 'rgba(74,222,128,0.18)' },
                    { value: '< 1h', label: 'Response', color: '#60a5fa', glow: 'rgba(96,165,250,0.18)' },
                    { value: '3yr', label: 'On Platform', color: '#c084fc', glow: 'rgba(192,132,252,0.18)' },
                  ].map((stat) => (
                    <div key={stat.label} className="flex flex-col items-center justify-center rounded-xl py-2 px-1 border border-border/40 text-center"
                      style={{ background: stat.glow ? `radial-gradient(ellipse at center, ${stat.glow} 0%, rgba(255,255,255,0.02) 100%)` : 'rgba(255,255,255,0.03)' }}>
                      <span className="font-black text-sm leading-tight" style={{ color: stat.color }}>{stat.value}</span>
                      <span className="text-[9px] text-muted-foreground mt-0.5 font-medium leading-tight">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Right: Ask the Seller */}
            <div className="lg:w-[380px] flex flex-col gap-3">
              {/* Panel header */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#0070e0,#7c3aed)', boxShadow: '0 4px 14px rgba(0,112,224,0.45)' }}>
                  <FiMessageSquare className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm leading-tight">Ask the Seller</p>
                  <p className="text-[10px] text-muted-foreground">Pick a question · get an instant answer</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <motion.div className="w-1.5 h-1.5 bg-green-400 rounded-full"
                    animate={{ scale: [1, 1.6, 1], opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }} />
                  <span className="text-[10px] text-green-400 font-bold">Online</span>
                </div>
              </div>

              {/* Question chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: '💰', text: 'Is this product still available?' },
                  { icon: '⚡', text: 'Urgent delivery possible?' },
                  { icon: '🎁', text: 'Is gift wrapping available?' },
                ].map((q) => (
                  <motion.button key={q.text} onClick={() => onChatClick(q.text)}
                    whileHover={{ scale: 1.04, y: -1.5 }} whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-semibold transition-colors hover:border-blue-500/40 hover:bg-blue-500/8 hover:text-blue-400"
                    style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.035)' }}>
                    <span className="text-sm leading-none">{q.icon}</span>
                    {q.text}
                  </motion.button>
                ))}
              </div>

              {/* Main CTA */}
              <motion.button onClick={() => onChatClick()}
                whileHover={{ scale: 1.02, boxShadow: '0 16px 40px rgba(0,112,224,0.45)' }} whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-3 rounded-2xl text-white font-black text-sm relative overflow-hidden mt-1"
                style={{ background: 'linear-gradient(135deg,#0070e0,#005bb5)', boxShadow: '0 8px 28px rgba(0,112,224,0.35)', padding: '14px 24px' }}>
                <motion.div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.18) 50%,transparent 60%)' }}
                  animate={{ x: ['-150%','150%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }} />
                <FiMessageSquare className="w-5 h-5 flex-shrink-0" />
                Live Chat with Seller
                <span className="ml-auto text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">Online</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─── Single Review Card ─────────────────────────────────────────── */
const ReviewCard: React.FC<{ review: ReviewItem }> = ({ review }) => {
  const [helpful, setHelpful] = useState(review.helpful);
  const [voted, setVoted] = useState(false);
  const [zoomedReviewImg, setZoomedReviewImg] = useState<string | null>(null);
  const ratingColor = review.rating >= 5 ? '#f59e0b' : review.rating >= 4 ? '#22c55e' : review.rating >= 3 ? '#3b82f6' : '#ef4444';
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(0,0,0,0.32)' }}
      className="relative rounded-2xl overflow-hidden border border-border/50 hover:border-border transition-all duration-300"
      style={{ background: 'rgba(255,255,255,0.025)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
      {/* Rating-colored top accent bar */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg,${ratingColor},transparent 70%)` }} />

      <div className="p-5">
        <div className="flex items-start gap-4 mb-3">
          {/* Circular avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-base shadow-lg"
              style={{ background: review.avatar, boxShadow: `0 0 0 2px ${ratingColor}35` }}>
              {review.name[0]}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="font-black text-sm">{review.name}</span>
              {review.verified && (
                <span className="flex items-center gap-1 text-[10px] bg-violet-500/15 text-violet-400 font-bold px-2 py-0.5 rounded-full border border-violet-500/20">
                  <FiAward className="w-3 h-3" />
                  Verified Buyer
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ReviewStars rating={review.rating} size="sm" />
              <span className="text-[10px] text-muted-foreground">{review.date}</span>
            </div>
          </div>
          {/* Decorative large quote */}
          <div className="text-5xl font-black leading-none select-none flex-shrink-0" style={{ color: ratingColor, opacity: 0.13, marginTop: '-6px' }}>"</div>
        </div>

        <h5 className="font-black text-sm mb-2">"{review.title}"</h5>
        <p className="text-muted-foreground text-sm leading-relaxed mb-3">{review.body}</p>

        {review.images.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {review.images.map((img, i) => (
              <div key={i} onClick={() => setZoomedReviewImg(img)}
                className="w-20 h-20 rounded-xl overflow-hidden border border-border/40 hover:scale-105 transition-transform cursor-zoom-in relative group">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <FiZoomIn className="w-5 h-5 text-white" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review image lightbox */}
        <AnimatePresence>
          {zoomedReviewImg && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md"
              onClick={() => setZoomedReviewImg(null)}>
              <button onClick={() => setZoomedReviewImg(null)}
                className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10">
                <FiX className="w-6 h-6" />
              </button>
              <motion.img src={zoomedReviewImg} alt="Review photo"
                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="max-h-[88vh] max-w-[92vw] object-contain rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between pt-2.5 border-t border-border/40">
          <span className="text-[11px] text-muted-foreground">Was this helpful?</span>
          <motion.button onClick={() => { if (!voted) { setHelpful((h) => h + 1); setVoted(true); } }}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${voted ? 'border-green-500/40 text-green-400 bg-green-500/10' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-primary'}`}>
            <FiThumbsUp className={`w-3.5 h-3.5 ${voted ? 'fill-green-400' : ''}`} />
            {helpful}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Chat Modal ────────────────────────────────────────────────── */
type ChatMessage = { id: string; sender: 'seller' | 'user'; text: string };

const SELLER_REPLIES = [
  'Great question! This is one of our bestsellers and ships within 24 hours! 🚀',
  'Absolutely — we offer a 30-day money-back guarantee. No questions asked! ✅',
  'Yes, we ship to 180+ countries with full tracking. Usually 3–5 business days. 📦',
  'We have bulk discount options too — the more you order, the better the price! 🎉',
  'Our team is here 24/7. Feel free to ask anything else! 😊',
];

const CHAT_QUICK_QUESTIONS = [
  { icon: '💰', text: 'Is this product still available?' },
  { icon: '⚡', text: 'Urgent delivery possible?' },
  { icon: '🎁', text: 'Is gift wrapping available?' },
];

const ChatModal: React.FC<{ product: Product; onClose: () => void; initialMessage?: string }> = ({ product, onClose, initialMessage }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'c1', sender: 'seller', text: `Hi! 👋 Welcome! I'm the seller of the **${product.name}**. How can I help you today?` },
    { id: 'c2', sender: 'seller', text: 'Pick a question below and I\'ll answer right away! 😊' },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const didAutoSend = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);

  const sendPreset = useCallback((text: string) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text };
    setMessages((p) => [...p, userMsg]);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const reply: ChatMessage = { id: Date.now() + 'r', sender: 'seller', text: SELLER_REPLIES[Math.floor(Math.random() * SELLER_REPLIES.length)] };
      setMessages((p) => [...p, reply]);
    }, 1400);
  }, []);

  useEffect(() => {
    if (initialMessage && !didAutoSend.current) {
      didAutoSend.current = true;
      const userMsg: ChatMessage = { id: 'auto-q', sender: 'user', text: initialMessage };
      setMessages((p) => [...p, userMsg]);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const reply: ChatMessage = { id: 'auto-r', sender: 'seller', text: SELLER_REPLIES[Math.floor(Math.random() * SELLER_REPLIES.length)] };
        setMessages((p) => [...p, reply]);
      }, 1400);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="w-full sm:max-w-md bg-card border border-border rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: '82vh', boxShadow: '0 -20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.07) inset' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="relative px-4 py-3 border-b border-border flex items-center gap-3 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,rgba(0,112,224,0.15),rgba(124,58,237,0.10))' }}>
          {/* Circular seller avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-lg font-black"
              style={{ background: 'linear-gradient(135deg,#0070e0,#7c3aed)', boxShadow: '0 0 0 2px rgba(0,112,224,0.45), 0 0 20px rgba(0,112,224,0.3)' }}>
              {product.brand[0]}
            </div>
            <motion.div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-background"
              animate={{ scale: [1, 1.35, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-black text-sm leading-tight">{product.brand}</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              <p className="text-[11px] text-green-400 font-bold">Online</p>
              <span className="text-[11px] text-muted-foreground ml-1">· {product.name.slice(0, 22)}{product.name.length > 22 ? '…' : ''}</span>
            </div>
          </div>

          {/* Product thumbnail */}
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-border/40 flex-shrink-0">
            <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
          </div>

          <motion.button onClick={onClose} whileHover={{ rotate: 90, scale: 1.1 }} whileTap={{ scale: 0.9 }}
            className="flex-shrink-0 p-1.5 rounded-full hover:bg-secondary transition-colors">
            <FiX className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Product context pill */}
        <div className="px-4 pt-3 flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-border/50 bg-secondary/30">
            <img src={product.images[0]} alt="" className="w-6 h-6 rounded-lg object-cover flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground font-medium flex-1 truncate">{product.name}</span>
            <span className="text-[11px] font-black text-primary flex-shrink-0">PKR {product.price.toFixed(0)}</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: 0 }}>
          {messages.map((msg) => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
              {msg.sender === 'seller' && (
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-black mb-0.5"
                  style={{ background: 'linear-gradient(135deg,#0070e0,#7c3aed)' }}>
                  {product.brand[0]}
                </div>
              )}
              <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.sender === 'user' ? 'rounded-br-sm text-white' : 'rounded-bl-sm text-foreground border border-border/30'
              }`}
                style={msg.sender === 'user'
                  ? { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 2px 12px rgba(124,58,237,0.35)' }
                  : { background: 'rgba(255,255,255,0.04)' }}>
                {msg.text}
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-black"
                  style={{ background: 'linear-gradient(135deg,#0070e0,#7c3aed)' }}>
                  {product.brand[0]}
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm border border-border/30 flex items-center gap-1.5"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {[0, 0.18, 0.36].map((delay, i) => (
                    <motion.span key={i} className="w-2 h-2 rounded-full bg-muted-foreground/60 inline-block"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.65, repeat: Infinity, delay, ease: 'easeInOut' }} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={endRef} />
        </div>

        {/* Quick-reply chips */}
        <div className="px-3 pt-2 pb-3 border-t border-border flex-shrink-0">
          <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest mb-2 px-1">Select a question</p>
          <div className="flex flex-wrap gap-2">
            {CHAT_QUICK_QUESTIONS.map((q) => (
              <motion.button key={q.text} onClick={() => sendPreset(q.text)}
                whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.93 }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-semibold transition-colors hover:border-blue-500/40 hover:bg-blue-500/8 hover:text-blue-400"
                style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.035)' }}>
                <span className="leading-none">{q.icon}</span>
                {q.text}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── Write Review Modal ─────────────────────────────────────────── */
const WriteReviewModal: React.FC<{ product: Product; onClose: () => void; onSubmit: (r: ReviewItem) => void }> = ({ product, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [name, setName] = useState('');
  const [previews, setPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'];
  const GRADS = ['linear-gradient(135deg,#0070e0,#005bb5)', 'linear-gradient(135deg,#7c3aed,#5b21b6)', 'linear-gradient(135deg,#059669,#047857)', 'linear-gradient(135deg,#dc2626,#b91c1c)', 'linear-gradient(135deg,#d97706,#b45309)'];
  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).slice(0, 5 - previews.length).forEach((f) => {
      const r = new FileReader(); r.onload = (ev) => setPreviews((p) => [...p, ev.target?.result as string]); r.readAsDataURL(f);
    });
  };
  const handleSubmit = () => {
    if (!rating || !body.trim()) return;
    onSubmit({ id: Date.now().toString(), name: name.trim() || 'Anonymous', avatar: GRADS[Math.floor(Math.random() * GRADS.length)], rating, date: 'Just now', title: title.trim() || 'My Review', body: body.trim(), verified: true, images: previews, helpful: 0 });
    onClose();
  };
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.88, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.88, y: 24 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        className="w-full max-w-lg bg-card border border-border rounded-3xl overflow-hidden"
        style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.07) inset' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-border flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(99,102,241,0.06))' }}>
          <div>
            <h3 className="font-black text-lg">Write a Review</h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[280px]">{product.name}</p>
          </div>
          <motion.button onClick={onClose} whileHover={{ rotate: 90 }} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <FiX className="w-5 h-5" />
          </motion.button>
        </div>
        <div className="p-6 space-y-5 max-h-[68vh] overflow-y-auto">
          <div>
            <p className="font-bold text-sm mb-3">Your Rating <span className="text-destructive">*</span></p>
            <div className="flex gap-2">
              {[1,2,3,4,5].map((s) => (
                <motion.button key={s} onClick={() => setRating(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
                  whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.9 }}>
                  <FiStar className={`w-10 h-10 transition-all ${s <= (hover || rating) ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.7)]' : 'text-border'}`} strokeWidth={1.5} />
                </motion.button>
              ))}
            </div>
            {(hover || rating) > 0 && <p className="text-xs font-black text-amber-400 mt-2 uppercase tracking-wider">{LABELS[hover || rating]}</p>}
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (e.g. Alex M.)"
            className="w-full h-11 px-4 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Review title"
            className="w-full h-11 px-4 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Share your experience..."
            className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none" />
          <div>
            <p className="font-bold text-sm mb-2">Add Photos <span className="text-muted-foreground font-normal text-xs">(up to 5)</span></p>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
            <div className="flex gap-3 flex-wrap">
              {previews.map((img, i) => (
                <motion.div key={i} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="w-20 h-20 rounded-xl overflow-hidden relative group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setPreviews((p) => p.filter((_, j) => j !== i))}
                    className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <FiX className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
              {previews.length < 5 && (
                <motion.button onClick={() => fileRef.current?.click()} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/60 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary">
                  <FiCamera className="w-5 h-5" /><span className="text-[10px] font-bold">Add</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex gap-3">
          <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-border font-bold text-sm hover:bg-secondary transition-colors">Cancel</button>
          <motion.button onClick={handleSubmit} disabled={!rating || !body.trim()}
            whileHover={rating && body.trim() ? { scale: 1.02 } : {}} whileTap={rating && body.trim() ? { scale: 0.97 } : {}}
            className="flex-1 h-11 rounded-xl font-black text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: rating && body.trim() ? '0 8px 24px rgba(124,58,237,0.45)' : 'none' }}>
            <FiSend className="w-4 h-4" /> Submit Review
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── Store FAQs ─────────────────────────────────────────────────── */
const STORE_FAQS = [
  {
    q: 'Is this product 100% original / authentic?',
    a: 'Absolutely. We source all products directly from authorized distributors and brand manufacturers. Every item ships with an authenticity certificate or original brand packaging.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Standard delivery takes 3–5 business days after dispatch. Express 1–2 day shipping is available at checkout. Digital products are delivered instantly to your registered email.',
  },
  {
    q: 'What if I receive a damaged or wrong item?',
    a: 'Contact us within 48 hours of delivery with photos and we will arrange a free replacement or full refund, no questions asked. Your satisfaction is our priority.',
  },
  {
    q: 'Can I return the product if I change my mind?',
    a: 'Yes — we offer a 30-day hassle-free return policy. The item must be in its original, unused condition with all packaging intact. Return shipping is on us.',
  },
  {
    q: 'Do you offer bulk or wholesale pricing?',
    a: 'Yes! Order 10+ units and get up to 20% off automatically at checkout. For larger wholesale orders, send us a message through the chat and we will send a custom quote within 1 hour.',
  },
  {
    q: 'Is cash on delivery (COD) available?',
    a: 'COD is available in selected cities. The option will appear at checkout based on your delivery address. All major cards, bank transfers, and digital wallets are also accepted.',
  },
];

const StoreFAQ: React.FC = () => {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {STORE_FAQS.map((faq, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ delay: i * 0.04 }}
          className="rounded-2xl border border-border/50 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.025)' }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.03] transition-colors">
            <span className="font-bold text-sm text-foreground">{faq.q}</span>
            <motion.span animate={{ rotate: open === i ? 45 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="flex-shrink-0 w-6 h-6 rounded-full border border-border flex items-center justify-center text-muted-foreground">
              <FiPlus className="w-3.5 h-3.5" />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                key="content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: 'easeInOut' }}
                className="overflow-hidden">
                <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                  {faq.a}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────────── */
const ProductPage: React.FC = () => {
  const { products } = useProductStore();
  const [, params] = useRoute('/product/:id');
  const [, setLocation] = useLocation();
  const { addItem } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();
  const { addItem: addToRecentlyViewed, items: recentlyViewedItems } = useRecentlyViewedStore();
  const { toast } = useToast();
  const { triggerCartBlink, setHeaderGlowImage, clearHeaderGlowImage } = useUIStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [qtyInput, setQtyInput] = useState('1');
  const [compared, setCompared] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInitialMsg, setChatInitialMsg] = useState('');
  const [userReviews, setUserReviews] = useState<ReviewItem[]>([]);
  const [descTab, setDescTab] = useState<'features' | 'specs' | null>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const relatedScrollRef = useRef<HTMLDivElement>(null);
  const recentlyScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (params?.id) {
      const found = products.find((p) => p.id === params.id);
      if (found) {
        setProduct(found);
        setActiveImage(0);
        setQuantity(1);
        setQtyInput('1');
        setCompared(CompareStore.has(found.id));
        addToRecentlyViewed(found);
        setHeaderGlowImage(found.images[0]);
        const attrs = PRODUCT_ATTRS[found.category] ?? DEFAULT_ATTRS;
        const cols = found.colors?.length ? found.colors : attrs.colors;
        const szs  = found.sizes?.length  ? found.sizes  : attrs.sizes;
        setSelectedColor(cols[0] ?? '');
        setSelectedSize(szs[0] ?? '');
        setSelectedType(attrs.types[0] ?? '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setLocation('/not-found');
      }
    }
  }, [params?.id, setLocation, addToRecentlyViewed]);

  // Header glow: update when active image changes, clear on unmount
  useEffect(() => {
    if (product) setHeaderGlowImage(product.images[activeImage]);
  }, [activeImage, product, setHeaderGlowImage]);

  useEffect(() => {
    return () => clearHeaderGlowImage();
  }, [clearHeaderGlowImage]);

  // Auto-scroll horizontal strips — 280px card + 16px gap = 296
  useAutoScroll(relatedScrollRef,  296, 3500);
  useAutoScroll(recentlyScrollRef, 296, 4000);

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-4 w-48 bg-secondary rounded" />
          <div className="flex gap-12">
            <div className="w-1/2 aspect-square bg-secondary rounded-2xl" />
            <div className="w-1/2 space-y-4">
              {[32, '3/4', '1/2', '1/3'].map((w, i) => (
                <div key={i} className={`h-${i === 0 ? 6 : i === 1 ? 8 : 5} w-${w} bg-secondary rounded`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isDigital = product.category === 'Digital';
  const isWished = isInWishlist(product.id);

  // Related Products — same category, up to 16
  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 16);

  // You Might Also Like — trending or best-seller products (different or same category), up to 8 for grid
  const youMightAlsoLike = products
    .filter((p) => p.id !== product.id && (p.isTrending || p.isBestSeller))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);

  // Recently Viewed — from persisted store, exclude current product
  const recentlyViewed = recentlyViewedItems.filter((p) => p.id !== product.id);

  const hasSale = product.originalPrice > product.price;
  const saveAmount = hasSale ? `PKR ${(product.originalPrice - product.price).toFixed(0)}` : '';
  const attrs = PRODUCT_ATTRS[product.category] ?? DEFAULT_ATTRS;
  // Prefer actual product data; fall back to category lookup
  const displayColors = product.colors?.length ? product.colors : attrs.colors;
  const displaySizes  = product.sizes?.length  ? product.sizes  : attrs.sizes;
  const deliveryDays  = product.deliveryDays ?? 3;

  // Bulk pricing
  const activeTier = getBulkTier(quantity);
  const bulkDiscountPct = activeTier.pct;
  const effectivePrice = product.price * (1 - bulkDiscountPct / 100);
  const lineTotal = effectivePrice * quantity;

  const handleQtyBlur = () => {
    const n = parseInt(qtyInput, 10);
    if (!isNaN(n) && n >= 1 && n <= product.stock) {
      setQuantity(n); setQtyInput(String(n));
    } else if (!isNaN(n) && n < 1) {
      setQuantity(1); setQtyInput('1');
    } else if (!isNaN(n) && n > product.stock) {
      setQuantity(product.stock); setQtyInput(String(product.stock));
    } else {
      setQtyInput(String(quantity));
    }
  };

  const handleAddToCart = () => {
    addItem(product, quantity);
    triggerCartBlink();
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2200);
    toast({ title: '✓ Added to cart', description: `${quantity}× ${product.name}` });
  };
  const handleBuyNow = () => {
    addItem(product, quantity);
    triggerCartBlink();
    setLocation('/checkout');
  };
  const handleCompare = () => {
    if (compared) {
      CompareStore.remove(product.id);
      setCompared(false);
      toast({ title: 'Removed from compare', description: product.name });
    } else {
      if (CompareStore.items.length >= 3) {
        toast({ title: 'Compare limit reached', description: 'You can compare up to 3 products.' });
        return;
      }
      CompareStore.add(product.id);
      setCompared(true);
      toast({ title: 'Added to compare', description: `${product.name} added. ${CompareStore.items.length}/3 selected.` });
    }
  };

  const activeBadge = BADGE_PRIORITY.find((b) => (product as unknown as Record<string, unknown>)[b.key]);

  return (
    <>
      <AnimatePresence>
        {shareOpen && product && (
          <ShareModal product={product} onClose={() => setShareOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {zoomOpen && (
          <ImageZoomModal
            images={product.images}
            initialIndex={activeImage}
            productName={product.name}
            onClose={() => setZoomOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reviewModalOpen && (
          <WriteReviewModal
            product={product}
            onClose={() => setReviewModalOpen(false)}
            onSubmit={(r) => {
              setUserReviews((prev) => [r, ...prev]);
              toast({ title: '✓ Review submitted!', description: 'Your review has been posted.' });
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {chatOpen && (
          <ChatModal product={product} initialMessage={chatInitialMsg} onClose={() => { setChatOpen(false); setChatInitialMsg(''); }} />
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

        {/* ── HERO WRAPPER with ambient glow background ── */}
        <div className="relative overflow-hidden">
          {/* Ambient color bleed from product image */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{ zIndex: 0 }}>
            <motion.img
              key={activeImage}
              src={product.images[activeImage]}
              alt=""
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'blur(80px) saturate(2.5) brightness(0.55)', transform: 'scale(1.3)' }}
            />
            <div className="absolute inset-0 bg-background/70" />
            <div className="absolute left-0 top-0 w-full h-full"
              style={{ background: 'radial-gradient(ellipse 60% 80% at 25% 40%, rgba(255,255,255,0.04) 0%, transparent 70%)' }} />
          </div>

          <div className="container mx-auto px-4 pt-6 pb-16 relative z-10">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-8 flex-wrap">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <span>/</span>
              <Link href={`/category/${product.category.toLowerCase()}`} className="hover:text-foreground transition-colors">{product.category}</Link>
              <span>/</span>
              <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
            </nav>

            <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">

              {/* ── Gallery ── */}
              <div className="w-full lg:w-[48%] flex flex-col gap-4">
                <div className="relative">
                  {/* Glow halo */}
                  <motion.div
                    key={`glow-${activeImage}`}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
                    className="absolute inset-0 rounded-3xl pointer-events-none"
                    style={{ zIndex: 0 }}
                    aria-hidden="true"
                  >
                    <img
                      src={product.images[activeImage]}
                      alt=""
                      className="w-full h-full object-cover rounded-3xl"
                      style={{ filter: 'blur(28px) saturate(3) brightness(0.9)', transform: 'scale(1.08) translateY(12px)', opacity: 0.75 }}
                    />
                  </motion.div>

                  {/* Card */}
                  <div
                    className="relative rounded-3xl overflow-hidden cursor-zoom-in group"
                    style={{ aspectRatio: '1 / 1', boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)', zIndex: 1 }}
                    onClick={() => setZoomOpen(true)}
                  >
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={activeImage}
                        src={product.images[activeImage]}
                        alt={product.name}
                        initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.35 }}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </AnimatePresence>

                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      <FiZoomIn className="w-3.5 h-3.5" /> Tap to zoom
                    </div>

                    {activeBadge && (
                      <div className="absolute top-4 left-4 z-10 pointer-events-none">
                        <TypingBadge text={activeBadge.text} bgStyle={activeBadge.bgStyle} />
                      </div>
                    )}
                    {product.discount > 0 && (
                      <div className="absolute top-4 right-4 z-10 pointer-events-none">
                        <TypingBadge text={`-${product.discount}%`} bgStyle={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 0 16px rgba(239,68,68,0.6)' }} />
                      </div>
                    )}

                    {/* Digital badge */}
                    {isDigital && (
                      <div className="absolute bottom-4 left-4 z-10 pointer-events-none flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow: '0 0 16px rgba(99,102,241,0.5)' }}>
                        <FiMonitor className="w-3.5 h-3.5" /> Digital Product
                      </div>
                    )}

                    {product.images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveImage((i) => (i - 1 + product.images.length) % product.images.length); }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 shadow-xl border border-white/10"
                        ><FiChevronLeft className="w-5 h-5" /></button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveImage((i) => (i + 1) % product.images.length); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 shadow-xl border border-white/10"
                        ><FiChevronRight className="w-5 h-5" /></button>
                      </>
                    )}
                  </div>
                </div>

                {/* Thumbnails */}
                <div className="grid grid-cols-4 gap-3">
                  {product.images.map((img, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all relative ${
                        activeImage === idx
                          ? 'border-primary ring-2 ring-primary/30 shadow-lg shadow-primary/20'
                          : 'border-transparent opacity-55 hover:opacity-90 hover:border-white/20'
                      }`}
                      style={activeImage === idx ? { boxShadow: '0 0 16px rgba(var(--primary-rgb, 99,102,241),0.35)' } : {}}
                    >
                      <img src={img} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      {activeImage === idx && <div className="absolute inset-0 ring-inset ring-2 ring-primary/40 rounded-2xl pointer-events-none" />}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* ── Details Panel ── */}
              <div ref={detailsRef} className="w-full lg:w-[52%] flex flex-col">
                {/* Brand */}
                <div className="flex items-center mb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {product.brand}
                  </span>
                </div>

                {/* Product Name */}
                <h1 className="text-3xl md:text-4xl font-black text-foreground mb-4 leading-tight tracking-tight">
                  {product.name}
                </h1>

                {/* Rating + Stock */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <ReviewStars rating={product.rating} />
                  <span className="text-muted-foreground text-sm">{product.reviewCount} Reviews</span>
                  <span className="text-muted-foreground">·</span>
                  <button onClick={() => setReviewModalOpen(true)} className="text-primary hover:underline text-sm font-medium">Write a Review</button>
                  <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                    product.stock > 10 ? 'bg-green-500/10 text-green-500' :
                    product.stock > 0  ? 'bg-orange-500/10 text-orange-500' :
                                         'bg-destructive/10 text-destructive'
                  }`}>
                    {product.stock > 10 ? (
                      <>
                        <motion.span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 inline-block"
                          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                          transition={{ duration: 1.6, repeat: Infinity }} />
                        In Stock
                      </>
                    ) : product.stock > 0 ? (
                      <>
                        <FiClock className="w-3.5 h-3.5 flex-shrink-0" />
                        Only {product.stock} left
                      </>
                    ) : (
                      <>
                        <FiX className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={3} />
                        Out of Stock
                      </>
                    )}
                  </span>
                </div>

                {/* ── PRICE BLOCK ── */}
                <div className="rounded-2xl p-5 mb-5 border"
                  style={{
                    background: 'linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(239,68,68,0.04) 100%)',
                    borderColor: 'rgba(34,197,94,0.18)',
                    boxShadow: '0 4px 24px rgba(34,197,94,0.08)',
                  }}>
                  <div className="flex flex-wrap items-end gap-3">
                    <motion.span
                      key={`${product.price}-${bulkDiscountPct}`}
                      initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="text-5xl md:text-6xl font-black tracking-tighter"
                      style={{
                        color: hasSale || bulkDiscountPct > 0 ? '#22c55e' : undefined,
                        textShadow: hasSale || bulkDiscountPct > 0 ? '0 0 32px rgba(34,197,94,0.4)' : undefined,
                      }}
                    >
                      ${effectivePrice.toFixed(2)}
                    </motion.span>
                    {hasSale && (
                      <div className="flex flex-col gap-1 mb-1">
                        <span className="text-xl font-bold line-through" style={{ color: '#ef4444', textShadow: '0 0 8px rgba(239,68,68,0.3)' }}>
                          PKR {product.originalPrice.toFixed(0)}
                        </span>
                      </div>
                    )}
                    {bulkDiscountPct > 0 && (
                      <span className="mb-1 text-sm font-black px-2.5 py-1 rounded-lg text-white"
                        style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 0 12px rgba(124,58,237,0.4)' }}>
                        BULK -{bulkDiscountPct}%
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    {hasSale && <SaveBadge amount={saveAmount} />}
                    {quantity > 1 && (
                      <span className="text-sm text-muted-foreground font-medium">
                        Total: <span className="text-green-400 font-black">PKR {lineTotal.toFixed(0)}</span> for {quantity} units
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-muted-foreground text-base mb-5 leading-relaxed">{product.description}</p>

                {/* ── PRODUCT ATTRIBUTES ── */}
                <div className="space-y-5 mb-5">
                  {/* Color picker */}
                  {displayColors.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="font-bold text-sm">Color</span>
                        <span className="text-muted-foreground text-xs font-medium">{selectedColor}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {displayColors.map((color) => {
                          const isSelected = selectedColor === color;
                          const bg = getSwatchBg(color);
                          const isGradient = bg.startsWith('linear');
                          return (
                            <button
                              key={color}
                              onClick={() => setSelectedColor(color)}
                              title={color}
                              className={`relative w-9 h-9 rounded-full transition-all ${
                                isSelected ? 'ring-2 ring-offset-2 ring-primary ring-offset-background scale-110 shadow-lg' : 'hover:scale-105'
                              }`}
                              style={{ background: isGradient ? bg : undefined, backgroundColor: isGradient ? undefined : bg }}
                            >
                              {isSelected && (
                                <FiCheck
                                  className="absolute inset-0 m-auto w-4 h-4 drop-shadow"
                                  style={{ color: ['Pearl White', 'Off White', 'Arctic White', 'White', 'Warm Beige'].includes(color) ? '#000' : '#fff' }}
                                  strokeWidth={3}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Size picker */}
                  {displaySizes.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="font-bold text-sm">Size</span>
                        <button className="text-primary text-xs font-medium hover:underline">Size Guide →</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {displaySizes.map((size) => {
                          const isSelected = selectedSize === size;
                          return (
                            <button
                              key={size}
                              onClick={() => setSelectedSize(size)}
                              className={`min-w-[44px] h-10 px-3 rounded-xl font-bold text-sm border transition-all ${
                                isSelected
                                  ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                                  : 'border-border bg-card/60 text-foreground hover:border-primary/50 hover:bg-primary/5'
                              }`}
                            >{size}</button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Type picker */}
                  {attrs.types.length > 0 && (
                    <div>
                      <span className="font-bold text-sm block mb-2.5">Type</span>
                      <div className="flex flex-wrap gap-2">
                        {attrs.types.map((type) => {
                          const isSelected = selectedType === type;
                          return (
                            <button
                              key={type}
                              onClick={() => setSelectedType(type)}
                              className={`h-10 px-4 rounded-xl font-bold text-sm border transition-all ${
                                isSelected
                                  ? 'border-primary bg-primary/15 text-primary shadow-inner'
                                  : 'border-border bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                              }`}
                            >{type}</button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px bg-border w-full mb-5" />

                {/* ── QUANTITY + BULK TIERS ── */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm">Quantity</span>
                    {bulkDiscountPct > 0 && (
                      <span className="text-xs font-bold text-violet-400 flex items-center gap-1">
                        <FiLayers className="w-3 h-3" /> Bulk pricing active
                      </span>
                    )}
                  </div>

                  {/* Qty control */}
                  <div className="flex items-center border border-border rounded-2xl bg-card/60 backdrop-blur-sm overflow-hidden h-12 shadow-sm w-44">
                    <button
                      onClick={() => { const n = Math.max(1, quantity - 1); setQuantity(n); setQtyInput(String(n)); }}
                      disabled={quantity <= 1}
                      className="flex items-center justify-center px-4 hover:bg-secondary transition-colors disabled:opacity-40 h-full"
                    ><FiMinus className="w-4 h-4" /></button>
                    <input
                      type="number"
                      min={1}
                      max={product.stock}
                      value={qtyInput}
                      onChange={(e) => setQtyInput(e.target.value)}
                      onBlur={handleQtyBlur}
                      onKeyDown={(e) => e.key === 'Enter' && handleQtyBlur()}
                      className="flex-1 text-center font-black text-lg bg-transparent border-0 outline-none focus:outline-none min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => { const n = Math.min(product.stock, quantity + 1); setQuantity(n); setQtyInput(String(n)); }}
                      disabled={quantity >= product.stock}
                      className="flex items-center justify-center px-4 hover:bg-secondary transition-colors disabled:opacity-40 h-full"
                    ><FiPlus className="w-4 h-4" /></button>
                  </div>

                  {/* Bulk discount tiers table — 8K look, light+dark aware */}
                  <div className="mt-4 rounded-2xl overflow-hidden border border-violet-400/30 dark:border-violet-500/25">
                    {/* Header */}
                    <div className="px-4 py-2.5 flex items-center gap-2"
                      style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.18) 0%,rgba(139,92,246,0.10) 100%)', borderBottom: '1px solid rgba(124,58,237,0.18)' }}>
                      <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 0 10px rgba(124,58,237,0.5)' }}>
                        <FiPackage className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider text-violet-600 dark:text-violet-300">Bulk Discount Pricing</span>
                      <span className="ml-auto text-[10px] font-bold text-violet-500 dark:text-violet-400 bg-violet-100 dark:bg-violet-500/15 px-2 py-0.5 rounded-full">Save up to 50%</span>
                    </div>
                    {/* Rows */}
                    <div>
                      {BULK_TIERS.map((tier, idx) => {
                        const tierPrice = product.price * (1 - tier.pct / 100);
                        const isActive = activeTier.min === tier.min;
                        return (
                          <div
                            key={tier.label}
                            className={`flex items-center justify-between px-4 py-3 transition-all duration-150 ${idx < BULK_TIERS.length - 1 ? 'border-b border-violet-300/20 dark:border-violet-500/12' : ''}`}
                            style={isActive ? { background: 'linear-gradient(90deg,rgba(124,58,237,0.14) 0%,rgba(139,92,246,0.06) 100%)', borderLeft: '3px solid #7c3aed' } : { paddingLeft: '19px' }}
                          >
                            <div className="flex items-center gap-2">
                              {isActive && (
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#7c3aed', boxShadow: '0 0 6px rgba(124,58,237,0.8)' }} />
                              )}
                              <span className={`text-xs font-semibold ${isActive ? 'text-violet-700 dark:text-violet-200 font-black' : 'text-muted-foreground'}`}>{tier.label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {tier.pct > 0 && (
                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md"
                                  style={{ background: isActive ? 'linear-gradient(135deg,#7c3aed,#5b21b6)' : 'rgba(124,58,237,0.12)', color: isActive ? '#fff' : '#7c3aed' }}>
                                  -{tier.pct}% OFF
                                </span>
                              )}
                              <span className={`text-sm font-black ${isActive ? 'text-violet-700 dark:text-violet-100' : 'text-muted-foreground'}`}>
                                ${tierPrice.toFixed(2)}/unit
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="px-4 py-2 text-[11px] text-violet-500 dark:text-violet-400/70 font-medium" style={{ background: 'rgba(124,58,237,0.04)', borderTop: '1px solid rgba(124,58,237,0.12)' }}>
                      ✦ Enter qty above to activate bulk pricing automatically
                    </div>
                  </div>
                </div>

                {/* ── Live Demo button for Digital products ── */}
                {isDigital && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 mb-4 border"
                    style={{
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.06))',
                      borderColor: 'rgba(99,102,241,0.3)',
                      color: '#818cf8',
                      boxShadow: '0 0 20px rgba(99,102,241,0.15)',
                    }}
                  >
                    <FiPlay className="w-4 h-4" />
                    Try Live Demo
                  </motion.button>
                )}

                {/* ── Primary CTA Buttons ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {/* Add to Cart — success animation */}
                  <motion.button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    whileHover={{ scale: cartAdded ? 1 : 1.02 }}
                    whileTap={{ scale: cartAdded ? 1 : 0.96 }}
                    animate={cartAdded ? { scale: [1, 1.06, 1], transition: { duration: 0.35 } } : {}}
                    className="h-14 font-black rounded-2xl flex items-center justify-center gap-2.5 transition-all disabled:opacity-40 text-sm relative overflow-hidden border"
                    style={cartAdded ? {
                      background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1))',
                      borderColor: 'rgba(34,197,94,0.5)',
                      color: '#22c55e',
                      boxShadow: '0 0 24px rgba(34,197,94,0.35)',
                    } : {
                      background: 'linear-gradient(135deg, rgba(var(--primary-rgb,99,102,241),0.12), rgba(var(--primary-rgb,99,102,241),0.06))',
                      borderColor: 'rgba(var(--primary-rgb,99,102,241),0.3)',
                      color: 'hsl(var(--primary))',
                    }}
                  >
                    {cartAdded && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0.6 }}
                        animate={{ scale: 4, opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-0 m-auto w-full h-full rounded-full"
                        style={{ background: 'rgba(34,197,94,0.2)', borderRadius: '50%' }}
                      />
                    )}
                    <AnimatePresence mode="wait">
                      {cartAdded ? (
                        <motion.span key="added" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                          className="flex items-center gap-2">
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
                            <FiCheck className="w-5 h-5" strokeWidth={3} />
                          </motion.div>
                          Added!
                        </motion.span>
                      ) : (
                        <motion.span key="cart" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                          className="flex items-center gap-2">
                          <FiShoppingCart className="w-5 h-5" />
                          Add to Cart
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  {/* Buy Now */}
                  <motion.button
                    onClick={handleBuyNow}
                    disabled={product.stock === 0}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    className="h-14 font-black rounded-2xl transition-all shadow-2xl disabled:opacity-40 text-sm relative overflow-hidden flex items-center justify-center gap-2.5 text-white"
                    style={{
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                      boxShadow: '0 8px 32px rgba(34,197,94,0.35), 0 2px 8px rgba(34,197,94,0.2)',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                    <motion.div
                      animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <FiZap className="w-5 h-5 fill-white" />
                    </motion.div>
                    Buy It Now
                  </motion.button>
                </div>

                {/* ── Secondary Actions ── */}
                <div className="grid grid-cols-3 gap-2.5 mb-7">
                  <motion.button
                    onClick={handleCompare}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                    className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-2xl border text-xs font-bold transition-all ${
                      compared ? 'border-blue-500/60 text-blue-400 bg-blue-500/10' : 'border-border text-muted-foreground hover:border-blue-400/40 hover:text-blue-400 hover:bg-blue-500/5'
                    }`}
                  >
                    <FiRefreshCw className={`w-5 h-5 ${compared ? 'stroke-blue-400' : ''}`} />
                    Compare
                  </motion.button>

                  <motion.button
                    onClick={() => toggleItem(product)}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                    className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-2xl border text-xs font-bold transition-all ${
                      isWished ? 'border-rose-500/60 text-rose-400 bg-rose-500/10' : 'border-border text-muted-foreground hover:border-rose-400/40 hover:text-rose-400 hover:bg-rose-500/5'
                    }`}
                  >
                    <FiHeart className={`w-5 h-5 ${isWished ? 'fill-rose-400 stroke-rose-400' : ''}`} />
                    {isWished ? 'Saved' : 'Wishlist'}
                  </motion.button>

                  <motion.button
                    onClick={() => setShareOpen(true)}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-2xl border border-border text-xs font-bold text-muted-foreground hover:border-violet-400/40 hover:text-violet-400 hover:bg-violet-500/5 transition-all"
                  >
                    <FiShare2 className="w-5 h-5" />
                    Share
                  </motion.button>
                </div>

                {/* Trust Badges */}
                <div className="p-5 rounded-2xl space-y-3 border"
                  style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)' }}>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 shadow-inner">
                      <FiTruck className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold">{isDigital ? 'Instant Download' : 'Free Shipping'}</p>
                      <p className="text-muted-foreground text-xs">{isDigital ? 'Available immediately after purchase' : 'On orders over $50 · 3-5 business days'}</p>
                    </div>
                  </div>
                  <div className="h-px bg-border/60" />
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0 shadow-inner">
                      <FiShield className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-bold">Secure Transaction</p>
                      <p className="text-muted-foreground text-xs">30-day money-back guarantee · 256-bit SSL</p>
                    </div>
                  </div>
                  <div className="h-px bg-border/60" />
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 shadow-inner">
                      <FiCamera className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-bold">Premium Quality</p>
                      <p className="text-muted-foreground text-xs">As shown in photos · 100% authentic</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── All Product Detail Sections — Vertically Stacked ─────── */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div className="container mx-auto px-4 max-w-4xl">

          {/* ── 1. Description ── */}
          <section className="py-14 border-b border-border">
            <h3 className="text-xl font-black mb-8 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full inline-block" />
              Description
            </h3>

            <div className="space-y-10">
              {/* Overview */}
              <div>
                <p className="text-lg leading-relaxed text-foreground">{product.description}</p>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  {product.brand} is known for delivering exceptional quality and innovative design. This product is
                  crafted with premium materials and engineered to the highest standards, ensuring lasting durability
                  and performance that exceeds expectations.
                </p>
              </div>

              {/* Inline description feature image */}
              <div
                className="cursor-zoom-in rounded-2xl overflow-hidden border border-border/40 group relative"
                onClick={() => { setActiveImage(0); setZoomOpen(true); }}
                style={{ aspectRatio: '16 / 7' }}
              >
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <FiZoomIn className="w-3.5 h-3.5" /> Tap to zoom
                </div>
              </div>

              {/* ── Horizontal tab toggles: Key Features / Specifications ── */}
              <div>
                <div className="flex gap-3">
                  {([
                    { id: 'features', label: 'Key Features', icon: <FiZap className="w-4 h-4" /> },
                    { id: 'specs',    label: 'Specifications', icon: <FiLayers className="w-4 h-4" /> },
                  ] as const).map((tab) => {
                    const active = descTab === tab.id;
                    return (
                      <motion.button key={tab.id}
                        onClick={() => setDescTab(active ? null : tab.id)}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border font-black text-sm transition-all ${
                          active
                            ? 'text-white border-transparent'
                            : 'border-border text-muted-foreground hover:border-primary/40 hover:text-primary'
                        }`}
                        style={active ? { background: 'linear-gradient(135deg,#0070e0,#7c3aed)', boxShadow: '0 6px 20px rgba(0,112,224,0.4)' } : {}}>
                        {tab.icon}
                        {tab.label}
                        <motion.span animate={{ rotate: active ? 180 : 0 }} transition={{ duration: 0.2 }}
                          className="ml-0.5 opacity-60 text-xs">▾</motion.span>
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {descTab === 'features' && (
                    <motion.div key="features"
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }} className="overflow-hidden">
                      <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(isDigital ? [
                          { icon: <FiZap className="w-4 h-4 text-primary" />,           title: 'Instant Access',        desc: 'Download immediately after payment — no waiting' },
                          { icon: <FiRefreshCw className="w-4 h-4 text-primary" />,     title: 'Lifetime Updates',      desc: 'Free updates for the lifetime of the product' },
                          { icon: <FiShield className="w-4 h-4 text-primary" />,        title: '30-Day Guarantee',      desc: "Full refund if you're not satisfied, no questions asked" },
                          { icon: <FiSmartphone className="w-4 h-4 text-primary" />,    title: 'Multi-Device',          desc: 'Use on all your devices — desktop, tablet, mobile' },
                          { icon: <FiGlobe className="w-4 h-4 text-primary" />,         title: 'Worldwide Access',      desc: 'Available in 150+ countries with instant delivery' },
                          { icon: <FiMessageSquare className="w-4 h-4 text-primary" />, title: 'Priority Support',      desc: 'Dedicated support team ready to help you succeed' },
                        ] : [
                          { icon: <FiAward className="w-4 h-4 text-primary" />,         title: 'Premium Materials',     desc: 'Crafted from the finest materials for lasting quality' },
                          { icon: <FiTool className="w-4 h-4 text-primary" />,          title: 'Precision Engineering', desc: 'Designed and tested to exceed industry standards' },
                          { icon: <FiShield className="w-4 h-4 text-primary" />,        title: '1-Year Warranty',       desc: 'Full manufacturer warranty on all components' },
                          { icon: <FiZap className="w-4 h-4 text-primary" />,           title: 'High Performance',      desc: 'Optimized for peak performance in any condition' },
                          { icon: <FiGlobe className="w-4 h-4 text-primary" />,         title: 'Worldwide Shipping',    desc: 'Fast, tracked shipping to 180+ countries' },
                          { icon: <FiRefreshCw className="w-4 h-4 text-primary" />,     title: 'Eco-Friendly',          desc: 'Responsibly sourced and sustainably produced' },
                        ]).map((feat) => (
                          <div key={feat.title}
                            className="flex items-start gap-4 p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/30 transition-all group">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                              {feat.icon}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-foreground mb-0.5">{feat.title}</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Why Choose */}
                      <div className="mt-4 p-6 rounded-2xl border border-border/50 bg-secondary/20">
                        <h4 className="font-black text-base mb-3 flex items-center gap-2">
                          <span className="w-1 h-5 bg-primary rounded-full inline-block" />
                          Why Choose {product.brand}?
                        </h4>
                        <ul className="space-y-2.5">
                          {(isDigital
                            ? ['Trusted by 10,000+ satisfied customers worldwide', 'Continuously improved based on user feedback', 'Compatible with all major platforms and tools', 'Created by industry experts with years of experience']
                            : ['Trusted brand with 15+ years in the industry', 'Rigorous quality control at every production stage', 'Award-winning design recognized globally', 'Backed by a passionate customer support team']
                          ).map((item) => (
                            <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                              <FiCheck className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={3} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}

                  {descTab === 'specs' && (
                    <motion.div key="specs"
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }} className="overflow-hidden">
                      <div className="pt-6 relative rounded-3xl overflow-hidden"
                        style={{ boxShadow: '0 20px 50px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.07)' }}>
                        <div className="flex items-center gap-3 px-6 py-4"
                          style={{ background: 'linear-gradient(135deg,rgba(0,112,224,0.18) 0%,rgba(0,112,224,0.06) 100%)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg,rgba(0,112,224,0.35),rgba(0,112,224,0.15))', boxShadow: '0 0 18px rgba(0,112,224,0.3)' }}>
                            <FiLayers className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-black text-sm tracking-wide">Technical Specifications</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{Object.keys(product.specifications).length} parameters</p>
                          </div>
                        </div>
                        {Object.entries(product.specifications).map(([key, value], idx) => (
                          <div key={key} className="flex items-stretch"
                            style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.18)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <div className="w-[3px] flex-shrink-0"
                              style={{ background: idx % 3 === 0 ? 'linear-gradient(180deg,#0070e0,#005bb5)' : idx % 3 === 1 ? 'linear-gradient(180deg,#7c3aed,#5b21b6)' : 'linear-gradient(180deg,#059669,#047857)' }} />
                            <div className="flex flex-col sm:flex-row py-4 px-6 gap-1 sm:gap-0 flex-1">
                              <div className="sm:w-[40%] text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{key}</div>
                              <div className="sm:w-[60%] font-bold text-sm text-foreground">{value}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </section>

          {/* ── Reviews ── */}
          <section className="py-14">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <h3 className="text-xl font-black flex items-center gap-2">
                <span className="w-1 h-6 bg-amber-500 rounded-full inline-block" />
                Reviews ({product.reviewCount + userReviews.length})
              </h3>
              <motion.button onClick={() => setReviewModalOpen(true)}
                whileHover={{ scale: 1.04, boxShadow: '0 12px 32px rgba(124,58,237,0.45)' }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white font-black text-sm relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 8px 24px rgba(124,58,237,0.35)' }}>
                <motion.div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.18) 50%,transparent 60%)' }}
                  animate={{ x: ['-150%','150%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }} />
                <FiStar className="w-4 h-4 fill-white" />
                Write a Review
              </motion.button>
            </div>
            {/* Rating hero */}
            <div className="relative rounded-3xl overflow-hidden mb-8 border border-border bg-secondary/40">
              <div className="absolute top-0 left-0 w-56 h-56 rounded-full pointer-events-none opacity-40"
                style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.25) 0%, transparent 70%)', transform: 'translate(-30%,-30%)' }} />
              <div className="flex flex-col sm:flex-row items-center gap-0 sm:gap-8 p-7 relative">
                <div className="flex flex-col items-center flex-shrink-0 sm:border-r sm:border-border sm:pr-8 pb-5 sm:pb-0">
                  <div className="text-7xl font-black leading-none mb-2"
                    style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {product.rating}
                  </div>
                  <ReviewStars rating={product.rating} className="justify-center mb-2" />
                  <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{product.reviewCount + userReviews.length} Reviews</div>
                </div>
                <div className="flex-1 space-y-2.5 w-full">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const pct = stars === 5 ? 68 : stars === 4 ? 21 : stars === 3 ? 7 : stars === 2 ? 3 : 1;
                    const barColor = stars >= 4 ? '#22c55e' : stars === 3 ? '#f59e0b' : '#ef4444';
                    return (
                      <div key={stars} className="flex items-center gap-3 text-sm">
                        <div className="w-12 flex items-center justify-end gap-1 flex-shrink-0 text-xs font-bold text-foreground/70">
                          {stars} <FiStar className="w-3 h-3 fill-amber-400 text-amber-400" />
                        </div>
                        <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-border/80">
                          <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ delay: 0.15 * (6 - stars), duration: 0.7, ease: 'easeOut' }}
                            className="h-full rounded-full" style={{ background: barColor, boxShadow: `0 0 8px ${barColor}60` }} />
                        </div>
                        <div className="w-9 text-right text-xs flex-shrink-0 font-black text-foreground/80">{pct}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* Review cards */}
            <div className="space-y-4">
              {[
                ...userReviews,
                { id: 's1', name: 'Alex M.',   avatar: 'linear-gradient(135deg,#0070e0,#005bb5)', rating: 5, date: '2 days ago',  title: 'Outstanding quality!',        body: 'Exceeded all my expectations. The build quality is phenomenal and it arrived perfectly packaged. Would 100% buy again.', verified: true,  images: [product.images[0]], helpful: 42 },
                { id: 's2', name: 'Sarah K.',  avatar: 'linear-gradient(135deg,#7c3aed,#5b21b6)', rating: 5, date: '1 week ago',  title: 'Worth every penny',           body: 'I was hesitant about the price, but after using it I completely understand why. Absolutely premium from top to bottom.', verified: true, images: [product.images[Math.min(1, product.images.length - 1)]], helpful: 38 },
                { id: 's3', name: 'Jordan P.', avatar: 'linear-gradient(135deg,#059669,#047857)', rating: 4, date: '2 weeks ago', title: 'Great product, fast shipping', body: 'Really happy with this purchase. Arrived quickly, well packaged, and exactly as described.', verified: true, images: [], helpful: 27 },
              ].map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
            {/* See All Reviews */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link href={`/product/${product.id}/reviews`}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm text-white"
                  style={{ background: 'linear-gradient(135deg,#0070e0,#005bb5)', boxShadow: '0 8px 24px rgba(0,112,224,0.35)' }}>
                  <FiStar className="w-4 h-4 fill-white" />
                  See All {product.reviewCount + userReviews.length} Reviews
                  <FiArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
              <motion.button onClick={() => setReviewModalOpen(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-border font-bold text-sm hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all">
                Write a Review
              </motion.button>
            </div>
          </section>

        </div>{/* /container */}

        {/* ── Seller Section — below Reviews ── */}
        <SellerSection product={product} onChatClick={(msg) => { setChatInitialMsg(msg || ''); setChatOpen(true); }} />

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── Related Products — landing-page style auto-scroll strip ── */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {relatedProducts.length > 0 && (
          <section className="py-14 border-t border-border">
            <div className="container mx-auto px-4 mb-0">
              <SectionHeading
                eyebrow="Shop More"
                title="Related Products"
              />
            </div>

            <div className="container mx-auto px-4">
              <div
                ref={relatedScrollRef}
                className="flex overflow-x-auto pb-4 gap-4 snap-x snap-mandatory hide-scrollbar"
              >
                {relatedProducts.map((p) => (
                  <div key={p.id} className="min-w-[260px] w-[260px] sm:min-w-[280px] sm:w-[280px] snap-start shrink-0">
                    <ProductCard product={p} />
                  </div>
                ))}
                <div className="min-w-[1px] shrink-0" />
              </div>

              {/* View All — centered below, no inline header button */}
              <div className="mt-8 flex justify-center">
                <Link
                  href={`/category/${product.category.toLowerCase()}`}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-border bg-card hover:bg-secondary font-bold text-sm text-foreground transition-all duration-200 hover:border-primary hover:text-primary group"
                >
                  View All {product.category}
                  <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── You Might Also Like — vertical grid ───────────────────── */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {youMightAlsoLike.length > 0 && (
          <section className="py-14 border-t border-border">
            <div className="container mx-auto px-4">
              <SectionHeading eyebrow="Picked For You" title="You Might Also Like" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {youMightAlsoLike.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <div className="mt-10 flex justify-center">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-border bg-card hover:bg-secondary font-bold text-sm text-foreground transition-all duration-200 hover:border-primary hover:text-primary group"
                >
                  View All Products
                  <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── Recently Viewed — horizontal auto-scroll strip ─────────── */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {recentlyViewed.length > 0 && (
          <section className="py-14 border-t border-border">
            <div className="container mx-auto px-4 mb-0">
              <SectionHeading eyebrow="Your History" title="Recently Viewed" />
            </div>
            <div className="container mx-auto px-4">
              <div
                ref={recentlyScrollRef}
                className="flex overflow-x-auto pb-4 gap-4 snap-x snap-mandatory hide-scrollbar"
              >
                {recentlyViewed.map((p) => (
                  <div key={p.id} className="min-w-[260px] w-[260px] sm:min-w-[280px] sm:w-[280px] snap-start shrink-0">
                    <ProductCard product={p} />
                  </div>
                ))}
                <div className="min-w-[1px] shrink-0" />
              </div>
            </div>
          </section>
        )}

        {/* ── FAQs by Store ── */}
        <section className="py-14 border-t border-border">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-1 h-6 bg-primary rounded-full inline-block" />
              <div>
                <h3 className="text-xl font-black">FAQs by Store</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Common questions answered by the seller</p>
              </div>
            </div>
            <StoreFAQ />
          </div>
        </section>

        {/* ── Shipping & Returns ── */}
        <section className="py-14 border-t border-border">
          <div className="container mx-auto px-4 max-w-4xl">
            <h3 className="text-xl font-black mb-8 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full inline-block" />
              {isDigital ? 'Delivery & Refunds' : 'Shipping & Returns'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {(isDigital ? [
                {
                  icon: <FiZap className="w-6 h-6 text-white" />,
                  gradient: 'linear-gradient(135deg,#0070e0,#0050a8)',
                  glow: 'rgba(0,112,224,0.4)',
                  title: 'Instant Delivery',
                  subtitle: 'Zero wait time',
                  bullets: ['Delivered to your email instantly', 'Available in your dashboard immediately', 'No shipping, no delays'],
                },
                {
                  icon: <FiRefreshCw className="w-6 h-6 text-white" />,
                  gradient: 'linear-gradient(135deg,#059669,#047857)',
                  glow: 'rgba(5,150,105,0.4)',
                  title: '30-Day Guarantee',
                  subtitle: 'Risk-free purchase',
                  bullets: ['Full refund, no questions asked', 'Contact support within 30 days', 'Processed within 24 hours'],
                },
                {
                  icon: <FiMonitor className="w-6 h-6 text-white" />,
                  gradient: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
                  glow: 'rgba(124,58,237,0.4)',
                  title: 'License & Usage',
                  subtitle: 'Flexible licensing',
                  bullets: ['Personal use included', 'Commercial & team tiers at checkout', 'Multi-device, lifetime access'],
                },
              ] : [
                {
                  icon: <FiTruck className="w-6 h-6 text-white" />,
                  gradient: 'linear-gradient(135deg,#0070e0,#0050a8)',
                  glow: 'rgba(0,112,224,0.4)',
                  title: 'Fast Shipping',
                  subtitle: 'Free over $50',
                  bullets: ['Processed in 1-2 business days', `Standard: ${deliveryDays} day${deliveryDays !== 1 ? 's' : ''} delivery`, 'Express 1-2 day option at checkout'],
                },
                {
                  icon: <FiRefreshCw className="w-6 h-6 text-white" />,
                  gradient: 'linear-gradient(135deg,#059669,#047857)',
                  glow: 'rgba(5,150,105,0.4)',
                  title: '30-Day Returns',
                  subtitle: 'Hassle-free policy',
                  bullets: ['Original condition & packaging', 'Refunds in 3-5 business days', 'Free return shipping label'],
                },
                {
                  icon: <FiShield className="w-6 h-6 text-white" />,
                  gradient: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
                  glow: 'rgba(124,58,237,0.4)',
                  title: '1-Year Warranty',
                  subtitle: 'Manufacturer backed',
                  bullets: ['Covers manufacturing defects', 'Extended options at checkout', 'Dedicated warranty support'],
                },
              ]).map((card) => (
                <motion.div key={card.title}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  whileHover={{ y: -6, boxShadow: `0 24px 60px rgba(0,0,0,0.35), 0 0 30px ${card.glow}` }}
                  className="relative rounded-3xl p-6 border border-border/50 cursor-default"
                  style={{ background: 'rgba(255,255,255,0.03)', boxShadow: '0 4px 24px rgba(0,0,0,0.25)' }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
                    style={{ background: card.gradient, boxShadow: `0 8px 24px ${card.glow}` }}>
                    {card.icon}
                  </div>
                  <h4 className="font-black text-base text-foreground mb-0.5">{card.title}</h4>
                  <p className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest">{card.subtitle}</p>
                  <ul className="space-y-2">
                    {card.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <FiCheck className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" strokeWidth={3} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

      </motion.div>
    </>
  );
};

export default ProductPage;
