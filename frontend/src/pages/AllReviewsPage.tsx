import React, { useState, useEffect } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiStar, FiArrowLeft, FiCamera, FiVideo, FiThumbsUp,
  FiFilter, FiCheck, FiAward, FiX, FiSend, FiChevronDown,
  FiSearch,
} from 'react-icons/fi';
import { useProductStore } from '../store/productStore';
import ReviewStars from '../components/product/ReviewStars';
import { useToast } from '@/hooks/use-toast';

/* ─── Types ─────────────────────────────────────────────────────── */
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
  hasVideo: boolean;
  helpful: number;
  location?: string;
};

/* ─── Static mock reviews (injected with product images at render) ─ */
const MOCK_REVIEWS_BASE: Omit<ReviewItem, 'images'>[] = [
  { id: 'r1', name: 'Alex M.',    avatar: 'linear-gradient(135deg,#0070e0,#005bb5)', rating: 5, date: '2 days ago',   title: 'Outstanding quality!',        body: 'Exceeded all my expectations. The build quality is phenomenal and it arrived perfectly packaged. Would 100% buy again. The product matches exactly what was described and the performance is top-notch.', verified: true,  hasVideo: false, helpful: 42, location: 'New York, USA' },
  { id: 'r2', name: 'Sarah K.',   avatar: 'linear-gradient(135deg,#7c3aed,#5b21b6)', rating: 5, date: '1 week ago',    title: 'Worth every penny',           body: 'I was hesitant about the price, but after using it I completely understand why. Absolutely premium from top to bottom. The attention to detail is incredible.', verified: true,  hasVideo: true,  helpful: 38, location: 'London, UK' },
  { id: 'r3', name: 'Jordan P.',  avatar: 'linear-gradient(135deg,#059669,#047857)', rating: 4, date: '2 weeks ago',   title: 'Great product, fast shipping', body: 'Really happy with this purchase. Arrived quickly, well packaged, and exactly as described. Minor thing — the instructions could be clearer, but overall a fantastic product.', verified: true,  hasVideo: false, helpful: 27, location: 'Toronto, CA' },
  { id: 'r4', name: 'Mia R.',     avatar: 'linear-gradient(135deg,#dc2626,#b91c1c)', rating: 5, date: '3 weeks ago',   title: 'Absolutely love it!',         body: 'This product has completely transformed my daily routine. The quality is exceptional and the design is sleek and modern. My friends are all asking where I got it from!', verified: true,  hasVideo: true,  helpful: 61, location: 'Sydney, AU' },
  { id: 'r5', name: 'Chen W.',    avatar: 'linear-gradient(135deg,#d97706,#b45309)', rating: 5, date: '1 month ago',   title: 'Best purchase of the year',   body: 'I\'ve bought many similar products before but this is by far the best. The value for money is unbeatable and the craftsmanship speaks for itself. Highly recommend!', verified: true,  hasVideo: false, helpful: 55, location: 'Singapore' },
  { id: 'r6', name: 'Elena B.',   avatar: 'linear-gradient(135deg,#0891b2,#0e7490)', rating: 4, date: '1 month ago',   title: 'Solid build, happy customer', body: 'Good solid product. Took a couple of days to get used to but now I love it. The quality is exactly what you\'d expect at this price point. Would recommend.', verified: true,  hasVideo: false, helpful: 19, location: 'Berlin, DE' },
  { id: 'r7', name: 'Marcus T.',  avatar: 'linear-gradient(135deg,#be185d,#9d174d)', rating: 5, date: '5 weeks ago',   title: 'Exceeded expectations!',      body: 'When I saw the price I was sceptical, but wow — this is legitimately one of the best products I\'ve ever bought. The packaging alone felt luxurious. Brilliant product.', verified: true,  hasVideo: true,  helpful: 74, location: 'Dubai, UAE' },
  { id: 'r8', name: 'Priya S.',   avatar: 'linear-gradient(135deg,#7c3aed,#0070e0)', rating: 3, date: '2 months ago',  title: 'Good but room to improve',    body: 'The product is good overall but there are a few areas that could be improved. The core functionality is solid but some of the extra features feel unpolished. Still worth the price.', verified: false, hasVideo: false, helpful: 12, location: 'Mumbai, IN' },
  { id: 'r9', name: 'Thomas L.',  avatar: 'linear-gradient(135deg,#059669,#0891b2)', rating: 5, date: '2 months ago',  title: 'A masterpiece!',              body: 'I\'ve been searching for a product like this for years. The precision and attention to detail is simply remarkable. This is what premium really means.', verified: true,  hasVideo: true,  helpful: 88, location: 'Paris, FR' },
  { id: 'r10', name: 'Yuki H.',   avatar: 'linear-gradient(135deg,#d97706,#dc2626)', rating: 4, date: '3 months ago',  title: 'Very impressive quality',     body: 'After reading all the reviews I finally bought it and I\'m glad I did. The product is exactly as described and the quality is top-tier. Shipping was fast too.', verified: true,  hasVideo: false, helpful: 33, location: 'Tokyo, JP' },
];

