/**
 * UI Control Theme Tokens
 * 
 * This file defines the structure and default values for all UI theme tokens
 * that can be controlled through the Admin UI Control Mode.
 */

export interface ThemeTokens {
  brand: {
    logoUrl: string;
    logoWidth: number;
    logoHeight: number;
    logoPosition: 'top-left' | 'top-center' | 'top-right' | 'center';
    logoOpacity: number;
    faviconUrl: string;
  };
  
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    neutral: string;
    gradientStart: string;
    gradientEnd: string;
  };
  
  typography: {
    headingFont: string;
    bodyFont: string;
    monoFont: string;
    baseSize: number;
    scaleRatio: number;
    h1Size: string;
    h2Size: string;
    h3Size: string;
    h4Size: string;
    lineHeight: number;
    letterSpacing: number;
  };
  
  layout: {
    containerWidth: 'sm' | 'md' | 'lg' | 'xl' | 'fluid';
    gridColumns: number;
    gap: number;
    sectionPadding: number;
    borderRadius: number;
    shadowIntensity: number;
  };
  
  header: {
    height: number;
    padding: number;
    sticky: boolean;
    shadow: boolean;
    blur: boolean;
    transparency: number;
    menuLayout: 'inline' | 'drawer' | 'mega';
    collapseBreakpoint: 'sm' | 'md' | 'lg';
    ctaVisible: boolean;
  };
  
  buttons: {
    sizeScale: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    borderRadius: number;
    elevation: number;
    hoverScale: number;
    focusRing: boolean;
  };
  
  components: {
    cardRadius: number;
    cardShadow: boolean;
    cardHoverEffect: boolean;
    modalRadius: number;
    modalBackdrop: 'light' | 'dark' | 'blur';
    toastPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  };
  
  responsive: {
    breakpoints: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
    };
    mobileFirst: boolean;
    fluidTypography: boolean;
  };
}

export const defaultThemeTokens: ThemeTokens = {
  brand: {
    logoUrl: '/logo.png',
    logoWidth: 180,
    logoHeight: 45,
    logoPosition: 'top-left',
    logoOpacity: 1,
    faviconUrl: '/favicon.ico'
  },
  
  colors: {
    primary: '#9333ea', // Purple
    secondary: '#3b82f6', // Blue
    accent: '#f59e0b', // Orange
    background: '#111827', // Dark gray
    foreground: '#ffffff', // White
    success: '#10b981', // Green
    warning: '#f59e0b', // Orange
    error: '#ef4444', // Red
    info: '#3b82f6', // Blue
    neutral: '#6b7280', // Gray
    gradientStart: '#9333ea',
    gradientEnd: '#3b82f6'
  },
  
  typography: {
    headingFont: 'Inter, system-ui, sans-serif',
    bodyFont: 'Inter, system-ui, sans-serif',
    monoFont: 'Monaco, Courier New, monospace',
    baseSize: 16,
    scaleRatio: 1.25,
    h1Size: '3rem',
    h2Size: '2.5rem',
    h3Size: '2rem',
    h4Size: '1.5rem',
    lineHeight: 1.6,
    letterSpacing: 0
  },
  
  layout: {
    containerWidth: 'xl',
    gridColumns: 12,
    gap: 24,
    sectionPadding: 80,
    borderRadius: 12,
    shadowIntensity: 0.15
  },
  
  header: {
    height: 72,
    padding: 16,
    sticky: true,
    shadow: true,
    blur: true,
    transparency: 0.95,
    menuLayout: 'inline',
    collapseBreakpoint: 'md',
    ctaVisible: true
  },
  
  buttons: {
    sizeScale: 'md',
    borderRadius: 8,
    elevation: 1,
    hoverScale: 1.02,
    focusRing: true
  },
  
  components: {
    cardRadius: 16,
    cardShadow: true,
    cardHoverEffect: true,
    modalRadius: 16,
    modalBackdrop: 'blur',
    toastPosition: 'top-right'
  },
  
  responsive: {
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    },
    mobileFirst: true,
    fluidTypography: true
  }
};

/**
 * Convert theme tokens to CSS variables
 */
export function tokensToCSSVariables(tokens: ThemeTokens): Record<string, string> {
  return {
    '--color-primary': tokens.colors.primary,
    '--color-secondary': tokens.colors.secondary,
    '--color-accent': tokens.colors.accent,
    '--color-background': tokens.colors.background,
    '--color-foreground': tokens.colors.foreground,
    '--color-success': tokens.colors.success,
    '--color-warning': tokens.colors.warning,
    '--color-error': tokens.colors.error,
    '--color-info': tokens.colors.info,
    '--font-heading': tokens.typography.headingFont,
    '--font-body': tokens.typography.bodyFont,
    '--font-mono': tokens.typography.monoFont,
    '--text-base': `${tokens.typography.baseSize}px`,
    '--h1-size': tokens.typography.h1Size,
    '--h2-size': tokens.typography.h2Size,
    '--h3-size': tokens.typography.h3Size,
    '--h4-size': tokens.typography.h4Size,
    '--line-height': tokens.typography.lineHeight.toString(),
    '--border-radius': `${tokens.layout.borderRadius}px`,
    '--header-height': `${tokens.header.height}px`,
    '--button-radius': `${tokens.buttons.borderRadius}px`,
    '--card-radius': `${tokens.components.cardRadius}px`
  };
}

/**
 * Apply theme tokens to the document
 */
export function applyThemeTokens(tokens: ThemeTokens): void {
  const cssVariables = tokensToCSSVariables(tokens);
  const root = document.documentElement;
  
  Object.entries(cssVariables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}
