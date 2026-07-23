import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { Product } from '../../data/products';
import { FiHeart, FiShoppingCart, FiCheck } from 'react-icons/fi';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useUIStore } from '../../store/uiStore';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  soldOut?: boolean;
}

const fmt = (n: number) =>
  Math.round(Math.max(0, Math.min(n, 9999))).toLocaleString();

// ─── Mini star row ────────────────────────────────────────────────────────────
const MiniStars: React.FC<{ rating: number }> = ({ rating }) => (
  <span className="flex items-center gap-[2px]">
    {[1, 2, 3, 4, 5].map((i) => {
      const full = rating >= i;
      const half = !full && rating >= i - 0.5;
      return full ? (
        <FaStar key={i} className="w-2.5 h-2.5 text-yellow-400" />
      ) : half ? (
        <FaStarHalfAlt key={i} className="w-2.5 h-2.5 text-yellow-400" />
      ) : (
        <FaRegStar key={i} className="w-2.5 h-2.5 text-yellow-400/50" />
      );
    })}
  </span>
);

// ─── Typing badge — no cursor, loops forever ──────────────────────────────────
const TypingBadge: React.FC<{
  text: string;
  bgStyle: React.CSSProperties;
}> = ({ text, bgStyle }) => {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (visible < text.length) {
      timer = setTimeout(() => setVisible((v) => v + 1), 75);
    } else {
      timer = setTimeout(() => setVisible(0), 1600);
    }
    return () => clearTimeout(timer);
  }, [visible, text.length]);

  return (
    <span
      className="text-white text-[10px] font-black px-2.5 py-[3px] rounded-md shadow-md tracking-wide inline-block"
      style={bgStyle}
    >
      {text.slice(0, visible)}
    </span>
  );
};

