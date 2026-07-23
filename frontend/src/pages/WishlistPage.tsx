import React from 'react';
import { useWishlistStore } from '../store/wishlistStore';
import { useCartStore } from '../store/cartStore';
import { Link, useLocation } from 'wouter';
import {
  FiHeart, FiShoppingCart, FiTrash2, FiArrowRight,
  FiStar, FiZap,
} from 'react-icons/fi';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import ReviewStars from '../components/product/ReviewStars';
import { useToast } from '@/hooks/use-toast';

/* ── 3D tilt product card ── */
function ProductCard3D({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotX = useTransform(y, [-80, 80], [9, -9]);
  const rotY = useTransform(x, [-80, 80], [-9, 9]);
  const sx = useSpring(rotX, { stiffness: 310, damping: 32 });
  const sy = useSpring(rotY, { stiffness: 310, damping: 32 });

  return (
    <motion.div
      style={{ rotateX: sx, rotateY: sy }}
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - (r.left + r.width / 2));
        y.set(e.clientY - (r.top + r.height / 2));
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

const WishlistPage: React.FC = () => {
  const { items, toggleItem } = useWishlistStore();
  const { addItem } = useCartStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleMoveToCart = (product: typeof items[0]) => {
    addItem(product);
    toggleItem(product);
    toast({ title: 'Moved to cart', description: `${product.name} added to your cart.` });
  };

  const handleAddToCart = (product: typeof items[0]) => {
    addItem(product);
    toast({ title: 'Added to cart', description: `${product.name} is in your cart.` });
  };

  const handleAddAll = () => {
    items.forEach(p => addItem(p));
    toast({ title: 'All items added', description: `${items.length} items added to your cart.` });
  };

  /* ── empty state ── */
  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full bg-rose-500/6 blur-[110px]" />
          <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full bg-primary/5 blur-[90px]" />
        </div>
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          className="relative text-center"
        >
          <div className="relative w-36 h-36 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-rose-500/10 blur-2xl" />
            <div className="relative w-36 h-36 rounded-3xl bg-white/[0.04] border border-white/10 flex items-center justify-center"
              style={{ boxShadow: '0 20px 60px rgba(244,63,94,0.14)' }}>
              <FiHeart className="w-16 h-16 text-rose-400/70" />
            </div>
          </div>
          <h1 className="text-4xl font-black mb-4">Your Wishlist is Empty</h1>
          <p className="text-muted-foreground text-lg mb-10 max-w-md">
            Save items you love and come back when you're ready to buy.
          </p>
          <Link href="/shop">
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              className="px-10 py-4 rounded-2xl font-black text-white flex items-center gap-2 mx-auto"
              style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', boxShadow: '0 12px 32px rgba(37,99,235,0.4)' }}
            >
              <FiHeart className="w-5 h-5" /> Discover Products
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* ── ambient depth lighting ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[560px] h-[560px] rounded-full bg-rose-500/5 blur-[130px]" />
        <div className="absolute top-1/2 -left-60 w-[440px] h-[440px] rounded-full bg-primary/5 blur-[110px]" />
        <div className="absolute bottom-10 right-1/4 w-[320px] h-[320px] rounded-full bg-indigo-500/4 blur-[90px]" />
        {/* dot grid */}
        <div className="absolute inset-0 opacity-[0.018]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative container mx-auto px-4 py-10">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center"
                style={{ boxShadow: '0 8px 24px rgba(244,63,94,0.2)' }}>
                <FiHeart className="w-5 h-5 text-rose-400" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight">My Wishlist</h1>
            </div>
            <p className="text-muted-foreground ml-[56px]">
              {items.length} {items.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
          <motion.button
            onClick={handleAddAll}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="relative flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm text-white self-start sm:self-auto overflow-hidden"
            style={{
              background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
              boxShadow: '0 10px 28px rgba(37,99,235,0.4)',
            }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2, ease: 'linear' }}
            />
            <FiShoppingCart className="w-4 h-4 relative" />
            <span className="relative">Add All to Cart</span>
          </motion.button>
        </motion.div>

        {/* ── Product Grid ── */}
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {items.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.86 }}
                transition={{ delay: i * 0.07, type: 'spring', stiffness: 280, damping: 26 }}
                style={{ perspective: '1000px' }}
                className="h-full"
              >
                <ProductCard3D>
                  <motion.div
                    className="relative rounded-2xl overflow-hidden flex flex-col h-full group"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    style={{
                      background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                      border: '1px solid rgba(255,255,255,0.09)',
                      boxShadow: '0 10px 36px rgba(0,0,0,0.28), 0 2px 10px rgba(0,0,0,0.18)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 24px 64px rgba(37,99,235,0.22), 0 8px 28px rgba(0,0,0,0.35)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.28)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 36px rgba(0,0,0,0.28), 0 2px 10px rgba(0,0,0,0.18)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.09)';
                    }}
                  >
                    {/* glass top sheen */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />

                    {/* Product Image */}
                    <div
                      className="relative aspect-[4/3] overflow-hidden bg-white/[0.03] cursor-pointer"
                      onClick={() => setLocation(`/product/${product.id}`)}
                    >
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-112"
                      />
                      {/* gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

                      {/* Discount badge */}
                      {product.discount > 0 && (
                        <div
                          className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-black text-white z-20"
                          style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 4px 14px rgba(239,68,68,0.45)' }}
                        >
                          -{product.discount}%
                        </div>
                      )}

                      {/* Remove from wishlist */}
                      <motion.button
                        whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.88 }}
                        onClick={e => { e.stopPropagation(); toggleItem(product); }}
                        className="absolute top-3 right-3 w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center z-20 transition-all"
                        style={{
                          background: 'rgba(239,68,68,0.18)',
                          border: '1px solid rgba(239,68,68,0.35)',
                          color: '#f87171',
                          boxShadow: '0 4px 12px rgba(239,68,68,0.2)',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.35)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.18)'; }}
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </motion.button>

                      {/* quick view hint */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                        <span className="text-[10px] font-black text-white bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                          View Product
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex flex-col flex-1">
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">{product.brand}</p>
                      <h3
                        className="font-bold text-sm leading-snug mb-2 line-clamp-2 hover:text-primary transition-colors cursor-pointer"
                        onClick={() => setLocation(`/product/${product.id}`)}
                      >
                        {product.name}
                      </h3>

                      <ReviewStars rating={product.rating} className="mb-3" size="sm" />

                      <div className="flex items-baseline gap-2 mb-5">
                        <span className="font-black text-xl">${product.price.toFixed(2)}</span>
                        {product.originalPrice > product.price && (
                          <span className="text-sm text-muted-foreground line-through">${product.originalPrice.toFixed(2)}</span>
                        )}
                        {product.discount > 0 && (
                          <span className="text-xs font-black text-emerald-400 ml-auto flex items-center gap-0.5">
                            <FiZap className="w-3 h-3" /> Save ${(product.originalPrice - product.price).toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2.5 mt-auto">
                        <motion.button
                          onClick={() => handleMoveToCart(product)}
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          className="w-full py-3 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 relative overflow-hidden"
                          style={{
                            background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
                            boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
                          }}
                        >
                          <FiShoppingCart className="w-4 h-4" /> Move to Cart
                        </motion.button>
                        <motion.button
                          onClick={() => handleAddToCart(product)}
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.09)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                        >
                          Add to Cart
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </ProductCard3D>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-16 text-center"
        >
          <Link href="/shop" className="inline-flex items-center gap-2 text-primary font-bold hover:opacity-75 transition-opacity">
            Continue Shopping <FiArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default WishlistPage;
