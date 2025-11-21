import { useEffect, useRef, useState } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPullDistance?: number;
  enabled?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPullDistance = 150,
  enabled = true,
}: PullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const scrollableRef = useRef<HTMLElement | null>(null);

  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
      };
      navigator.vibrate(patterns[style]);
    }
  };

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      const scrollable = scrollableRef.current || document.documentElement;
      if (scrollable.scrollTop === 0) {
        touchStartY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const scrollable = scrollableRef.current || document.documentElement;
      if (scrollable.scrollTop > 0 || isRefreshing) return;

      const touchY = e.touches[0].clientY;
      const distance = touchY - touchStartY.current;

      if (distance > 0) {
        e.preventDefault();
        const dampedDistance = Math.min(
          distance * 0.5,
          maxPullDistance
        );
        setPullDistance(dampedDistance);
        setIsPulling(true);

        // Light haptic when reaching threshold
        if (dampedDistance >= threshold && pullDistance < threshold) {
          triggerHaptic('medium');
        }
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        triggerHaptic('heavy');
        
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
          setIsPulling(false);
        }
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, pullDistance, threshold, maxPullDistance, isRefreshing, onRefresh]);

  return {
    isPulling,
    pullDistance,
    isRefreshing,
    setScrollableRef: (ref: HTMLElement | null) => {
      scrollableRef.current = ref;
    },
  };
}
