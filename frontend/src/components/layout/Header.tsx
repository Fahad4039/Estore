import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { FiSearch, FiMenu, FiX, FiClock, FiTrendingUp, FiArrowRight, FiBell, FiPackage, FiTag, FiGift, FiInfo, FiHeart, FiShoppingCart, FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from 'next-themes';
import { useUIStore } from '../../store/uiStore';
import { useSearchStore, TRENDING_SEARCHES } from '../../store/searchStore';
import { useNotifStore, timeAgo, notifColor, NotifType } from '../../store/notificationStore';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useProductStore } from '../../store/productStore';

const MAX_SUGGESTIONS = 5;

const notifIcon = (type: NotifType) => {
  switch (type) {
    case 'deal':   return FiTag;
    case 'order':  return FiPackage;
    case 'promo':  return FiGift;
    case 'system': return FiInfo;
  }
};

const DASHBOARD_ROUTES = [
  '/dashboard', '/account', '/account/orders',
  '/wallet', '/top-up', '/cashout', '/checkin',
  '/seller-hub', '/statement', '/membership', '/refer-earn',
];

const Header: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const { currentUser } = useAuth();

  /* true when user is on any dashboard/account page */
  const isDashboard = DASHBOARD_ROUTES.some((r) => location === r || location.startsWith(r + '/'));
  const { isSearchOpen, openSearch, closeSearch, openDrawer, headerGlowImage, cartAddedAt, wishlistAddedAt } = useUIStore();
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchStore();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifStore();
  const { itemCount } = useCartStore();
  const wishlistItems = useWishlistStore((s) => s.items);
  const { products } = useProductStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cartPinging, setCartPinging] = useState(false);
  const [wishPinging, setWishPinging] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!cartAddedAt) return;
    setCartPinging(true);
    const t = setTimeout(() => setCartPinging(false), 1800);
    return () => clearTimeout(t);
  }, [cartAddedAt]);

  useEffect(() => {
    if (!wishlistAddedAt) return;
    setWishPinging(true);
    const t = setTimeout(() => setWishPinging(false), 1800);
    return () => clearTimeout(t);
  }, [wishlistAddedAt]);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Auto-focus and show dropdown when search opens
  useEffect(() => {
    if (isSearchOpen) {
      setShowDropdown(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setShowDropdown(false);
      setSearchQuery('');
    }
  }, [isSearchOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Live product suggestions
  const suggestions = searchQuery.trim().length >= 1
    ? products
        .filter((p) => {
          const q = searchQuery.toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
          );
        })
        .slice(0, MAX_SUGGESTIONS)
    : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    addToHistory(searchQuery.trim());
    setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    closeSearch();
    setSearchQuery('');
    setShowDropdown(false);
  };

  const navigateTerm = (term: string) => {
    addToHistory(term);
    setLocation(`/search?q=${encodeURIComponent(term)}`);
    closeSearch();
    setSearchQuery('');
    setShowDropdown(false);
  };

  const navigateProduct = (id: string) => {
    setLocation(`/product/${id}`);
    closeSearch();
    setSearchQuery('');
    setShowDropdown(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-[60px] z-40 header-glass transition-colors duration-300 overflow-hidden">
        {/* ── Ambient glow from active product image ── */}
        <AnimatePresence>
          {headerGlowImage && (
            <motion.div
              key={headerGlowImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 pointer-events-none"
              aria-hidden="true"
              style={{ zIndex: 0 }}
            >
              <img
                src={headerGlowImage}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  filter: 'blur(40px) saturate(3) brightness(0.6)',
                  transform: 'scale(1.5)',
                }}
              />
              {/* Light overlay so product colors glow through */}
              <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.18)' }} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="container mx-auto h-full px-4 flex items-center justify-between relative z-10">

          <AnimatePresence mode="wait">
            {!isSearchOpen ? (
              <motion.div
                key="logo"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center space-x-2 flex-1"
              >
                <Link href="/" className="flex items-center space-x-2 group">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl transition-transform group-hover:scale-105">
                    E
                  </div>
                  <span className="font-bold text-xl tracking-tight hidden sm:block">STORE</span>
                </Link>
                {/* Desktop Nav */}
                <nav className="hidden lg:flex items-center gap-6 ml-8">
                  {([
                    { label: 'Shop', href: '/shop' },
                    { label: 'Flash Sale', href: '/flash-sale' },
                    { label: 'Electronics', href: '/category/electronics' },
                    { label: 'Fashion', href: '/category/fashion' },
                    { label: 'Audio', href: '/category/audio' },
                    { label: 'Digital', href: '/category/digital' },
                  ] as const).map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </motion.div>
            ) : (
              <motion.div
                key="search"
                ref={searchRef}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 flex items-center mr-4 relative"
              >
                <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    ref={inputRef}
                    type="search"
                    placeholder="Search products, brands, categories..."
                    className="w-full h-10 pl-10 pr-4 bg-secondary/50 border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                  />
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Right icons ── */}
          <div className="flex items-center gap-1">
            {isSearchOpen ? (
              <button onClick={closeSearch} className="p-2 rounded-full hover:bg-secondary transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            ) : (
              <>
                {/* Search — always visible */}
                <button onClick={openSearch} className="p-2 rounded-full hover:bg-secondary transition-colors">
                  <FiSearch className="w-5 h-5" />
                </button>

                {currentUser ? (
                  /* ── LOGGED-IN: Bell only ── */
                  <div ref={notifRef} className="relative">
                    <button
                      onClick={() => setNotifOpen((v) => !v)}
                      className="relative p-2 rounded-full hover:bg-secondary transition-colors"
                    >
                      <FiBell className="w-5 h-5" />
                      {unreadCount() > 0 && (
                        <span
                          className="absolute top-1 right-1 w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center leading-none"
                          style={{ animation: 'badge-pulse 1.6s ease-in-out infinite' }}
                        >
                          {unreadCount() > 9 ? '9+' : unreadCount()}
                        </span>
                      )}
                    </button>

                    <AnimatePresence>
                      {notifOpen && (
                        <>
                          <div className="fixed inset-0 z-[55]" onClick={() => setNotifOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.97 }}
                            transition={{ duration: 0.14, type: 'spring', stiffness: 400, damping: 30 }}
                            className="absolute right-0 top-full mt-2 w-[340px] max-h-[480px] flex flex-col z-[56] rounded-2xl shadow-2xl overflow-hidden"
                            style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
                          >
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
                              <div className="flex items-center gap-2">
                                <FiBell className="w-4 h-4 text-primary" />
                                <span className="font-black text-sm">Notifications</span>
                                {unreadCount() > 0 && (
                                  <span className="text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/25 rounded-full px-2 py-0.5">
                                    {unreadCount()} new
                                  </span>
                                )}
                              </div>
                              {unreadCount() > 0 && (
                                <button onClick={markAllRead} className="text-[10px] font-bold text-primary hover:underline">
                                  Mark all read
                                </button>
                              )}
                            </div>
                            <div className="overflow-y-auto flex-1 divide-y divide-border/50">
                              {notifications.length === 0 ? (
                                <div className="py-10 text-center text-sm text-muted-foreground">No notifications yet</div>
                              ) : notifications.map((n) => {
                                const colors = notifColor(n.type);
                                const Icon = notifIcon(n.type);
                                return (
                                  <button
                                    key={n.id}
                                    onClick={() => markRead(n.id)}
                                    className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/60 ${!n.read ? 'bg-primary/[0.04]' : ''}`}
                                  >
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${colors.bg} ${colors.border}`}>
                                      <Icon className={`w-4 h-4 ${colors.dot.replace('bg-', 'text-')}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <p className={`text-xs font-bold leading-snug ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                                        {!n.read && <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${colors.dot}`} />}
                                      </div>
                                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                                      <p className="text-[10px] text-muted-foreground/60 mt-1 font-medium">{timeAgo(n.time)}</p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  /* ── GUEST: Wishlist + Cart + Theme ── */
                  <>
                    <Link href="/wishlist" className="p-2 rounded-full hover:bg-secondary transition-colors relative">
                      {wishPinging && (
                        <span className="absolute inset-0 rounded-full" style={{ border: '2px solid #ef4444', animation: 'cart-ping 0.6s ease-out 3', opacity: 0 }} />
                      )}
                      <FiHeart className="w-5 h-5" style={{ color: wishPinging ? '#ef4444' : undefined, transition: 'color 0.2s' }} />
                      {wishlistItems.length > 0 && (
                        <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center" style={{ animation: 'badge-pulse 1.4s ease-in-out infinite' }}>
                          {wishlistItems.length}
                        </span>
                      )}
                    </Link>
                    <Link href="/cart" className="p-2 rounded-full hover:bg-secondary transition-colors relative">
                      {cartPinging && (
                        <span className="absolute inset-0 rounded-full" style={{ border: '2px solid #2563eb', animation: 'cart-ping 0.6s ease-out 3', opacity: 0 }} />
                      )}
                      <FiShoppingCart className="w-5 h-5" style={{ color: cartPinging ? '#2563eb' : undefined, transition: 'color 0.2s' }} />
                      {itemCount() > 0 && (
                        <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center" style={{ animation: 'badge-pulse 1.4s ease-in-out infinite' }}>
                          {itemCount()}
                        </span>
                      )}
                    </Link>
                    {mounted && (
                      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full hover:bg-secondary transition-colors">
                        {theme === 'dark' ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
                      </button>
                    )}
                  </>
                )}
              </>
            )}

            {/* Menu — always visible */}
            <button onClick={openDrawer} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <FiMenu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Search Dropdown Portal */}
      <AnimatePresence>
        {isSearchOpen && showDropdown && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-[60px] bg-background/60 backdrop-blur-sm z-30"
              onClick={() => { closeSearch(); }}
            />

            {/* Dropdown Panel */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="fixed top-[60px] left-0 right-0 z-35 flex justify-center px-4 pointer-events-none"
              style={{ zIndex: 39 }}
            >
              <div
                className="w-full max-w-2xl mt-1 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {searchQuery.trim().length === 0 ? (
                  /* No query: show history + trending */
                  <div className="p-4 space-y-5">
                    {/* Recent Searches */}
                    {history.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <FiClock className="w-3.5 h-3.5" /> Recent
                          </span>
                          <button onClick={clearHistory} className="text-xs text-primary hover:underline">
                            Clear all
                          </button>
                        </div>
                        <div className="space-y-1">
                          {history.slice(0, 5).map((term) => (
                            <div key={term} className="flex items-center group">
                              <button
                                onClick={() => navigateTerm(term)}
                                className="flex items-center gap-3 flex-1 py-2 px-3 rounded-lg hover:bg-secondary transition-colors text-left"
                              >
                                <FiClock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm font-medium">{term}</span>
                                <FiArrowRight className="ml-auto w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                              <button
                                onClick={() => removeFromHistory(term)}
                                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <FiX className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Trending */}
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
                        <FiTrendingUp className="w-3.5 h-3.5 text-primary" /> Trending
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {TRENDING_SEARCHES.slice(0, 8).map((term) => (
                          <button
                            key={term}
                            onClick={() => navigateTerm(term)}
                            className="px-3 py-1.5 bg-secondary hover:bg-primary hover:text-primary-foreground rounded-full text-sm font-medium transition-colors"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Category Links */}
                    <div className="border-t border-border pt-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3">Browse</span>
                      <div className="grid grid-cols-4 gap-2">
                        {['Electronics', 'Fashion', 'Audio', 'Gaming'].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => { setLocation(`/category/${cat.toLowerCase()}`); closeSearch(); }}
                            className="text-center p-2 rounded-lg bg-secondary hover:bg-primary/10 hover:text-primary transition-colors text-xs font-semibold"
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : suggestions.length > 0 ? (
                  /* Live suggestions */
                  <div>
                    <div className="px-4 pt-4 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Products</span>
                    </div>
                    <div className="divide-y divide-border">
                      {suggestions.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => navigateProduct(product.id)}
                          className="w-full flex items-center gap-4 px-4 py-3 hover:bg-secondary transition-colors text-left"
                        >
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.brand} · {product.category}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-sm">PKR {product.price.toFixed(0)}</p>
                            {product.discount > 0 && (
                              <p className="text-xs text-destructive font-bold">-{product.discount}%</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-border">
                      <button
                        onClick={() => {
                          addToHistory(searchQuery.trim());
                          setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                          closeSearch();
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-primary hover:bg-primary/5 transition-colors"
                      >
                        <FiSearch className="w-4 h-4" />
                        See all results for "{searchQuery}"
                        <FiArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* No matches */
                  <div className="px-4 py-8 text-center">
                    <p className="text-muted-foreground text-sm">No products found for "{searchQuery}"</p>
                    <button
                      onClick={() => {
                        addToHistory(searchQuery.trim());
                        setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                        closeSearch();
                        setSearchQuery('');
                      }}
                      className="mt-2 text-sm text-primary hover:underline"
                    >
                      Search anyway →
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
