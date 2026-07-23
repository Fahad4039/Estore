import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { FiZap, FiChevronDown, FiGrid, FiList, FiArrowRight } from 'react-icons/fi';
import { useProductStore } from '../store/productStore';
import ProductCard from '../components/product/ProductCard';

const PRODUCTS_PER_PAGE = 20;

// Fixed end time 24h from when the module first loads
const SALE_END = new Date(Date.now() + 24 * 60 * 60 * 1000);

function useCountdown(target: Date) {
  const [remaining, setRemaining] = useState({ h: 0, m: 0, s: 0, d: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target.getTime() - Date.now());
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setRemaining({ d, h, m, s });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [target]);
  return remaining;
}

const TimerUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <motion.div
      key={value}
      initial={{ rotateX: -90, opacity: 0 }}
      animate={{ rotateX: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center"
    >
      <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">
        {String(value).padStart(2, '0')}
      </span>
    </motion.div>
    <span className="text-[10px] sm:text-xs font-bold text-white/60 uppercase tracking-wider mt-2">{label}</span>
  </div>
);

const FlashSalePage: React.FC = () => {
  const { products } = useProductStore();
  const timer = useCountdown(SALE_END);
  const [sortBy, setSortBy] = useState('discount');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const flashProducts = products.filter(p => p.isFlashSale || p.discount > 0);

  const categories = ['All', ...Array.from(new Set(flashProducts.map(p => p.category))).sort()];

  const filtered = useMemo(() => {
    let res = selectedCategory === 'All' ? flashProducts : flashProducts.filter(p => p.category === selectedCategory);
    switch (sortBy) {
      case 'discount': return [...res].sort((a, b) => b.discount - a.discount);
      case 'price-asc': return [...res].sort((a, b) => a.price - b.price);
      case 'price-desc': return [...res].sort((a, b) => b.price - a.price);
      case 'rating': return [...res].sort((a, b) => b.rating - a.rating);
      default: return res;
    }
  }, [flashProducts, sortBy, selectedCategory]);

  const totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

  const totalSavings = flashProducts.reduce((sum, p) => sum + (p.originalPrice - p.price), 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-red-950 via-orange-950 to-yellow-950 min-h-[380px] flex flex-col items-center justify-center text-center px-4 py-16">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-orange-500/30"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
              animate={{ y: [0, -30, 0], opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex flex-col items-center"
        >
          {/* Badge */}
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/40 rounded-full mb-6">
            <FiZap className="text-orange-400 fill-orange-400 w-4 h-4" />
            <span className="text-orange-300 font-bold text-sm tracking-wider uppercase">Limited Time Only</span>
            <FiZap className="text-orange-400 fill-orange-400 w-4 h-4" />
          </div>

          <h1 className="text-6xl sm:text-8xl font-black text-white mb-2 tracking-tight">
            FLASH <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">SALE</span>
          </h1>
          <p className="text-white/70 text-lg mb-8 max-w-md">
            Up to <strong className="text-white">70% OFF</strong> on {flashProducts.length}+ products. Sale ends in:
          </p>

          {/* Countdown */}
          <div className="flex items-center gap-3 sm:gap-4 mb-10">
            <TimerUnit value={timer.d} label="Days" />
            <span className="text-white/50 text-3xl font-black mb-4">:</span>
            <TimerUnit value={timer.h} label="Hours" />
            <span className="text-white/50 text-3xl font-black mb-4">:</span>
            <TimerUnit value={timer.m} label="Mins" />
            <span className="text-white/50 text-3xl font-black mb-4">:</span>
            <TimerUnit value={timer.s} label="Secs" />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 text-white/60 text-sm">
            <div className="text-center">
              <div className="text-2xl font-black text-white">{flashProducts.length}+</div>
              <div>Deals Available</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-black text-orange-400">70%</div>
              <div>Max Discount</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-black text-white">${Math.round(totalSavings)}</div>
              <div>Total Savings</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Category Filter Bar */}
      <div className="border-b border-border bg-card sticky top-[60px] z-30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 py-3 overflow-x-auto hide-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${selectedCategory === cat ? 'bg-orange-500 text-white' : 'bg-secondary hover:bg-secondary/80'}`}
              >
                {cat}
                {cat !== 'All' && (
                  <span className="ml-1.5 text-xs opacity-60">
                    ({flashProducts.filter(p => p.category === cat).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold">
              {selectedCategory === 'All' ? 'All Flash Deals' : `${selectedCategory} Deals`}
            </h2>
            <p className="text-sm text-muted-foreground">{filtered.length} deals available</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                className="appearance-none pl-4 pr-8 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              >
                <option value="discount">Biggest Discount</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
              <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground w-4 h-4" />
            </div>
            <div className="flex items-center space-x-1 bg-secondary rounded-lg p-1">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-background shadow' : 'text-muted-foreground'}`}>
                <FiGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-background shadow' : 'text-muted-foreground'}`}>
                <FiList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className={`grid gap-6 mb-8 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
          {paginated.map(product =>
            viewMode === 'grid' ? (
              <ProductCard key={product.id} product={product} />
            ) : (
              <Link key={product.id} href={`/product/${product.id}`}>
                <div className="flex bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow p-4 gap-5 cursor-pointer group">
                  <div className="relative flex-shrink-0">
                    <img src={product.images[0]} alt={product.name} className="w-36 h-36 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300" />
                    {product.discount > 0 && (
                      <span className="absolute top-2 left-2 bg-destructive text-white text-xs font-black px-2 py-1 rounded">-{product.discount}%</span>
                    )}
                  </div>
                  <div className="flex flex-col justify-center gap-2 flex-1 min-w-0">
                    <p className="text-xs text-primary font-semibold uppercase">{product.brand}</p>
                    <h3 className="font-bold text-base truncate">{product.name}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">{product.description}</p>
                    <div className="flex items-center gap-3 mt-auto">
                      <span className="font-bold text-xl">PKR {product.price.toFixed(0)}</span>
                      {product.originalPrice > product.price && (
                        <span className="text-sm text-muted-foreground line-through">PKR {product.originalPrice.toFixed(0)}</span>
                      )}
                      {product.discount > 0 && (
                        <span className="text-xs font-bold text-green-500">
                          Save ${(product.originalPrice - product.price).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <FiArrowRight className="self-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              </Link>
            )
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-lg border border-border bg-card disabled:opacity-40 hover:bg-secondary transition-colors font-medium text-sm">
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .reduce<(number | string)[]>((acc, p, i, arr) => {
                if (i > 0 && typeof arr[i - 1] === 'number' && (p as number) - (arr[i - 1] as number) > 1) acc.push('…');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '…' ? (
                  <span key={`e-${i}`} className="px-2 text-muted-foreground">…</span>
                ) : (
                  <button key={p} onClick={() => setCurrentPage(p as number)} className={`w-10 h-10 rounded-lg font-bold text-sm transition-colors ${currentPage === p ? 'bg-orange-500 text-white' : 'border border-border bg-card hover:bg-secondary'}`}>
                    {p}
                  </button>
                )
              )}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 rounded-lg border border-border bg-card disabled:opacity-40 hover:bg-secondary transition-colors font-medium text-sm">
              Next →
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FlashSalePage;
