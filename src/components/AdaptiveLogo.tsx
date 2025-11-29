"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface AdaptiveLogoProps {
  defaultLogoSrc?: string;
  smallScreenLogoSrc?: string;
  alt?: string;
  className?: string;
  priority?: boolean;
}

export default function AdaptiveLogo({
  defaultLogoSrc = "/cryptorafts.logo (1).svg",
  smallScreenLogoSrc = "/logofor-smallscreens.png",
  alt = "Cryptorafts",
  className = "logo-responsive",
  priority = false
}: AdaptiveLogoProps) {
  const [logoSrc, setLogoSrc] = useState(defaultLogoSrc);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const isSmall = width <= 480; // Switch to small logo at 480px and below
      setIsSmallScreen(isSmall);
      setLogoSrc(isSmall ? smallScreenLogoSrc : defaultLogoSrc);
    };

    // Check on mount
    checkScreenSize();

    // Listen for resize events
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [defaultLogoSrc, smallScreenLogoSrc]);

  return (
    <Image
      src={logoSrc}
      alt={alt}
      width={isSmallScreen ? 32 : 40}
      height={isSmallScreen ? 32 : 40}
      className={className}
      priority={priority}
      style={{
        height: 'auto',
        width: 'auto',
        maxHeight: isSmallScreen ? '2rem' : '3rem',
        objectFit: 'contain'
      }}
    />
  );
}
