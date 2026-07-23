import React, { useState, useMemo } from 'react';
import { useRoute, Link } from 'wouter';
import { motion } from 'framer-motion';
import { FiArrowRight, FiChevronDown, FiGrid, FiList, FiMonitor, FiTag, FiHeadphones, FiCpu, FiActivity, FiFeather, FiHome, FiPackage, FiZap } from 'react-icons/fi';
import { Product } from '../data/products';
import { useProductStore } from '../store/productStore';
import ProductCard from '../components/product/ProductCard';
import ProductCardSkeleton from '../components/product/ProductCardSkeleton';

type CategoryName = 'Electronics' | 'Fashion' | 'Audio' | 'Gaming' | 'Sports' | 'Beauty' | 'Kitchen' | 'Home' | 'Digital';

const CATEGORY_CONFIG: Record<string, {
  gradient: string;
  heroImage: string;
  accentColor: string;
  description: string;
  Icon: React.FC<{ className?: string }>;
}> = {
  Electronics: {
    gradient: 'from-blue-950 via-blue-900 to-slate-900',
    heroImage: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1400&h=500&fit=crop',
    accentColor: 'text-blue-400',
    description: 'Cutting-edge technology for the modern world',
    Icon: FiMonitor,
  },
  Fashion: {
    gradient: 'from-purple-950 via-pink-900 to-rose-950',
    heroImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1400&h=500&fit=crop',
    accentColor: 'text-pink-400',
    description: 'Premium style for every occasion',
    Icon: FiTag,
  },
  Audio: {
    gradient: 'from-orange-950 via-amber-900 to-yellow-950',
    heroImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1400&h=500&fit=crop',
    accentColor: 'text-orange-400',
    description: 'Immersive sound for every moment',
    Icon: FiHeadphones,
  },
  Gaming: {
    gradient: 'from-green-950 via-emerald-900 to-teal-950',
    heroImage: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=1400&h=500&fit=crop',
    accentColor: 'text-green-400',
    description: 'Level up your gaming experience',
    Icon: FiCpu,
  },
  Sports: {
    gradient: 'from-teal-950 via-cyan-900 to-sky-950',
    heroImage: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1400&h=500&fit=crop',
    accentColor: 'text-cyan-400',
    description: 'Gear up for peak performance',
    Icon: FiActivity,
  },
  Beauty: {
    gradient: 'from-pink-950 via-rose-900 to-fuchsia-950',
    heroImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1400&h=500&fit=crop',
    accentColor: 'text-rose-400',
    description: 'Elevate your beauty routine',
    Icon: FiFeather,
  },
  Kitchen: {
    gradient: 'from-amber-950 via-orange-900 to-red-950',
    heroImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1400&h=500&fit=crop',
    accentColor: 'text-amber-400',
    description: 'Premium kitchen essentials',
    Icon: FiZap,
  },
  Home: {
    gradient: 'from-indigo-950 via-violet-900 to-purple-950',
    heroImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&h=500&fit=crop',
    accentColor: 'text-indigo-400',
    description: 'Transform your living space',
    Icon: FiHome,
  },
  Digital: {
    gradient: 'from-violet-950 via-purple-900 to-fuchsia-950',
    heroImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1400&h=500&fit=crop',
    accentColor: 'text-violet-400',
    description: 'Tools, scripts, courses & prompts — earn without limits',
    Icon: FiPackage,
  },
};

const PRODUCTS_PER_PAGE = 20;

