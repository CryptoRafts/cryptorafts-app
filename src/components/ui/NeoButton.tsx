"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NeoButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  ariaLabel?: string;
  role?: string;
  tabIndex?: number;
}

const NeoButton: React.FC<NeoButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  fullWidth = false,
  icon,
  ariaLabel,
  role = 'button',
  tabIndex = 0
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  // Variants with neo blue blockchain theme
  const variants = {
    primary: {
      base: 'bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-600',
      hover: 'hover:from-cyan-400 hover:via-blue-400 hover:to-cyan-500',
      glow: 'shadow-[0_0_20px_rgba(56,189,248,0.4)]',
      hoverGlow: 'hover:shadow-[0_0_35px_rgba(56,189,248,0.6)]',
      border: 'border-cyan-400/50',
      text: 'text-white',
      pulseColor: 'rgba(56, 189, 248, 0.3)'
    },
    secondary: {
      base: 'bg-gradient-to-r from-purple-500 to-pink-500',
      hover: 'hover:from-purple-400 hover:to-pink-400',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]',
      hoverGlow: 'hover:shadow-[0_0_35px_rgba(168,85,247,0.6)]',
      border: 'border-purple-400/50',
      text: 'text-white',
      pulseColor: 'rgba(168, 85, 247, 0.3)'
    },
    success: {
      base: 'bg-gradient-to-r from-green-500 to-emerald-500',
      hover: 'hover:from-green-400 hover:to-emerald-400',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]',
      hoverGlow: 'hover:shadow-[0_0_35px_rgba(16,185,129,0.6)]',
      border: 'border-green-400/50',
      text: 'text-white',
      pulseColor: 'rgba(16, 185, 129, 0.3)'
    },
    danger: {
      base: 'bg-gradient-to-r from-red-500 to-rose-500',
      hover: 'hover:from-red-400 hover:to-rose-400',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]',
      hoverGlow: 'hover:shadow-[0_0_35px_rgba(239,68,68,0.6)]',
      border: 'border-red-400/50',
      text: 'text-white',
      pulseColor: 'rgba(239, 68, 68, 0.3)'
    },
    warning: {
      base: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      hover: 'hover:from-yellow-400 hover:to-orange-400',
      glow: 'shadow-[0_0_20px_rgba(251,146,60,0.4)]',
      hoverGlow: 'hover:shadow-[0_0_35px_rgba(251,146,60,0.6)]',
      border: 'border-yellow-400/50',
      text: 'text-white',
      pulseColor: 'rgba(251, 146, 60, 0.3)'
    },
    ghost: {
      base: 'bg-white/5',
      hover: 'hover:bg-white/10',
      glow: 'shadow-[0_0_15px_rgba(255,255,255,0.1)]',
      hoverGlow: 'hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]',
      border: 'border-white/20',
      text: 'text-white',
      pulseColor: 'rgba(255, 255, 255, 0.2)'
    },
    outline: {
      base: 'bg-transparent',
      hover: 'hover:bg-cyan-500/10',
      glow: 'shadow-[0_0_15px_rgba(56,189,248,0.2)]',
      hoverGlow: 'hover:shadow-[0_0_30px_rgba(56,189,248,0.4)]',
      border: 'border-cyan-400/60',
      text: 'text-cyan-400',
      pulseColor: 'rgba(56, 189, 248, 0.2)'
    }
  };

  // Size mappings with AA/AAA compliant touch targets (minimum 44px)
  const sizes = {
    xs: 'px-3 py-2 text-xs min-h-[44px]',
    sm: 'px-4 py-2.5 text-sm min-h-[44px]',
    md: 'px-6 py-3 text-base min-h-[44px]',
    lg: 'px-8 py-4 text-lg min-h-[48px]',
    xl: 'px-10 py-5 text-xl min-h-[52px]'
  };

  const currentVariant = variants[variant];

  // Handle ripple effect
  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    
    setRipples(prev => [...prev, { id, x, y }]);
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id));
    }, 600);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    handleRipple(e);
    onClick?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as any);
    }
  };

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      role={role}
      tabIndex={disabled ? -1 : tabIndex}
      className={`
        relative overflow-hidden
        ${currentVariant.base}
        ${currentVariant.hover}
        ${currentVariant.glow}
        ${currentVariant.hoverGlow}
        ${currentVariant.border}
        ${currentVariant.text}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        rounded-xl
        border-2
        font-semibold
        transition-all
        duration-300
        ease-out
        transform
        active:scale-95
        ${isFocused ? 'ring-4 ring-cyan-400/50 ring-offset-2 ring-offset-gray-900' : ''}
        ${className}
      `}
      whileHover={!disabled && !loading ? { 
        scale: 1.05,
        transition: { duration: 0.2, ease: 'easeOut' }
      } : {}}
      whileTap={!disabled && !loading ? { 
        scale: 0.95,
        transition: { duration: 0.1 }
      } : {}}
      // Respect prefers-reduced-motion
      style={{
        willChange: 'transform',
      }}
    >
      {/* Neo Blockchain Animation Background */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          backgroundImage: [
            'linear-gradient(45deg, transparent 25%, rgba(56, 189, 248, 0.1) 50%, transparent 75%)',
            'linear-gradient(45deg, transparent 25%, rgba(56, 189, 248, 0.3) 50%, transparent 75%)',
            'linear-gradient(45deg, transparent 25%, rgba(56, 189, 248, 0.1) 50%, transparent 75%)'
          ],
          backgroundPosition: ['0% 0%', '200% 100%', '400% 200%']
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
          repeatDelay: 0
        }}
        style={{
          backgroundSize: '200% 200%'
        }}
      />

      {/* Blockchain Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(90deg, ${currentVariant.pulseColor} 1px, transparent 1px),
            linear-gradient(${currentVariant.pulseColor} 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          animation: 'blockchainMove 20s linear infinite'
        }}
      />

      {/* Pulse Animation */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        animate={{
          boxShadow: [
            `0 0 20px ${currentVariant.pulseColor}`,
            `0 0 35px ${currentVariant.pulseColor}`,
            `0 0 20px ${currentVariant.pulseColor}`
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />

      {/* Loading Spinner */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          >
            <motion.div
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button Content */}
      <motion.div
        className={`relative z-10 flex items-center justify-center gap-2 ${
          loading ? 'opacity-0' : 'opacity-100'
        }`}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {icon && (
          <motion.span
            className="flex items-center justify-center"
            animate={{ 
              scale: isHovered ? 1.1 : 1
            }}
            transition={{ duration: 0.3 }}
          >
            {icon}
          </motion.span>
        )}
        <span className="font-semibold">{children}</span>
      </motion.div>

      {/* Ripple Effects */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            className="absolute rounded-full bg-white/30 pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 20,
              height: 20,
              transform: 'translate(-50%, -50%)'
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Glow Effect on Hover */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-white/10"
        animate={{
          opacity: isHovered && !disabled && !loading ? 0.2 : 0,
          scale: isHovered ? 1.05 : 1
        }}
        transition={{ duration: 0.3 }}
      />

      {/* CSS Animation Keyframes Injected */}
      <style jsx>{`
        @keyframes blockchainMove {
          0% { transform: translateX(0) translateY(0); }
          100% { transform: translateX(20px) translateY(20px); }
        }
        
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </motion.button>
  );
};

export default NeoButton;

