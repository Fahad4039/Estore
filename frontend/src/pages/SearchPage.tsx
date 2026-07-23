import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiClock, FiTrendingUp, FiArrowRight, FiFilter, FiGrid, FiList } from 'react-icons/fi';
import { useProductStore } from '../store/productStore';
import ProductCard from '../components/product/ProductCard';
import ProductCardSkeleton from '../components/product/ProductCardSkeleton';
import { useSearchStore, TRENDING_SEARCHES } from '../store/searchStore';
import ReviewStars from '../components/product/ReviewStars';

const PRODUCTS_PER_PAGE = 20;

const SearchPage: React.FC = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get('q') || '';

  const [, setLocation] = useLocation();
  const [query, setQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState('relevant');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  const { products } = useProductStore();
  const { history, trending, addToHistory, removeFromHistory, clearHistory } = useSearchStore();

  const results = useMemo(() => {
    if (!initialQuery.trim()) return [];
    const q = initialQuery.toLowerCase();
    let res = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
    switch (sortBy) {
      case 'price-asc': return [...res].sort((a, b) => a.price - b.price);
      case 'price-desc': return [...res].sort((a, b) => b.price - a.price);
      case 'rating': return [...res].sort((a, b) => b.rating - a.rating);
      case 'popular': return [...res].sort((a, b) => b.reviewCount - a.reviewCount);
      default: return res;
    }
  }, [initialQuery, sortBy]);

  const totalPages = Math.ceil(results.length / PRODUCTS_PER_PAGE);
  const paginated = results.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    addToHistory(query.trim());
    setLocation(`/search?q=${encodeURIComponent(query.trim())}`);
    setCurrentPage(1);
  };

  const navigateSearch = (term: string) => {
    addToHistory(term);
    setQuery(term);
    setLocation(`/search?q=${encodeURIComponent(term)}`);
    setCurrentPage(1);
  };

  const showNoQuery = !initialQuery.trim();

  return (
    <div className="container mx-auto px-4 py-8 min-h-[80vh]">
      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-10">
        <form onSubmit={handleSearch} className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, brands, categories..."
            autoFocus
            className="w-full h-14 pl-12 pr-16 bg-card border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-base shadow-lg"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-14 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-sm"
          >
            Go
          </button>
        </form>
      </div>

      <AnimatePresence mode="wait">
        {showNoQuery ? (
          /* No-query state: show history + trending */
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto space-y-10"
          >
            {/* Recent Searches */}
            {history.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <FiClock className="text-muted-foreground" /> Recent Searches
                  </h2>
                  <button
                    onClick={clearHistory}
                    className="text-sm text-primary hover:underline"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.map((term) => (
                    <div key={term} className="flex items-center gap-1 bg-secondary rounded-full pr-1">
                      <button
                        onClick={() => navigateSearch(term)}
                        className="pl-4 pr-2 py-2 text-sm font-medium hover:text-primary transition-colors"
                      >
                        {term}
                      </button>
                      <button
                        onClick={() => removeFromHistory(term)}
                        className="p-1.5 rounded-full hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Searches */}
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <FiTrendingUp className="text-primary" /> Trending Searches
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TRENDING_SEARCHES.map((term, i) => (
                  <button
                    key={term}
                    onClick={() => navigateSearch(term)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-secondary/50 transition-all text-left group"
                  >
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="font-medium text-sm flex-1">{term}</span>
                    <FiArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>

            {/* Browse Categories */}
            <div>
              <h2 className="text-lg font-bold mb-4">Browse Categories</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['Electronics', 'Fashion', 'Audio', 'Gaming', 'Sports', 'Beauty', 'Kitchen', 'Home'] as const).map((cat) => (
                  <Link
                    key={cat}
                    href={`/category/${cat.toLowerCase()}`}
                    className="p-4 bg-card border border-border rounded-xl text-center hover:border-primary/40 hover:bg-secondary/30 transition-all font-medium text-sm"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        ) : results.length === 0 ? (
          /* No results state */
          <motion.div
            key="noresults"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-16 max-w-lg mx-auto"
          >
            <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <FiSearch className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-3">No results for "{initialQuery}"</h2>
            <p className="text-muted-foreground mb-8">
              Check the spelling or try a different keyword.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {TRENDING_SEARCHES.slice(0, 5).map((term) => (
                <button
                  key={term}
                  onClick={() => navigateSearch(term)}
                  className="px-4 py-2 bg-secondary rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
            <Link href="/shop" className="text-primary hover:underline font-medium">
              Browse all products →
            </Link>
          </motion.div>
        ) : (
          /* Search results */
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Results for <span className="text-primary">"{initialQuery}"</span>
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {results.length} product{results.length !== 1 ? 's' : ''} found
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                  className="px-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="relevant">Most Relevant</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="popular">Most Popular</option>
                </select>
                <div className="hidden sm:flex items-center space-x-1 bg-secondary rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-background shadow' : 'text-muted-foreground'}`}
                  >
                    <FiGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-background shadow' : 'text-muted-foreground'}`}
                  >
                    <FiList className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            <div className={`grid gap-6 mb-8 ${
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1'
            }`}>
              {paginated.map((product) =>
                viewMode === 'grid' ? (
                  <ProductCard key={product.id} product={product} />
                ) : (
                  <Link key={product.id} href={`/product/${product.id}`}>
                    <div className="flex bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow p-4 gap-5 cursor-pointer group">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-36 h-36 object-cover rounded-lg flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="flex flex-col justify-center gap-2 flex-1 min-w-0">
                        <p className="text-xs text-primary font-semibold uppercase">{product.brand}</p>
                        <h3 className="font-bold text-base leading-snug truncate">{product.name}</h3>
                        <ReviewStars rating={product.rating} />
                        <p className="text-muted-foreground text-sm line-clamp-1">{product.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="font-bold text-lg">${product.price.toFixed(2)}</span>
                          {product.originalPrice > product.price && (
                            <span className="text-sm text-muted-foreground line-through">${product.originalPrice.toFixed(2)}</span>
                          )}
                          {product.discount > 0 && (
                            <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded">-{product.discount}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-border bg-card disabled:opacity-40 hover:bg-secondary transition-colors font-medium text-sm"
                >
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
                      <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p as number)}
                        className={`w-10 h-10 rounded-lg font-bold text-sm transition-colors ${
                          currentPage === p ? 'bg-primary text-primary-foreground' : 'border border-border bg-card hover:bg-secondary'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border border-border bg-card disabled:opacity-40 hover:bg-secondary transition-colors font-medium text-sm"
                >
                  Next →
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchPage;
