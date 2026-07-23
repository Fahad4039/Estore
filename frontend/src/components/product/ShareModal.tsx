import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiLink, FiCheck, FiShare2 } from 'react-icons/fi';
import { FaWhatsapp, FaFacebook, FaInstagram, FaTiktok, FaTwitter } from 'react-icons/fa';
import { Product } from '../../data/products';

interface ShareModalProps {
  product: Product;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ product, onClose }) => {
  const [copied, setCopied] = useState(false);
  const url = window.location.href;
  const text = `🛒 Check out "${product.name}" – PKR ${product.price.toFixed(0)}\n${url}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const socials = [
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      color: '#25D366',
      bg: 'rgba(37,211,102,0.12)',
      border: 'rgba(37,211,102,0.25)',
      href: `https://wa.me/?text=${encodeURIComponent(text)}`,
    },
    {
      name: 'Facebook',
      icon: FaFacebook,
      color: '#1877F2',
      bg: 'rgba(24,119,242,0.12)',
      border: 'rgba(24,119,242,0.25)',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      name: 'Instagram',
      icon: FaInstagram,
      color: '#E1306C',
      bg: 'rgba(225,48,108,0.12)',
      border: 'rgba(225,48,108,0.25)',
      // Instagram has no direct web share; use native share
      href: null,
      native: true,
    },
    {
      name: 'TikTok',
      icon: FaTiktok,
      color: '#ffffff',
      bg: 'rgba(255,255,255,0.08)',
      border: 'rgba(255,255,255,0.15)',
      href: null,
      native: true,
    },
    {
      name: 'Twitter',
      icon: FaTwitter,
      color: '#1DA1F2',
      bg: 'rgba(29,161,242,0.12)',
      border: 'rgba(29,161,242,0.25)',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
    },
    {
      name: 'More',
      icon: FiShare2,
      color: '#a78bfa',
      bg: 'rgba(167,139,250,0.12)',
      border: 'rgba(167,139,250,0.25)',
      href: null,
      native: true,
    },
  ];

  const handleSocial = async (social: typeof socials[0]) => {
    if (social.native || !social.href) {
      if (navigator.share) {
        try {
          await navigator.share({ title: product.name, text, url });
        } catch {}
      } else {
        handleCopy();
      }
    } else {
      window.open(social.href, '_blank', 'noopener,noreferrer,width=600,height=500');
    }
  };

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}
      onClick={handleBackdrop}
    >
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(160deg, rgba(30,30,40,0.98) 0%, rgba(15,15,22,0.98) 100%)', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h3 className="font-black text-xl text-white">Share Product</h3>
            <p className="text-muted-foreground text-xs mt-0.5 truncate max-w-[260px]">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Product preview strip */}
        <div className="mx-6 mb-5 rounded-2xl overflow-hidden flex items-center gap-4 p-3"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <img src={product.images[0]} alt={product.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm truncate">{product.name}</p>
            <p className="text-muted-foreground text-xs">{product.brand} · PKR {product.price.toFixed(0)}</p>
          </div>
        </div>

        {/* Copy link */}
        <div className="mx-6 mb-6">
          <div className="flex items-center gap-2 p-3 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5 font-medium">Product Link</p>
              <p className="text-white/80 text-xs truncate font-mono">{url.replace(/^https?:\/\//, '')}</p>
            </div>
            <motion.button
              onClick={handleCopy}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className="flex-shrink-0 h-9 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
              style={copied
                ? { background: 'rgba(34,197,94,0.2)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.4)' }
                : { background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.12)' }
              }
            >
              {copied ? <FiCheck className="w-3.5 h-3.5" strokeWidth={3} /> : <FiLink className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </motion.button>
          </div>
        </div>

        {/* Social platforms */}
        <div className="px-6 pb-8">
          <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-4">Share via</p>
          <div className="grid grid-cols-3 gap-3">
            {socials.map((social) => {
              const Icon = social.icon;
              return (
                <motion.button
                  key={social.name}
                  onClick={() => handleSocial(social)}
                  whileHover={{ scale: 1.07, y: -2 }}
                  whileTap={{ scale: 0.94 }}
                  className="flex flex-col items-center gap-2.5 py-4 rounded-2xl transition-all font-bold text-xs"
                  style={{
                    background: social.bg,
                    border: `1px solid ${social.border}`,
                    color: social.color,
                  }}
                >
                  <Icon className="text-2xl" style={{ color: social.color }} />
                  {social.name}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ShareModal;
