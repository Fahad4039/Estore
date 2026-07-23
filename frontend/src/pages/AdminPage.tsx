import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  FiGrid, FiPackage, FiShoppingBag, FiUsers, FiTrendingUp, FiSettings,
  FiSearch, FiBell, FiLogOut, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight,
  FiChevronDown, FiChevronUp, FiCheck, FiX, FiFilter, FiDownload,
  FiDollarSign, FiStar, FiAlertCircle, FiRefreshCw, FiPlus, FiEye,
  FiZap, FiAward, FiTag, FiBarChart2, FiMenu, FiArrowUp, FiArrowDown,
  FiImage, FiDroplet,
} from 'react-icons/fi';
import { products as ALL_PRODUCTS, Product } from '../data/products';
import { useProductStore } from '../store/productStore';
import { useOrderStore, Order, OrderStatus } from '../store/orderStore';
import { useLocation } from 'wouter';

// ─── Colour palette ────────────────────────────────────────────────────────────
const C = {
  primary:  '#6366f1',
  emerald:  '#10b981',
  rose:     '#f43f5e',
  amber:    '#f59e0b',
  cyan:     '#06b6d4',
  violet:   '#8b5cf6',
  bg:       '#0a0a0f',
  surface:  '#12121a',
  card:     '#1a1a26',
  border:   'rgba(255,255,255,0.07)',
  muted:    'rgba(255,255,255,0.45)',
};

// ─── Mock data generators ──────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const revenueData = MONTHS.map((m, i) => ({
  month: m,
  revenue: 40000 + Math.sin(i * 0.8) * 15000 + i * 3200 + (i === 10 ? 25000 : 0),
  orders:  120 + Math.floor(Math.sin(i) * 40) + i * 8,
}));

const categoryData = [
  { name: 'Electronics', value: 38, color: C.primary },
  { name: 'Fashion',     value: 22, color: C.emerald },
  { name: 'Audio',       value: 15, color: C.amber },
  { name: 'Gaming',      value: 12, color: C.violet },
  { name: 'Others',      value: 13, color: C.cyan },
];

const MOCK_USERS = [
  { id: 'u1', name: 'Ali Hassan',     email: 'ali@example.com',   joined: '2025-01-12', orders: 14, spent: 82400, status: 'active' },
  { id: 'u2', name: 'Sara Khan',      email: 'sara@example.com',  joined: '2025-03-08', orders:  7, spent: 31200, status: 'active' },
  { id: 'u3', name: 'Umar Farooq',   email: 'umar@example.com',  joined: '2025-05-22', orders:  3, spent: 12800, status: 'inactive' },
  { id: 'u4', name: 'Ayesha Malik',   email: 'ayesh@example.com', joined: '2025-06-01', orders: 21, spent: 145000, status: 'active' },
  { id: 'u5', name: 'Bilal Ahmed',    email: 'bilal@example.com', joined: '2025-07-10', orders:  1, spent: 3200, status: 'active' },
];

const MOCK_ORDERS: Order[] = [
  { id: 'ORD-4821', items: [{ id: ALL_PRODUCTS[0].id, name: ALL_PRODUCTS[0].name, brand: ALL_PRODUCTS[0].brand, price: ALL_PRODUCTS[0].price, images: ALL_PRODUCTS[0].images, quantity: 2, category: ALL_PRODUCTS[0].category }], total: ALL_PRODUCTS[0].price * 2, status: 'pending',    date: '2026-07-20' },
  { id: 'ORD-4820', items: [{ id: ALL_PRODUCTS[1].id, name: ALL_PRODUCTS[1].name, brand: ALL_PRODUCTS[1].brand, price: ALL_PRODUCTS[1].price, images: ALL_PRODUCTS[1].images, quantity: 1, category: ALL_PRODUCTS[1].category }], total: ALL_PRODUCTS[1].price,     status: 'processing', date: '2026-07-19' },
  { id: 'ORD-4819', items: [{ id: ALL_PRODUCTS[2].id, name: ALL_PRODUCTS[2].name, brand: ALL_PRODUCTS[2].brand, price: ALL_PRODUCTS[2].price, images: ALL_PRODUCTS[2].images, quantity: 3, category: ALL_PRODUCTS[2].category }], total: ALL_PRODUCTS[2].price * 3, status: 'shipped',    date: '2026-07-18' },
  { id: 'ORD-4818', items: [{ id: ALL_PRODUCTS[3].id, name: ALL_PRODUCTS[3].name, brand: ALL_PRODUCTS[3].brand, price: ALL_PRODUCTS[3].price, images: ALL_PRODUCTS[3].images, quantity: 1, category: ALL_PRODUCTS[3].category }], total: ALL_PRODUCTS[3].price,     status: 'delivered',  date: '2026-07-17' },
  { id: 'ORD-4817', items: [{ id: ALL_PRODUCTS[4].id, name: ALL_PRODUCTS[4].name, brand: ALL_PRODUCTS[4].brand, price: ALL_PRODUCTS[4].price, images: ALL_PRODUCTS[4].images, quantity: 2, category: ALL_PRODUCTS[4].category }], total: ALL_PRODUCTS[4].price * 2, status: 'delivered',  date: '2026-07-16' },
  { id: 'ORD-4816', items: [{ id: ALL_PRODUCTS[5].id, name: ALL_PRODUCTS[5].name, brand: ALL_PRODUCTS[5].brand, price: ALL_PRODUCTS[5].price, images: ALL_PRODUCTS[5].images, quantity: 1, category: ALL_PRODUCTS[5].category }], total: ALL_PRODUCTS[5].price,     status: 'pending',    date: '2026-07-15' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
const pkr = (n: number) => `PKR ${Math.round(n).toLocaleString()}`;

const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pending',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  processing: { label: 'Processing', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  shipped:    { label: 'Shipped',    color: '#06b6d4', bg: 'rgba(6,182,212,0.12)'  },
  delivered:  { label: 'Delivered',  color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  cancelled:  { label: 'Cancelled',  color: '#f43f5e', bg: 'rgba(244,63,94,0.12)'  },
};

const CATEGORIES: Product['category'][] = [
  'Electronics', 'Fashion', 'Audio', 'Gaming', 'Sports', 'Beauty', 'Kitchen', 'Home', 'Digital',
];

// ─── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, trend }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string; trend?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend !== undefined && (
          <span className="flex items-center gap-1 text-xs font-bold" style={{ color: trend >= 0 ? C.emerald : C.rose }}>
            {trend >= 0 ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-xs font-semibold mt-0.5" style={{ color: C.muted }}>{label}</p>
      </div>
      {sub && <p className="text-xs" style={{ color: C.muted }}>{sub}</p>}
    </motion.div>
  );
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-lg font-black text-white">{children}</h2>
      {action}
    </div>
  );
}

