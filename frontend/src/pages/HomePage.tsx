import React, { useCallback, useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { Link } from 'wouter';
import {
  FiTruck, FiRefreshCw, FiShield, FiGrid,
  FiBox, FiUsers, FiShoppingBag, FiStar, FiZap, FiArrowRight,
  FiTrendingUp, FiPercent, FiAward, FiThumbsUp, FiDollarSign, FiTag,
  FiSun, FiCheckCircle,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useProductStore } from '../store/productStore';
import ProductCard from '../components/product/ProductCard';


// ─── Hero Carousel (embla-powered, auto-plays, fade-like crossfade) ───────────
const HERO_SLIDES = [
  {
    img: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=1400&h=900&fit=crop',
    label: 'New Collection 2025',
    labelColor: 'text-blue-400',
    labelBg: 'bg-blue-500/20 border-blue-500/30',
    title: <>Next-Gen<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Tech</span></>,
    body: 'Experience the future with our latest premium electronics. Uncompromised quality, unmatched performance.',
    glowColor: 'bg-blue-700/20',
    overlayFrom: 'from-[#000d1f]',
    ctaHref: '/shop?category=Electronics',
    ctaLabel: 'Shop Electronics',
    ctaBg: 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_24px_rgba(37,99,235,0.5)]',
  },
  {
    img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1400&h=900&fit=crop',
    label: "Editor's Choice",
    labelColor: 'text-green-400',
    labelBg: 'bg-green-500/20 border-green-500/30',
    title: <>Audio<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">Perfection</span></>,
    body: 'Hear every detail exactly as the artist intended. Immerse yourself in studio-quality sound.',
    glowColor: 'bg-green-700/20',
    overlayFrom: 'from-[#001a08]',
    ctaHref: '/shop?category=Audio',
    ctaLabel: 'Shop Audio',
    ctaBg: 'bg-green-600 hover:bg-green-500 shadow-[0_0_24px_rgba(22,163,74,0.5)]',
  },
  {
    img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&h=900&fit=crop',
    label: 'Limited Edition',
    labelColor: 'text-purple-400',
    labelBg: 'bg-purple-500/20 border-purple-500/30',
    title: <>Premium<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">Fashion</span></>,
    body: 'Dress to impress with our exclusive curated collection. Luxury meets everyday comfort.',
    glowColor: 'bg-purple-700/20',
    overlayFrom: 'from-[#0d0014]',
    ctaHref: '/shop?category=Fashion',
    ctaLabel: 'Explore Fashion',
    ctaBg: 'bg-purple-600 hover:bg-purple-500 shadow-[0_0_24px_rgba(147,51,234,0.5)]',
  },
];

function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 40 });
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    const timer = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => { emblaApi.off('select', onSelect); clearInterval(timer); };
  }, [emblaApi, onSelect]);

  return (
    <section id="home" className="relative h-screen min-h-[600px] w-full overflow-hidden -mt-[60px]">
      <div className="overflow-hidden w-full h-full" ref={emblaRef}>
        <div className="flex w-full h-full">
          {HERO_SLIDES.map((s, i) => (
            <div key={i} className="flex-[0_0_100%] relative w-full h-full overflow-hidden">
              <img src={s.img} alt={s.ctaLabel} className="absolute inset-0 w-full h-full object-cover object-center" />
              <div className={`absolute inset-0 bg-gradient-to-r ${s.overlayFrom} via-black/70 to-transparent`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] ${s.glowColor} blur-[120px] pointer-events-none`} />
              <div className="relative z-10 h-full flex items-end pb-24 md:pb-32">
                <div className="container mx-auto px-6 md:px-12">
                  <div className="max-w-xl text-white space-y-6">
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full ${s.labelBg} ${s.labelColor} text-xs font-bold tracking-widest uppercase border backdrop-blur-sm`}>{s.label}</span>
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">{s.title}</h1>
                    <p className="text-base md:text-lg text-white/70 max-w-md leading-relaxed">{s.body}</p>
                    <div className="flex flex-wrap gap-4 pt-2">
                      <Link href={s.ctaHref} className={`px-7 py-3.5 ${s.ctaBg} text-white rounded-xl font-bold transition-all`}>{s.ctaLabel}</Link>
                      <Link href="/shop" className="px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold backdrop-blur-sm transition-all border border-white/15">View All</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {HERO_SLIDES.map((_, i) => (
          <button key={i} onClick={() => emblaApi?.scrollTo(i)}
            className={`rounded-full transition-all duration-300 ${i === selected ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40'}`} />
        ))}
      </div>
    </section>
  );
}

// ─── Reusable Section Header ───────────────────────────────────────────────────
const SectionHeader: React.FC<{
  eyebrow: string;
  eyebrowColor?: string;
  title: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ eyebrow, eyebrowColor = 'text-primary', title, icon }) => (
  <div className="mb-8">
    <p className={`${eyebrowColor} text-[11px] font-black uppercase tracking-[0.35em] mb-1`}>{eyebrow}</p>
    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
      {title}{icon}
    </h2>
  </div>
);

