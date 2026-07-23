import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useFDStore, FD_TO_PKR } from '../store/fdStore';
import { motion } from 'framer-motion';
import { FiDownload, FiFilter } from 'react-icons/fi';

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  earn:     { label: 'Earned',    color: 'text-emerald-400' },
  checkin:  { label: 'Check-In',  color: 'text-amber-400' },
  sale:     { label: 'Sale',      color: 'text-blue-400' },
  referral: { label: 'Referral',  color: 'text-violet-400' },
  topup:    { label: 'Top-Up',    color: 'text-cyan-400' },
  cashout:  { label: 'Cash Out',  color: 'text-rose-400' },
  spend:    { label: 'Spent',     color: 'text-rose-400' },
};

const FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'checkin', label: 'Check-In' },
  { key: 'sale', label: 'Sales' },
  { key: 'referral', label: 'Referrals' },
  { key: 'topup', label: 'Top-Up' },
  { key: 'cashout', label: 'Cash Out' },
];

const StatementPage: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { transactions, coins } = useFDStore();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!loading && !currentUser) setLocation('/login');
  }, [currentUser, loading]);

  if (loading || !currentUser) return null;

  const filtered = filter === 'all' ? transactions : transactions.filter((t) => t.type === filter);
  const totalEarned = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalSpent = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const handleDownload = () => {
    const rows = [
      ['Date', 'Type', 'Description', 'FD Coins', 'PKR Value'],
      ...filtered.map((t) => [
        new Date(t.date).toLocaleDateString('en-PK'),
        TYPE_LABELS[t.type]?.label || t.type,
        t.description,
        t.amount,
        Math.abs(t.pkrValue).toFixed(2),
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estore-statement-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div>
        <main className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-black">E-Statement</h1>
              <p className="text-muted-foreground mt-1">Complete FD Coins transaction history</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary/15 hover:bg-primary/25 text-primary rounded-xl font-bold text-sm transition-colors"
            >
              <FiDownload className="w-4 h-4" /> Download CSV
            </motion.button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Current Balance', value: `${coins.toLocaleString()} FD`, sub: `≈ ₨${(coins * FD_TO_PKR).toFixed(0)} PKR`, color: 'text-primary' },
              { label: 'Total Earned', value: `${totalEarned.toLocaleString()} FD`, sub: `≈ ₨${(totalEarned * FD_TO_PKR).toFixed(0)}`, color: 'text-emerald-400' },
              { label: 'Total Out', value: `${totalSpent.toLocaleString()} FD`, sub: `≈ ₨${(totalSpent * FD_TO_PKR).toFixed(0)}`, color: 'text-rose-400' },
            ].map((s) => (
              <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
                <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <FiFilter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filter === f.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-16 text-center">
                <p className="text-4xl mb-3">📄</p>
                <p className="font-bold">No transactions</p>
                <p className="text-sm text-muted-foreground mt-1">Start earning FD Coins to see your statement</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      {['Date', 'Type', 'Description', 'FD Coins', 'PKR'].map((h) => (
                        <th
                          key={h}
                          className={`px-5 py-3 text-xs font-bold text-muted-foreground uppercase ${
                            ['FD Coins', 'PKR'].includes(h) ? 'text-right' : 'text-left'
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((tx) => {
                      const cfg = TYPE_LABELS[tx.type] || { label: tx.type, color: 'text-foreground' };
                      return (
                        <tr key={tx.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-5 py-4 text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(tx.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg bg-secondary ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm max-w-xs truncate">{tx.description}</td>
                          <td className={`px-5 py-4 text-right font-black text-sm ${tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                          </td>
                          <td className="px-5 py-4 text-right text-sm text-muted-foreground whitespace-nowrap">
                            ₨{Math.abs(tx.pkrValue).toFixed(0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StatementPage;
