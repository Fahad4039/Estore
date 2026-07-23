/**
 * SignInGate — reusable "sign in to use this feature" mini-popup overlay.
 * Drop it anywhere inside a protected page/section.
 */
import React from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLock, FiX } from 'react-icons/fi';

interface SignInGateProps {
  /** Shown in the popup title, e.g. "Seller Hub" */
  feature: string;
  /** Optional short description */
  description?: string;
  /** If true renders as full-screen overlay; false = card inline */
  fullPage?: boolean;
  /** Show a dismissible X (only for overlays) */
  onDismiss?: () => void;
}

const SignInGate: React.FC<SignInGateProps> = ({
  feature,
  description,
  fullPage = false,
  onDismiss,
}) => {
  const inner = (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 16 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="relative bg-[#0d0d14] border border-white/12 rounded-3xl p-8 sm:p-10 text-center w-full max-w-sm mx-auto shadow-2xl"
      style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)' }}
    >
      {/* dismiss */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors"
        >
          <FiX className="w-4 h-4" />
        </button>
      )}

      {/* icon */}
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
        <div className="relative w-20 h-20 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
          <FiLock className="w-8 h-8 text-primary" />
        </div>
      </div>

      <h2 className="text-2xl font-black mb-2">Sign in to {feature}</h2>
      <p className="text-muted-foreground text-sm leading-relaxed mb-1">
        {description || `You need an account to use ${feature}.`}
      </p>
      <p className="text-muted-foreground/60 text-xs mb-8">
        Don't worry — browsing & adding to cart is always free, no login needed!
      </p>

      {/* CTAs */}
      <div className="flex flex-col gap-3">
        <Link href="/register">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-2xl font-black text-white flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
              boxShadow: '0 8px 24px rgba(59,130,246,0.4)',
            }}
          >
            <span>👤</span> Create Account
          </motion.button>
        </Link>
        <Link href="/login">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-2xl font-bold border border-white/15 hover:bg-white/5 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <span>→</span> Sign In
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        {inner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center px-4 py-10">
      {inner}
    </div>
  );
};

/** Floating overlay version — use when you want to gate a section mid-page */
export const SignInOverlay: React.FC<Omit<SignInGateProps, 'fullPage'>> = (props) => (
  <AnimatePresence>
    <motion.div
      key="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
    >
      <SignInGate {...props} fullPage={false} />
    </motion.div>
  </AnimatePresence>
);

export default SignInGate;
