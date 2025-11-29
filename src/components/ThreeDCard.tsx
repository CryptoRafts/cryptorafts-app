'use client';

import React, { useRef, useState, useEffect } from 'react';

interface ThreeDCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  perspective?: number;
  glowColor?: string;
  hoverScale?: number;
}

export default function ThreeDCard({
  children,
  className = '',
  intensity = 15,
  perspective = 1000,
  glowColor = 'rgba(56, 189, 248, 0.3)',
  hoverScale = 1.02
}: ThreeDCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -intensity;
      const rotateY = ((x - centerX) / centerX) * intensity;
      
      setTransform(`perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${hoverScale})`);
    };

    const handleMouseLeave = () => {
      setTransform(`perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`);
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [intensity, perspective, hoverScale]);

  return (
    <div
      ref={cardRef}
      className={`relative transition-all duration-300 ease-out ${className}`}
      style={{
        transform: transform || 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${glowColor}, transparent 70%)`,
          filter: 'blur(20px)',
          transform: 'translateZ(-50px)',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10" style={{ transform: 'translateZ(20px)' }}>
        {children}
      </div>
    </div>
  );
}

