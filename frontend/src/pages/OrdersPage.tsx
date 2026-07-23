import React, { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FiPackage, FiArrowRight, FiCheckCircle, FiTruck } from 'react-icons/fi';

const OrdersPage: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !currentUser) setLocation('/login');
  }, [currentUser, loading]);

  if (loading || !currentUser) return null;

  return (
    <div className="container mx-auto px-4 py-12">
      <div>
        <main className="flex-1 min-w-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
              <h1 className="text-3xl font-black">Order History</h1>
              <p className="text-muted-foreground mt-1">All your ESTORE purchases in one place</p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: FiPackage,     label: 'Total Orders', value: '0', color: 'text-primary',    bg: 'bg-primary/10'    },
                { icon: FiCheckCircle, label: 'Delivered',    value: '0', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { icon: FiTruck,       label: 'In Transit',   value: '0', color: 'text-amber-400',   bg: 'bg-amber-500/10'  },
              ].map((s) => (
                <div key={s.label} className="bg-card border border-border rounded-2xl p-5 text-center">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mx-auto mb-2`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <p className="text-2xl font-black">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Empty state */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-2xl p-16 text-center"
            >
              <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiPackage className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-black mb-2">No orders yet</h2>
              <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">
                You haven't placed any orders yet. Discover our premium collection and find something you love.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 font-black text-white rounded-xl text-sm"
                style={{
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
                  boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
                }}
              >
                Browse Products <FiArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default OrdersPage;