// ─── Badge priority config ────────────────────────────────────────────────────
const BADGE_PRIORITY: Array<{
  key: keyof Product;
  text: string;
  bgStyle: React.CSSProperties;
}> = [
  { key: 'isNew',        text: 'NEW',         bgStyle: { background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' } },
  { key: 'isFlashSale',  text: 'FLASH SALE',  bgStyle: { background: 'linear-gradient(135deg,#dc2626,#b91c1c)' } },
  { key: 'isBestSeller', text: 'BEST SELLER', bgStyle: { background: 'linear-gradient(135deg,#d97706,#b45309)' } },
  { key: 'isTrending',   text: 'TRENDING',    bgStyle: { background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' } },
];

// ─── ProductCard ──────────────────────────────────────────────────────────────
const ProductCard: React.FC<ProductCardProps> = ({ product, soldOut = false }) => {
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);
  const [wishFlash, setWishFlash] = useState(false);
  const [, setLocation] = useLocation();
  const { addItem } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();
  const { triggerCartBlink, triggerWishlistBlink } = useUIStore();

  const isWished = isInWishlist(product.id);
  const hasSecondImage = product.images.length > 1;
  const hasDiscount = product.originalPrice > product.price && product.discount > 0;

  // Highest-priority badge only
  const activeBadge = BADGE_PRIORITY.find((b) => product[b.key as keyof Product]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (added) return;
    addItem(product);
    triggerCartBlink();
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const doWishlist = () => {
    toggleItem(product);
    triggerWishlistBlink();
    setWishFlash(true);
    setTimeout(() => setWishFlash(false), 800);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    doWishlist();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    doWishlist();
  };

  const goToProduct = () => setLocation(`/product/${product.id}`);

  return (
    <div
      className="group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer bg-card border border-border outline-none select-none"
      style={{
        boxShadow: hovered
          ? '0 20px 52px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)'
          : '0 2px 14px rgba(0,0,0,0.07)',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDoubleClick={handleDoubleClick}
    >
      {/* ── IMAGE ────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden bg-card flex-shrink-0 outline-none"
        style={{ aspectRatio: '1 / 1' }}
        onClick={goToProduct}
      >
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
          style={{
            transform: hovered ? 'scale(1.07)' : 'scale(1)',
            transition: 'transform 0.5s ease',
          }}
        />
        {hasSecondImage && (
          <img
            src={product.images[1]}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.4s ease' }}
          />
        )}

        {/* Bottom gradient for overlays */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/75 via-black/30 to-transparent pointer-events-none" />

        {/* ── TOP-LEFT: one typing badge ── */}
        {activeBadge && (
          <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
            <TypingBadge text={activeBadge.text} bgStyle={activeBadge.bgStyle} />
          </div>
        )}

        {/* ── TOP-RIGHT: discount badge (typing, no zoom) ── */}
        {hasDiscount && (
          <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
            <TypingBadge
              text={`-${product.discount}%`}
              bgStyle={{
                background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
                boxShadow: '0 0 8px rgba(220,38,38,0.38)',
              }}
            />
          </div>
        )}

        {/* ── BOTTOM-LEFT: rating ── */}
        <div
          className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2 py-1 rounded-lg"
          style={{
            background: 'rgba(0,0,0,0.62)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <MiniStars rating={product.rating} />
          <span className="text-[10px] font-semibold text-white/80 leading-none">
            {product.rating.toFixed(1)}
            <span className="text-white/50 ml-0.5">({product.reviewCount})</span>
          </span>
        </div>

        {/* ── BOTTOM-RIGHT: heart — always visible ── */}
        <motion.button
          onClick={handleWishlist}
          className="absolute bottom-2 right-2 z-10 p-1.5 rounded-full outline-none"
          whileTap={{ scale: 1.4 }}
          animate={wishFlash ? { scale: [1, 1.4, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            background: isWished || wishFlash ? 'rgb(239 68 68)' : 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            transition: 'background 0.2s',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <FiHeart
            className="w-3.5 h-3.5 text-white"
            fill={isWished || wishFlash ? 'white' : 'none'}
          />
        </motion.button>
      </div>

      {/* ── INFO ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col px-3 pt-2.5 pb-3" style={{ flex: '1 1 auto' }}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground truncate mb-0.5">
          {product.brand}
        </p>

        <h3
          className="text-sm font-semibold text-card-foreground leading-snug line-clamp-2 mb-1.5"
          style={{ minHeight: '2.5rem' }}
          onClick={goToProduct}
        >
          {product.name}
        </h3>

        {/* Original price row */}
        <div className="flex items-center gap-1.5" style={{ height: '1.6rem' }} onClick={(e) => e.stopPropagation()}>
          {hasDiscount ? (
            <>
              <span
                className="text-sm font-bold line-through leading-none"
                style={{ color: '#ef4444', textDecorationThickness: '2px' }}
              >
                PKR {fmt(product.originalPrice)}
              </span>
              <span
                className="text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none"
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.28)',
                }}
              >
                SAVE PKR {fmt(product.originalPrice - product.price)}
              </span>
            </>
          ) : null}
        </div>

        {/* Current price */}
        <div onClick={(e) => e.stopPropagation()}>
          <span className="text-2xl font-extrabold leading-none tabular-nums" style={{ color: '#16a34a' }}>
            PKR {fmt(product.price)}
          </span>
        </div>

        {/* Add to cart / Sold out */}
        <div className="mt-2.5" onClick={(e) => e.stopPropagation()}>
          {soldOut ? (
            <button
              disabled
              className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm text-white cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
                boxShadow: '0 4px 16px rgba(220,38,38,0.30)',
                opacity: 0.92,
              }}
            >
              Sold Out
            </button>
          ) : added ? (
            <button
              disabled
              className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm text-white"
              style={{
                background: 'linear-gradient(135deg,#16a34a,#15803d)',
                boxShadow: '0 4px 16px rgba(22,163,74,0.38)',
              }}
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/25">
                <FiCheck className="w-3.5 h-3.5" strokeWidth={3} />
              </span>
              Added
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm text-white outline-none"
              style={{
                background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                boxShadow: '0 4px 16px rgba(37,99,235,0.38)',
                transition: 'filter 0.15s, transform 0.12s',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)'; }}
              onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)'; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            >
              <FiShoppingCart className="w-4 h-4" />
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
