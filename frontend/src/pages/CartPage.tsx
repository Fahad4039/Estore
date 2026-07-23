import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import CartItem from '../components/cart/CartItem';
import {
  FiShield, FiShoppingBag, FiTag, FiArrowRight,
  FiTruck, FiZap, FiPackage,
} from 'react-icons/fi';
import { FaCcVisa, FaCcMastercard, FaCcAmex, FaCcPaypal, FaCcStripe } from 'react-icons/fa';
import { useToast } from '@/hooks/use-toast';

/* ── 3D tilt wrapper for the order summary card ── */
function Card3D({ children, className }: { children: React.ReactNode; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-120, 120], [6, -6]);
  const rotateY = useTransform(x, [-120, 120], [-6, 6]);
  const sx = useSpring(rotateX, { stiffness: 260, damping: 30 });
  const sy = useSpring(rotateY, { stiffness: 260, damping: 30 });

  return (
    <motion.div
      style={{ rotateX: sx, rotateY: sy }}
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - (r.left + r.width / 2));
        y.set(e.clientY - (r.top + r.height / 2));
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const CartPage: React.FC = () => {
  const { items, subtotal, total, discount, coupon, applyCoupon } = useCartStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [couponInput, setCouponInput] = useState(coupon || '');

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    try {
      applyCoupon(couponInput);
      toast({ title: 'Coupon applied!', description: `${couponInput.toUpperCase()} applied successfully.` });
    } catch {
      toast({ variant: 'destructive', title: 'Invalid coupon', description: 'The code is invalid or expired.' });
    }
  };

  /* ── empty state ── */
  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-500/6 blur-[100px]" />
        </div>
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          className="relative text-center"
        >
          <div className="relative w-36 h-36 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-primary/12 blur-2xl" />
            <div className="relative w-36 h-36 rounded-3xl bg-white/[0.04] border border-white/10 flex items-center justify-center"
              style={{ boxShadow: '0 20px 60px rgba(37,99,235,0.18)' }}>
              <FiShoppingBag className="w-16 h-16 text-primary/70" />
            </div>
          </div>
          <h1 className="text-4xl font-black mb-4">Your Cart is Empty</h1>
          <p className="text-muted-foreground text-lg mb-10 max-w-md">
            Discover premium collections and add something extraordinary.
          </p>
          <Link href="/shop">
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              className="px-10 py-4 rounded-2xl font-black text-white text-base flex items-center gap-2 mx-auto"
              style={{ background: 'linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)', boxShadow: '0 12px 32px rgba(37,99,235,0.4)' }}
            >
              <FiShoppingBag className="w-5 h-5" /> Start Shopping
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const shipping = subtotal() > 50 ? 0 : 9.99;
  const tax = subtotal() * 0.08;
  const finalTotal = total() + shipping + tax;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* ── Ambient 3D depth orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-60 -left-60 w-[700px] h-[700px] rounded-full bg-primary/5 blur-[140px]" />
        <div className="absolute top-1/3 -right-80 w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[450px] h-[450px] rounded-full bg-indigo-500/4 blur-[100px]" />
        {/* subtle grid texture */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '48px 48px' }} />
      </div>

      <div className="relative container mx-auto px-4 py-10">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
              My Cart
              <span className="ml-3 text-2xl sm:text-3xl font-normal text-muted-foreground">({items.length})</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Review your items before checkout</p>
          </div>
          <Link href="/shop" className="hidden sm:flex items-center gap-1.5 text-sm text-primary font-bold hover:opacity-80 transition-opacity">
            Continue Shopping <FiArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── Left: items + coupon + trust badges ── */}
          <motion.div
            initial={{ opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.06 }}
            className="w-full lg:flex-1 min-w-0 space-y-6"
          >
            {/* Items glass panel */}
            <div className="relative rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                border: '1px solid rgba(255,255,255,0.09)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.07)',
              }}
            >
              {/* glass sheen top line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent z-10" />
              {/* subtle inner glow */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-20 bg-blue-500/6 blur-2xl rounded-full pointer-events-none" />
              <div className="relative p-6 sm:p-8">
                {items.map(item => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            </div>

            {/* Coupon panel */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="relative rounded-2xl p-6 overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              }}
            >
              <h3 className="font-black text-xs uppercase tracking-[0.18em] text-muted-foreground mb-4 flex items-center gap-2">
                <FiTag className="w-4 h-4 text-primary" /> Promo Code
              </h3>
              <form onSubmit={handleApplyCoupon} className="flex gap-3">
                <input
                  type="text" value={couponInput} onChange={e => setCouponInput(e.target.value)}
                  placeholder="Enter discount code"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/40 font-medium"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit"
                  className="px-6 py-3 rounded-xl font-black text-sm text-white"
                  style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', boxShadow: '0 4px 16px rgba(37,99,235,0.3)' }}
                >
                  Apply
                </motion.button>
              </form>
              {coupon ? (
                <div className="mt-3 flex items-center gap-2 text-emerald-400 text-sm font-bold">
                  <FiZap className="w-4 h-4" /> {coupon.toUpperCase()} — {discount}% off applied!
                </div>
              ) : (
                <p className="mt-2.5 text-xs text-muted-foreground/55">Try: QUANTUM10 · WELCOME15 · SAVE20</p>
              )}
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="grid grid-cols-3 gap-4"
            >
              {[
                { icon: FiTruck,   label: 'Free Shipping', sub: 'Orders over $50' },
                { icon: FiShield,  label: 'Secure Payment', sub: '256-bit SSL' },
                { icon: FiPackage, label: 'Easy Returns',   sub: '30-day policy' },
              ].map(({ icon: Icon, label, sub }) => (
                <motion.div
                  key={label}
                  whileHover={{ y: -3, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="rounded-2xl p-4 text-center cursor-default"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-2">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xs font-black">{label}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right: 3D order summary ── */}
          <motion.div
            initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full lg:w-[360px] xl:w-[400px] flex-shrink-0"
          >
            <div className="sticky top-24" style={{ perspective: '1400px' }}>
              <Card3D>
                <div
                  className="relative rounded-3xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(160deg, rgba(37,99,235,0.14) 0%, rgba(255,255,255,0.03) 100%)',
                    border: '1px solid rgba(59,130,246,0.22)',
                    boxShadow: '0 40px 100px rgba(37,99,235,0.22), 0 12px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.09)',
                  }}
                >
                  {/* glass top sheen */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent z-10" />
                  {/* glow orb */}
                  <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-blue-500/12 blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-indigo-500/8 blur-2xl pointer-events-none" />

                  <div className="relative p-6 sm:p-7">
                    <div className="flex items-center gap-2.5 mb-6">
                      <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                        <FiShoppingBag className="w-4 h-4 text-primary" />
                      </div>
                      <h2 className="text-xl font-black">Order Summary</h2>
                    </div>

                    <div className="space-y-3.5 text-sm font-medium mb-6">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                        <span className="font-bold text-foreground">${subtotal().toFixed(2)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-emerald-400 font-bold">
                          <span>Discount ({discount}%)</span>
                          <span>−${(subtotal() * discount / 100).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-muted-foreground">
                        <span>Shipping</span>
                        <span className={shipping === 0 ? 'text-emerald-400 font-bold' : 'text-foreground font-bold'}>
                          {shipping === 0 ? 'Free' : `PKR ${shipping.toFixed(0)}`}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Tax (8%)</span>
                        <span className="font-bold text-foreground">PKR {tax.toFixed(0)}</span>
                      </div>
                      <div className="h-px bg-white/8 my-1" />
                      <div className="flex justify-between items-baseline">
                        <span className="text-base font-black">Total</span>
                        <span className="text-2xl font-black text-primary">PKR {finalTotal.toFixed(0)}</span>
                      </div>
                    </div>

                    {/* Free shipping progress bar */}
                    {subtotal() < 50 && (
                      <div className="mb-6">
                        <div className="flex justify-between text-xs font-bold text-muted-foreground mb-2">
                          <span className="flex items-center gap-1.5"><FiTruck className="w-3 h-3" /> Free shipping at PKR 50</span>
                          <span className="text-primary">PKR {(50 - subtotal()).toFixed(0)} away</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((subtotal() / 50) * 100, 100)}%` }}
                            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
                            className="h-full rounded-full"
                            style={{ background: 'linear-gradient(90deg,#1d4ed8,#3b82f6)' }}
                          />
                        </div>
                      </div>
                    )}

                    {/* CTA button */}
                    <motion.button
                      onClick={() => setLocation('/checkout')}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 mb-5 relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)',
                        boxShadow: '0 14px 36px rgba(37,99,235,0.5), 0 4px 14px rgba(0,0,0,0.3)',
                      }}
                    >
                      {/* shimmer */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5, ease: 'linear' }}
                      />
                      <span className="relative flex items-center gap-2">
                        Proceed to Checkout <FiArrowRight className="w-4 h-4" />
                      </span>
                    </motion.button>

                    {/* security + payment icons */}
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <FiShield className="w-3.5 h-3.5 text-emerald-400" />
                        Secure checkout · 256-bit SSL encrypted
                      </div>
                      <div className="flex items-center justify-center gap-3 text-[28px] text-muted-foreground/70">
                        <FaCcVisa className="hover:text-foreground transition-colors cursor-default" />
                        <FaCcMastercard className="hover:text-foreground transition-colors cursor-default" />
                        <FaCcAmex className="hover:text-foreground transition-colors cursor-default" />
                        <FaCcPaypal className="hover:text-foreground transition-colors cursor-default" />
                        <FaCcStripe className="hover:text-foreground transition-colors cursor-default" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card3D>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
