import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';
import { useCartStore } from '../../store/cartStore';
import { FiX, FiShoppingCart, FiHeart } from 'react-icons/fi';
import ReviewStars from './ReviewStars';
import { Link, useLocation } from 'wouter';

const ProductQuickView: React.FC = () => {
  const { isQuickViewOpen, quickViewProduct, closeQuickView } = useUIStore();
  const { addItem } = useCartStore();
  const [, setLocation] = useLocation();

  if (!quickViewProduct) return null;

  const handleAddToCart = () => {
    addItem(quickViewProduct);
    closeQuickView();
  };

  const viewDetails = () => {
    closeQuickView();
    setLocation(`/product/${quickViewProduct.id}`);
  };

  return (
    <AnimatePresence>
      {isQuickViewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeQuickView}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
          >
            <button 
              onClick={closeQuickView}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 text-foreground hover:bg-secondary transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>

            {/* Image section */}
            <div className="w-full md:w-1/2 bg-secondary/30 relative flex items-center justify-center min-h-[300px] md:min-h-full">
              <img 
                src={quickViewProduct.images[0]} 
                alt={quickViewProduct.name} 
                className="max-w-full max-h-full object-contain p-8"
              />
              {quickViewProduct.discount > 0 && (
                <div className="absolute top-4 left-4 bg-destructive text-destructive-foreground font-bold px-3 py-1 rounded">
                  -{quickViewProduct.discount}%
                </div>
              )}
            </div>

            {/* Details section */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto">
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
                {quickViewProduct.brand}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                {quickViewProduct.name}
              </h2>
              
              <div className="flex items-center space-x-3 mb-6">
                <ReviewStars rating={quickViewProduct.rating} />
                <span className="text-sm text-muted-foreground">({quickViewProduct.reviewCount} reviews)</span>
              </div>

              <div className="flex items-end space-x-3 mb-6">
                <span className="text-3xl font-bold">PKR {quickViewProduct.price.toFixed(0)}</span>
                {quickViewProduct.originalPrice > quickViewProduct.price && (
                  <span className="text-lg text-muted-foreground line-through mb-1">
                    PKR {quickViewProduct.originalPrice.toFixed(0)}
                  </span>
                )}
              </div>

              <p className="text-muted-foreground text-sm leading-relaxed mb-8 line-clamp-4">
                {quickViewProduct.description}
              </p>

              <div className="mt-auto space-y-3">
                <button 
                  onClick={handleAddToCart}
                  className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <FiShoppingCart className="w-5 h-5" />
                  <span>Add to Cart</span>
                </button>
                <button 
                  onClick={viewDetails}
                  className="w-full py-3.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-lg transition-colors"
                >
                  View Full Details
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProductQuickView;
