"use client";

import React from 'react';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  noPadding?: boolean;
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  size = 'xl',
  noPadding = false
}) => {
  const sizeClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    xl: 'max-w-screen-2xl',
    full: 'max-w-full'
  };

  const paddingClasses = noPadding 
    ? '' 
    : 'px-4 sm:px-6 lg:px-8';

  return (
    <div className={`w-full mx-auto ${sizeClasses[size]} ${paddingClasses} ${className}`}>
      {children}
    </div>
  );
};

// Responsive Grid Component
export const ResponsiveGrid: React.FC<{
  children: React.ReactNode;
  cols?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ children, cols = { xs: 1, sm: 2, md: 3, lg: 4 }, gap = 'md', className = '' }) => {
  const gapClasses = {
    xs: 'gap-2',
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12'
  };

  const colClasses = `
    grid-cols-${cols.xs || 1}
    ${cols.sm ? `sm:grid-cols-${cols.sm}` : ''}
    ${cols.md ? `md:grid-cols-${cols.md}` : ''}
    ${cols.lg ? `lg:grid-cols-${cols.lg}` : ''}
    ${cols.xl ? `xl:grid-cols-${cols.xl}` : ''}
  `.trim();

  return (
    <div className={`grid ${colClasses} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

// Responsive Stack Component
export const ResponsiveStack: React.FC<{
  children: React.ReactNode;
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;
  className?: string;
}> = ({ 
  children, 
  direction = 'col', 
  gap = 'md', 
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className = '' 
}) => {
  const directionClasses = {
    row: 'flex-row',
    col: 'flex-col',
    'row-reverse': 'flex-row-reverse',
    'col-reverse': 'flex-col-reverse'
  };

  const gapClasses = {
    xs: 'gap-2',
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around'
  };

  return (
    <div 
      className={`
        flex 
        ${directionClasses[direction]} 
        ${gapClasses[gap]} 
        ${alignClasses[align]}
        ${justifyClasses[justify]}
        ${wrap ? 'flex-wrap' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Responsive Card Component
export const ResponsiveCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  glass?: boolean;
}> = ({ children, className = '', padding = 'md', hover = true, glass = true }) => {
  const paddingClasses = {
    xs: 'p-3 sm:p-4',
    sm: 'p-4 sm:p-5',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
    xl: 'p-8 sm:p-10'
  };

  const hoverClass = hover 
    ? 'hover:bg-white/10 hover:border-cyan-400/30 hover:shadow-[0_0_30px_rgba(56,189,248,0.15)] transition-all duration-300' 
    : '';

  const glassClass = glass
    ? 'bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl shadow-lg'
    : '';

  return (
    <div className={`${glassClass} ${paddingClasses[padding]} ${hoverClass} ${className}`}>
      {children}
    </div>
  );
};

// Show/Hide based on breakpoint
export const ShowOn: React.FC<{
  children: React.ReactNode;
  breakpoint: 'sm' | 'md' | 'lg' | 'xl';
}> = ({ children, breakpoint }) => {
  const classes = {
    sm: 'hidden sm:block',
    md: 'hidden md:block',
    lg: 'hidden lg:block',
    xl: 'hidden xl:block'
  };

  return <div className={classes[breakpoint]}>{children}</div>;
};

export const HideOn: React.FC<{
  children: React.ReactNode;
  breakpoint: 'sm' | 'md' | 'lg' | 'xl';
}> = ({ children, breakpoint }) => {
  const classes = {
    sm: 'sm:hidden',
    md: 'md:hidden',
    lg: 'lg:hidden',
    xl: 'xl:hidden'
  };

  return <div className={classes[breakpoint]}>{children}</div>;
};

export default ResponsiveContainer;

