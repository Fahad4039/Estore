import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams } from 'wouter';
import {
  FiStar, FiUsers, FiArrowLeft, FiCheckCircle, FiShoppingBag,
  FiShare2, FiMapPin, FiCalendar, FiTruck, FiShield,
  FiPackage, FiMessageSquare, FiGrid, FiRefreshCw, FiClock,
  FiThumbsUp, FiAward, FiX, FiChevronRight, FiChevronDown,
  FiChevronUp, FiArrowRight,
} from 'react-icons/fi';
import { useProductStore } from '../store/productStore';
import ProductCard from '../components/product/ProductCard';

// ─── Seller data ──────────────────────────────────────────────────────────────
interface Seller {
  id: string; name: string; category: string; rating: number; sales: string;
  verified: boolean; avatar: string; cover: string; bio: string;
  location: string; joined: string; followers: string; responseRate: string;
  responseTime: string; deliveryTime: string; qualityScore: number;
  returnPolicy: string; badges: string[]; specialties: string[]; totalReviews: number;
}

const SELLERS: Record<string, Seller> = {
  ts1: {
    id: 'ts1', name: 'TechPeak', category: 'Electronics', rating: 4.9, sales: '12K+',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
    cover: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=400&fit=crop',
    bio: 'Your go-to destination for cutting-edge electronics. We curate the best tech so you don\'t have to — every product is personally tested by our team before hitting the shelf.',
    location: 'San Francisco, CA', joined: 'Jan 2022', followers: '8.2K', responseRate: '99%',
    responseTime: '< 1 hour', deliveryTime: '1–2 business days', qualityScore: 98,
    returnPolicy: '30-day hassle-free', badges: ['Top Seller', 'Fast Shipper', 'Verified'],
    specialties: ['Premium Tech', 'Tested & Certified', 'Official Warranty'],
    totalReviews: 3842,
  },
  ts2: {
    id: 'ts2', name: 'StyleHouse', category: 'Fashion', rating: 4.8, sales: '9K+',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face',
    cover: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=400&fit=crop',
    bio: 'Premium fashion curated for the modern lifestyle. Every piece tells a story — ethically sourced, trend-forward, and built to last multiple seasons.',
    location: 'New York, NY', joined: 'Mar 2021', followers: '6.1K', responseRate: '97%',
    responseTime: '< 2 hours', deliveryTime: '2–3 business days', qualityScore: 96,
    returnPolicy: '14-day free returns', badges: ['Top Seller', 'Verified'],
    specialties: ['Ethically Sourced', 'Trend-Forward', 'Size Inclusive'],
    totalReviews: 2210,
  },
  ts3: {
    id: 'ts3', name: 'SoundWave', category: 'Audio', rating: 4.9, sales: '7K+',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    cover: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=400&fit=crop',
    bio: 'Audiophile-grade gear for everyone. We believe great sound should be accessible — each product is tuned and reviewed by professional sound engineers.',
    location: 'Austin, TX', joined: 'Jun 2022', followers: '4.9K', responseRate: '98%',
    responseTime: '< 1 hour', deliveryTime: '1–3 business days', qualityScore: 99,
    returnPolicy: '30-day returns', badges: ['Top Seller', 'Fast Shipper'],
    specialties: ['Audiophile Grade', 'Engineer Tested', 'Noise Isolation'],
    totalReviews: 1876,
  },
  ts4: {
    id: 'ts4', name: 'GameZone', category: 'Gaming', rating: 4.7, sales: '6K+',
    verified: false,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop',
    bio: 'Level up your setup. From peripherals to games, we stock the arsenal every gamer needs — with competitive pricing and same-day dispatch on most orders.',
    location: 'Seattle, WA', joined: 'Sep 2022', followers: '3.7K', responseRate: '95%',
    responseTime: '< 3 hours', deliveryTime: '2–4 business days', qualityScore: 94,
    returnPolicy: '7-day returns', badges: ['Fast Shipper'],
    specialties: ['Same-Day Dispatch', 'Price Match', 'Bundle Deals'],
    totalReviews: 1420,
  },
  ts5: {
    id: 'ts5', name: 'BeautyLab', category: 'Beauty', rating: 4.8, sales: '5K+',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    cover: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=400&fit=crop',
    bio: 'Science-backed beauty products that actually work. No fillers, no fluff — every formula is dermatologist reviewed and cruelty-free certified.',
    location: 'Los Angeles, CA', joined: 'Feb 2023', followers: '2.8K', responseRate: '96%',
    responseTime: '< 2 hours', deliveryTime: '2–3 business days', qualityScore: 97,
    returnPolicy: '21-day returns', badges: ['Verified', 'Fast Shipper'],
    specialties: ['Dermatologist Reviewed', 'Cruelty Free', 'Clean Formula'],
    totalReviews: 980,
  },
};

