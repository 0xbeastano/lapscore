import React from 'react';

const Card = ({
  children, 
  className = '',
  glow = false, 
  accent = null,
  onClick = null
}) => (
  <div 
    onClick={onClick}
    className={`
      rounded-[12px] border border-[#1e1e38]
      bg-[#0f0f1e] relative overflow-hidden
      transition-all duration-300
      ${onClick ? 'cursor-pointer' : ''}
      hover:border-[#2d2d50] hover:shadow-lg
      ${glow ? 'shadow-[0_0_20px_rgba(124,58,237,0.15)]' : ''}
      ${className}
    `}
  >
    {accent && (
      <div className={`
        absolute top-0 left-0 right-0 h-[1px]
        bg-gradient-to-r ${accent}
      `} />
    )}
    {children}
  </div>
);

export default Card;
