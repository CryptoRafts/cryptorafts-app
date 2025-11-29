"use client";

import React from 'react';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  container?: 'responsive' | 'fluid' | 'constrained' | 'wide';
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export default function ResponsiveLayout({
  children,
  className = '',
  container = 'responsive',
  spacing = 'md',
  padding = 'md'
}: ResponsiveLayoutProps) {
  const containerClass = `container-${container}`;
  const spacingClass = `space-responsive-${spacing}`;
  const paddingClass = `p-responsive-${padding}`;

  return (
    <div className={`${containerClass} ${spacingClass} ${paddingClass} ${className}`}>
      {children}
    </div>
  );
}

// Responsive Grid Component
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'auto-fit' | 'auto-fill' | 'stack-mobile' | 'split-tablet' | 'multi-desktop';
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function ResponsiveGrid({
  children,
  className = '',
  variant = 'auto-fit',
  gap = 'md'
}: ResponsiveGridProps) {
  const gridClass = `grid-responsive grid-${variant}`;
  const gapClass = `gap-${gap}`;

  return (
    <div className={`${gridClass} ${gapClass} ${className}`}>
      {children}
    </div>
  );
}

// Responsive Card Component
interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
}

export function ResponsiveCard({
  children,
  className = '',
  variant = 'md',
  hover = true
}: ResponsiveCardProps) {
  const cardClass = `glass-card glass-panel-${variant}`;
  const hoverClass = hover ? 'hover:glass-panel-hover' : '';

  return (
    <div className={`${cardClass} ${hoverClass} ${className}`}>
      {children}
    </div>
  );
}

// Responsive Text Component
interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  color?: string;
}

export function ResponsiveText({
  children,
  className = '',
  variant = 'base',
  weight = 'normal',
  color = 'text-white'
}: ResponsiveTextProps) {
  const textClass = `text-responsive-${variant}`;
  const weightClass = `font-${weight}`;

  return (
    <span className={`${textClass} ${weightClass} ${color} ${className}`}>
      {children}
    </span>
  );
}

// Responsive Button Component
interface ResponsiveButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function ResponsiveButton({
  children,
  onClick,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button'
}: ResponsiveButtonProps) {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${variantClass} ${sizeClass} ${disabledClass} ${className}`}
    >
      {children}
    </button>
  );
}
