// Global loading component for Next.js navigation - FIXED: Black background
import UnifiedLoadingScreen from '@/components/UnifiedLoadingScreen';

export default function Loading() {
  return <UnifiedLoadingScreen message="Loading..." size="md" showLogo={true} />;
}
