'use client';

import { useState, useEffect } from 'react';
import { useIDEStore } from '../store';

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export function useMobileDetect() {
  const [mounted, setMounted] = useState(false);
  const setIsMobile = useIDEStore((state) => state.setIsMobile);
  const isMobile = useIDEStore((state) => state.ui.isMobile);

  useEffect(() => {
    setMounted(true);

    const checkMobile = () => {
      const width = window.innerWidth;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Consider mobile if:
      // 1. Width is less than mobile breakpoint, OR
      // 2. Touch device with width less than tablet breakpoint
      const mobile = width < MOBILE_BREAKPOINT || (isTouchDevice && width < TABLET_BREAKPOINT);

      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  return {
    isMobile: mounted ? isMobile : false,
    isTablet: mounted ? window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT : false,
    isDesktop: mounted ? window.innerWidth >= TABLET_BREAKPOINT : true,
    mounted,
  };
}

export function useViewportHeight() {
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    const updateHeight = () => {
      // Use visualViewport for accurate mobile height (handles keyboard)
      const vh = window.visualViewport?.height || window.innerHeight;
      setHeight(vh);
      // Update CSS custom property
      document.documentElement.style.setProperty('--vh', `${vh * 0.01}px`);
    };

    updateHeight();

    window.addEventListener('resize', updateHeight);
    window.visualViewport?.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
      window.visualViewport?.removeEventListener('resize', updateHeight);
    };
  }, []);

  return height;
}
