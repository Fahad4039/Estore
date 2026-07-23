import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiGrid, FiList, FiChevronDown, FiX, FiStar } from 'react-icons/fi';
import { Product } from '../data/products';
import { useProductStore } from '../store/productStore';
import ProductCard from '../components/product/ProductCard';
import ProductCardSkeleton, { ProductListSkeleton } from '../components/product/ProductCardSkeleton';
import ReviewStars from '../components/product/ReviewStars';
import { Link } from 'wouter';

const PRODUCTS_PER_PAGE = 20;

const ShopPage: React.FC = () => {
  const { products } = useProductStore();
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get('category');
  const initialQuery = searchParams.get('q') || '';
  const initialFilter = searchParams.get('filter') || '';
  const initialSort = searchParams.get('sort') || 'newest';

  const [isLoading, setIsLoading] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [searchQuery] = useState(initialQuery);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState(initialSort);

  // Simulate initial loading skeleton
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, selectedBrands, priceRange, minRating, sortBy, searchQuery]);

  const allCategories = Array.from(new Set(products.map((p) => p.category))).sort();
  const allBrands = Array.from(new Set(products.map((p) => p.brand))).sort();

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    // Special filters from URL
    if (initialFilter === 'flash') result = result.filter((p) => p.isFlashSale);
    if (initialFilter === 'new') result = result.filter((p) => p.isNew);
    if (initialFilter === 'sale') result = result.filter((p) => p.discount > 0);

    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category));
    }
    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand));
    }
    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    result = result.filter((p) => p.rating >= minRating);

    switch (sortBy) {
      case 'price-asc': return result.sort((a, b) => a.price - b.price);
      case 'price-desc': return result.sort((a, b) => b.price - a.price);
      case 'rating': return result.sort((a, b) => b.rating - a.rating);
      case 'popular': return result.sort((a, b) => b.reviewCount - a.reviewCount);
      case 'trending': return result.sort((a, b) => (a.isTrending === b.isTrending ? 0 : a.isTrending ? -1 : 1));
      default: return result.sort((a, b) => (a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1));
    }
  }, [searchQuery, selectedCategories, selectedBrands, priceRange, minRating, sortBy, initialFilter]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const toggleCategory = (cat: string) =>
    setSelectedCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));

  const toggleBrand = (brand: string) =>
    setSelectedBrands((prev) => (prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]));

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setPriceRange([0, 3000]);
    setMinRating(0);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    selectedCategories.length > 0 || selectedBrands.length > 0 || minRating > 0;

  const FilterSidebar = () => (
    <div className="space-y-8">
      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Active Filters</h3>
          <button onClick={clearFilters} className="text-sm text-destructive hover:underline font-medium">
            Clear All
          </button>
        </div>
      )}

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map((c) => (
            <span key={c} className="flex items-center gap-1 pl-3 pr-1.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">
              {c}
              <button onClick={() => toggleCategory(c)} className="ml-1 hover:bg-primary/20 rounded-full p-0.5">
                <FiX className="w-3 h-3" />
              </button>
            </span>
          ))}
          {selectedBrands.map((b) => (
            <span key={b} className="flex items-center gap-1 pl-3 pr-1.5 py-1 bg-secondary text-foreground text-xs font-bold rounded-full border border-border">
              {b}
              <button onClick={() => toggleBrand(b)} className="ml-1 hover:bg-secondary/80 rounded-full p-0.5">
                <FiX className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Categories */}
      <div>
        <h3 className="font-bold mb-4">Categories</h3>
        <div className="space-y-2">
          {allCategories.map((cat) => (
            <label key={cat} className="flex items-center space-x-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              />
              <span className="text-sm group-hover:text-primary transition-colors flex-1">{cat}</span>
              <span className="text-xs text-muted-foreground">
                ({products.filter((p) => p.category === cat).length})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-bold mb-4">Price Range</h3>
        <div className="space-y-4">
          <input
            type="range"
            min="0" max="3000" step="50"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
            className="w-full accent-primary"
          />
          <div className="flex items-center justify-between text-sm font-medium">
            <span className="px-3 py-1 bg-secondary rounded-lg">${priceRange[0]}</span>
            <span className="text-muted-foreground">—</span>
            <span className="px-3 py-1 bg-secondary rounded-lg">${priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="font-bold mb-4">Brands</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
          {allBrands.map((brand) => (
            <label key={brand} className="flex items-center space-x-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() => toggleBrand(brand)}
                className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              />
              <span className="text-sm group-hover:text-primary transition-colors">{brand}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="font-bold mb-4">Min. Rating</h3>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="radio" name="rating" checked={minRating === 0} onChange={() => setMinRating(0)} className="text-primary w-4 h-4" />
            <span className="text-sm">All Ratings</span>
          </label>
          {[4, 3, 2].map((rating) => (
            <label key={rating} className="flex items-center space-x-2 cursor-pointer group">
              <input
                type="radio"
                name="rating"
                checked={minRating === rating}
                onChange={() => setMinRating(rating)}
                className="text-primary focus:ring-primary w-4 h-4"
              />
              <span className="flex items-center gap-1 text-sm group-hover:text-primary transition-colors">
                {rating}+ <FiStar className="w-3 h-3 fill-amber-400 text-amber-400" />
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-1">
          {searchQuery ? `Results for "${searchQuery}"` : 'Shop All'}
        </h1>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-muted-foreground text-sm">
            {isLoading ? 'Loading...' : `Showing ${filteredProducts.length} products`}
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              className="sm:hidden flex items-center space-x-2 px-4 py-2 bg-secondary rounded-lg font-medium text-sm"
              onClick={() => setIsMobileFiltersOpen(true)}
            >
              <FiFilter className="w-4 h-4" /> <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {selectedCategories.length + selectedBrands.length + (minRating > 0 ? 1 : 0)}
                </span>
              )}
            </button>

            <div className="relative flex-1 sm:flex-none">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none w-full sm:w-52 px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-medium text-sm"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="popular">Most Popular</option>
                <option value="trending">Trending</option>
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground w-4 h-4" />
            </div>

            <div className="hidden sm:flex items-center space-x-1 bg-secondary rounded-lg p-1">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-background shadow' : 'text-muted-foreground'}`}>
                <FiGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-background shadow' : 'text-muted-foreground'}`}>
                <FiList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-[80px]">
            <FilterSidebar />
          </div>
        </aside>

        {/* Mobile Filters Drawer */}
        <AnimatePresence>
          {isMobileFiltersOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileFiltersOpen(false)}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:hidden"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                className="fixed inset-y-0 left-0 w-[300px] bg-card z-50 p-6 overflow-y-auto lg:hidden shadow-2xl"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold">Filters</h2>
                  <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 hover:bg-secondary rounded-lg">
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                <FilterSidebar />
                <div className="mt-8 pt-6 border-t border-border">
                  <button
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl"
                  >
                    Show {filteredProducts.length} Results
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        <main className="flex-1 min-w-0">
          {isLoading ? (
            /* Skeleton Loading */
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {Array.from({ length: 12 }).map((_, i) => (
                viewMode === 'grid' ? <ProductCardSkeleton key={i} /> : <ProductListSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6">
                <FiFilter className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No products found</h2>
              <p className="text-muted-foreground mb-6">Try adjusting your filters or search query.</p>
              <button onClick={clearFilters} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold">
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className={`grid gap-6 ${
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  : 'grid-cols-1'
              }`}>
                <AnimatePresence mode="popLayout">
                  {paginatedProducts.map((product) =>
                    viewMode === 'grid' ? (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Link href={`/product/${product.id}`}>
                          <div className="flex bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all p-4 gap-5 cursor-pointer group">
                            <div className="w-36 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-secondary relative">
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {product.discount > 0 && (
                                <span className="absolute top-2 left-2 bg-destructive text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                                  -{product.discount}%
                                </span>
                              )}
                            </div>
                            <div className="flex-1 flex flex-col justify-center gap-2 min-w-0">
                              <p className="text-xs text-primary font-bold uppercase tracking-wider">{product.brand}</p>
                              <h3 className="text-base font-bold leading-snug line-clamp-2">{product.name}</h3>
                              <ReviewStars rating={product.rating} />
                              <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                              <div className="flex items-center gap-3 mt-auto">
                                <span className="text-xl font-black">${product.price.toFixed(2)}</span>
                                {product.originalPrice > product.price && (
                                  <span className="text-sm text-muted-foreground line-through">${product.originalPrice.toFixed(2)}</span>
                                )}
                              </div>
                            </div>
                            <FiChevronDown className="self-center rotate-[-90deg] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </div>
                        </Link>
                      </motion.div>
                    )
                  )}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    disabled={currentPage === 1}
                    className="px-4 py-2.5 rounded-xl border border-border bg-card disabled:opacity-40 hover:bg-secondary transition-colors font-medium text-sm"
                  >
                    ← Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                    .reduce<(number | string)[]>((acc, p, i, arr) => {
                      if (i > 0 && typeof arr[i - 1] === 'number' && (p as number) - (arr[i - 1] as number) > 1)
                        acc.push('…');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === '…' ? (
                        <span key={`e-${i}`} className="px-2 text-muted-foreground select-none">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => { setCurrentPage(p as number); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className={`w-10 h-10 rounded-xl font-bold text-sm transition-colors ${
                            currentPage === p
                              ? 'bg-primary text-primary-foreground shadow-md'
                              : 'border border-border bg-card hover:bg-secondary'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}

                  <button
                    onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2.5 rounded-xl border border-border bg-card disabled:opacity-40 hover:bg-secondary transition-colors font-medium text-sm"
                  >
                    Next →
                  </button>
                </div>
              )}

              {/* Page Info */}
              {totalPages > 1 && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Page {currentPage} of {totalPages} · {filteredProducts.length} products
                </p>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ShopPage;
