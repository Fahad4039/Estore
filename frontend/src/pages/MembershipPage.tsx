import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { FiCheck, FiZap, FiShield } from "react-icons/fi";

const PLANS = [
  {
    name: "Free",
    price: 0,
    borderColor: "border-white/10",
    gradient: "bg-white/[0.02]",
    glowColor: "rgba(255,255,255,0.05)",
    badge: "Current Plan",
    badgeCls: "bg-white/10 text-gray-300",
    features: [
      "Full shopping access",
      "FD Wallet & coins",
      "100 FD/day check-in",
      "Referral program",
      "Order history",
    ],
    cta: "Current Plan",
    disabled: true,
  },
  {
    name: "Silver",
    price: 499,
    borderColor: "border-slate-400/30",
    gradient: "bg-slate-400/[0.03]",
    glowColor: "rgba(148, 163, 184, 0.15)",
    badge: "Popular",
    badgeCls: "bg-slate-500/20 text-slate-300 border border-slate-500/30",
    features: [
      "Everything in Free",
      "200 FD/day check-in (2×)",
      "10% top-up bonus coins",
      "Priority customer support",
      "Exclusive member deals",
    ],
    cta: "Upgrade to Silver",
    disabled: false,
  },
  {
    name: "Gold",
    price: 999,
    borderColor: "border-yellow-500/30",
    gradient: "bg-yellow-500/[0.03]",
    glowColor: "rgba(234, 179, 8, 0.15)",
    badge: "Best Value",
    badgeCls: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    features: [
      "Everything in Silver",
      "300 FD/day check-in (3×)",
      "25% top-up bonus coins",
      "Seller Hub priority listing",
      "Monthly 5,000 FD bonus",
    ],
    cta: "Upgrade to Gold",
    disabled: false,
  },
  {
    name: "Diamond",
    price: 2499,
    borderColor: "border-emerald-500/40",
    gradient: "bg-emerald-500/[0.04]",
    glowColor: "rgba(16, 185, 129, 0.25)",
    badge: "👑 Elite",
    badgeCls:
      "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]",
    features: [
      "Everything in Gold",
      "1,000 FD/day check-in",
      "50% top-up bonus coins",
      "VIP seller badge & placement",
      "Monthly 20,000 FD bonus",
    ],
    cta: "Go Diamond",
    disabled: false,
  },
];

const MembershipPage: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !currentUser) setLocation("/login");
  }, [currentUser, loading]);

  if (loading || !currentUser) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Optional: Subtle background glowing orbs for that premium feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-green-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 py-16 relative z-10">
        <main className="space-y-12 max-w-7xl mx-auto">
          <div className="text-center space-y-3">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60"
            >
              VIP Club
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground text-lg"
            >
              Upgrade for exclusive rewards and priority access
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`relative rounded-[2rem] border ${plan.borderColor} ${plan.gradient} p-8 flex flex-col backdrop-blur-xl shadow-lg transition-all duration-300`}
                style={{
                  boxShadow: `0 10px 40px -10px ${plan.glowColor}`,
                }}
              >
                <div className="flex flex-col mb-6">
                  <div className="flex items-start justify-between w-full mb-2">
                    <p className="font-black text-2xl tracking-tight">
                      {plan.name}
                    </p>
                    <span
                      className={`text-xs font-bold px-3 py-1.5 rounded-full ${plan.badgeCls} whitespace-nowrap`}
                    >
                      {plan.badge}
                    </span>
                  </div>

                  {plan.price === 0 ? (
                    <p className="text-muted-foreground text-sm mt-2">
                      Free forever
                    </p>
                  ) : (
                    <div className="mt-2 flex items-baseline gap-1">
                      <p className="text-4xl font-black text-foreground">
                        ₨{plan.price.toLocaleString()}
                      </p>
                      <span className="text-sm font-medium text-muted-foreground">
                        /mo
                      </span>
                    </div>
                  )}
                </div>

                <ul className="space-y-4 flex-1 mt-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 bg-emerald-500/20 p-1 rounded-full">
                        <FiCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      </div>
                      <span className="text-muted-foreground leading-relaxed">
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled={plan.disabled}
                  className="mt-8 w-full py-3.5 rounded-2xl font-bold text-[15px] transition-all duration-300 disabled:cursor-not-allowed active:scale-95"
                  style={
                    !plan.disabled
                      ? {
                          // Swapped the blue gradient out for a premium green aesthetic
                          background:
                            "linear-gradient(135deg, #064e3b 0%, #10b981 100%)",
                          color: "white",
                          boxShadow:
                            "0 8px 25px -5px rgba(16, 185, 129, 0.4), inset 0 1px 1px rgba(255,255,255,0.2)",
                          border: "1px solid rgba(16,185,129,0.5)",
                        }
                      : {
                          background: "rgba(255,255,255,0.03)",
                          color: "var(--muted-foreground)",
                          border: "1px solid rgba(255,255,255,0.05)",
                        }
                  }
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>

          {/* Premium FD Coins note container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-5 max-w-4xl mx-auto shadow-2xl"
          >
            <div className="bg-yellow-500/10 p-4 rounded-2xl border border-yellow-500/20">
              <FiZap className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <p className="font-bold text-lg tracking-tight">
                FD Coins Exchange Rate
              </p>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                <strong className="text-foreground">
                  1,000 FD Coins = ₨100 PKR
                </strong>
                . Earn through daily check-ins, sales, and referrals. Upgrade
                your membership tier to multiply your daily check-in rewards and
                hit cashout faster.
              </p>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default MembershipPage;