/* ─── Floating Particle ───────────────────────────────────────────── */
const FloatingOrb: React.FC<{ x: number; y: number; size: number; color: string; delay: number }> = ({ x, y, size, color, delay }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, background: color, filter: 'blur(40px)', opacity: 0 }}
    animate={{ opacity: [0, 0.35, 0], y: [0, -30, 0], scale: [1, 1.15, 1] }}
    transition={{ duration: 7, delay, repeat: Infinity, ease: 'easeInOut' }}
  />
);

/* ─── 3D Review Card ─────────────────────────────────────────────── */
const ReviewCard3D: React.FC<{ review: ReviewItem; delay: number; onImageClick: (imgs: string[], idx: number) => void }> = ({ review, delay, onImageClick }) => {
  const [helpful, setHelpful] = useState(review.helpful);
  const [voted, setVoted] = useState(false);
  const [cardStyle, setCardStyle] = useState<React.CSSProperties>({});

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setCardStyle({
      transform: `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 5}deg) translateZ(4px)`,
      boxShadow: `${-x * 16}px ${y * 16}px 50px rgba(0,0,0,0.45), 0 0 40px rgba(0,0,0,0.2)`,
    });
  };

  const handleMouseLeave = () => {
    setCardStyle({
      transform: 'perspective(900px) rotateY(0deg) rotateX(0deg) translateZ(0px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      transition: 'all 0.5s ease',
    });
  };

  const STAR_COLORS = ['', '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#22c55e'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay }}
      style={{ transformStyle: 'preserve-3d', ...cardStyle }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="rounded-3xl border border-border/50 overflow-hidden cursor-default transition-transform duration-100"
    >
      {/* Card top accent bar */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg,${STAR_COLORS[review.rating]},transparent)` }} />

      <div className="p-6" style={{ background: 'rgba(255,255,255,0.025)' }}>
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base flex-shrink-0 shadow-lg"
            style={{ background: review.avatar }}>
            {review.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-black text-sm">{review.name}</span>
              {review.verified && (
                <span className="flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/25">
                  <FiAward className="w-2.5 h-2.5" /> BUYER
                </span>
              )}
              {review.hasVideo && (
                <span className="flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/25">
                  <FiVideo className="w-2.5 h-2.5" /> VIDEO
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <FiStar key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-border'}`} strokeWidth={1.5} />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground">{review.date}</span>
              {review.location && <span className="text-[10px] text-muted-foreground hidden sm:block">· {review.location}</span>}
            </div>
          </div>
        </div>

        {/* Content */}
        <h5 className="font-black text-sm mb-2 text-foreground">"{review.title}"</h5>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">{review.body}</p>

        {/* Media */}
        {review.images.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {review.images.map((img, i) => (
              <motion.button
                key={i}
                onClick={() => onImageClick(review.images, i)}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                className="relative rounded-xl overflow-hidden border border-border/40 group"
                style={{ width: 80, height: 80, flexShrink: 0 }}
              >
                <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                {i === review.images.length - 1 && review.hasVideo && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                      <FiVideo className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}

        {/* Helpful */}
        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          <span className="text-[11px] text-muted-foreground">Was this helpful?</span>
          <motion.button
            onClick={() => { if (!voted) { setHelpful((h) => h + 1); setVoted(true); } }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${
              voted ? 'border-green-500/40 text-green-400 bg-green-500/10' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5'
            }`}
          >
            <FiThumbsUp className={`w-3.5 h-3.5 ${voted ? 'fill-green-400' : ''}`} />
            {helpful} Helpful
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Image lightbox ─────────────────────────────────────────────── */
const LightBox: React.FC<{ images: string[]; initialIndex: number; onClose: () => void }> = ({ images, initialIndex, onClose }) => {
  const [idx, setIdx] = useState(initialIndex);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % images.length);
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [images.length, onClose]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md"
      onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10">
        <FiX className="w-6 h-6" />
      </button>
      <motion.img key={idx} src={images[idx]} alt=""
        initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
        className="max-h-[88vh] max-w-[90vw] rounded-2xl object-contain"
        onClick={(e) => e.stopPropagation()} />
    </motion.div>
  );
};

/* ─── Write Review Modal ─────────────────────────────────────────── */
const QuickReviewModal: React.FC<{ productName: string; onClose: () => void; onSubmit: (r: ReviewItem) => void }> = ({ productName, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [name, setName] = useState('');
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'];

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).slice(0, 5 - previews.length).forEach((f) => {
      const r = new FileReader();
      r.onload = (ev) => setPreviews((p) => [...p, ev.target?.result as string]);
      r.readAsDataURL(f);
    });
  };

  const handleSubmit = () => {
    if (!rating || !body.trim()) return;
    onSubmit({
      id: Date.now().toString(),
      name: name.trim() || 'Anonymous',
      avatar: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
      rating,
      date: 'Just now',
      title: title.trim() || 'My Review',
      body: body.trim(),
      verified: true,
      images: previews,
      hasVideo: false,
      helpful: 0,
    });
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
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[280px]">{productName}</p>
          </div>
          <motion.button onClick={onClose} whileHover={{ rotate: 90 }} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <FiX className="w-5 h-5" />
          </motion.button>
        </div>
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
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
            <p className="font-bold text-sm mb-2">Add Photos</p>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
            <div className="flex gap-3 flex-wrap">
              {previews.map((img, i) => (
                <div key={i} className="w-20 h-20 rounded-xl overflow-hidden relative group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setPreviews((p) => p.filter((_, j) => j !== i))}
                    className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {previews.length < 5 && (
                <button onClick={() => fileRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/60 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary">
                  <FiCamera className="w-5 h-5" />
                  <span className="text-[10px] font-bold">Add</span>
                </button>
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

/* ─── Main Page ──────────────────────────────────────────────────── */
const AllReviewsPage: React.FC = () => {
  const [, params] = useRoute('/product/:id/reviews');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { products } = useProductStore();

  const product = params?.id ? products.find((p) => p.id === params.id) : null;

  const [filterStar, setFilterStar] = useState(0);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'high' | 'low'>('recent');
  const [showSort, setShowSort] = useState(false);
  const [writeOpen, setWriteOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [userReviews, setUserReviews] = useState<ReviewItem[]>([]);
  const [visible, setVisible] = useState(6);

  // Assign product images to mock reviews
  const allReviews: ReviewItem[] = React.useMemo(() => {
    if (!product) return [];
    const imgs = product.images;
    return [
      ...userReviews,
      ...MOCK_REVIEWS_BASE.map((r, i) => ({
        ...r,
        images: i % 3 === 0 ? [imgs[0], imgs[Math.min(1, imgs.length - 1)]] :
                i % 3 === 1 ? [imgs[Math.min(1, imgs.length - 1)]] : [],
      })),
    ];
  }, [product, userReviews]);

  const filtered = allReviews
    .filter((r) => filterStar === 0 || r.rating === filterStar)
    .sort((a, b) =>
      sortBy === 'helpful' ? b.helpful - a.helpful :
      sortBy === 'high' ? b.rating - a.rating :
      sortBy === 'low' ? a.rating - b.rating : 0
    );

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Product not found.</p>
        <Link href="/" className="text-primary hover:underline mt-4 block">← Back to home</Link>
      </div>
    );
  }

  const ORBS = [
    { x: -5, y: 10, size: 350, color: 'radial-gradient(circle,rgba(0,112,224,0.5),transparent 65%)', delay: 0 },
    { x: 90, y: -10, size: 280, color: 'radial-gradient(circle,rgba(124,58,237,0.5),transparent 65%)', delay: 2 },
    { x: 50, y: 60, size: 220, color: 'radial-gradient(circle,rgba(34,197,94,0.4),transparent 65%)', delay: 4 },
    { x: 20, y: 80, size: 180, color: 'radial-gradient(circle,rgba(251,191,36,0.35),transparent 65%)', delay: 1.5 },
  ];

  const pct = (s: number) => (s === 5 ? 68 : s === 4 ? 21 : s === 3 ? 7 : s === 2 ? 3 : 1);
  const barColor = (s: number) => s >= 4 ? '#22c55e' : s === 3 ? '#f59e0b' : '#ef4444';

  const SORT_OPTIONS = [
    { key: 'recent', label: 'Most Recent' },
    { key: 'helpful', label: 'Most Helpful' },
    { key: 'high', label: 'Highest Rated' },
    { key: 'low', label: 'Lowest Rated' },
  ] as const;

  return (
    <>
      <AnimatePresence>
        {lightbox && <LightBox images={lightbox.images} initialIndex={lightbox.index} onClose={() => setLightbox(null)} />}
        {writeOpen && (
          <QuickReviewModal
            productName={product.name}
            onClose={() => setWriteOpen(false)}
            onSubmit={(r) => {
              setUserReviews((prev) => [r, ...prev]);
              toast({ title: '✓ Review submitted!', description: 'Thank you for your feedback.' });
            }}
          />
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen">

        {/* ── 3D HERO ── */}
        <div className="relative overflow-hidden py-16 md:py-20"
          style={{ background: 'linear-gradient(160deg,rgba(0,112,224,0.12) 0%,rgba(124,58,237,0.1) 50%,rgba(34,197,94,0.06) 100%)' }}>
          {ORBS.map((o, i) => <FloatingOrb key={i} {...o} />)}

          {/* Mesh grid overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

          <div className="container mx-auto px-4 relative">
            {/* Back button */}
            <motion.button
              onClick={() => setLocation(`/product/${product.id}`)}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ x: -4 }}
              className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground mb-10 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" /> Back to Product
            </motion.button>

            <div className="flex flex-col lg:flex-row gap-12 items-start">
              {/* Left: Big rating hero */}
              <motion.div
                initial={{ opacity: 0, y: 32, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-start"
                style={{ perspective: '1000px' }}
              >
                {/* 3D floating rating card */}
                <motion.div
                  className="relative rounded-3xl p-8 border border-white/10 mb-6"
                  style={{
                    background: 'linear-gradient(135deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.02) 100%)',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.07) inset',
                    backdropFilter: 'blur(20px)',
                    transformStyle: 'preserve-3d',
                  }}
                  animate={{ rotateX: [0, 3, 0], rotateY: [0, -3, 0] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {/* Amber glow */}
                  <div className="absolute -inset-px rounded-3xl pointer-events-none"
                    style={{ background: 'linear-gradient(135deg,rgba(251,191,36,0.15),transparent 60%)', borderRadius: 'inherit' }} />

                  <div className="text-[110px] font-black leading-none mb-3 tracking-tighter"
                    style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24,#fde68a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: 'none', filter: 'drop-shadow(0 0 40px rgba(251,191,36,0.4))' }}>
                    {product.rating}
                  </div>
                  <div className="flex gap-1.5 mb-2">
                    {[1,2,3,4,5].map((s) => (
                      <FiStar key={s} className={`w-7 h-7 ${s <= Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-border'}`} strokeWidth={1.5} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground font-bold">{product.reviewCount + userReviews.length} verified reviews</p>

                  {/* Floating star particles */}
                  {[...Array(5)].map((_, i) => (
                    <motion.div key={i} className="absolute pointer-events-none"
                      style={{ right: `${10 + i * 15}%`, top: `${5 + (i % 2) * 20}%` }}
                      animate={{ y: [0, -12, 0], opacity: [0.3, 0.7, 0.3], rotate: [0, 20, 0] }}
                      transition={{ duration: 3 + i * 0.7, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}>
                      <FiStar className="w-5 h-5 fill-amber-400/30 text-amber-400/30" />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Star bars */}
                <div className="space-y-3 w-full min-w-[240px]">
                  {[5,4,3,2,1].map((s) => (
                    <button key={s} onClick={() => setFilterStar(filterStar === s ? 0 : s)}
                      className={`flex items-center gap-3 w-full group transition-all ${filterStar === s ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}>
                      <div className={`flex items-center gap-1 w-14 justify-end text-xs font-bold flex-shrink-0 ${filterStar === s ? 'text-amber-400' : 'text-muted-foreground'}`}>
                        {s} <FiStar className={`w-3 h-3 ${filterStar === s ? 'fill-amber-400 text-amber-400' : 'fill-muted-foreground text-muted-foreground'}`} />
                      </div>
                      <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${filterStar === s ? 'bg-amber-400/20' : 'bg-border/80'}`}>
                        <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct(s)}%` }} viewport={{ once: true }}
                          transition={{ delay: (6-s)*0.1, duration: 0.7, ease: 'easeOut' }}
                          className="h-full rounded-full" style={{ background: barColor(s), boxShadow: filterStar === s ? `0 0 10px ${barColor(s)}80` : 'none' }} />
                      </div>
                      <span className={`w-9 text-right text-xs font-black flex-shrink-0 ${filterStar === s ? 'text-amber-400' : 'text-muted-foreground'}`}>{pct(s)}%</span>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Right: Product info + CTA */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="flex-1"
              >
                <p className="text-xs font-black uppercase tracking-[0.35em] text-primary mb-2">{product.brand}</p>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4 leading-tight">{product.name}</h1>
                <p className="text-muted-foreground mb-8 leading-relaxed max-w-lg">
                  All customer reviews for this product. See what buyers are saying, view photos and videos, and share your own experience.
                </p>

                <motion.button
                  onClick={() => setWriteOpen(true)}
                  whileHover={{ scale: 1.03, boxShadow: '0 20px 50px rgba(124,58,237,0.5)' }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-black text-base relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 12px 36px rgba(124,58,237,0.4)' }}
                >
                  <motion.div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.18) 50%,transparent 60%)' }}
                    animate={{ x: ['-150%','150%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }} />
                  <FiStar className="w-5 h-5 fill-white" />
                  Write a Review
                </motion.button>

                {/* Photo collage preview */}
                <div className="mt-8 flex gap-2 flex-wrap">
                  {product.images.slice(0, 4).map((img, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="rounded-2xl overflow-hidden border border-border/40 relative group cursor-pointer"
                      style={{ width: 80, height: 80 }}
                      onClick={() => setLightbox({ images: product.images, index: i })}>
                      <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      {i === 3 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-black text-sm">
                          +{allReviews.reduce((acc, r) => acc + r.images.length, 0)} photos
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* ── REVIEW LIST ── */}
        <div className="container mx-auto px-4 py-12">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-muted-foreground">Filter:</span>
              {[0,5,4,3,2,1].map((s) => (
                <button key={s} onClick={() => setFilterStar(s)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                    filterStar === s
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40 hover:text-primary'
                  }`}>
                  {s === 0 ? 'All' : `${s} ★`}
                </button>
              ))}
            </div>

            <div className="relative">
              <button onClick={() => setShowSort((b) => !b)}
                className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl border border-border hover:border-primary/40 transition-all">
                <FiFilter className="w-3.5 h-3.5" />
                {SORT_OPTIONS.find((o) => o.key === sortBy)?.label}
                <FiChevronDown className={`w-3.5 h-3.5 transition-transform ${showSort ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showSort && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 top-full mt-2 w-44 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-20">
                    {SORT_OPTIONS.map((opt) => (
                      <button key={opt.key} onClick={() => { setSortBy(opt.key); setShowSort(false); }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${sortBy === opt.key ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-secondary text-foreground'}`}>
                        {opt.label}
                        {sortBy === opt.key && <FiCheck className="w-3.5 h-3.5" strokeWidth={3} />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground mb-6">
            Showing <span className="font-bold text-foreground">{Math.min(visible, filtered.length)}</span> of <span className="font-bold text-foreground">{filtered.length}</span> reviews
            {filterStar > 0 && <span> for <span className="text-amber-400 font-bold">{filterStar}-star</span></span>}
          </p>

          {/* 3D Review Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.slice(0, visible).map((review, i) => (
              <ReviewCard3D
                key={review.id}
                review={review}
                delay={i * 0.05}
                onImageClick={(imgs, idx) => setLightbox({ images: imgs, index: idx })}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-20 text-center">
              <FiSearch className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No reviews with {filterStar} stars yet.</p>
              <button onClick={() => setFilterStar(0)} className="mt-3 text-sm text-primary hover:underline">Show all reviews</button>
            </div>
          )}

          {/* Load more */}
          {visible < filtered.length && (
            <div className="mt-10 flex justify-center">
              <motion.button
                onClick={() => setVisible((v) => v + 6)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl border border-border font-bold text-sm text-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
              >
                <FiChevronDown className="w-4 h-4" />
                Load More Reviews ({filtered.length - visible} remaining)
              </motion.button>
            </div>
          )}

          {/* Bottom CTA */}
          <div className="mt-16 rounded-3xl p-10 text-center relative overflow-hidden border border-border/40"
            style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.08),rgba(0,112,224,0.06))' }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 50% 60% at 50% 50%,rgba(124,58,237,0.12),transparent 70%)' }} />
            <h3 className="text-2xl font-black mb-2 relative">Share Your Experience</h3>
            <p className="text-muted-foreground mb-6 relative">Your review helps thousands of buyers make the right decision.</p>
            <motion.button
              onClick={() => setWriteOpen(true)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-black relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 12px 36px rgba(124,58,237,0.4)' }}>
              <FiStar className="w-5 h-5 fill-white" />
              Write a Review
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default AllReviewsPage;
