import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useFDStore, CHECKIN_REWARDS } from '../store/fdStore';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiZap, FiAward, FiCalendar, FiStar, FiArrowRight } from 'react-icons/fi';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* colour tier for each day */
const DAY_STYLES = [
  { from: '#3b82f6', to: '#2563eb', glow: 'rgba(59,130,246,0.55)',  shadow: 'rgba(37,99,235,0.4)'  },
  { from: '#6366f1', to: '#4f46e5', glow: 'rgba(99,102,241,0.55)',  shadow: 'rgba(79,70,229,0.4)'  },
  { from: '#8b5cf6', to: '#7c3aed', glow: 'rgba(139,92,246,0.55)',  shadow: 'rgba(124,58,237,0.4)' },
  { from: '#a855f7', to: '#9333ea', glow: 'rgba(168,85,247,0.55)',  shadow: 'rgba(147,51,234,0.4)' },
  { from: '#c026d3', to: '#a21caf', glow: 'rgba(192,38,211,0.55)',  shadow: 'rgba(162,28,175,0.4)' },
  { from: '#ec4899', to: '#db2777', glow: 'rgba(236,72,153,0.55)',  shadow: 'rgba(219,39,119,0.4)' },
  { from: '#f59e0b', to: '#d97706', glow: 'rgba(245,158,11,0.70)',  shadow: 'rgba(217,119,6,0.55)' }, // jackpot gold
];

