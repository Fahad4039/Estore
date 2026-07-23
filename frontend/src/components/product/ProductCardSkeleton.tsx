import React from 'react';

const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col bg-card rounded-xl border border-border overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-square bg-secondary/60" />
      {/* Content Skeleton */}
      <div className="p-4 flex flex-col gap-3">
        <div className="h-3 w-1/3 bg-secondary/80 rounded-full" />
        <div className="h-4 w-4/5 bg-secondary/80 rounded-full" />
        <div className="h-4 w-3/5 bg-secondary/60 rounded-full" />
        <div className="flex items-center justify-between mt-1">
          <div className="h-5 w-1/3 bg-secondary/80 rounded-full" />
          <div className="h-5 w-1/4 bg-secondary/60 rounded-full" />
        </div>
        <div className="h-9 w-full bg-secondary/60 rounded-lg mt-1" />
      </div>
    </div>
  );
};

export const ProductListSkeleton: React.FC = () => (
  <div className="flex bg-card rounded-xl border border-border overflow-hidden p-4 gap-6 animate-pulse">
    <div className="w-40 h-40 flex-shrink-0 rounded-lg bg-secondary/60" />
    <div className="flex-1 flex flex-col gap-3 justify-center">
      <div className="h-3 w-1/4 bg-secondary/80 rounded-full" />
      <div className="h-5 w-1/2 bg-secondary/80 rounded-full" />
      <div className="h-4 w-3/4 bg-secondary/60 rounded-full" />
      <div className="h-4 w-3/5 bg-secondary/60 rounded-full" />
      <div className="flex items-center justify-between mt-2">
        <div className="h-6 w-1/4 bg-secondary/80 rounded-full" />
        <div className="h-9 w-32 bg-secondary/60 rounded-lg" />
      </div>
    </div>
  </div>
);

export default ProductCardSkeleton;