const DEFAULT_SELLER = SELLERS['ts1'];

// ─── Story data ───────────────────────────────────────────────────────────────
const STORY_IMAGES = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=900&fit=crop',
];

const STORY_DATA = {
  today: [
    { img: STORY_IMAGES[0], caption: 'New arrivals just landed — limited stock available', label: 'New In', time: '2h ago' },
    { img: STORY_IMAGES[1], caption: 'Today only: extra 15% off on all orders above $80', label: 'Flash Offer', time: '4h ago' },
    { img: STORY_IMAGES[2], caption: 'Customer favourite — rated 5 stars by 340 buyers', label: 'Top Rated', time: '6h ago' },
  ],
  weekly: [
    { img: STORY_IMAGES[3], caption: 'Best seller of the week — 280 units moved', label: 'Best Seller', time: 'Mon' },
    { img: STORY_IMAGES[4], caption: 'Restocked: the item that sold out in 3 hours', label: 'Restocked', time: 'Tue' },
    { img: STORY_IMAGES[5], caption: 'Weekend bundle deal — save more when you buy 2+', label: 'Bundle Deal', time: 'Wed' },
    { img: STORY_IMAGES[6], caption: 'New collection added — fresh drops every Thursday', label: 'New Drop', time: 'Thu' },
  ],
};

// ─── Stories Modal ────────────────────────────────────────────────────────────
type StoryDay = 'today' | 'weekly';