const CheckInPage: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { checkIn, checkInStreak, lastCheckInDate, coins } = useFDStore();
  const [reward, setReward] = useState<{ coins: number; streak: number } | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const alreadyCheckedIn = lastCheckInDate === today;
  const nextDayIndex = checkInStreak % 7;
  const nextReward = CHECKIN_REWARDS[nextDayIndex];

  // eslint-disable-next-line react-hooks/rules-of-hooks
  React.useEffect(() => {
    if (!loading && !currentUser) setLocation('/login');
  }, [loading, currentUser]);

  if (loading || !currentUser) return null;

  const handleCheckIn = () => {
    const result = checkIn();
    if (result) {
      setReward({ coins: result.coinsEarned, streak: result.streak });
      setTimeout(() => setReward(null), 3800);
    }
  };

  /* 3D tilt on hover */
  const tilt = (idx: number) =>
    hovered === idx ? { rotateX: -8, rotateY: 6, scale: 1.08, z: 20 } : { rotateX: 0, rotateY: 0, scale: 1, z: 0 };

  const renderDayCard = (dayIdx: number) => {
    const coinReward = CHECKIN_REWARDS[dayIdx];
    const cycleDays = checkInStreak % 7;
    const isTodayDone = alreadyCheckedIn && dayIdx === (checkInStreak - 1) % 7;
    const isPast      = dayIdx < cycleDays && !isTodayDone;
    const isToday     = dayIdx === nextDayIndex && !alreadyCheckedIn;
    const isJackpot   = dayIdx === 6;
    const style       = DAY_STYLES[dayIdx];

    return (
      <motion.div
        key={dayIdx}
        initial={{ opacity: 0, y: 20, rotateX: -15 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ delay: dayIdx * 0.06, type: 'spring', stiffness: 300, damping: 22 }}
        onHoverStart={() => setHovered(dayIdx)}
        onHoverEnd={() => setHovered(null)}
        style={{ perspective: 600 }}
        className="cursor-default"
      >
        <motion.div
          animate={tilt(dayIdx)}
          transition={{ type: 'spring', stiffness: 400, damping: 26 }}
          className="relative rounded-2xl overflow-hidden select-none"
          style={{
            transformStyle: 'preserve-3d',
            boxShadow: isToday
              ? `0 0 0 2px ${style.from}, 0 12px 36px ${style.shadow}`
              : isTodayDone
              ? '0 0 0 2px #10b981, 0 8px 24px rgba(16,185,129,0.3)'
              : isPast
              ? '0 4px 12px rgba(0,0,0,0.2)'
              : '0 4px 14px rgba(0,0,0,0.15)',
          }}
        >
          {/* card bg */}
          <div
            className="absolute inset-0"
            style={{
              background: isTodayDone
                ? 'linear-gradient(135deg,#064e3b,#065f46)'
                : isPast
                ? 'linear-gradient(135deg,#1a1a2e,#16213e)'
                : `linear-gradient(135deg,${style.from},${style.to})`,
              opacity: isPast ? 0.55 : 1,
            }}
          />
          {/* gloss highlight */}
          {(isToday || isJackpot) && (
            <div className="absolute inset-0 opacity-20" style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.6) 0%,transparent 55%)' }} />
          )}
          {/* jackpot sparkle rings */}
          {isJackpot && !isTodayDone && !isPast && (
            <>
              <motion.div
                className="absolute inset-0 rounded-2xl"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ boxShadow: `inset 0 0 20px ${style.glow}` }}
              />
            </>
          )}

          {/* content */}
          <div className="relative z-10 flex flex-col items-center py-3 px-1">
            <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-2">{DAY_LABELS[dayIdx]}</p>

            {/* icon circle */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-2 shadow-inner"
              style={{ background: 'rgba(0,0,0,0.25)' }}
            >
              {isTodayDone ? (
                <FiCheck className="w-4 h-4 text-emerald-300" strokeWidth={3} />
              ) : isJackpot ? (
                <FiAward className="w-4 h-4 text-yellow-300" />
              ) : isPast ? (
                <FiCheck className="w-4 h-4 text-white/40" strokeWidth={2} />
              ) : (
                <FiStar className={`w-4 h-4 ${isToday ? 'text-white' : 'text-white/70'}`} />
              )}
            </div>

            <p className={`text-sm font-black leading-none text-white ${isPast ? 'opacity-40' : ''}`}>
              {coinReward >= 1000 ? `${(coinReward / 1000).toFixed(0)}K` : coinReward}
            </p>
            <p className={`text-[9px] font-semibold mt-0.5 ${isPast ? 'text-white/30' : 'text-white/55'}`}>coins</p>

            {isToday && (
              <motion.p
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                className="text-[9px] text-white font-black mt-1 uppercase tracking-wider"
              >
                Today
              </motion.p>
            )}
            {isTodayDone && (
              <p className="text-[9px] text-emerald-300 font-black mt-1">Done</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen pb-16" style={{ background: 'linear-gradient(160deg,#03040e 0%,#0a0720 40%,#0d1535 100%)' }}>

      {/* ── TOP HERO ── */}
      <div className="relative overflow-hidden pt-24 pb-10 px-4">
        {/* glow orbs */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none opacity-25"
          style={{ background: 'radial-gradient(ellipse,#f59e0b 0%,#7c3aed 40%,transparent 70%)', filter: 'blur(80px)' }} />

        <div className="relative container mx-auto max-w-lg text-center">
          {/* streak ring */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="relative w-32 h-32 mx-auto mb-6"
          >
            {/* animated conic ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              style={{ background: 'conic-gradient(from 0deg,#f59e0b,#7c3aed,#3b82f6,#f59e0b)', filter: 'blur(3px)', opacity: 0.8 }}
            />
            <div className="absolute inset-1 rounded-full" style={{ background: 'linear-gradient(135deg,#0a0720,#0d1535)' }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-5xl font-black text-white leading-none">{checkInStreak}</p>
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mt-0.5">Day Streak</p>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-3xl font-black text-white mb-2"
          >
            Daily Streak
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.22 }}
            className="text-white/50 text-sm"
          >
            Check in every day · Build your streak · Earn bigger rewards
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 inline-flex items-center gap-2 bg-white/6 border border-white/10 rounded-full px-4 py-2"
          >
            <FiCalendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-white/70 font-medium">
              Balance: <span className="text-white font-black">{coins.toLocaleString()} Coins</span>
            </span>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto max-w-lg px-4 space-y-8">

        {/* ── 7-DAY 3D GRID ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-white">This Week</h2>
            <span className="text-xs text-white/40 font-medium">
              Day {Math.min(checkInStreak % 7 + (alreadyCheckedIn ? 0 : 0), 7)} of 7
            </span>
          </div>
          <div className="grid grid-cols-7 gap-2" style={{ perspective: '1000px' }}>
            {Array.from({ length: 7 }, (_, i) => renderDayCard(i))}
          </div>
          {/* jackpot label */}
          <div className="flex justify-end mt-2">
            <span className="text-[10px] text-amber-400/70 font-bold uppercase tracking-wider flex items-center gap-1">
              <FiAward className="w-3 h-3" /> Day 7 = 1,000 Coin Jackpot
            </span>
          </div>
        </motion.div>

        {/* ── CTA ── */}
        <AnimatePresence mode="wait">
          {reward ? (
            <motion.div
              key="reward"
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              className="rounded-3xl p-10 text-center relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.18),rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.3)' }}
            >
              {/* animated rings */}
              {[1, 2, 3].map((r) => (
                <motion.div
                  key={r}
                  className="absolute inset-0 rounded-3xl border border-emerald-500/30"
                  animate={{ scale: [1, 1.04 * r, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, delay: r * 0.4 }}
                />
              ))}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4"
              >
                <FiZap className="w-8 h-8 text-emerald-400" />
              </motion.div>
              <p className="text-4xl font-black text-emerald-400">+{reward.coins.toLocaleString()} Coins!</p>
              <p className="text-white/50 mt-2 text-sm">Day {reward.streak} streak complete · Keep going tomorrow!</p>
            </motion.div>
          ) : alreadyCheckedIn ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl p-8 text-center"
              style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.14),rgba(16,185,129,0.04))', border: '1px solid rgba(16,185,129,0.25)' }}
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                <FiCheck className="w-7 h-7 text-emerald-400" strokeWidth={2.5} />
              </div>
              <p className="text-xl font-black text-emerald-400">Checked in today!</p>
              <p className="text-sm text-white/45 mt-2">
                Come back tomorrow · Next reward: <span className="text-white font-bold">+{CHECKIN_REWARDS[checkInStreak % 7].toLocaleString()} Coins</span>
              </p>
            </motion.div>
          ) : (
            <motion.button
              key="btn"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCheckIn}
              className="w-full py-5 rounded-2xl font-black text-white text-lg relative overflow-hidden group"
              style={{
                background: `linear-gradient(135deg,${DAY_STYLES[nextDayIndex].from},${DAY_STYLES[nextDayIndex].to})`,
                boxShadow: `0 10px 40px ${DAY_STYLES[nextDayIndex].shadow}`,
              }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity"
                style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.5),transparent)' }} />
              <span className="relative flex items-center justify-center gap-2">
                <FiZap className="w-5 h-5" />
                Claim {nextReward.toLocaleString()} Coins
                <FiArrowRight className="w-4 h-4" />
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* ── REWARD SCHEDULE ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
            <FiCalendar className="w-4 h-4 text-primary" />
            <h3 className="font-black text-white text-sm">Reward Schedule</h3>
          </div>
          <div className="divide-y divide-white/5">
            {CHECKIN_REWARDS.map((r, i) => {
              const s = DAY_STYLES[i];
              const done = i < (checkInStreak % 7) || (alreadyCheckedIn && i === (checkInStreak - 1) % 7);
              return (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: done ? 'rgba(16,185,129,0.2)' : `linear-gradient(135deg,${s.from},${s.to})`, opacity: done ? 1 : 0.85 }}
                    >
                      {done
                        ? <FiCheck className="w-3 h-3 text-emerald-400" strokeWidth={2.5} />
                        : i === 6
                        ? <FiAward className="w-3 h-3 text-white" />
                        : <FiStar className="w-3 h-3 text-white/80" />
                      }
                    </div>
                    <span className="text-sm font-medium text-white/70">
                      Day {i + 1} — {DAY_LABELS[i]}
                      {i === 6 && <span className="text-amber-400 font-black ml-2">Jackpot!</span>}
                    </span>
                  </div>
                  <span className="font-black text-sm" style={{ color: done ? '#10b981' : i === 6 ? '#f59e0b' : s.from }}>
                    +{r.toLocaleString()} Coins
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default CheckInPage;