// ─── View All button ───────────────────────────────────────────────────────────
const ViewAllButton: React.FC<{ href: string; label?: string }> = ({ href, label = 'View All' }) => (
  <div className="mt-8 flex justify-center">
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-border bg-card hover:bg-secondary font-bold text-sm text-foreground transition-all duration-200 hover:border-primary hover:text-primary group"
    >
      {label}
      <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </Link>
  </div>
);

// ─── 2-Col Vertical Grid (like old New Arrivals) ──────────────────────────────
const TwoColGrid: React.FC<{
  products: typeof import('../data/products').products;
}> = ({ products: prods }) => (
  <div className="grid grid-cols-2 gap-3 sm:gap-4">
    {prods.map((product, i) => (
      <motion.div
        key={product.id}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.05, duration: 0.45 }}
      >
        <ProductCard product={product} />
      </motion.div>
    ))}
  </div>
);

// ─── Single-Row Horizontal Scroll (1 product per column) ──────────────────────
const SingleRowScroll: React.FC<{
  products: typeof import('../data/products').products;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}> = ({ products: prods, scrollRef }) => (
  <div
    ref={scrollRef}
    className="flex overflow-x-auto pb-4 gap-4 snap-x snap-mandatory hide-scrollbar"
  >
    {prods.map(product => (
      <div key={product.id} className="min-w-[260px] w-[260px] sm:min-w-[280px] sm:w-[280px] snap-start shrink-0">
        <ProductCard product={product} />
      </div>
    ))}
    <div className="min-w-[1px] shrink-0" />
  </div>
);

// ─── Auto-scroll hook ──────────────────────────────────────────────────────────
const useAutoScroll = (ref: React.RefObject<HTMLDivElement | null>, colWidth: number, delay = 3000) => {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let paused = false;
    const onEnter = () => { paused = true; };
    const onLeave = () => { paused = false; };
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    const id = setInterval(() => {
      if (paused) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 8) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: colWidth, behavior: 'smooth' });
      }
    }, delay);
    return () => {
      clearInterval(id);
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [ref, colWidth, delay]);
};