// ─── Section: Overview ─────────────────────────────────────────────────────────
function OverviewSection() {
  const { orders: storeOrders } = useOrderStore();
  const { products } = useProductStore();
  const orders = [...MOCK_ORDERS, ...storeOrders];
  const totalRevenue  = orders.reduce((s, o) => s + o.total, 0) + 2840000;
  const totalOrders   = orders.length + 1482;
  const totalProducts = products.length;
  const totalUsers    = MOCK_USERS.length + 3814;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiDollarSign} label="Total Revenue"   value={pkr(totalRevenue)}  color={C.emerald} trend={18.4} sub="vs last month" />
        <StatCard icon={FiShoppingBag} label="Total Orders"   value={totalOrders.toLocaleString()} color={C.primary} trend={7.2} />
        <StatCard icon={FiPackage}     label="Products"       value={totalProducts.toString()}     color={C.amber}   sub={`${products.filter(p=>p.stock<10).length} low stock`} />
        <StatCard icon={FiUsers}       label="Customers"      value={totalUsers.toLocaleString()}  color={C.cyan}    trend={12.1} />
      </div>

      <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <SectionTitle>Revenue & Orders — 2026</SectionTitle>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={C.primary} stopOpacity={0.35} />
                <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, color: '#fff', fontSize: 12 }}
              formatter={(v: number) => [pkr(v), 'Revenue']} />
            <Area type="monotone" dataKey="revenue" stroke={C.primary} strokeWidth={2.5}
              fill="url(#revGrad)" dot={false} activeDot={{ r: 5, fill: C.primary }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <SectionTitle>Sales by Category</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                paddingAngle={4} dataKey="value">
                {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Legend iconType="circle" iconSize={8}
                formatter={(v) => <span style={{ color: C.muted, fontSize: 11 }}>{v}</span>} />
              <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => [`${v}%`, '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <SectionTitle>Top Products</SectionTitle>
          <div className="space-y-3">
            {products.filter(p => p.isBestSeller || p.isFeatured).slice(0, 5).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-xs font-black w-4" style={{ color: i < 3 ? C.amber : C.muted }}>#{i+1}</span>
                <img src={p.images[0]} alt={p.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{p.name}</p>
                  <p className="text-[10px]" style={{ color: C.muted }}>{p.brand}</p>
                </div>
                <span className="text-xs font-black" style={{ color: C.emerald }}>{pkr(p.price)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <SectionTitle>Recent Orders</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Order ID','Product','Date','Amount','Status'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-bold" style={{ color: C.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_ORDERS.slice(0,5).map(o => {
                const sm = STATUS_META[o.status];
                return (
                  <tr key={o.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td className="py-3 px-3 font-mono text-xs font-bold text-white">{o.id}</td>
                    <td className="py-3 px-3 text-xs text-white truncate max-w-[140px]">{o.items[0]?.name}</td>
                    <td className="py-3 px-3 text-xs" style={{ color: C.muted }}>{o.date}</td>
                    <td className="py-3 px-3 text-xs font-black" style={{ color: C.emerald }}>{pkr(o.total)}</td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ color: sm.color, background: sm.bg }}>{sm.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Product Edit Modal ────────────────────────────────────────────────────────
const EMPTY_PRODUCT: Omit<Product, 'id'> = {
  name: '', brand: '', category: 'Electronics',
  price: 0, originalPrice: 0, discount: 0,
  rating: 4.5, reviewCount: 0,
  description: '', shortDescription: '',
  specifications: { Brand: '', Condition: 'New', Warranty: '1 Year' },
  images: [], colors: [], sizes: [], icon: '',
  stock: 10,
  isNew: false, isFeatured: false, isFlashSale: false, isBestSeller: false, isTrending: false,
  tags: [],
  deliveryDays: 3,
  sellerId: '',
  sellerName: '',
};

function FieldRow({ label, required, children, error }: {
  label: string; required?: boolean; children: React.ReactNode; error?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold mb-1.5 block" style={{ color: C.muted }}>
        {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[10px] text-rose-400 mt-1">{error}</p>}
    </div>
  );
}

function TInput({ value, onChange, type = 'text', placeholder, step, min, max }: {
  value: string | number; onChange: (v: string) => void; type?: string;
  placeholder?: string; step?: string; min?: number; max?: number;
}) {
  const [focused, setFocused] = React.useState(false);
  return (
    <input
      type={type} value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      step={step} min={min} max={max}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-all"
      style={{ background: C.bg, border: `1px solid ${focused ? C.primary : C.border}` }}
    />
  );
}

function TTextarea({ value, onChange, rows = 3, placeholder }: {
  value: string; onChange: (v: string) => void; rows?: number; placeholder?: string;
}) {
  const [focused, setFocused] = React.useState(false);
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows} placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none resize-none transition-all"
      style={{ background: C.bg, border: `1px solid ${focused ? C.primary : C.border}` }}
    />
  );
}

function SectionBar({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: color }} />
      <h3 className="text-xs font-black text-white uppercase tracking-wider">{children}</h3>
    </div>
  );
}

function ProductEditModal({ product, onSave, onClose }: {
  product: Product | null;
  onSave: (p: Product) => void;
  onClose: () => void;
}) {
  const isNew = !product?.id;
  const [form, setForm] = React.useState<Product>(
    product ? { ...product } : { id: `prod_${Date.now()}`, ...EMPTY_PRODUCT }
  );
  const [newImageUrl, setNewImageUrl] = React.useState('');
  const [newColor, setNewColor]       = React.useState('');
  const [newSize, setNewSize]         = React.useState('');
  const [newTag, setNewTag]           = React.useState('');
  const [newSpecKey, setNewSpecKey]   = React.useState('');
  const [newSpecVal, setNewSpecVal]   = React.useState('');
  const [errors, setErrors]           = React.useState<Record<string, string>>({});

  const set = <K extends keyof Product>(key: K, value: Product[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim())    errs.name   = 'Name is required';
    if (!form.brand.trim())   errs.brand  = 'Brand is required';
    if (form.price <= 0)      errs.price  = 'Must be > 0';
    if (form.images.length === 0) errs.images = 'At least one image required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  const BADGE_DEFS = [
    { key: 'isNew'        as keyof Product, label: '🆕 New',         color: C.cyan    },
    { key: 'isFeatured'   as keyof Product, label: '⭐ Featured',      color: C.primary },
    { key: 'isFlashSale'  as keyof Product, label: '⚡ Flash Sale',    color: C.amber   },
    { key: 'isBestSeller' as keyof Product, label: '🏆 Best Seller',   color: C.emerald },
    { key: 'isTrending'   as keyof Product, label: '🔥 Trending',      color: C.rose    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 pb-6 px-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{ background: C.surface, border: `1px solid ${C.border}` }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
          style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: isNew ? `${C.emerald}22` : `${C.primary}22` }}>
              {isNew
                ? <FiPlus className="w-4 h-4" style={{ color: C.emerald }} />
                : <FiEdit2 className="w-4 h-4" style={{ color: C.primary }} />}
            </div>
            <h2 className="text-sm font-black text-white">
              {isNew ? 'Add New Product' : `Edit: ${form.name || 'Product'}`}
            </h2>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10">
            <FiX className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-7">

          {/* ── Basic Info ── */}
          <section>
            <SectionBar color={C.primary}>Basic Info</SectionBar>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <FieldRow label="Product Name" required error={errors.name}>
                  <TInput value={form.name} onChange={v => set('name', v)} placeholder="e.g. iPhone 15 Pro Max" />
                </FieldRow>
              </div>
              <FieldRow label="Brand" required error={errors.brand}>
                <TInput value={form.brand} onChange={v => set('brand', v)} placeholder="e.g. Apple" />
              </FieldRow>
              <FieldRow label="Category" required>
                <select value={form.category} onChange={e => set('category', e.target.value as Product['category'])}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FieldRow>
              <div className="col-span-2">
                <FieldRow label="Icon (emoji or symbol)">
                  <TInput value={form.icon || ''} onChange={v => set('icon', v)} placeholder="e.g. 📱 or ⌚" />
                </FieldRow>
              </div>
            </div>
            <div className="space-y-4">
              <FieldRow label="Short Description">
                <TTextarea value={form.shortDescription || ''} onChange={v => set('shortDescription', v)}
                  rows={2} placeholder="Brief 1-2 line summary shown on cards…" />
              </FieldRow>
              <FieldRow label="Full Description">
                <TTextarea value={form.description} onChange={v => set('description', v)}
                  rows={4} placeholder="Detailed product description…" />
              </FieldRow>
            </div>
          </section>

          {/* ── Images ── */}
          <section>
            <SectionBar color={C.cyan}>
              Images
              {errors.images && <span className="text-[10px] text-rose-400 font-normal ml-2 normal-case">{errors.images}</span>}
            </SectionBar>
            {form.images.length > 0 && (
              <div className="space-y-2 mb-3">
                {form.images.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <img src={url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40/1a1a26/6366f1?text=Img'; }} />
                    <span className="flex-1 text-[11px] truncate" style={{ color: C.muted }}>{url}</span>
                    <button onClick={() => set('images', form.images.filter((_, j) => j !== i))}
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{ background: 'rgba(244,63,94,0.15)' }}>
                      <FiX className="w-3 h-3 text-rose-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <TInput value={newImageUrl} onChange={setNewImageUrl} placeholder="https://... paste image URL" />
              <button
                onClick={() => { if (!newImageUrl.trim()) return; set('images', [...form.images, newImageUrl.trim()]); setNewImageUrl(''); }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white whitespace-nowrap flex-shrink-0 transition-opacity hover:opacity-90"
                style={{ background: C.cyan }}>
                + Add
              </button>
            </div>
          </section>

          {/* ── Colors ── */}
          <section>
            <SectionBar color={C.violet}>Colors / Variants</SectionBar>
            {(form.colors ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {(form.colors ?? []).map((c, i) => (
                  <div key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                    style={{ background: `${C.violet}18`, color: C.violet, border: `1px solid ${C.violet}44` }}>
                    {c}
                    <button onClick={() => set('colors', (form.colors ?? []).filter((_, j) => j !== i))}>
                      <FiX className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <TInput value={newColor} onChange={setNewColor} placeholder="e.g. Midnight Black" />
              <button
                onClick={() => { if (!newColor.trim()) return; set('colors', [...(form.colors ?? []), newColor.trim()]); setNewColor(''); }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white whitespace-nowrap flex-shrink-0 transition-opacity hover:opacity-90"
                style={{ background: C.violet }}>
                + Add
              </button>
            </div>
          </section>

          {/* ── Pricing ── */}
          <section>
            <SectionBar color={C.emerald}>Pricing</SectionBar>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <FieldRow label="Sale Price (PKR)" required error={errors.price}>
                <TInput type="number" value={form.price} onChange={v => set('price', +v)} min={0} />
              </FieldRow>
              <FieldRow label="Original Price">
                <TInput type="number" value={form.originalPrice} onChange={v => set('originalPrice', +v)} min={0} />
              </FieldRow>
              <FieldRow label="Discount %">
                <TInput type="number" value={form.discount} onChange={v => set('discount', +v)} min={0} max={99} />
              </FieldRow>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FieldRow label="Rating (0–5)">
                <TInput type="number" value={form.rating} onChange={v => set('rating', +v)} min={0} max={5} step="0.1" />
              </FieldRow>
              <FieldRow label="Review Count">
                <TInput type="number" value={form.reviewCount} onChange={v => set('reviewCount', +v)} min={0} />
              </FieldRow>
            </div>
          </section>

          {/* ── Inventory & Badges ── */}
          <section>
            <SectionBar color={C.amber}>Inventory & Badges</SectionBar>
            <div className="mb-4">
              <FieldRow label="Stock Quantity">
                <TInput type="number" value={form.stock} onChange={v => set('stock', +v)} min={0} />
              </FieldRow>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {BADGE_DEFS.map(badge => {
                const active = form[badge.key] as boolean;
                return (
                  <button key={badge.key as string}
                    onClick={() => set(badge.key, !active as Product[typeof badge.key])}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all"
                    style={{
                      background: active ? `${badge.color}18` : C.card,
                      border: `1px solid ${active ? badge.color + '55' : C.border}`,
                      color: active ? badge.color : C.muted,
                    }}>
                    {active
                      ? <FiToggleRight className="w-4 h-4 flex-shrink-0" />
                      : <FiToggleLeft  className="w-4 h-4 flex-shrink-0" />}
                    <span className="text-[11px] font-bold">{badge.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Sizes ── */}
          <section>
            <SectionBar color={C.emerald}>Sizes / Variants</SectionBar>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {['XS','S','M','L','XL','XXL','6','7','8','9','10','11','12','Free Size'].map(s => (
                <button key={s}
                  onClick={() => {
                    const cur = form.sizes ?? [];
                    set('sizes', cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s]);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                  style={{
                    background: (form.sizes ?? []).includes(s) ? `${C.emerald}22` : C.card,
                    color:      (form.sizes ?? []).includes(s) ? C.emerald : C.muted,
                    border:     `1px solid ${(form.sizes ?? []).includes(s) ? C.emerald + '55' : C.border}`,
                  }}>{s}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <TInput value={newSize} onChange={setNewSize} placeholder="Custom size (e.g. 42 EU)" />
              <button
                onClick={() => { if (!newSize.trim()) return; const cur = form.sizes ?? []; set('sizes', [...cur, newSize.trim()]); setNewSize(''); }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white whitespace-nowrap flex-shrink-0 transition-opacity hover:opacity-90"
                style={{ background: C.emerald }}>
                + Add
              </button>
            </div>
          </section>

          {/* ── Tags ── */}
          <section>
            <SectionBar color={C.rose}>Tags</SectionBar>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {form.tags.map((tag, i) => (
                  <div key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                    style={{ background: 'rgba(244,63,94,0.12)', color: C.rose, border: '1px solid rgba(244,63,94,0.3)' }}>
                    {tag}
                    <button onClick={() => set('tags', form.tags.filter((_, j) => j !== i))}>
                      <FiX className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <TInput value={newTag} onChange={setNewTag} placeholder="e.g. premium, wireless"
              />
              <button
                onClick={() => { if (!newTag.trim()) return; set('tags', [...form.tags, newTag.trim()]); setNewTag(''); }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white whitespace-nowrap flex-shrink-0 transition-opacity hover:opacity-90"
                style={{ background: C.rose }}>
                + Add
              </button>
            </div>
            <p className="text-[10px] mt-1.5" style={{ color: C.muted }}>Press + Add or Enter to add a tag</p>
          </section>

          {/* ── Delivery & Seller ── */}
          <section>
            <SectionBar color={C.amber}>Delivery & Seller Info</SectionBar>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <FieldRow label="Delivery Days">
                <TInput type="number" value={form.deliveryDays ?? 3} onChange={v => set('deliveryDays', Math.max(1, +v))} min={1} max={30} />
              </FieldRow>
              <FieldRow label="Seller ID">
                <TInput value={form.sellerId || ''} onChange={v => set('sellerId', v)} placeholder="e.g. seller_001" />
              </FieldRow>
              <FieldRow label="Seller Name">
                <TInput value={form.sellerName || ''} onChange={v => set('sellerName', v)} placeholder="e.g. TechVault PK" />
              </FieldRow>
            </div>
          </section>

          {/* ── Specifications ── */}
          <section>
            <SectionBar color={C.muted}>Specifications</SectionBar>
            {Object.keys(form.specifications).length > 0 && (
              <div className="space-y-2 mb-3">
                {Object.entries(form.specifications).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <div className="w-32 flex-shrink-0">
                      <input value={k}
                        onChange={e => {
                          const newKey = e.target.value;
                          const s = Object.fromEntries(
                            Object.entries(form.specifications).map(([ok, ov]) => ok === k ? [newKey, ov] : [ok, ov])
                          );
                          set('specifications', s);
                        }}
                        className="w-full rounded-lg px-2 py-1.5 text-xs text-white outline-none"
                        style={{ background: C.bg, border: `1px solid ${C.border}` }} />
                    </div>
                    <span style={{ color: C.muted, flexShrink: 0 }}>:</span>
                    <input value={v}
                      onChange={e => set('specifications', { ...form.specifications, [k]: e.target.value })}
                      className="flex-1 rounded-lg px-2 py-1.5 text-xs text-white outline-none min-w-0"
                      style={{ background: C.bg, border: `1px solid ${C.border}` }} />
                    <button
                      onClick={() => {
                        const s = { ...form.specifications };
                        delete s[k];
                        set('specifications', s);
                      }}
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{ background: 'rgba(244,63,94,0.15)' }}>
                      <FiX className="w-3 h-3 text-rose-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <TInput value={newSpecKey} onChange={setNewSpecKey} placeholder="Key (e.g. RAM)" />
              <TInput value={newSpecVal} onChange={setNewSpecVal} placeholder="Value (e.g. 8 GB)" />
              <button
                onClick={() => {
                  if (!newSpecKey.trim() || !newSpecVal.trim()) return;
                  set('specifications', { ...form.specifications, [newSpecKey.trim()]: newSpecVal.trim() });
                  setNewSpecKey(''); setNewSpecVal('');
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white whitespace-nowrap flex-shrink-0 transition-opacity hover:opacity-90"
                style={{ background: C.primary }}>
                + Add
              </button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 sticky bottom-0"
          style={{ background: C.surface, borderTop: `1px solid ${C.border}` }}>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:bg-white/5"
            style={{ background: C.card, color: C.muted, border: `1px solid ${C.border}` }}>
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: isNew ? C.emerald : C.primary }}>
            {isNew ? '✓ Create Product' : '✓ Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Delete Confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ product, onConfirm, onClose }: {
  product: Product; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-sm rounded-2xl p-6 space-y-5"
        style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(244,63,94,0.15)' }}>
            <FiTrash2 className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <p className="text-sm font-black text-white">Delete Product?</p>
            <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>This action cannot be undone.</p>
          </div>
        </div>
        <div className="rounded-xl p-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2">
            <img src={product.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{product.name}</p>
              <p className="text-[10px]" style={{ color: C.muted }}>{product.brand} · {product.category}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:bg-white/5"
            style={{ background: C.card, color: C.muted, border: `1px solid ${C.border}` }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: '#f43f5e' }}>
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Section: Products ─────────────────────────────────────────────────────────
function ProductsSection() {
  const { products, addProduct, updateProduct, deleteProduct, resetToDefaults } = useProductStore();
  const [search, setSearch]           = useState('');
  const [catFilter, setCat]           = useState('All');
  const [editingProduct, setEditing]  = useState<Product | null | 'new'>(null);
  const [deletingProduct, setDeleting] = useState<Product | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);

  const cats = ['All', ...Array.from(new Set(products.map(p => p.category))).sort()];

  const filtered = useMemo(() => products.filter(p =>
    (catFilter === 'All' || p.category === catFilter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) ||
     p.brand.toLowerCase().includes(search.toLowerCase()) ||
     (p.shortDescription || '').toLowerCase().includes(search.toLowerCase()))
  ), [products, search, catFilter]);

  const handleSave = (product: Product) => {
    if (editingProduct === 'new') addProduct(product);
    else updateProduct(product.id, product);
    setEditing(null);
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-5">
        <button onClick={() => setEditing('new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: C.emerald }}>
          <FiPlus className="w-4 h-4" />
          Add Product
        </button>

        <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1 min-w-[180px]"
          style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <FiSearch className="w-4 h-4 flex-shrink-0" style={{ color: C.muted }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, brand, description…"
            className="bg-transparent text-sm text-white outline-none flex-1 placeholder:text-gray-600" />
          {search && (
            <button onClick={() => setSearch('')}><FiX className="w-3.5 h-3.5" style={{ color: C.muted }} /></button>
          )}
        </div>

        <button onClick={() => setResetConfirm(true)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all"
          style={{ background: C.card, color: C.muted, border: `1px solid ${C.border}` }}
          title="Reset all products to defaults">
          <FiRefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 flex-wrap mb-5">
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background: catFilter === c ? C.primary : C.card,
              color: catFilter === c ? '#fff' : C.muted,
              border: `1px solid ${catFilter === c ? C.primary : C.border}`,
            }}>{c}</button>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Showing',    val: filtered.length,                         color: C.primary },
          { label: 'Low Stock',  val: filtered.filter(p=>p.stock<10).length,   color: C.rose    },
          { label: 'Flash Sale', val: filtered.filter(p=>p.isFlashSale).length, color: C.amber  },
        ].map(s => (
          <div key={s.label} className="rounded-xl px-4 py-3"
            style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <span className="text-xl font-black block" style={{ color: s.color }}>{s.val}</span>
            <span className="text-[10px] font-semibold" style={{ color: C.muted }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.02)' }}>
                {['Product','Category','Price','Stock','Badges','Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-bold whitespace-nowrap" style={{ color: C.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filtered.map(p => {
                  const badges = [
                    p.isNew        && { label: 'New',     color: C.cyan    },
                    p.isFeatured   && { label: 'Featured', color: C.primary },
                    p.isFlashSale  && { label: '⚡',       color: C.amber   },
                    p.isBestSeller && { label: '🏆',       color: C.emerald },
                    p.isTrending   && { label: '🔥',       color: C.rose    },
                  ].filter(Boolean) as { label: string; color: string }[];

                  return (
                    <motion.tr key={p.id} layout
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="transition-colors hover:bg-white/[0.02]"
                      style={{ borderBottom: `1px solid ${C.border}` }}>

                      {/* Product */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            <img src={p.images[0]} alt={p.name}
                              className="w-11 h-11 rounded-xl object-cover"
                              onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/44x44/1a1a26/6366f1?text=P'; }} />
                            {p.icon && (
                              <span className="absolute -bottom-1 -right-1 text-sm leading-none">{p.icon}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate max-w-[170px]">{p.name}</p>
                            <p className="text-[10px]" style={{ color: C.muted }}>{p.brand}</p>
                            {p.shortDescription && (
                              <p className="text-[10px] truncate max-w-[170px] mt-0.5 italic" style={{ color: C.muted }}>{p.shortDescription}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{ background: `${C.primary}18`, color: C.primary }}>{p.category}</span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4">
                        <p className="text-xs font-black whitespace-nowrap" style={{ color: C.emerald }}>{pkr(p.price)}</p>
                        {p.discount > 0 && (
                          <p className="text-[10px] line-through" style={{ color: C.muted }}>{pkr(p.originalPrice)}</p>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4">
                        <span className="text-xs font-bold" style={{ color: p.stock < 10 ? C.rose : '#fff' }}>
                          {p.stock < 10 && <FiAlertCircle className="w-3 h-3 inline mr-1" />}
                          {p.stock}
                        </span>
                      </td>

                      {/* Badges */}
                      <td className="py-3 px-4">
                        <div className="flex gap-1 flex-wrap">
                          {badges.slice(0,3).map(b => (
                            <span key={b.label} className="text-[9px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap"
                              style={{ background: `${b.color}22`, color: b.color }}>{b.label}</span>
                          ))}
                          {badges.length > 3 && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                              style={{ background: 'rgba(255,255,255,0.06)', color: C.muted }}>+{badges.length-3}</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button onClick={() => setEditing(p)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                            style={{ background: `${C.primary}22`, border: `1px solid ${C.primary}44` }}
                            title="Edit product">
                            <FiEdit2 className="w-3.5 h-3.5" style={{ color: C.primary }} />
                          </button>
                          <button onClick={() => setDeleting(p)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                            style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)' }}
                            title="Delete product">
                            <FiTrash2 className="w-3.5 h-3.5 text-rose-400" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-14" style={{ color: C.muted }}>
              <FiPackage className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">No products found</p>
              {search && <p className="text-xs mt-1 opacity-60">Try a different search term</p>}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {editingProduct !== null && (
          <ProductEditModal
            product={editingProduct === 'new' ? null : editingProduct}
            onSave={handleSave}
            onClose={() => setEditing(null)}
          />
        )}
        {deletingProduct && (
          <DeleteConfirm
            product={deletingProduct}
            onConfirm={() => { deleteProduct(deletingProduct.id); setDeleting(null); }}
            onClose={() => setDeleting(null)}
          />
        )}
        {resetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm rounded-2xl p-6 space-y-5"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <p className="text-sm font-black text-white">Reset all products?</p>
              <p className="text-xs" style={{ color: C.muted }}>This will restore the original product catalogue and remove any custom additions.</p>
              <div className="flex gap-3">
                <button onClick={() => setResetConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: C.card, color: C.muted, border: `1px solid ${C.border}` }}>
                  Cancel
                </button>
                <button onClick={() => { resetToDefaults(); setResetConfirm(false); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: C.amber }}>
                  Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Section: Orders ───────────────────────────────────────────────────────────
function OrdersSection() {
  const { orders: storeOrders } = useOrderStore();
  const allOrders: Order[] = [...MOCK_ORDERS, ...storeOrders];
  const [orders, setOrders]           = useState<Order[]>(allOrders);
  const [statusFilter, setStatus]     = useState<OrderStatus | 'All'>('All');
  const [search, setSearch]           = useState('');

  const ORDER_FLOW: OrderStatus[] = ['pending','processing','shipped','delivered'];

  const advance = (id: string) => setOrders(os => os.map(o => {
    if (o.id !== id) return o;
    const idx = ORDER_FLOW.indexOf(o.status);
    return idx < ORDER_FLOW.length - 1 ? { ...o, status: ORDER_FLOW[idx + 1] } : o;
  }));

  const filtered = orders.filter(o =>
    (statusFilter === 'All' || o.status === statusFilter) &&
    (o.id.toLowerCase().includes(search.toLowerCase()) ||
     o.items[0]?.name.toLowerCase().includes(search.toLowerCase()))
  );

  const counts = { All: orders.length, ...Object.fromEntries(ORDER_FLOW.map(s => [s, orders.filter(o=>o.status===s).length])) };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        {(['All', ...ORDER_FLOW] as const).map(s => {
          const sm = s === 'All' ? { color: C.primary, bg: 'rgba(99,102,241,0.12)' } : STATUS_META[s];
          const active = statusFilter === s;
          return (
            <button key={s} onClick={() => setStatus(s)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              style={{
                background: active ? sm.bg : C.card,
                color: active ? sm.color : C.muted,
                border: `1px solid ${active ? sm.color + '44' : C.border}`,
              }}>
              {s === 'All' ? 'All' : STATUS_META[s as OrderStatus].label}
              <span className="text-[10px] font-black opacity-60">{(counts as any)[s]}</span>
            </button>
          );
        })}
        <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 ml-auto"
          style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <FiSearch className="w-3.5 h-3.5" style={{ color: C.muted }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search orders…"
            className="bg-transparent text-xs text-white outline-none w-36 placeholder:text-gray-600" />
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.02)' }}>
                {['Order','Items','Date','Total','Status','Action'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-bold whitespace-nowrap" style={{ color: C.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map(o => {
                  const sm = STATUS_META[o.status];
                  const isDelivered = o.status === 'delivered';
                  return (
                    <motion.tr key={o.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="transition-colors hover:bg-white/[0.02]"
                      style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-white whitespace-nowrap">{o.id}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <img src={o.items[0]?.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          <div>
                            <p className="text-xs font-bold text-white truncate max-w-[120px]">{o.items[0]?.name}</p>
                            {o.items.length > 1 && <p className="text-[10px]" style={{ color: C.muted }}>+{o.items.length - 1} more</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap" style={{ color: C.muted }}>{o.date}</td>
                      <td className="py-3 px-4 text-xs font-black whitespace-nowrap" style={{ color: C.emerald }}>{pkr(o.total)}</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap"
                          style={{ color: sm.color, background: sm.bg }}>{sm.label}</span>
                      </td>
                      <td className="py-3 px-4">
                        <button disabled={isDelivered} onClick={() => advance(o.id)}
                          className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-30"
                          style={{ background: isDelivered ? 'transparent' : `${C.primary}22`, color: isDelivered ? C.muted : C.primary, border: `1px solid ${isDelivered ? C.border : C.primary + '44'}` }}>
                          {isDelivered ? 'Completed' : '→ Advance'}
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12" style={{ color: C.muted }}>
              <FiShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No orders found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Section: Customers ────────────────────────────────────────────────────────
function CustomersSection() {
  const [search, setSearch] = useState('');
  const users = MOCK_USERS.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 rounded-xl px-3 py-2"
        style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <FiSearch className="w-4 h-4 flex-shrink-0" style={{ color: C.muted }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search customers…"
          className="bg-transparent text-sm text-white outline-none flex-1 placeholder:text-gray-600" />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.02)' }}>
              {['Customer','Email','Joined','Orders','Spent','Status'].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-bold" style={{ color: C.muted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="transition-colors hover:bg-white/[0.02]"
                style={{ borderBottom: `1px solid ${C.border}` }}>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
                      style={{ background: C.primary + '33', color: C.primary }}>
                      {u.name.charAt(0)}
                    </div>
                    <span className="text-xs font-bold text-white">{u.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-xs" style={{ color: C.muted }}>{u.email}</td>
                <td className="py-3 px-4 text-xs" style={{ color: C.muted }}>{u.joined}</td>
                <td className="py-3 px-4 text-xs font-bold text-white">{u.orders}</td>
                <td className="py-3 px-4 text-xs font-black" style={{ color: C.emerald }}>{pkr(u.spent)}</td>
                <td className="py-3 px-4">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                    style={{
                      color: u.status === 'active' ? C.emerald : C.muted,
                      background: u.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)',
                    }}>{u.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Section: Analytics ────────────────────────────────────────────────────────
function AnalyticsSection() {
  const { products } = useProductStore();
  const orderData = MONTHS.map((m, i) => ({
    month: m,
    orders: 120 + Math.floor(Math.sin(i) * 40) + i * 8,
    returns: Math.floor(8 + (i * 3.7) % 15),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Order Value',  value: pkr(18400),  icon: FiDollarSign, color: C.primary, trend: 5.2 },
          { label: 'Conversion Rate',  value: '3.8%',      icon: FiTrendingUp,  color: C.emerald, trend: 0.4 },
          { label: 'Return Rate',      value: '2.1%',      icon: FiRefreshCw,   color: C.rose,    trend: -0.3 },
          { label: 'Repeat Customers', value: '64%',       icon: FiUsers,       color: C.amber,   trend: 8.1 },
        ].map(s => <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} color={s.color} trend={s.trend} />)}
      </div>

      <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <SectionTitle>Orders vs Returns</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={orderData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 12 }} />
            <Bar dataKey="orders"  name="Orders"  fill={C.primary} radius={[4,4,0,0]} />
            <Bar dataKey="returns" name="Returns" fill={C.rose}    radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <SectionTitle>Category Performance</SectionTitle>
          <div className="space-y-3">
            {categoryData.map(c => (
              <div key={c.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-white">{c.name}</span>
                  <span style={{ color: c.color }} className="font-black">{c.value}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${c.value}%` }}
                    transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full" style={{ background: c.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-5 space-y-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <SectionTitle>Key Metrics</SectionTitle>
          {[
            { label: 'Daily Visitors',    value: '2,841',                                                   icon: FiEye,  color: C.cyan    },
            { label: 'Cart Abandonment',  value: '41%',                                                     icon: FiTag,  color: C.rose    },
            { label: 'New Signups Today', value: '34',                                                       icon: FiUsers, color: C.emerald },
            { label: 'Flash Sales Live',  value: products.filter(p=>p.isFlashSale).length.toString(),       icon: FiZap,  color: C.amber   },
            { label: 'Top Seller Brand',  value: products.filter(p=>p.isBestSeller)[0]?.brand ?? '—',       icon: FiAward, color: C.violet  },
          ].map(m => (
            <div key={m.label} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${m.color}22` }}>
                <m.icon className="w-3.5 h-3.5" style={{ color: m.color }} />
              </div>
              <span className="text-xs flex-1" style={{ color: C.muted }}>{m.label}</span>
              <span className="text-xs font-black text-white">{m.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Section: Settings ─────────────────────────────────────────────────────────
function SettingsSection() {
  const [storeName, setStoreName]       = useState('ESTORE Premium');
  const [currency, setCurrency]         = useState('PKR');
  const [taxRate, setTaxRate]           = useState('8');
  const [freeShipping, setFreeShipping] = useState('50');
  const [maintenanceMode, setMaintMode] = useState(false);
  const [saved, setSaved]               = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="max-w-2xl space-y-6">
      {[
        {
          title: 'Store Info',
          fields: [
            { label: 'Store Name',  value: storeName,    onChange: setStoreName,    type: 'text' },
            { label: 'Currency',    value: currency,     onChange: setCurrency,     type: 'text' },
          ],
        },
        {
          title: 'Pricing & Shipping',
          fields: [
            { label: 'Tax Rate (%)',             value: taxRate,      onChange: setTaxRate,      type: 'number' },
            { label: 'Free Shipping Threshold',  value: freeShipping, onChange: setFreeShipping, type: 'number' },
          ],
        },
      ].map(section => (
        <div key={section.title} className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <h3 className="text-sm font-black text-white mb-4">{section.title}</h3>
          <div className="space-y-4">
            {section.fields.map(f => (
              <div key={f.label}>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: C.muted }}>{f.label}</label>
                <input type={f.type} value={f.value} onChange={e => f.onChange(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-all"
                  style={{ background: C.surface, border: `1px solid ${C.border}` }}
                  onFocus={e => (e.target.style.borderColor = C.primary)}
                  onBlur={e  => (e.target.style.borderColor = C.border)} />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-2xl p-5 flex items-center justify-between"
        style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div>
          <p className="text-sm font-bold text-white">Maintenance Mode</p>
          <p className="text-xs mt-0.5" style={{ color: C.muted }}>Temporarily hide the store from customers</p>
        </div>
        <button onClick={() => setMaintMode(m => !m)}>
          {maintenanceMode
            ? <FiToggleRight className="w-7 h-7" style={{ color: C.rose }} />
            : <FiToggleLeft  className="w-7 h-7" style={{ color: C.muted }} />}
        </button>
      </div>

      <button onClick={save}
        className="w-full py-3 rounded-xl font-black text-sm transition-all"
        style={{ background: saved ? C.emerald : C.primary, color: '#fff' }}>
        {saved ? '✓ Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}

// ─── Sidebar nav ───────────────────────────────────────────────────────────────
type Section = 'overview' | 'products' | 'orders' | 'customers' | 'analytics' | 'settings';
const NAV: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'overview',   label: 'Overview',   icon: FiGrid },
  { id: 'products',   label: 'Products',   icon: FiPackage },
  { id: 'orders',     label: 'Orders',     icon: FiShoppingBag },
  { id: 'customers',  label: 'Customers',  icon: FiUsers },
  { id: 'analytics',  label: 'Analytics',  icon: FiBarChart2 },
  { id: 'settings',   label: 'Settings',   icon: FiSettings },
];

// ─── Main AdminPage ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [active, setActive]       = useState<Section>('overview');
  const [sidebarOpen, setSidebar] = useState(false);
  const [, setLocation]           = useLocation();

  const SECTION_LABELS: Record<Section, string> = {
    overview: 'Dashboard Overview', products: 'Products', orders: 'Orders',
    customers: 'Customers', analytics: 'Analytics', settings: 'Settings',
  };

  return (
    <div className="min-h-screen flex" style={{ background: C.bg, color: '#fff' }}>
      <>
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebar(false)} />
        )}

        <aside
          className={`fixed top-0 left-0 h-full z-30 flex flex-col transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}
          style={{ width: 220, background: C.surface, borderRight: `1px solid ${C.border}`, flexShrink: 0 }}>

          <div className="flex items-center gap-2.5 px-5 py-5" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm"
              style={{ background: C.primary }}>E</div>
            <div>
              <p className="text-sm font-black text-white">ESTORE</p>
              <p className="text-[9px] font-semibold" style={{ color: C.muted }}>Admin Panel</p>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {NAV.map(n => {
              const isActive = active === n.id;
              return (
                <button key={n.id} onClick={() => { setActive(n.id); setSidebar(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm font-semibold"
                  style={{
                    background: isActive ? `${C.primary}22` : 'transparent',
                    color: isActive ? C.primary : C.muted,
                    borderLeft: `3px solid ${isActive ? C.primary : 'transparent'}`,
                  }}>
                  <n.icon className="w-4 h-4 flex-shrink-0" />
                  {n.label}
                </button>
              );
            })}
          </nav>

          <div className="px-3 pb-5" style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
            <button onClick={() => setLocation('/')}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ color: C.muted, background: 'transparent' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <FiLogOut className="w-4 h-4" />
              Back to Store
            </button>
          </div>
        </aside>
      </>

      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <header className="sticky top-0 z-10 flex items-center gap-3 px-5 py-3.5"
          style={{ background: `${C.surface}ee`, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}` }}>
          <button className="lg:hidden" onClick={() => setSidebar(true)}>
            <FiMenu className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-base font-black text-white">{SECTION_LABELS[active]}</h1>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-xl px-3 py-1.5"
              style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <FiSearch className="w-3.5 h-3.5" style={{ color: C.muted }} />
              <input placeholder="Quick search…"
                className="bg-transparent text-xs text-white outline-none w-32 placeholder:text-gray-600" />
            </div>
            <button className="relative w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <FiBell className="w-4 h-4" style={{ color: C.muted }} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: C.rose }} />
            </button>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black"
              style={{ background: C.primary }}>A</div>
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div key={active}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              {active === 'overview'  && <OverviewSection />}
              {active === 'products'  && <ProductsSection />}
              {active === 'orders'    && <OrdersSection />}
              {active === 'customers' && <CustomersSection />}
              {active === 'analytics' && <AnalyticsSection />}
              {active === 'settings'  && <SettingsSection />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