const StoriesModal: React.FC<{
  seller: Seller;
  onClose: () => void;
}> = ({ seller, onClose }) => {
  const [day, setDay] = useState<StoryDay>('today');
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const DURATION = 4000;

  const stories = STORY_DATA[day];

  const goNext = useCallback(() => {
    if (idx < stories.length - 1) {
      setIdx(i => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [idx, stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (idx > 0) {
      setIdx(i => i - 1);
      setProgress(0);
    }
  }, [idx]);

  useEffect(() => {
    setIdx(0);
    setProgress(0);
  }, [day]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const step = 100 / (DURATION / 50);
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { goNext(); return 0; }
        return p + step;
      });
    }, 50);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [idx, day, goNext]);

  const story = stories[idx];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-sm h-[88vh] rounded-2xl overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Background image */}
          <img src={story.img} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/50" />

          {/* Progress bars */}
          <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
            {stories.map((_, i) => (
              <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-none"
                  style={{ width: i < idx ? '100%' : i === idx ? `${progress}%` : '0%' }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-7 left-3 right-3 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/60 flex-shrink-0">
                <img src={seller.avatar} alt={seller.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-white text-xs font-bold leading-none">{seller.name}</p>
                <p className="text-white/60 text-[10px] mt-0.5">{story.time}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors">
              <FiX className="w-4 h-4" />
            </button>
          </div>

          {/* Day selector */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full p-1 border border-white/15">
            {(['today', 'weekly'] as StoryDay[]).map(d => (
              <button
                key={d}
                onClick={() => setDay(d)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all ${
                  day === d ? 'bg-white text-black' : 'text-white/70 hover:text-white'
                }`}
              >
                {d === 'today' ? 'Today' : 'This Week'}
              </button>
            ))}
          </div>

          {/* Tap zones */}
          <button className="absolute inset-y-0 left-0 w-1/3 z-20" onClick={goPrev} />
          <button className="absolute inset-y-0 right-0 w-1/3 z-20" onClick={goNext} />

          {/* Bottom content */}
          <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
            <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/80 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest mb-2">
              {story.label}
            </div>
            <p className="text-white font-bold text-base leading-snug">{story.caption}</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 h-px bg-white/20" />
              <p className="text-white/40 text-[10px]">{idx + 1} / {stories.length}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Reviews ──────────────────────────────────────────────────────────────────
const REVIEWS = [
  { name: 'Alex M.',  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face', rating: 5, date: '3 days ago',   text: 'Incredible quality and super fast shipping. This seller is the real deal — will be coming back for sure!', product: 'Premium Wireless Headphones', helpful: 24 },
  { name: 'Sarah L.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face', rating: 5, date: '1 week ago',  text: 'Packaging was immaculate and the product is exactly as described. Highly recommend this store.', product: 'Smart Watch Pro', helpful: 18 },
  { name: 'James R.', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&h=80&fit=crop&crop=face', rating: 4, date: '2 weeks ago', text: 'Good seller, product arrived in perfect condition. Only minor issue was a slight delay but they communicated proactively.', product: 'Wireless Earbuds', helpful: 11 },
  { name: 'Maria K.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face', rating: 5, date: '3 weeks ago', text: 'Five stars all the way. The seller went above and beyond — even included a handwritten thank-you note!', product: 'Gaming Keyboard RGB', helpful: 31 },
  { name: 'Tom C.',   avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face', rating: 5, date: '1 month ago', text: "Best purchase I've made this year. Quality is insane for the price. Will definitely recommend.", product: 'Bluetooth Speaker', helpful: 42 },
];

// ─── FAQ data ─────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'What is the return policy for this store?',         a: 'We offer a hassle-free return window. If you are not satisfied, contact the seller within the return period and they will arrange a full refund or exchange at no cost to you.' },
  { q: 'How fast does this seller ship orders?',            a: 'Most orders are dispatched within 24 hours of payment confirmation. Estimated delivery is shown at checkout based on your location.' },
  { q: 'Are all products genuine and brand new?',           a: 'Yes. Every product listed by this seller is 100% authentic, brand new, and includes the official manufacturer warranty where applicable.' },
  { q: 'Can I contact the seller before purchasing?',       a: 'Absolutely. Use the message button on the product page to chat directly with the seller. They typically respond within the stated response time.' },
  { q: 'Does the seller offer bulk or wholesale pricing?',  a: 'Yes — for orders of 5+ units of the same item, send a message to the seller requesting a bulk quote and they will respond with a custom price.' },
  { q: 'What payment methods are accepted?',                a: 'All major credit and debit cards, PayPal, Apple Pay, and Google Pay are accepted. Payment is securely processed and your details are never stored.' },
];

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
const FAQItem: React.FC<{ q: string; a: string; index: number }> = ({ q, a, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border border-border rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 bg-card hover:bg-secondary/50 transition-colors text-left"
      >
        <span className="text-sm font-bold text-foreground">{q}</span>
        {open
          ? <FiChevronUp className="w-4 h-4 text-primary flex-shrink-0" />
          : <FiChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        }
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 bg-card/50 border-t border-border">
              <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Section heading ──────────────────────────────────────────────────────────
const SectionHeading: React.FC<{ eyebrow: string; eyebrowColor?: string; title: string; sub?: string; action?: React.ReactNode }> = ({
  eyebrow, eyebrowColor = 'text-primary', title, sub, action,
}) => (
  <div className="flex items-end justify-between gap-4 mb-6">
    <div>
      <p className={`text-xs font-black uppercase tracking-[0.25em] mb-1 ${eyebrowColor}`}>{eyebrow}</p>
      <h2 className="text-2xl md:text-3xl font-black text-foreground leading-tight">{title}</h2>
      {sub && <p className="text-sm text-muted-foreground mt-1">{sub}</p>}
    </div>
    {action}
  </div>
);

// ─── View All button ──────────────────────────────────────────────────────────
const ViewAllBtn: React.FC<{ href: string; label: string }> = ({ href, label }) => (
  <div className="mt-8 flex justify-center">
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-border bg-card hover:bg-secondary font-bold text-sm text-foreground transition-all hover:border-primary hover:text-primary group"
    >
      {label}
      <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </Link>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const SellerProfilePage: React.FC = () => {
  const { products } = useProductStore();
  const params = useParams<{ id: string }>();
  const seller = SELLERS[params.id] ?? DEFAULT_SELLER;
  const [followed, setFollowed]   = useState(false);
  const [storiesOpen, setStoriesOpen] = useState(false);

  const topSelling = [...products]
    .filter(p => p.category === seller.category && p.category !== 'Digital')
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);

  const soldOut = [...products]
    .filter(p => p.category !== seller.category && p.category !== 'Digital')
    .slice(0, 8);

  const allProducts = [...products]
    .filter(p => p.category === seller.category && p.category !== 'Digital');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-background">

      {storiesOpen && <StoriesModal seller={seller} onClose={() => setStoriesOpen(false)} />}

      {/* ── Cover ────────────────────────────────────────────────────────── */}
      <div className="relative w-full h-52 md:h-64 overflow-hidden">
        <img src={seller.cover} alt="cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute top-4 left-4">
          <Link href="/">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-bold border border-white/15 hover:bg-black/70 transition-colors">
              <FiArrowLeft className="w-3.5 h-3.5" /> Back to Store
            </button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4">

        {/* ── Profile header ──────────────────────────────────────────────── */}
        <div className="relative -mt-16 mb-8 flex flex-col sm:flex-row items-start sm:items-end gap-5">
          {/* Avatar — click to open stories */}
          <button
            onClick={() => setStoriesOpen(true)}
            className="relative flex-shrink-0 group focus:outline-none"
          >
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full p-[3px] shadow-2xl group-hover:scale-105 transition-transform duration-200"
              style={{ background: 'linear-gradient(135deg,#f43f5e,#fb923c,#facc15)' }}>
              <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-background">
                <img src={seller.avatar} alt={seller.name} className="w-full h-full object-cover" />
              </div>
            </div>
            {/* Story ring pulse */}
            <div className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ background: 'linear-gradient(135deg,#f43f5e,#facc15)', animationDuration: '2.5s' }} />
            {seller.verified && (
              <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center border-2 border-background shadow-lg z-10">
                <FiCheckCircle className="w-4 h-4 text-white" />
              </div>
            )}
            {/* "View Story" label on hover */}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-[10px] font-black tracking-wide">View Story</span>
            </div>
          </button>

          {/* Name + meta */}
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-2xl md:text-3xl font-black text-foreground">{seller.name}</h1>
              {seller.badges.map(b => (
                <span key={b} className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-primary/10 text-primary border border-primary/20">{b}</span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><FiGrid className="w-3 h-3" />{seller.category}</span>
              <span className="flex items-center gap-1"><FiMapPin className="w-3 h-3" />{seller.location}</span>
              <span className="flex items-center gap-1"><FiCalendar className="w-3 h-3" />Joined {seller.joined}</span>
              <span className="flex items-center gap-1.5">
                <FiStar className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="font-bold text-foreground">{seller.rating}</span>
                <span>({seller.totalReviews.toLocaleString()} reviews)</span>
              </span>
              <span className="flex items-center gap-1"><FiUsers className="w-3 h-3" />{seller.followers} followers</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0 pb-1">
            <button
              onClick={() => setFollowed(f => !f)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                followed
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                  : 'bg-card border border-border text-foreground hover:border-primary hover:text-primary'
              }`}
            >
              {followed ? 'Following' : 'Follow'}
            </button>
            <button className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-all">
              <FiShare2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── One-line stats strip ─────────────────────────────────────────── */}
        <div className="mb-10 rounded-2xl border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-4 divide-x divide-border">
            {[
              { label: 'Total Sales',  value: seller.sales,                         color: '#3b82f6' },
              { label: 'Followers',    value: seller.followers,                     color: '#8b5cf6' },
              { label: 'Rating',       value: `${seller.rating} / 5`,              color: '#f59e0b' },
              { label: 'Reviews',      value: seller.totalReviews.toLocaleString(), color: '#10b981' },
            ].map(stat => (
              <div key={stat.label} className="flex flex-col items-center justify-center py-4 px-2 text-center">
                <span className="text-lg md:text-xl font-black text-foreground leading-none" style={{ color: stat.color }}>{stat.value}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ABOUT SECTION                                                        */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="mb-14">
          <SectionHeading eyebrow="Seller" title="About the Store" />

          {/* Bio card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-6 relative overflow-hidden mb-4">
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-[0.06] blur-3xl pointer-events-none"
              style={{ background: 'radial-gradient(circle,#3b82f6,#8b5cf6)' }} />
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FiMessageSquare className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-black text-foreground">About {seller.name}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">{seller.bio}</p>
            <div className="flex flex-wrap gap-2">
              {seller.specialties.map(s => (
                <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-xs font-semibold text-foreground/80 border border-border">
                  <FiAward className="w-3 h-3 text-primary" /> {s}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Trust cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: FiShield,    color: '#3b82f6', label: 'Quality Score', value: `${seller.qualityScore}%`, sub: 'Products pass QC' },
              { icon: FiTruck,     color: '#10b981', label: 'Delivery',      value: seller.deliveryTime,        sub: 'Estimated dispatch' },
              { icon: FiRefreshCw, color: '#f59e0b', label: 'Returns',       value: seller.returnPolicy,        sub: 'No questions asked' },
              { icon: FiClock,     color: '#8b5cf6', label: 'Response',      value: seller.responseTime,        sub: `${seller.responseRate} rate` },
            ].map((item, i) => (
              <motion.div key={item.label}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${item.color}18` }}>
                  <item.icon style={{ color: item.color, width: 18, height: 18 }} />
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{item.label}</p>
                <p className="text-sm font-black text-foreground leading-tight">{item.value}</p>
                <p className="text-[10px] text-muted-foreground">{item.sub}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TOP SELLING ITEMS                                                    */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="mb-14">
          <SectionHeading
            eyebrow="Best Sellers"
            title="Top Selling Items"
            sub="Ranked by buyer ratings and total orders"
            action={
              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 flex-shrink-0">
                {topSelling.length} items
              </span>
            }
          />
          {topSelling.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {topSelling.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground text-sm rounded-2xl border border-border bg-card">
              No products available right now.
            </div>
          )}
          <ViewAllBtn href={`/shop?category=${seller.category.toLowerCase()}`} label="See All Top Items" />
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SOLD OUT                                                             */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="mb-14">
          <SectionHeading
            eyebrow="Out of Stock"
            eyebrowColor="text-rose-400"
            title="Sold Out Products of This Store"
            sub="These flew off the shelves — notify me when back in stock"
            action={
              <span className="text-xs font-bold text-rose-400 bg-rose-400/10 px-3 py-1.5 rounded-full border border-rose-400/20 flex-shrink-0">
                {soldOut.length} items
              </span>
            }
          />

          {/* Restock notice */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center flex-shrink-0">
              <FiPackage style={{ color: '#f43f5e', width: 20, height: 20 }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Items restocking soon</p>
              <p className="text-xs text-muted-foreground">The Sold Out button updates automatically once stock is replenished.</p>
            </div>
            <button className="flex-shrink-0 px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors">
              Notify Me
            </button>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {soldOut.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <ProductCard product={p} soldOut />
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ALL PRODUCTS                                                         */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="mb-14">
          <SectionHeading
            eyebrow="Full Catalogue"
            title="All Products"
            sub={`${allProducts.length} products from ${seller.name}`}
            action={
              <span className="text-xs font-bold text-muted-foreground bg-secondary px-3 py-1.5 rounded-full border border-border flex-shrink-0">
                {allProducts.length} total
              </span>
            }
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {allProducts.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
          <ViewAllBtn href={`/shop?category=${seller.category.toLowerCase()}`} label="See All in Shop" />
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* REVIEWS                                                              */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="mb-14">
          <SectionHeading
            eyebrow="Customer Reviews"
            title="What Buyers Say"
            sub={`${seller.totalReviews.toLocaleString()} verified reviews`}
          />

          {/* Rating summary */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-5 flex items-center gap-8 flex-wrap mb-6">
            <div className="text-center flex-shrink-0">
              <p className="text-6xl font-black text-foreground leading-none">{seller.rating}</p>
              <div className="flex gap-0.5 mt-2 justify-center">
                {[1,2,3,4,5].map(s => (
                  <FiStar key={s} className={`w-4 h-4 ${s <= Math.round(seller.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-yellow-400/30'}`} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{seller.totalReviews.toLocaleString()} reviews</p>
            </div>
            <div className="flex-1 min-w-[160px] space-y-2">
              {[{label:'5 stars',pct:68},{label:'4 stars',pct:21},{label:'3 stars',pct:7},{label:'2 stars',pct:3},{label:'1 star',pct:1}].map(r => (
                <div key={r.label} className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground w-12 flex-shrink-0">{r.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <motion.div className="h-full rounded-full bg-yellow-400" initial={{ width: 0 }} animate={{ width: `${r.pct}%` }} transition={{ delay: 0.2, duration: 0.6 }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-7 flex-shrink-0">{r.pct}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="space-y-4">
            {REVIEWS.map((review, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start gap-4">
                  <img src={review.avatar} alt={review.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{review.name}</span>
                        <FiCheckCircle className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">Verified</span>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{review.date}</span>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {[1,2,3,4,5].map(s => (
                        <FiStar key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-yellow-400/25'}`} />
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-2">Re: <span className="text-foreground/70 font-semibold">{review.product}</span></p>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-3">{review.text}</p>
                    <button className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors font-semibold">
                      <FiThumbsUp className="w-3 h-3" /> Helpful ({review.helpful})
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* STORE FAQs                                                           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="mb-16">
          <SectionHeading
            eyebrow="Store FAQs"
            title="Frequently Asked Questions"
            sub="Everything you need to know about buying from this store"
          />
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} index={i} />
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FiMessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Still have questions?</p>
              <p className="text-xs text-muted-foreground">Send a direct message to {seller.name} — they respond within {seller.responseTime}.</p>
            </div>
            <button className="flex-shrink-0 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 transition-all">
              Message Seller
            </button>
          </div>
        </section>

      </div>
    </motion.div>
  );
};

export default SellerProfilePage;
