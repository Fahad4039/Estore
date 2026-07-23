import React, { useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';
import { FiTrash2, FiMinus, FiPlus } from 'react-icons/fi';

interface CartItemProps {
  item: import('../../store/cartStore').CartItem;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeItem } = useCartStore();
  const [removing, setRemoving] = useState(false);

  const handleRemove = () => {
    setRemoving(true);
    setTimeout(() => removeItem(item.id), 320);
  };

  return (
    <AnimatePresence>
      {!removing && (
        <motion.div
          layout
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -60, scale: 0.93 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="group flex items-start gap-5 py-6 border-b border-white/6 last:border-0"
        >
          {/* 3D product image */}
          <Link href={`/product/${item.id}`}>
            <motion.div
              whileHover={{ scale: 1.06, y: -4 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0 rounded-2xl cursor-pointer"
              style={{ perspective: '600px' }}
            >
              <div
                className="w-full h-full rounded-2xl overflow-hidden"
                style={{
                  boxShadow: '0 10px 28px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.09)',
                }}
              >
                <img
                  src={item.images[0]}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-112 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            </motion.div>
          </Link>

          <div className="flex-1 min-w-0">
            {/* brand */}
            <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.22em] mb-0.5">{item.brand}</p>

            {/* name */}
            <Link href={`/product/${item.id}`}>
              <p className="font-bold text-sm sm:text-base leading-snug line-clamp-2 hover:text-primary transition-colors cursor-pointer">
                {item.name}
              </p>
            </Link>

            {/* price */}
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-primary font-black text-lg sm:text-xl">
                PKR {(item.price * item.quantity).toFixed(0)}
              </span>
              {item.quantity > 1 && (
                <span className="text-xs text-muted-foreground font-normal">
                  (PKR {item.price.toFixed(0)} each)
                </span>
              )}
            </div>

            {/* quantity + remove */}
            <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
              {/* stepper */}
              <div
                className="flex items-center gap-1 rounded-xl p-1"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
                }}
              >
                <motion.button
                  whileTap={{ scale: 0.78 }}
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/12 disabled:opacity-25 transition-colors"
                >
                  <FiMinus className="w-3.5 h-3.5" />
                </motion.button>
                <span className="w-8 text-center font-black text-sm select-none">{item.quantity}</span>
                <motion.button
                  whileTap={{ scale: 0.78 }}
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/12 disabled:opacity-25 transition-colors"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                </motion.button>
              </div>

              {/* remove button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleRemove}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/15 transition-all"
              >
                <FiTrash2 className="w-3.5 h-3.5" /> Remove
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CartItem;
