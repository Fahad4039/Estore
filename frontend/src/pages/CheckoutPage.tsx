import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../context/AuthContext';
import { useFDStore, FD_TO_PKR } from '../store/fdStore';
import { useOrderStore } from '../store/orderStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  FiCheckCircle, FiShield, FiLock, FiArrowLeft,
  FiArrowRight, FiCreditCard, FiTruck, FiPackage,
  FiMapPin, FiUser, FiPhone, FiMail, FiGlobe, FiTrash2,
  FiPlus, FiMinus, FiDollarSign, FiSmartphone, FiZap,
} from 'react-icons/fi';
import { FaCcPaypal, FaApple, FaBitcoin } from 'react-icons/fa';

/* ─── schema ──────────────────────────────────────────────── */
const addressSchema = z.object({
  firstName: z.string().min(2, 'Required'),
  email:     z.string().email('Invalid email'),
  phone:     z.string().min(7, 'Required'),
  address:   z.string().min(5, 'Required'),
  city:      z.string().min(2, 'Required'),
  state:     z.string().min(2, 'Required'),
  zip:       z.string().min(4, 'Required'),
  country:   z.string().min(2, 'Required'),
});
type AddressFormValues = z.infer<typeof addressSchema>;

/* ─── payment methods (icon-based, no emojis) ────────────── */
type PayMethod = {
  id: string;
  Icon: React.ElementType;
  iconColor: string;
  label: string;
  sub: string;
};

const PAY_METHODS: PayMethod[] = [
  { id: 'fd',     Icon: FiDollarSign,  iconColor: 'text-amber-400',  label: 'FD Wallet',           sub: 'Pay with your FD Coins balance' },
  { id: 'card',   Icon: FiCreditCard,  iconColor: 'text-blue-400',   label: 'Credit / Debit Card', sub: 'Visa, Mastercard, AMEX, Discover' },
  { id: 'paypal', Icon: FaCcPaypal,    iconColor: 'text-blue-500',   label: 'PayPal',              sub: 'Pay securely with PayPal' },
  { id: 'apple',  Icon: FaApple,       iconColor: 'text-foreground', label: 'Apple Pay',           sub: 'Touch ID fast checkout' },
  { id: 'google', Icon: FiSmartphone,  iconColor: 'text-foreground', label: 'Google Pay',          sub: 'Pay with Google account' },
  { id: 'crypto', Icon: FaBitcoin,     iconColor: 'text-amber-500',  label: 'Bitcoin / Crypto',   sub: 'Pay with cryptocurrency' },
  { id: 'cod',    Icon: FiPackage,     iconColor: 'text-emerald-400',label: 'Cash on Delivery',   sub: 'Pay when order arrives' },
];

/* ─── tiny helpers ───────────────────────────────────────── */
const inputCls =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/60 focus:bg-white/8 focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/40';

