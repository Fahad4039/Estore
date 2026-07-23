import React, { Suspense, lazy, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from './context/AuthContext';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import DrawerMenu from './components/layout/DrawerMenu';
import ProductQuickView from './components/product/ProductQuickView';

// Eager-loaded core pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

// Lazy-loaded secondary pages for performance
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const FlashSalePage = lazy(() => import('./pages/FlashSalePage'));
const SellerProfilePage = lazy(() => import('./pages/SellerProfilePage'));
const AffiliatorPage    = lazy(() => import('./pages/AffiliatorPage'));
const AllReviewsPage    = lazy(() => import('./pages/AllReviewsPage'));
const WalletPage        = lazy(() => import('./pages/WalletPage'));
const TopUpPage         = lazy(() => import('./pages/TopUpPage'));
const CashOutPage       = lazy(() => import('./pages/CashOutPage'));
const CheckInPage       = lazy(() => import('./pages/CheckInPage'));
const SellerHubPage     = lazy(() => import('./pages/SellerHubPage'));
const ReferEarnPage     = lazy(() => import('./pages/ReferEarnPage'));
const StatementPage     = lazy(() => import('./pages/StatementPage'));
const MembershipPage    = lazy(() => import('./pages/MembershipPage'));
const AdminPage         = lazy(() => import('./pages/AdminPage'));

const queryClient = new QueryClient();

// Minimal skeleton fallback for lazy pages
function PageFallback() {
  return (
    <div className="container mx-auto px-4 py-16 space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-secondary rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] bg-secondary rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen relative">
      <Header />
      <DrawerMenu />
      <main className="flex-1 w-full flex flex-col mt-[60px]">
        {children}
      </main>
      <Footer />
      <ProductQuickView />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* Admin — own full-screen layout, no store header/footer */}
      <Route path="/admin">
        <Suspense fallback={<PageFallback />}>
          <AdminPage />
        </Suspense>
      </Route>

      {/* All other routes share the store Layout */}
      <Route>
        <Layout>
          <Suspense fallback={<PageFallback />}>
            <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/shop" component={ShopPage} />
          <Route path="/product/:id/reviews" component={AllReviewsPage} />
          <Route path="/product/:id" component={ProductPage} />
          <Route path="/cart" component={CartPage} />
          <Route path="/checkout" component={CheckoutPage} />
          <Route path="/wishlist" component={WishlistPage} />
          <Route path="/search" component={SearchPage} />
          <Route path="/category/:name" component={CategoryPage} />
          <Route path="/flash-sale" component={FlashSalePage} />
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/account" component={AccountPage} />
          <Route path="/account/orders" component={OrdersPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/register" component={RegisterPage} />
          <Route path="/forgot-password" component={ForgotPasswordPage} />
          <Route path="/seller/:id" component={SellerProfilePage} />
          <Route path="/affiliators" component={AffiliatorPage} />
          <Route path="/wallet" component={WalletPage} />
          <Route path="/top-up" component={TopUpPage} />
          <Route path="/cashout" component={CashOutPage} />
          <Route path="/checkin" component={CheckInPage} />
          <Route path="/seller-hub" component={SellerHubPage} />
          <Route path="/refer-earn" component={ReferEarnPage} />
          <Route path="/statement" component={StatementPage} />
          <Route path="/membership" component={MembershipPage} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </Layout>
      </Route>
    </Switch>
  );
}

function AppInit() {
  const fetchProducts = React.useCallback(() => {
    import('./store/productStore').then(({ useProductStore }) => {
      useProductStore.getState().fetchFromApi();
    });
  }, []);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  return null;
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <AppInit />
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
