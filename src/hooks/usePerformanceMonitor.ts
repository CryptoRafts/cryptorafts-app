import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  loadTime: number;
  renderTime: number;
}

export const usePerformanceMonitor = () => {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const metrics = useRef<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    loadTime: 0,
    renderTime: 0
  });

  useEffect(() => {
    const startTime = performance.now();
    
    // Monitor FPS
    const measureFPS = () => {
      frameCount.current++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime.current >= 1000) {
        metrics.current.fps = frameCount.current;
        frameCount.current = 0;
        lastTime.current = currentTime;
        
        // Log performance warnings only for very low FPS
        if (metrics.current.fps < 20) {
          console.warn(`⚠️ Very low FPS detected: ${metrics.current.fps}fps`);
        }
      }
      
      requestAnimationFrame(measureFPS);
    };

    // Monitor memory usage
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        metrics.current.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
        
        if (metrics.current.memoryUsage > 100) {
          console.warn(`⚠️ High memory usage: ${metrics.current.memoryUsage.toFixed(2)}MB`);
        }
      }
    };

    // Start monitoring
    measureFPS();
    const memoryInterval = setInterval(measureMemory, 5000);

    // Measure load time
    const loadTime = performance.now() - startTime;
    metrics.current.loadTime = loadTime;
    
    console.log(`🚀 Homepage loaded in ${loadTime.toFixed(2)}ms`);

    // Cleanup
    return () => {
      clearInterval(memoryInterval);
    };
  }, []);

  return metrics.current;
};
