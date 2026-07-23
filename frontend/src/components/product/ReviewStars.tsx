import React from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

interface ReviewStarsProps {
  rating: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ReviewStars: React.FC<ReviewStarsProps> = ({ rating, className = '', size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-xl' : 'text-sm';
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  const stars = Array.from({ length: 5 }, (_, i) => {
    const pos = i + 1;
    if (pos <= fullStars) return <FaStar key={i} className={`text-amber-400 ${sizeClass}`} />;
    if (pos === fullStars + 1 && hasHalf) return <FaStarHalfAlt key={i} className={`text-amber-400 ${sizeClass}`} />;
    return <FaRegStar key={i} className={`text-amber-400/40 ${sizeClass}`} />;
  });

  return <div className={`flex items-center space-x-0.5 ${className}`}>{stars}</div>;
};

export default ReviewStars;