const HomePage: React.FC = () => {
  const { products } = useProductStore();
  const [timeLeft, setTimeLeft] = useState({ h: 23, m: 59, s: 59 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 };
        if (prev.h > 0) return { ...prev, h: prev.h - 1, m: 59, s: 59 };
        return { h: 24, m: 0, s: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const statsRef = React.useRef(null);
  useInView(statsRef, { once: true, margin: '-100px' });

  const bestValRef   = useRef<HTMLDivElement>(null);
  const popularRef   = useRef<HTMLDivElement>(null);
  const recoRef      = useRef<HTMLDivElement>(null);

  // card width 280px + gap 16px → advance by ~296
  useAutoScroll(bestValRef, 296, 3500);
  useAutoScroll(popularRef, 296, 3800);
  useAutoScroll(recoRef,    296, 4100);

  const categories = [
    { name: 'Electronics', count: products.filter(p => p.category === 'Electronics').length, img: products.find(p => p.category === 'Electronics')?.images[0] },
    { name: 'Fashion',     count: products.filter(p => p.category === 'Fashion').length,     img: products.find(p => p.category === 'Fashion')?.images[0] },
    { name: 'Audio',       count: products.filter(p => p.category === 'Audio').length,       img: products.find(p => p.category === 'Audio')?.images[0] },
    { name: 'Sports',      count: products.filter(p => p.category === 'Sports').length,      img: products.find(p => p.category === 'Sports')?.images[0] },
    { name: 'Gaming',      count: products.filter(p => p.category === 'Gaming').length,      img: products.find(p => p.category === 'Gaming')?.images[0] },
    { name: 'Beauty',      count: products.filter(p => p.category === 'Beauty').length,      img: products.find(p => p.category === 'Beauty')?.images[0] },
    { name: 'Digital',     count: products.filter(p => p.category === 'Digital').length,     img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=800&fit=crop' },
  ];

  const trendingProducts    = products.filter(p => p.isTrending).slice(0, 16);
  const flashDeals          = products.filter(p => p.isFlashSale).slice(0, 16);
  const bestValueProducts   = [...products].filter(p => p.discount > 0).sort((a, b) => b.discount - a.discount).slice(0, 16);
  const mostPopularProducts = [...products].filter(p => p.category !== 'Digital').sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 16);
  const newArrivals         = products.filter(p => p.isNew && p.category !== 'Digital').slice(0, 16);
  const summerProducts      = [...products].filter(p => ['Fashion', 'Sports', 'Beauty'].includes(p.category)).slice(0, 12);
  const recommendedProducts = [...products].filter(p => p.isBestSeller && p.category !== 'Digital').sort((a, b) => b.rating - a.rating).slice(0, 16);

  const rareProducts = [...products]
    .filter(p => p.rating >= 4.8 && p.isBestSeller && p.isTrending && p.category !== 'Digital')
    .slice(0, 8)
    .concat(
      [...products].filter(p => p.rating >= 4.9 && p.category !== 'Digital').slice(0, 4)
    )
    .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
    .slice(0, 8);

  const topAffiliators = [
    { id: 'af1', name: 'MarketingMike',  commission: '$2.8K', sales: '142', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face', rank: 1 },
    { id: 'af2', name: 'SalesStar_Ria',  commission: '$2.1K', sales: '118', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face', rank: 2 },
    { id: 'af3', name: 'PromoKing_Dan',  commission: '$1.9K', sales: '97',  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face', rank: 3 },
    { id: 'af4', name: 'ClickMaster',    commission: '$1.7K', sales: '84',  avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face', rank: 4 },
    { id: 'af5', name: 'ConvertQueen',   commission: '$1.5K', sales: '76',  avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face', rank: 5 },
    { id: 'af6', name: 'SocialShop_Sam', commission: '$1.4K', sales: '68',  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face', rank: 6 },
    { id: 'af7', name: 'InfluenceNick',  commission: '$1.2K', sales: '61',  avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&h=200&fit=crop&crop=face', rank: 7 },
    { id: 'af8', name: 'LinkLord_Amy',   commission: '$1.1K', sales: '54',  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face', rank: 8 },
  ];

  const topSellers = [
    { id: 'ts1', name: 'TechPeak',    category: 'Electronics', rating: 4.9, sales: '12K+', verified: true, avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face' },
    { id: 'ts2', name: 'StyleHouse',  category: 'Fashion',     rating: 4.8, sales: '9K+',  verified: true, avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face' },
    { id: 'ts3', name: 'SoundWave',   category: 'Audio',       rating: 4.9, sales: '7K+',  verified: true, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' },
    { id: 'ts4', name: 'GameZone',    category: 'Gaming',      rating: 4.7, sales: '6K+',  verified: false, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face' },
    { id: 'ts5', name: 'BeautyLab',   category: 'Beauty',      rating: 4.8, sales: '5K+',  verified: true, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face' },
    { id: 'ts6', name: 'SportsPro',   category: 'Sports',      rating: 4.6, sales: '4K+',  verified: true, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face' },
    { id: 'ts7', name: 'DigiWorld',   category: 'Digital',     rating: 4.9, sales: '11K+', verified: true, avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&h=200&fit=crop&crop=face' },
    { id: 'ts8', name: 'GadgetKing',  category: 'Electronics', rating: 4.7, sales: '8K+',  verified: false, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face' },
    { id: 'ts9', name: 'LuxeWear',    category: 'Fashion',     rating: 4.8, sales: '6K+',  verified: true, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face' },
    { id: 'ts10', name: 'AudioNest',  category: 'Audio',       rating: 4.6, sales: '3K+',  verified: false, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col min-h-screen"
    >

      {/* ── 1. Hero Carousel ─────────────────────────────────────────────────── */}
      <HeroCarousel />

      {/* ── 2. Digital Era Banner — SHOP WITHOUT LIMITS ─────────────────────── */}
      <section id="digital" className="relative w-full overflow-hidden bg-background border-t border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-stretch min-h-[600px] lg:min-h-[680px]">
          <div className="flex-1 flex flex-col justify-center px-8 md:px-16 py-16 lg:py-0 order-2 lg:order-1">
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="max-w-md">
              <span className="text-xs font-black uppercase tracking-[0.35em] text-muted-foreground block mb-6">Digital Era · 2025</span>
              <h2 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter text-foreground mb-8">
                SHOP<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-400">WITH</span><br />OUT<br />LIMITS
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-10 max-w-xs">Tools, scripts, courses &amp; prompts that generate real income. Every product chosen for those who build online.</p>
              <div className="flex items-center gap-6">
                <Link href="/category/digital" className="group inline-flex items-center gap-3 px-7 py-3.5 bg-foreground text-background text-sm font-black uppercase tracking-wider rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-md">
                  Explore
                  <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/category/digital" className="text-muted-foreground hover:text-foreground text-xs font-bold uppercase tracking-widest transition-colors border-b border-border hover:border-foreground pb-0.5">All Products</Link>
              </div>
            </motion.div>
          </div>
          <div className="relative flex-shrink-0 flex items-center justify-center px-6 py-10 lg:py-6 order-1 lg:order-2">
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} whileInView={{ opacity: 1, scale: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }} className="relative">
              <div className="absolute -inset-3 border border-border/60 pointer-events-none" style={{ clipPath: 'polygon(18px 0%, 100% 0%, calc(100% - 18px) 100%, 0% 100%)' }} />
              <div className="absolute -inset-6 border border-border/30 pointer-events-none" style={{ clipPath: 'polygon(28px 0%, 100% 0%, calc(100% - 28px) 100%, 0% 100%)' }} />
              <div className="relative overflow-hidden w-[260px] sm:w-[300px] lg:w-[340px]" style={{ clipPath: 'polygon(20px 0%, calc(100% - 20px) 0%, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0% calc(100% - 20px), 0% 20px)' }}>
                <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=680&h=960&fit=crop" alt="Digital Products" className="w-full h-[420px] sm:h-[500px] lg:h-[580px] object-cover object-center" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="text-white/50 text-[10px] uppercase tracking-[0.25em] mb-1">Digital Marketplace</div>
                  <div className="text-white font-bold text-lg leading-tight">Instant Downloads</div>
                </div>
              </div>
              <div className="absolute -top-3 -right-3 bg-foreground text-background px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">Digital</div>
              <div className="absolute -bottom-4 -left-4 bg-primary text-primary-foreground px-4 py-2 shadow-xl rounded-sm">
                <div className="text-[10px] uppercase tracking-widest opacity-70">100%</div>
                <div className="text-xl font-black leading-none">Instant</div>
              </div>
            </motion.div>
          </div>
          <div className="flex-1 hidden lg:flex flex-col justify-center items-start px-16 order-3">
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.3 }} className="space-y-10">
              {[{ num: '200+', label: 'Digital Products' }, { num: '10K+', label: 'Happy Buyers' }, { num: '4.9', label: 'Avg Rating' }].map(({ num, label }) => (
                <div key={label} className="border-l-2 border-border pl-5">
                  <div className="text-3xl font-black text-foreground">{num}</div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mt-0.5">{label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 3. Feature Bar ───────────────────────────────────────────────────── */}
      <section className="relative py-16 bg-background overflow-hidden border-t border-border">
        <div className="absolute inset-0 opacity-[0.022]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[180px] bg-primary/6 blur-[100px] pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: FiTruck,     title: 'Free Shipping',  desc: 'On orders over $50',    glow: 'rgba(59,130,246,0.3)',  border: 'rgba(59,130,246,0.22)', iconBg: 'rgba(59,130,246,0.1)',  ic: '#60a5fa' },
              { icon: FiRefreshCw, title: 'Easy Returns',   desc: '30-day hassle-free',    glow: 'rgba(16,185,129,0.3)',  border: 'rgba(16,185,129,0.22)', iconBg: 'rgba(16,185,129,0.1)',  ic: '#34d399' },
              { icon: FiShield,    title: 'Secure Payment', desc: '256-bit SSL encrypted', glow: 'rgba(245,158,11,0.3)',  border: 'rgba(245,158,11,0.22)', iconBg: 'rgba(245,158,11,0.1)',  ic: '#fbbf24' },
              { icon: FiGrid,      title: '120+ Products',  desc: 'Across 9 categories',   glow: 'rgba(139,92,246,0.3)', border: 'rgba(139,92,246,0.22)', iconBg: 'rgba(139,92,246,0.1)', ic: '#a78bfa' },
            ].map(({ icon: Icon, title, desc, glow, border, iconBg, ic }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -8, scale: 1.03 }}
                className="relative group rounded-2xl p-6 overflow-hidden cursor-default"
                style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${border}`, backdropFilter: 'blur(12px)' }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" style={{ background: `radial-gradient(circle at 40% 60%, ${glow}, transparent 68%)` }} />
                <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg" style={{ background: iconBg, border: `1px solid ${border}` }}>
                  <Icon className="w-6 h-6" style={{ color: ic }} />
                </div>
                <h4 className="font-black text-foreground text-sm sm:text-base mb-1 relative">{title}</h4>
                <p className="text-xs text-muted-foreground relative">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Categories Grid ───────────────────────────────────────────────── */}
      <section id="category" className="py-24 bg-background relative overflow-hidden border-t border-border">
        <div className="absolute inset-0 opacity-[0.018]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-32 right-1/4 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="mb-14">
            <p className="text-primary text-[11px] font-black uppercase tracking-[0.35em] mb-3">Collections</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
              Shop by{' '}<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Category</span>
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md text-sm leading-relaxed">Explore our premium collections, curated for every lifestyle and interest.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat, i) => (
              <Link key={cat.name} href={`/category/${cat.name.toLowerCase()}`}>
                <motion.div
                  initial={{ opacity: 0, y: 32, scale: 0.97 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.09, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="group relative h-72 rounded-3xl overflow-hidden cursor-pointer"
                >
                  <img src={cat.img} alt={cat.name} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10" />
                  <div className="absolute inset-0 bg-primary/18 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 rounded-3xl ring-1 ring-white/10 group-hover:ring-primary/50 transition-all duration-500" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white/70 text-[10px] font-bold uppercase tracking-wider border border-white/10 group-hover:border-white/25 transition-colors duration-300">{cat.count} Items</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight leading-none">{cat.name}</h3>
                      <p className="text-white/45 text-[11px] mt-1.5 uppercase tracking-widest">Explore Collection</p>
                    </div>
                    <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white group-hover:bg-primary group-hover:border-primary transition-all duration-300 group-hover:scale-110">
                      <FiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Trending Now — 2-row horizontal scroll ────────────────────────── */}
      <section id="trending" className="py-16 bg-secondary/30 border-t border-border">
        <div className="container mx-auto px-4">
          <SectionHeader
            eyebrow="Hot Right Now"
            eyebrowColor="text-violet-500"
            title="Trending Now"
            icon={<FiTrendingUp className="text-violet-500 w-5 h-5" />}
          />
          <TwoColGrid products={trendingProducts} />
          <ViewAllButton href="/shop?sort=trending" label="View All Trending" />
        </div>
      </section>

      {/* ── 6. WhatsApp Community ─────────────────────────────────────────────── */}
      <section className="py-10 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <div className="bg-[#052e16] rounded-3xl overflow-hidden relative border border-[#166534]">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#22c55e 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-white max-w-xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Join Our WhatsApp Community</h2>
                <p className="text-[#a7f3d0] text-lg mb-6">Get exclusive access to secret drops, early sales, and direct customer support.</p>
                <ul className="space-y-3 mb-8">
                  {['Daily Deals & Flash Sales', 'Exclusive Discount Coupons', 'Early Access to New Arrivals', 'Priority Support'].map((benefit) => (
                    <li key={benefit} className="flex items-center space-x-3 text-[#d1fae5]">
                      <div className="w-5 h-5 rounded-full bg-[#22c55e] flex items-center justify-center flex-shrink-0">
                        <FiStar className="w-3 h-3 text-white" />
                      </div>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <a href="#" className="inline-flex items-center gap-3 px-8 py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg font-bold transition-all shadow-lg">
                  <FaWhatsapp className="w-6 h-6" />
                  Join WhatsApp Channel
                </a>
              </div>
              <div className="hidden md:block">
                <FaWhatsapp className="w-64 h-64 text-[#22c55e] opacity-20 transform rotate-12" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Flash Deals — 2-row horizontal scroll ─────────────────────────── */}
      <section id="flash-deals" className="py-16 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <p className="text-orange-500 text-[11px] font-black uppercase tracking-[0.35em] mb-1">Limited Time</p>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
                Flash Deals <FiZap className="text-orange-500 fill-orange-500 w-5 h-5" />
              </h2>
              <div className="flex items-center gap-1.5 bg-destructive/10 px-3 py-1.5 rounded-lg border border-destructive/20 text-destructive text-sm font-bold tabular-nums">
                {String(timeLeft.h).padStart(2,'0')}:{String(timeLeft.m).padStart(2,'0')}:{String(timeLeft.s).padStart(2,'0')}
              </div>
            </div>
          </div>
          <TwoColGrid products={flashDeals} />
          <ViewAllButton href="/shop?filter=flash" label="View All Flash Deals" />
        </div>
      </section>

      {/* ── 8. Become an Affiliate Marketer Banner ───────────────────────────── */}
      <section className="py-10 bg-secondary/30 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="rounded-3xl overflow-hidden relative border border-blue-900/60" style={{ background: 'linear-gradient(135deg,#0a0f2e 0%,#0d1b4a 50%,#0a0f2e 100%)' }}>
            <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/15 blur-[100px] pointer-events-none" />
            <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-white max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-widest mb-5">
                  <FiDollarSign className="w-3 h-3" /> Earn More
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Become an Affiliate Marketer</h2>
                <p className="text-blue-200/80 text-lg mb-6">Share our products, earn commissions on every sale. No investment needed — just your reach.</p>
                <ul className="space-y-3 mb-8">
                  {['Earn up to 20% Commission', 'Real-time Earnings Dashboard', 'Dedicated Affiliate Support', 'Weekly Payouts via PayPal'].map((benefit) => (
                    <li key={benefit} className="flex items-center space-x-3 text-blue-100/90">
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <FiStar className="w-3 h-3 text-white" />
                      </div>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <a href="#" className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-900/40">
                  <FiDollarSign className="w-5 h-5" />
                  Join Affiliate Program
                </a>
              </div>
              <div className="hidden md:flex flex-col items-center gap-4 opacity-20">
                <FiDollarSign className="w-48 h-48 text-blue-400 transform -rotate-12" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. Best Value — 2-row horizontal scroll ──────────────────────────── */}
      <section id="best-value" className="py-16 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <SectionHeader
            eyebrow="Maximum Savings"
            eyebrowColor="text-emerald-500"
            title="Best Value"
            icon={<FiPercent className="text-emerald-500 w-5 h-5" />}
          />
          <SingleRowScroll products={bestValueProducts} scrollRef={bestValRef} />
          <ViewAllButton href="/shop?sort=discount" label="View All Best Value" />
        </div>
      </section>

      {/* ── 10. Most Popular — 2-row horizontal scroll ───────────────────────── */}
      <section id="most-popular" className="py-16 bg-secondary/30 border-t border-border">
        <div className="container mx-auto px-4">
          <SectionHeader
            eyebrow="Community Picks"
            eyebrowColor="text-amber-500"
            title="Most Popular"
            icon={<FiThumbsUp className="text-amber-500 w-5 h-5" />}
          />
          <SingleRowScroll products={mostPopularProducts} scrollRef={popularRef} />
          <ViewAllButton href="/shop?sort=popular" label="View All Popular" />
        </div>
      </section>

      {/* ── 10b. Rare Items ──────────────────────────────────────────────────── */}
      <section className="py-16 bg-background border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-40"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 80% 50%,rgba(139,92,246,0.08),transparent 70%)' }} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-start justify-between mb-8 gap-4">
            <SectionHeader
              eyebrow="Limited Availability"
              eyebrowColor="text-violet-500"
              title={<>Rare Items <FiAward className="text-violet-500 w-5 h-5" /></>}
            />
            <Link
              href="/shop?sort=rare"
              className="flex-shrink-0 mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors border-b border-border hover:border-primary pb-0.5"
            >
              View All Rare <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {/* Banner strip */}
          <div className="rounded-2xl overflow-hidden mb-8 relative h-32 md:h-44 border border-violet-500/20">
            <img
              src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1400&h=400&fit=crop"
              alt="Rare Items"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0.15) 60%,transparent 100%)' }} />
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-400 block mb-1">Exclusive Picks</span>
              <p className="text-xl md:text-3xl font-black leading-tight">Hard to Find.<br className="hidden md:block" />Worth Every Penny.</p>
              <p className="text-white/50 text-xs mt-1 hidden md:block">Top-rated products with limited stock</p>
            </div>
          </div>
          <TwoColGrid products={rareProducts} />
          <ViewAllButton href="/shop?sort=rare" label="View All Rare Items" />
        </div>
      </section>

      {/* ── 10c. Top Sellers ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-background border-t border-border overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-start justify-between mb-8 gap-4">
            <SectionHeader
              eyebrow="Featured Stores"
              eyebrowColor="text-rose-500"
              title={<>Top Sellers <FiAward className="text-rose-500 w-5 h-5" /></>}
            />
            <Link
              href="/sellers"
              className="flex-shrink-0 mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors border-b border-border hover:border-primary pb-0.5"
            >
              View All Sellers <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex gap-5 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory">
            {topSellers.map((seller, i) => (
              <motion.div
                key={seller.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.45 }}
                className="flex-shrink-0 snap-start"
              >
                <Link href={`/seller/${seller.id}`}>
                  <div className="flex flex-col items-center gap-2.5 w-[100px] group cursor-pointer">
                    {/* Circle avatar with gradient ring */}
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full p-[2.5px]"
                        style={{ background: 'linear-gradient(135deg,#f43f5e,#fb923c,#facc15)' }}>
                        <div className="w-full h-full rounded-full overflow-hidden border-2 border-background">
                          <img
                            src={seller.avatar}
                            alt={seller.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      </div>
                      {seller.verified && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center border-2 border-background">
                          <FiCheckCircle className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-[12px] font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{seller.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{seller.category}</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <FiStar className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-[10px] font-bold text-foreground/70">{seller.rating}</span>
                        <span className="text-[9px] text-muted-foreground">· {seller.sales}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <ViewAllButton href="/sellers" label="View All Sellers" />
        </div>
      </section>

      {/* ── 10d. Top Affiliators ─────────────────────────────────────────────── */}
      <section className="py-16 bg-secondary/30 border-t border-border overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-start justify-between mb-8 gap-4">
            <SectionHeader
              eyebrow="Earn With Us"
              eyebrowColor="text-emerald-500"
              title={<>Top Affiliators <FiTrendingUp className="text-emerald-500 w-5 h-5" /></>}
            />
            <Link
              href="/affiliators"
              className="flex-shrink-0 mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors border-b border-border hover:border-primary pb-0.5"
            >
              Full Leaderboard <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex gap-5 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory">
            {topAffiliators.map((af, i) => (
              <motion.div
                key={af.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.45 }}
                className="flex-shrink-0 snap-start"
              >
                <Link href="/affiliators">
                  <div className="flex flex-col items-center gap-2.5 w-[104px] group cursor-pointer">
                    <div className="relative">
                      {/* Rank badge */}
                      <div className="absolute -top-1 -left-1 z-10 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white border border-background"
                        style={{ background: af.rank === 1 ? 'linear-gradient(135deg,#f59e0b,#d97706)' : af.rank === 2 ? 'linear-gradient(135deg,#94a3b8,#64748b)' : af.rank === 3 ? 'linear-gradient(135deg,#b45309,#92400e)' : 'rgba(0,0,0,0.6)' }}>
                        {af.rank}
                      </div>
                      <div className="w-20 h-20 rounded-full p-[2.5px]"
                        style={{ background: 'linear-gradient(135deg,#10b981,#3b82f6,#8b5cf6)' }}>
                        <div className="w-full h-full rounded-full overflow-hidden border-2 border-background">
                          <img
                            src={af.avatar}
                            alt={af.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[12px] font-bold text-foreground leading-tight group-hover:text-primary transition-colors truncate w-full">{af.name}</p>
                      <p className="text-[10px] text-emerald-400 font-bold mt-0.5">{af.commission}</p>
                      <p className="text-[9px] text-muted-foreground">{af.sales} sales</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <ViewAllButton href="/affiliators" label="View Full Leaderboard" />
        </div>
      </section>

      {/* ── 11. Become a Seller Banner ────────────────────────────────────────── */}
      <section className="py-10 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <div className="rounded-3xl overflow-hidden relative border border-amber-900/60" style={{ background: 'linear-gradient(135deg,#1a0e00 0%,#2d1a00 50%,#1a0e00 100%)' }}>
            <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[400px] h-[400px] bg-amber-600/15 blur-[100px] pointer-events-none" />
            <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-white max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-widest mb-5">
                  <FiTag className="w-3 h-3" /> Sell with Us
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Become a Seller</h2>
                <p className="text-amber-200/80 text-lg mb-6">List your products, reach thousands of buyers, and grow your business — all on one powerful platform.</p>
                <ul className="space-y-3 mb-8">
                  {['Zero Listing Fees to Start', 'Access to 99K+ Active Buyers', 'Seller Analytics & Insights', 'Fast & Secure Payouts'].map((benefit) => (
                    <li key={benefit} className="flex items-center space-x-3 text-amber-100/90">
                      <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                        <FiStar className="w-3 h-3 text-white" />
                      </div>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <a href="#" className="inline-flex items-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black rounded-lg font-bold transition-all shadow-lg shadow-amber-900/40">
                  <FiTag className="w-5 h-5" />
                  Start Selling Today
                </a>
              </div>
              <div className="hidden md:flex flex-col items-center gap-4 opacity-20">
                <FiTag className="w-48 h-48 text-amber-400 transform rotate-12" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 12a. Summer Special ──────────────────────────────────────────────── */}
      <section id="summer-special" className="py-16 bg-background border-t border-border relative overflow-hidden">
        {/* warm gradient wash */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%,rgba(251,146,60,0.07),transparent 65%)' }} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="mb-8">
            <p className="text-orange-400 text-[11px] font-black uppercase tracking-[0.35em] mb-1">Hot Season</p>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
              Summer Special <FiSun className="text-orange-400 w-5 h-5" />
            </h2>
            <p className="text-muted-foreground text-sm mt-1">Hand-picked for the season — fashion, sports & beauty deals you'll love.</p>
          </div>
          {/* hero strip */}
          <div className="rounded-2xl overflow-hidden mb-8 relative h-40 md:h-52 border border-orange-500/20">
            <img
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&h=400&fit=crop"
              alt="Summer Special"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg,rgba(0,0,0,0.65) 0%,rgba(0,0,0,0.1) 60%,transparent 100%)' }} />
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-300 block mb-1">Limited Time</span>
              <p className="text-2xl md:text-4xl font-black leading-tight">Sun, Style <br className="hidden md:block" />& Savings</p>
              <p className="text-white/60 text-xs mt-1 hidden md:block">Up to 40% off seasonal picks</p>
            </div>
            <div className="absolute right-6 top-1/2 -translate-y-1/2">
              <FiSun className="w-14 h-14 md:w-20 md:h-20 text-orange-400 opacity-70" />
            </div>
          </div>
          <TwoColGrid products={summerProducts} />
          <ViewAllButton href="/shop?filter=summer" label="View All Summer Deals" />
        </div>
      </section>

      {/* ── 12b. New Arrivals — 2-row horizontal scroll ───────────────────────── */}
      <section className="py-16 bg-secondary/30 border-t border-border">
        <div className="container mx-auto px-4">
          <SectionHeader
            eyebrow="Just Dropped"
            title={<>New Arrivals <FiAward className="text-primary w-5 h-5" /></>}
          />
          <TwoColGrid products={newArrivals} />
          <ViewAllButton href="/shop?filter=new" label="View All New Arrivals" />
        </div>
      </section>

      {/* ── 12c. Top Recommendations ─────────────────────────────────────────── */}
      <section className="py-16 bg-background border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 50% at 30% 100%,rgba(14,165,233,0.06),transparent 65%)' }} />
        <div className="container mx-auto px-4 relative z-10">
          <SectionHeader
            eyebrow="Just for You"
            eyebrowColor="text-sky-500"
            title={<>Top Recommendations <FiStar className="text-sky-500 w-5 h-5" /></>}
          />
          <SingleRowScroll products={recommendedProducts} scrollRef={recoRef} />
          <ViewAllButton href="/shop?filter=recommended" label="View All Recommendations" />
        </div>
      </section>

      {/* ── 13. Trusted Worldwide Stats ──────────────────────────────────────── */}
      <section
        className="relative py-28 overflow-hidden"
        ref={statsRef}
        style={{ background: 'linear-gradient(180deg,#04040a 0%,#080814 100%)' }}
      >
        <div className="absolute inset-0 opacity-[0.055]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '52px 52px' }} />
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-background to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-primary/12 blur-[130px] pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-white/30 text-[11px] font-black uppercase tracking-[0.45em] mb-16"
          >
            Trusted Worldwide
          </motion.p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {[
              { icon: FiBox,         label: 'Products',  value: '120+', sub: 'Across 9 categories' },
              { icon: FiUsers,       label: 'Customers', value: '99K+', sub: 'Active buyers' },
              { icon: FiShoppingBag, label: 'Orders',    value: '12K+', sub: 'Successfully fulfilled' },
              { icon: FiStar,        label: 'Rating',    value: '4.8',  sub: 'Avg across all products' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex flex-col items-center justify-center text-center py-14 px-6 group cursor-default"
                style={{ background: 'rgba(255,255,255,0.015)' }}
              >
                <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 60%,rgba(59,130,246,0.13),transparent 68%)' }} />
                <stat.icon className="w-6 h-6 text-primary/50 mb-6 relative group-hover:text-primary transition-colors duration-300" />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2 relative"
                >
                  {stat.value}
                </motion.div>
                <p className="text-white/60 font-black text-sm uppercase tracking-wider relative mb-1">{stat.label}</p>
                <p className="text-white/25 text-xs relative">{stat.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </motion.div>
  );
};

export default HomePage;
