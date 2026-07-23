import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../../context/AuthContext';
import {
  FiGrid, FiCreditCard, FiPlusCircle, FiMinusCircle,
  FiCalendar, FiPackage, FiShoppingBag,
  FiFileText, FiStar, FiUser, FiLogOut, FiChevronRight,
} from 'react-icons/fi';

export const dashboardNavItems = [
  { icon: FiGrid,        label: 'Overview',      href: '/dashboard' },
  { icon: FiCreditCard,  label: 'My Wallet',     href: '/wallet' },
  { icon: FiPlusCircle,  label: 'Top Up',        href: '/top-up' },
  { icon: FiMinusCircle, label: 'Cash Out',      href: '/cashout' },
  { icon: FiCalendar,    label: 'Daily Streak',  href: '/checkin' },
  { icon: FiPackage,     label: 'Order History', href: '/account/orders' },
  { icon: FiShoppingBag, label: 'Seller Hub',    href: '/seller-hub' },
  { icon: FiFileText,    label: 'E-Statement',   href: '/statement' },
  { icon: FiStar,        label: 'VIP Club',      href: '/membership' },
  { icon: FiUser,        label: 'My Profile',    href: '/account' },
];

const DashboardSidebar: React.FC = () => {
  const [location] = useLocation();
  const { signOut } = useAuth();
  const [, setLocation] = useLocation();

  const handleSignOut = async () => {
    await signOut();
    setLocation('/');
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden sticky top-24">
      {/* Nav items */}
      <nav className="p-2 space-y-0.5">
        {dashboardNavItems.map((item) => {
          const active = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <FiChevronRight className="w-3.5 h-3.5 opacity-70" />}
            </Link>
          );
        })}
        <div className="h-px bg-border mx-2 my-1" />
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
        >
          <FiLogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </nav>
    </div>
  );
};

// Backward-compat shim so legacy imports don't break
export const AccountSidebar: React.FC<{ activePath?: string }> = () => <DashboardSidebar />;

export default DashboardSidebar;
