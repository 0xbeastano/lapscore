import React from 'react';

const Skeleton = ({ w = '100%', h = 16, rounded = 4, className = '' }) => (
  <div 
    className={`animate-shimmer relative overflow-hidden bg-[#1e1e38] ${className}`}
    style={{
      width: w,
      height: h,
      borderRadius: rounded,
      background: 'linear-gradient(90deg, #1e1e38 25%, #2d2d50 50%, #1e1e38 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }} 
  />
);

export default Skeleton;