const CategoryPage: React.FC = () => {
  const { products } = useProductStore();
  const [, params] = useRoute('/category/:name');
  const rawName = params?.name || '';
  const categoryName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase() as CategoryName;

  const config = CATEGORY_CONFIG[categoryName];

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000]);

  const categoryProducts = products.filter(p => p.category === categoryName);
  const allBrands = Array.from(new Set(categoryProducts.map(p => p.brand))).sort();
  const maxPrice = Math.ceil(Math.max(...categoryProducts.map(p => p.price)));

  const filteredProducts = useMemo(() => {
    let res = categoryProducts;
    if (selectedBrands.length > 0) res = res.filter(p => selectedBrands.includes(p.brand));
    res = res.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    switch (sortBy) {
      case 'price-asc': return [...res].sort((a, b) => a.price - b.price);
      case 'price-desc': return [...res].sort((a, b) => b.price - a.price);
      case 'rating': return [...res].sort((a, b) => b.rating - a.rating);
      case 'popular': return [...res].sort((a, b) => b.reviewCount - a.reviewCount);
      case 'discount': return [...res].sort((a, b) => b.discount - a.discount);
      default: return [...res].sort((a, b) => (a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1));
    }
  }, [categoryProducts, selectedBrands, sortBy, priceRange]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginated = filteredProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
    setCurrentPage(1);
  };

  if (!config) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Category Not Found</h1>
        <Link href="/shop" className="text-primary hover:underline">Browse all products</Link>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Hero Banner */}
      <section className={`relative overflow-hidden bg-gradient-to-r ${config.gradient} min-h-[280px] flex items-center`}>
        <img
          src={config.heroImage}
          alt={categoryName}
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="relative z-10 container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 text-white/60 text-sm mb-3">
              <Link href="/" className="hover:text-white">Home</Link>
              <span>/</span>
              <span className="text-white">{categoryName}</span>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <config.Icon className="w-12 h-12 text-white/80 flex-shrink-0" />
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">{categoryName}</h1>
            </div>
            <p className={`text-lg md:text-xl ${config.accentColor} mb-6`}>{config.description}</p>
            <div className="flex items-center gap-6 text-white/70 text-sm">
              <span><strong className="text-white font-bold">{categoryProducts.length}</strong> Products</span>
              <span><strong className="text-white font-bold">{allBrands.length}</strong> Brands</span>
              <span><strong className="text-white font-bold">{categoryProducts.filter(p => p.discount > 0).length}</strong> On Sale</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sub-category Quick Links */}
      <div className="border-b border-border bg-card sticky top-[60px] z-30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 py-3 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => { setSelectedBrands([]); setCurrentPage(1); }}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${selectedBrands.length === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}
            >
              All
            </button>
            {allBrands.map(brand => (
              <button
                key={brand}
                onClick={() => { setSelectedBrands([brand]); setCurrentPage(1); }}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${selectedBrands.includes(brand) && selectedBrands.length === 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'}`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-60 flex-shrink-0">
            <div className="sticky top-[120px] space-y-8">
              <div>
                <h3 className="font-bold mb-4">Price Range</h3>
                <input
                  type="range"
                  min={0}
                  max={maxPrice || 3000}
                  step={50}
                  value={priceRange[1]}
                  onChange={(e) => { setPriceRange([0, parseInt(e.target.value)]); setCurrentPage(1); }}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>PKR 0</span>
                  <span>PKR {priceRange[1]}</span>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-4">Brands</h3>
                <div className="space-y-2">
                  {allBrands.map(brand => (
                    <label key={brand} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => toggleBrand(brand)}
                        className="rounded border-border text-primary w-4 h-4"
                      />
                      <span className="text-sm group-hover:text-primary transition-colors">{brand}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        ({categoryProducts.filter(p => p.brand === brand).length})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedBrands.length > 0 && (
                <button
                  onClick={() => setSelectedBrands([])}
                  className="w-full py-2 text-sm font-bold text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <p className="text-muted-foreground text-sm">
                Showing <strong className="text-foreground">{filteredProducts.length}</strong> products
              </p>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                    className="appearance-none pl-4 pr-8 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                    <option value="popular">Most Popular</option>
                    <option value="discount">Biggest Discount</option>
                  </select>
                  <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground w-4 h-4" />
                </div>
                <div className="flex items-center space-x-1 bg-secondary rounded-lg p-1">
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

            {/* Grid */}
            {paginated.length === 0 ? (
              <div className="text-center py-20">
                <h3 className="text-xl font-bold mb-2">No products match your filters</h3>
                <button onClick={() => { setSelectedBrands([]); setPriceRange([0, 3000]); }} className="text-primary hover:underline">
                  Clear filters
                </button>
              </div>
            ) : (
              <div className={`grid gap-6 mb-8 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {paginated.map(product =>
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
                          <h3 className="font-bold text-base truncate">{product.name}</h3>
                          <p className="text-muted-foreground text-sm line-clamp-2">{product.description}</p>
                          <div className="flex items-center gap-3 mt-auto">
                            <span className="font-bold text-lg">PKR {product.price.toFixed(0)}</span>
                            {product.discount > 0 && (
                              <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded">-{product.discount}%</span>
                            )}
                          </div>
                        </div>
                        <FiArrowRight className="self-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  )
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
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
                      <span key={`e-${i}`} className="px-2 text-muted-foreground">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p as number)}
                        className={`w-10 h-10 rounded-lg font-bold text-sm transition-colors ${currentPage === p ? 'bg-primary text-primary-foreground' : 'border border-border bg-card hover:bg-secondary'}`}
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
          </main>
        </div>
      </div>
    </motion.div>
  );
};

export default CategoryPage;
