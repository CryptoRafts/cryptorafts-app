"use client";

import React from 'react';

interface AnimatedMenuButtonProps {
  onClick: () => void;
  isOpen: boolean;
  className?: string;
}

export default function AnimatedMenuButton({ onClick, isOpen, className = '' }: AnimatedMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`animated-menu-button ${className}`}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
      data-state={isOpen ? 'open' : 'closed'}
    >
      <div className="flex flex-col gap-1">
        <div 
          className={`menu-line w-4 h-0.5 transition-all duration-300 ${
            isOpen ? 'rotate-45 translate-y-1.5' : ''
          }`}
        />
        <div 
          className={`menu-line w-4 h-0.5 transition-all duration-300 ${
            isOpen ? 'opacity-0' : ''
          }`}
        />
        <div 
          className={`menu-line w-4 h-0.5 transition-all duration-300 ${
            isOpen ? '-rotate-45 -translate-y-1.5' : ''
          }`}
        />
      </div>
    </button>
  );
}
