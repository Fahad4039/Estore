import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { Link } from 'wouter';
import { useUIStore } from '../../store/uiStore';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from 'next-themes';
import {
  FiHome, FiGrid, FiTrendingUp, FiZap, FiAward, FiPackage,
  FiSun, FiCpu, FiUserPlus, FiLogIn, FiLogOut,
  FiX, FiSettings, FiBarChart2, FiShoppingBag,
  FiCreditCard, FiChevronRight, FiUser,
  FiCalendar, FiStar, FiFileText, FiPlusCircle, FiMinusCircle,
} from 'react-icons/fi';

/* ─── scroll helper ─── */
const scrollToSection = (id: string) => {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

/* ─── Guest items (landing page sections only) ─── */
const guestItems = [
  { icon: FiHome,       label: 'Home',           sectionId: 'home',         accent: '#e2e8f0' },
  { icon: FiGrid,       label: 'Category',       sectionId: 'category',     accent: '#e2e8f0' },
  { icon: FiTrendingUp, label: 'Trending Now',   sectionId: 'trending',     accent: '#e2e8f0' },
  { icon: FiZap,        label: 'Flash Deals',    sectionId: 'flash-deals',  accent: '#e2e8f0' },
  { icon: FiAward,      label: 'Most Popular',   sectionId: 'most-popular', accent: '#e2e8f0' },
  { icon: FiPackage,    label: 'Best Value',     sectionId: 'best-value',   accent: '#e2e8f0' },
  { icon: FiSun,        label: 'Summer Special', sectionId: 'summer-special', accent: '#e2e8f0' },
  { icon: FiCpu,        label: 'Digital Market', sectionId: 'digital',      accent: '#e2e8f0' },
];

/* ─── Logged-in / dashboard items ─── */
const loggedItems = [
  { icon: FiGrid,        label: 'Overview',      href: '/dashboard' },
  { icon: FiCreditCard,  label: 'My Wallet',     href: '/wallet' },
  { icon: FiPlusCircle,  label: 'Top Up',        href: '/top-up' },
  { icon: FiMinusCircle, label: 'Cash Out',      href: '/cashout' },
  { icon: FiCalendar,    label: 'Daily Streak',  href: '/checkin' },
  { icon: FiPackage,     label: 'Order History', href: '/account/orders' },
  { icon: FiShoppingBag, label: 'Seller Hub',    href: '/seller-hub' },
  { icon: FiFileText,    label: 'E-Statement',   href: '/statement' },
  { icon: FiStar,        label: 'VIP Club',      href: '/membership' },
  { icon: FiSettings,    label: 'My Profile',    href: '/account' },
];

/* ═══════════════════════════════════════════
   ROW — guest (scroll to section)
═══════════════════════════════════════════ */
const GuestRow: React.FC<{
  icon: React.ElementType;
  label: string;
  sectionId: string;
  delay: number;
  onNavigate: (id: string) => void;
}> = ({ icon: Icon, label, sectionId, delay, onNavigate }) => (
  <motion.div
    initial={{ opacity: 0, x: 24 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, type: 'spring', stiffness: 460, damping: 34 }}
  >
    <button
      onClick={() => onNavigate(sectionId)}
      className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 hover:bg-white/10 active:scale-[0.98] text-left"
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/8 group-hover:bg-white/14 transition-colors">
        <Icon className="w-[15px] h-[15px] text-foreground/70 group-hover:text-foreground transition-colors" />
      </div>
      <span className="flex-1 text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors tracking-wide">
        {label}
      </span>
      <FiChevronRight className="w-3 h-3 text-foreground/20 group-hover:text-foreground/50 group-hover:translate-x-0.5 transition-all" />
    </button>
  </motion.div>
);

/* ═══════════════════════════════════════════
   ROW — logged in (link-based)
═══════════════════════════════════════════ */
const LoggedRow: React.FC<{
  icon: React.ElementType;
  label: string;
  href: string;
  delay: number;
  onClick: () => void;
}> = ({ icon: Icon, label, href, delay, onClick }) => (
  <motion.div
    initial={{ opacity: 0, x: 24 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, type: 'spring', stiffness: 460, damping: 34 }}
  >
    <Link
      href={href}
      onClick={onClick}
      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 hover:bg-white/10 active:scale-[0.98]"
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/8 group-hover:bg-white/14 transition-colors">
        <Icon className="w-[15px] h-[15px] text-foreground/70 group-hover:text-foreground transition-colors" />
      </div>
      <span className="flex-1 text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors tracking-wide">
        {label}
      </span>
      <FiChevronRight className="w-3 h-3 text-foreground/20 group-hover:text-foreground/50 group-hover:translate-x-0.5 transition-all" />
    </Link>
  </motion.div>
);

/* ═══════════════════════════════════════════
   MAIN
═══════════════════════════════════════════ */
const DrawerMenu: React.FC = () => {
  const { isDrawerOpen, closeDrawer } = useUIStore();
  const { currentUser, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [location, setLocation] = useLocation();

  const close = () => closeDrawer();

  const dashboardPaths = [
    '/dashboard', '/wallet', '/top-up', '/cashout', '/checkin',
    '/seller-hub', '/refer-earn', '/statement', '/membership',
    '/account', '/account/orders',
  ];
  const isOnDashboard = dashboardPaths.some((p) => location === p || location.startsWith(p + '/'));

  const handleGuestNav = (sectionId: string) => {
    close();
    // Go to home first, then scroll
    if (window.location.pathname.replace(/^\/estore\/?/, '/').replace(/^\/?$/, '/') === '/') {
      // Already on home — just scroll
      setTimeout(() => scrollToSection(sectionId), 80);
    } else {
      setLocation('/');
      setTimeout(() => scrollToSection(sectionId), 350);
    }
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={close}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          />

          {/* ── Drawer panel ── */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.6 }}
            className="fixed top-0 right-0 w-[272px] h-full z-[51] flex flex-col overflow-hidden"
            style={{
              /* True glass: very low opacity fill, heavy blur so the page content shows */
              background: theme === 'dark'
                ? 'rgba(12, 14, 26, 0.38)'
                : 'rgba(255, 255, 255, 0.32)',
              backdropFilter: 'blur(48px) saturate(160%)',
              WebkitBackdropFilter: 'blur(48px) saturate(160%)',
              borderLeft: theme === 'dark'
                ? '1px solid rgba(255,255,255,0.08)'
                : '1px solid rgba(255,255,255,0.6)',
              boxShadow: '-12px 0 48px rgba(0,0,0,0.25)',
            }}
          >

            {/* ── Header ── */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="px-5 py-4 flex items-center justify-between flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.10)' }}
            >
              <Link href="/" onClick={close} className="flex items-center gap-2.5 group">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' }}
                >
                  E
                </div>
                <div>
                  <p className="font-black text-sm tracking-widest text-foreground leading-none">ESTORE</p>
                  <p className="text-[9px] font-semibold tracking-[0.22em] uppercase text-foreground/40">Premium</p>
                </div>
              </Link>

              <div className="flex items-center gap-1">
                {/* Theme toggle */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-1.5 rounded-lg text-foreground/50 hover:text-foreground hover:bg-white/10 transition-all"
                >
                  {theme === 'dark'
                    ? <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                    : <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                  }
                </motion.button>
                {/* Close */}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.88 }}
                  transition={{ duration: 0.15 }}
                  onClick={close}
                  className="p-1.5 rounded-lg text-foreground/50 hover:text-foreground hover:bg-white/10 transition-all"
                >
                  <FiX className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>

            {/* ── User strip (logged in, name only, no email) ── */}
            <AnimatePresence>
              {currentUser && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mx-3 mt-3 flex-shrink-0 rounded-xl overflow-hidden flex items-center gap-3 px-4 py-2.5"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}
                  >
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                  <p className="text-xs font-semibold text-foreground/80 truncate">
                    {currentUser.displayName || currentUser.email?.split('@')[0] || 'My Account'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Divider line ── */}
            {!currentUser && (
              <div className="mx-4 mt-3" style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
            )}

            {/* ── Nav list ── */}
            <div className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5 scrollbar-hide">
              {/* Logged-in on dashboard → coins widget + dashboard menu + sign out inline */}
              {currentUser && isOnDashboard
                ? (
                  <>
                    {loggedItems.map((item, i) => (
                      <LoggedRow
                        key={item.label}
                        {...item}
                        delay={0.07 + i * 0.03}
                        onClick={close}
                      />
                    ))}
                    <motion.div
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.07 + loggedItems.length * 0.03, type: 'spring', stiffness: 460, damping: 34 }}
                    >
                      <button
                        onClick={() => { signOut(); close(); }}
                        className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 hover:bg-red-500/10 active:scale-[0.98] mt-1"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-500/10 group-hover:bg-red-500/18 transition-colors">
                          <FiLogOut className="w-[15px] h-[15px] text-red-400" />
                        </div>
                        <span className="text-sm font-medium text-red-400 tracking-wide">Sign Out</span>
                      </button>
                    </motion.div>
                  </>
                )
                : /* Guest or logged-in on home/other pages → show home scroll sections */
                  guestItems.map((item, i) => (
                    <GuestRow
                      key={item.sectionId}
                      {...item}
                      delay={0.07 + i * 0.03}
                      onNavigate={handleGuestNav}
                    />
                  ))
              }
            </div>

            {/* ── Bottom CTA ── */}
            {/* Guest → Login / Register */}
            {!currentUser && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 260, damping: 26 }}
                className="px-4 pb-8 pt-4 flex-shrink-0 space-y-2.5"
                style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Link
                  href="/register"
                  onClick={close}
                  className="flex items-center justify-center w-full py-3 rounded-xl font-bold text-sm text-white transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
                    boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
                  }}
                >
                  <FiUserPlus className="w-4 h-4 mr-2" />
                  Create Account
                </Link>
                <Link
                  href="/login"
                  onClick={close}
                  className="flex items-center justify-center w-full py-3 rounded-xl font-semibold text-sm text-foreground/80 hover:text-foreground transition-all duration-150 active:scale-[0.98]"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  <FiLogIn className="w-4 h-4 mr-2" />
                  Login Now
                </Link>
              </motion.div>
            )}

            {/* Logged-in on home / other pages → My Dashboard + Sign Out */}
            {currentUser && !isOnDashboard && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 260, damping: 26 }}
                className="px-4 pb-8 pt-4 flex-shrink-0 space-y-2.5"
                style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Link
                  href="/dashboard"
                  onClick={close}
                  className="flex items-center justify-center w-full py-3 rounded-xl font-bold text-sm text-white transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
                    boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
                  }}
                >
                  <FiBarChart2 className="w-4 h-4 mr-2" />
                  My Dashboard
                </Link>
                <button
                  onClick={() => { signOut(); close(); }}
                  className="flex items-center justify-center w-full py-3 rounded-xl font-semibold text-sm text-red-400 hover:text-red-300 transition-all duration-150 active:scale-[0.98]"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.18)',
                  }}
                >
                  <FiLogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </motion.div>
            )}

            {/* Logged-in on dashboard → Home button + Sign Out */}
            {currentUser && isOnDashboard && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 260, damping: 26 }}
                className="px-4 pb-8 pt-4 flex-shrink-0 space-y-2.5"
                style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Link
                  href="/"
                  onClick={close}
                  className="flex items-center justify-center w-full py-3 rounded-xl font-bold text-sm text-white transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
                    boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
                  }}
                >
                  <FiHome className="w-4 h-4 mr-2" />
                  Go to Home
                </Link>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DrawerMenu;
