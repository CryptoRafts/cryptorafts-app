"use client";

/**
 * Utility functions for handling images in the application
 */

/**
 * Check if an image URL is valid for Next.js Image component
 * Next.js Image requires either:
 * - Relative path starting with "/"
 * - Absolute URL (http:// or https://)
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  
  // Check if it's a relative path starting with "/"
  if (url.startsWith('/')) return true;
  
  // Check if it's an absolute URL
  if (url.startsWith('http://') || url.startsWith('https://')) return true;
  
  // Check if it's a data URL (base64)
  if (url.startsWith('data:')) return true;
  
  return false;
}

/**
 * Get a fallback avatar component props
 */
export function getFallbackAvatarProps(displayName?: string, size: number = 32) {
  const initial = displayName?.charAt(0).toUpperCase() || 'U';
  
  return {
    className: `w-${size} h-${size} rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center border-2 border-white/20`,
    initial
  };
}

/**
 * Get profile image props for Next.js Image component
 */
export function getProfileImageProps(
  imageUrl?: string, 
  displayName?: string, 
  size: number = 32
): { type: 'image'; src: string; alt: string; width: number; height: number; className: string; style: Record<string, string> } | { type: 'fallback'; className: string; initial: string } {
  if (imageUrl && isValidImageUrl(imageUrl)) {
    return {
      type: 'image' as const,
      src: imageUrl,
      alt: 'Profile',
      width: size,
      height: size,
      className: 'rounded-full border-2 border-white/20',
      style: { width: 'auto', height: 'auto' }
    };
  }
  
  return {
    type: 'fallback' as const,
    ...getFallbackAvatarProps(displayName, size)
  };
}
