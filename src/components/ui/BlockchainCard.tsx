"use client";

import React from 'react';

interface BlockchainCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'glass' | 'solid' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
  glow?: boolean;
  animated?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}

const BlockchainCard: React.FC<BlockchainCardProps> = ({
  children,
  className = '',
  hoverable = false,
  clickable = false,
  onClick,
  variant = 'default',
  size = 'md',
  border = true,
  glow = false,
  animated = false,
  draggable = false,
  onDragStart
}) => {
  const variants = {
    default: 'bg-black/80',
    glass: 'bg-black/60 backdrop-blur-lg',
    solid: 'bg-black/80',
    gradient: 'bg-gradient-to-br from-black/80 to-black/60'
  };

  const sizes = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  return (
    <div
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      className={`
        relative overflow-hidden
        ${variants[variant]}
        ${sizes[size]}
        ${border ? 'border-2 border-cyan-400/20' : ''}
        ${clickable ? 'cursor-pointer' : ''}
        ${draggable ? 'cursor-move' : ''}
        rounded-xl
        transition-colors duration-200
        ${hoverable ? 'hover:bg-black/80 hover:border-cyan-400/50' : ''}
        shadow-cyan-500/10
        ${className}
      `}
    >
      {/* Simple background */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default BlockchainCard;