const Field: React.FC<{ label: string; icon?: React.ReactNode; error?: string; children: React.ReactNode }> = ({
  label, icon, error, children,
}) => (
  <div>
    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
    <div className={`relative ${icon ? '[&>input]:pl-10 [&>select]:pl-10' : ''}`}>
      {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none">{icon}</span>}
      {children}
    </div>
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
  </div>
);

/* ─── live card preview (all blue, no purple) ────────────── */
const CardPreview: React.FC<{ number: string; name: string; expiry: string }> = ({ number, name, expiry }) => {
  const raw = (number.replace(/\s/g, '') + '################').slice(0, 16);
  const g = [raw.slice(0,4), raw.slice(4,8), raw.slice(8,12), raw.slice(12,16)];
  return (
    <div className="relative w-full max-w-xs mx-auto rounded-2xl overflow-hidden p-6 select-none"
      style={{
        background: 'linear-gradient(135deg,#0f2d8c 0%,#1d4ed8 45%,#3b82f6 100%)',
        boxShadow: '0 24px 60px rgba(37,99,235,0.55), 0 8px 24px rgba(0,0,0,0.4)',
        aspectRatio: '1.586/1',
      }}>
      <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-300/10 rounded-full blur-xl pointer-events-none" />
      <div className="relative flex flex-col h-full justify-between">
        <div className="flex items-start justify-between">
          <div className="w-8 h-5 rounded-sm" style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)' }} />
          <p className="text-white font-black text-sm">ESTORE Premium</p>
        </div>
        <p className="font-mono text-lg sm:text-xl font-bold text-white tracking-[0.2em] text-center">
          {g.map((x, i) => <span key={i}>{x.includes('#') ? '••••' : x}{i < 3 ? ' ' : ''}</span>)}
        </p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white/40 text-[9px] uppercase tracking-widest">Card Holder</p>
            <p className="font-bold text-white text-sm truncate max-w-[130px]">{name || 'YOUR NAME'}</p>
          </div>
          <div className="text-right">
            <p className="text-white/40 text-[9px] uppercase tracking-widest">Expires</p>
            <p className="font-bold text-white text-sm">{expiry || 'MM/YY'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── main ───────────────────────────────────────────────── */
const CheckoutPage: React.FC = () => {
  const { items, total, subtotal, discount, clearCart, removeItem, updateQuantity } = useCartStore();
  const addOrder = useOrderStore((s) => s.addOrder);
  const [, setLocation] = useLocation();
  const { currentUser } = useAuth();
  const { coins } = useFDStore();

  const [step, setStep]           = useState<1 | 2 | 3>(1);
  const [orderId, setOrderId]     = useState('');
  const [paying, setPaying]       = useState(false);
  const [payMethod, setPayMethod] = useState('card');

  const [cardNum,    setCardNum]    = useState('');
  const [cardName,   setCardName]   = useState('');
  const [cardExpiry, setCardExpiry] = useState('');

  const shipping    = subtotal() > 50 ? 0 : 9.99;
  const tax         = subtotal() * 0.08;
  const finalTotal  = total() + shipping + tax;
  const fdNeeded    = Math.ceil(finalTotal / FD_TO_PKR);
  const hasEnoughFD = coins >= fdNeeded;

  const { register, handleSubmit, formState: { errors } } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { email: currentUser?.email || '' },
  });

  useEffect(() => {
    if (items.length === 0 && step !== 3) setLocation('/cart');
  }, [items.length, step]);

  if (items.length === 0 && step !== 3) return null;

  const onAddressSubmit = () => { setStep(2); window.scrollTo(0, 0); };
  const processPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaying(true);
    setTimeout(() => {
      const id = `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      setOrderId(id);
      addOrder({
        id,
        items: items.map((it) => ({
          id: it.id, name: it.name, brand: it.brand,
          price: it.price, images: it.images,
          quantity: it.quantity, category: it.category,
        })),
        total: finalTotal,
        date: new Date().toISOString(),
      });
      setStep(3); clearCart(); setPaying(false); window.scrollTo(0, 0);
    }, 2000);
  };

  const STEPS = [
    { num: 1, label: 'Shipping', icon: FiTruck },
    { num: 2, label: 'Payment',  icon: FiCreditCard },
    { num: 3, label: 'Done',     icon: FiCheckCircle },
  ];

  /* ── guest gate ── */
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 22 }}
          className="w-full max-w-sm text-center"
        >
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
            <div className="relative w-24 h-24 rounded-3xl bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto">
              <FiLock className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-black mb-2">Sign in to checkout</h1>
          <p className="text-muted-foreground text-sm mb-1">You need an account to place an order.</p>
          <p className="text-muted-foreground/50 text-xs mb-8">
            Don't worry — browsing &amp; adding to cart is always free, no login needed!
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/register">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 text-base"
                style={{ background: 'linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)', boxShadow: '0 8px 24px rgba(59,130,246,0.4)' }}
              >
                <FiUser className="w-4 h-4" /> Create Account
              </motion.button>
            </Link>
            <Link href="/login">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="w-full py-4 rounded-2xl font-bold border border-white/15 hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
              >
                <FiArrowRight className="w-4 h-4" /> Sign In
              </motion.button>
            </Link>
            <button onClick={() => setLocation('/cart')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors mt-1 flex items-center justify-center gap-1"
            >
              <FiArrowLeft className="w-3.5 h-3.5" /> Back to Cart
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── order sidebar ── */
  const OrderSidebar = () => (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden sticky top-24"
      style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.15)' }}>
      <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
        <FiPackage className="w-4 h-4 text-primary" />
        <h3 className="font-black text-sm">Order Summary</h3>
        <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
        {items.map(item => (
          <motion.div key={item.id} layout className="flex gap-3 p-4 group">
            <Link href={`/product/${item.id}`}>
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 ring-1 ring-white/10 cursor-pointer hover:ring-primary/40 transition-all">
                <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/product/${item.id}`}>
                <p className="text-xs font-bold leading-tight line-clamp-2 hover:text-primary transition-colors cursor-pointer">{item.name}</p>
              </Link>
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center gap-1 bg-white/6 border border-white/10 rounded-lg p-0.5">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}
                    className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-colors">
                    <FiMinus className="w-2.5 h-2.5" />
                  </button>
                  <span className="w-5 text-center text-xs font-black">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock}
                    className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-colors">
                    <FiPlus className="w-2.5 h-2.5" />
                  </button>
                </div>
                <button onClick={() => removeItem(item.id)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <FiTrash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            <p className="font-black text-xs text-primary flex-shrink-0 pt-0.5">PKR {(item.price * item.quantity).toFixed(0)}</p>
          </motion.div>
        ))}
      </div>

      <div className="px-5 py-4 border-t border-white/8 space-y-2.5 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span><span>PKR {subtotal().toFixed(0)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-emerald-400 font-bold">
            <span>Discount</span><span>−PKR {(subtotal() * discount / 100).toFixed(0)}</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span>
          <span className={shipping === 0 ? 'text-emerald-400 font-bold' : ''}>{shipping === 0 ? 'Free' : `PKR ${shipping.toFixed(0)}`}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Tax (8%)</span><span>PKR {tax.toFixed(0)}</span>
        </div>
        <div className="h-px bg-white/8" />
        <div className="flex justify-between text-lg font-black">
          <span>Total</span><span className="text-primary">PKR {finalTotal.toFixed(0)}</span>
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-2.5">
          <FiShield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-emerald-400">Secure Checkout</p>
            <p className="text-[10px] text-muted-foreground">256-bit SSL · PCI DSS compliant</p>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── step 3 success ── */
  if (step === 3) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 220 }} className="w-full max-w-lg text-center">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <motion.div animate={{ opacity: 1, scale: 1 }} initial={{ scale: 0, opacity: 0 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="absolute inset-0 rounded-full bg-emerald-500/15" />
            <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.15, 1] }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="absolute inset-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <FiCheckCircle className="w-14 h-14 text-emerald-400" />
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, rotate: 360 }}
              transition={{ delay: 0.3, rotate: { duration: 8, repeat: Infinity, ease: 'linear' } }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/30" />
          </div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <h1 className="text-4xl font-black mb-2">Order Placed!</h1>
            <p className="text-muted-foreground mb-2">Thank you for shopping with ESTORE Premium.</p>
            <div className="inline-block bg-primary/15 border border-primary/30 rounded-xl px-5 py-2 mb-8">
              <p className="text-xs text-muted-foreground">Order ID</p>
              <p className="font-black text-primary text-lg">{orderId}</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-8 text-left space-y-4">
            {[
              { icon: FiMail,    text: 'Confirmation email sent to your inbox' },
              { icon: FiTruck,   text: 'We\'ll notify you once your items ship' },
              { icon: FiPackage, text: 'Track your order from your dashboard' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => setLocation('/account/orders')}
              className="flex-1 py-4 border border-white/15 rounded-xl font-bold hover:bg-white/5 transition-colors">
              View Order
            </button>
            <button onClick={() => setLocation('/shop')}
              className="flex-1 py-4 rounded-xl font-black text-white"
              style={{ background: 'linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)', boxShadow: '0 8px 24px rgba(37,99,235,0.4)' }}>
              Continue Shopping
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  /* ── main layout ── */
  return (
    <div className="min-h-screen bg-background">
      {/* NO purple line — removed */}
      <div className="container mx-auto px-4 py-8 sm:py-12">

        {/* header + stepper */}
        <div className="max-w-5xl mx-auto mb-10">
          <h1 className="text-2xl sm:text-3xl font-black text-center mb-8">Checkout</h1>
          <div className="flex items-center justify-center gap-0">
            {STEPS.map((s, i) => {
              const done = step > s.num; const cur = step === s.num;
              const Icon = s.icon;
              return (
                <React.Fragment key={s.num}>
                  <div className="flex flex-col items-center gap-2 min-w-[72px]">
                    <motion.div
                      animate={{
                        background: done ? '#2563eb' : cur ? 'linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)' : 'rgba(255,255,255,0.05)',
                        borderColor: done || cur ? '#3b82f6' : 'rgba(255,255,255,0.12)',
                        boxShadow: cur ? '0 0 20px rgba(59,130,246,0.5)' : 'none',
                      }}
                      className="w-11 h-11 rounded-full border-2 flex items-center justify-center"
                    >
                      {done ? <FiCheckCircle className="w-5 h-5 text-white" />
                            : <Icon className={`w-5 h-5 ${cur ? 'text-white' : 'text-muted-foreground'}`} />}
                    </motion.div>
                    <span className={`text-xs font-bold ${cur ? 'text-foreground' : done ? 'text-primary' : 'text-muted-foreground'}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 mb-5 mx-1 overflow-hidden rounded-full bg-white/10">
                      <motion.div animate={{ width: step > s.num ? '100%' : '0%' }}
                        transition={{ duration: 0.5, ease: 'easeOut' }} className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg,#1d4ed8,#3b82f6)' }} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">

          {/* ── form area ── */}
          <div className="w-full lg:flex-1 min-w-0">
            <AnimatePresence mode="wait">

              {/* ── STEP 1: Shipping ── */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <FiMapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black">Shipping Address</h2>
                      <p className="text-xs text-muted-foreground">Where should we deliver?</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit(onAddressSubmit)}
                    className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-5">

                    <Field label="First Name" icon={<FiUser className="w-4 h-4" />} error={errors.firstName?.message}>
                      <input {...register('firstName')} placeholder="e.g. Pocho" className={inputCls} />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Field label="Email" icon={<FiMail className="w-4 h-4" />} error={errors.email?.message}>
                        <input type="email" {...register('email')} placeholder="you@example.com" className={inputCls} />
                      </Field>
                      <Field label="Phone" icon={<FiPhone className="w-4 h-4" />} error={errors.phone?.message}>
                        <input {...register('phone')} placeholder="+92 300 000 0000" className={inputCls} />
                      </Field>
                    </div>

                    <Field label="Street Address" icon={<FiMapPin className="w-4 h-4" />} error={errors.address?.message}>
                      <input {...register('address')} placeholder="House / Street / Area" className={inputCls} />
                    </Field>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="col-span-2">
                        <Field label="City" error={errors.city?.message}>
                          <input {...register('city')} placeholder="Karachi" className={inputCls} />
                        </Field>
                      </div>
                      <div className="col-span-1">
                        <Field label="Province" error={errors.state?.message}>
                          <input {...register('state')} placeholder="Sindh" className={inputCls} />
                        </Field>
                      </div>
                      <div className="col-span-1">
                        <Field label="ZIP" error={errors.zip?.message}>
                          <input {...register('zip')} placeholder="75400" className={inputCls} />
                        </Field>
                      </div>
                    </div>

                    <Field label="Country" icon={<FiGlobe className="w-4 h-4" />} error={errors.country?.message}>
                      <select {...register('country')} className={inputCls + ' cursor-pointer'}>
                        <option value="PK">Pakistan</option>
                        <option value="AE">UAE</option>
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="UK">United Kingdom</option>
                        <option value="AU">Australia</option>
                      </select>
                    </Field>

                    {subtotal() >= 50 && (
                      <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-4 py-3">
                        <FiTruck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <p className="text-sm text-emerald-400 font-bold">You qualify for free shipping!</p>
                      </div>
                    )}

                    <button type="submit"
                      className="w-full py-4 rounded-xl font-black text-white flex items-center justify-center gap-2 mt-2"
                      style={{ background: 'linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)', boxShadow: '0 8px 24px rgba(37,99,235,0.35)' }}>
                      Continue to Payment <FiArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ── STEP 2: Payment ── */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.25 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setStep(1)}
                      className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                      <FiArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h2 className="text-xl font-black">Payment Method</h2>
                      <p className="text-xs text-muted-foreground">Select how you'd like to pay</p>
                    </div>
                  </div>

                  <form onSubmit={processPayment} className="space-y-5">

                    {/* payment method selector */}
                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
                      {PAY_METHODS.map((m) => {
                        const isFD  = m.id === 'fd';
                        const active = payMethod === m.id;
                        const Icon = m.Icon;
                        return (
                          <motion.button
                            key={m.id} type="button" whileTap={{ scale: 0.98 }}
                            onClick={() => setPayMethod(m.id)}
                            className={`w-full flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-all ${
                              active
                                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                                : 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/5'
                            }`}
                          >
                            {/* radio dot */}
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              active ? 'border-primary' : 'border-white/25'}`}>
                              {active && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                            </div>
                            {/* icon */}
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              active ? 'bg-primary/20' : 'bg-white/5'
                            }`}>
                              <Icon className={`w-5 h-5 ${m.iconColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm leading-tight">{m.label}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {isFD ? `Balance: ${coins.toLocaleString()} FD ≈ ₨${(coins * FD_TO_PKR).toFixed(0)} PKR` : m.sub}
                              </p>
                            </div>
                            {isFD && (
                              <span className={`text-xs font-black px-2 py-1 rounded-lg flex-shrink-0 ${
                                hasEnoughFD ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                {hasEnoughFD ? '✓ Sufficient' : '✗ Insufficient'}
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* FD wallet details */}
                    <AnimatePresence>
                      {payMethod === 'fd' && (
                        <motion.div key="fd-panel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-widest">FD Wallet Balance</p>
                                <p className="text-3xl font-black text-primary">{coins.toLocaleString()} FD</p>
                                <p className="text-sm text-muted-foreground">≈ ₨{(coins * FD_TO_PKR).toFixed(0)} PKR</p>
                              </div>
                              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                                <FiDollarSign className="w-7 h-7 text-amber-400" />
                              </div>
                            </div>
                            <div className="h-px bg-white/8" />
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Required for this order</span>
                              <span className={`font-black ${hasEnoughFD ? 'text-emerald-400' : 'text-red-400'}`}>
                                {fdNeeded.toLocaleString()} FD
                              </span>
                            </div>
                            {!hasEnoughFD && (
                              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                <p className="text-sm text-red-400 font-bold mb-1">Insufficient Balance</p>
                                <p className="text-xs text-muted-foreground mb-3">
                                  You need {(fdNeeded - coins).toLocaleString()} more FD Coins to pay with wallet.
                                </p>
                                <Link href="/top-up">
                                  <button type="button"
                                    className="text-xs font-black px-4 py-2 rounded-xl text-white"
                                    style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)' }}>
                                    Top Up Balance
                                  </button>
                                </Link>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* card form */}
                    <AnimatePresence>
                      {payMethod === 'card' && (
                        <motion.div key="card-panel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="space-y-5">
                            <CardPreview number={cardNum} name={cardName} expiry={cardExpiry} />
                            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
                              <div className="flex items-center justify-between pb-1">
                                {/* Stripe blue instead of purple */}
                                <div className="flex items-center gap-2 text-blue-400">
                                  <FiLock className="w-4 h-4" />
                                  <span className="font-black text-sm">Secured by Stripe</span>
                                </div>
                                <div className="flex gap-1.5">
                                  {['VISA','MC','AMEX'].map(b => (
                                    <span key={b} className="text-[9px] font-black bg-white/8 border border-white/10 px-1.5 py-0.5 rounded text-muted-foreground">{b}</span>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Card Number</label>
                                <div className="relative">
                                  <FiCreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
                                  <input required placeholder="0000 0000 0000 0000" maxLength={19} value={cardNum}
                                    onChange={e => { const r = e.target.value.replace(/\D/g,'').slice(0,16); setCardNum(r.replace(/(.{4})/g,'$1 ').trim()); }}
                                    className={inputCls + ' pl-10 font-mono tracking-widest'} />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Expiry</label>
                                  <input required placeholder="MM / YY" maxLength={7} value={cardExpiry}
                                    onChange={e => { const r = e.target.value.replace(/\D/g,'').slice(0,4); setCardExpiry(r.length>2?r.slice(0,2)+' / '+r.slice(2):r); }}
                                    className={inputCls + ' font-mono'} />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">CVC</label>
                                  <input required placeholder="•••" maxLength={4} type="password" className={inputCls + ' font-mono tracking-widest'} />
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Name on Card</label>
                                <input required placeholder="JOHN DOE" value={cardName}
                                  onChange={e => setCardName(e.target.value.toUpperCase())}
                                  className={inputCls + ' uppercase font-bold tracking-wider'} />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* non-card / non-FD info panels */}
                    <AnimatePresence>
                      {!['card','fd'].includes(payMethod) && (
                        <motion.div key="other-panel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          {(() => {
                            const pm = PAY_METHODS.find(m => m.id === payMethod);
                            if (!pm) return null;
                            const PMIcon = pm.Icon;
                            return (
                              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                                  <PMIcon className={`w-8 h-8 ${pm.iconColor}`} />
                                </div>
                                <p className="font-bold">{pm.label}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  You'll be redirected to complete payment securely after clicking Place Order.
                                </p>
                              </div>
                            );
                          })()}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* pay button — all blue, no purple */}
                    <motion.button type="submit"
                      disabled={paying || (payMethod === 'fd' && !hasEnoughFD)}
                      whileHover={!paying ? { scale: 1.01 } : {}} whileTap={!paying ? { scale: 0.98 } : {}}
                      className="w-full py-4 rounded-xl font-black text-white text-base flex items-center justify-center gap-2 mt-2 transition-all disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)',
                        boxShadow: paying ? 'none' : '0 8px 28px rgba(37,99,235,0.5)',
                      }}>
                      {paying ? (
                        <>
                          <motion.div animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                          Processing…
                        </>
                      ) : payMethod === 'fd' ? (
                        <><FiDollarSign className="w-4 h-4" /> Pay {fdNeeded.toLocaleString()} FD Coins</>
                      ) : (
                        <><FiLock className="w-4 h-4" /> Pay PKR {finalTotal.toFixed(0)}</>
                      )}
                    </motion.button>

                    <p className="text-center text-xs text-muted-foreground">
                      By completing your purchase you agree to our{' '}
                      <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>
                    </p>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── right: order summary ── */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <OrderSidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
