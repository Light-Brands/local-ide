'use client';

import { useState, useEffect } from 'react';
import { useIDEStore } from '../stores/ideStore';

const MOBILE_BREAKPOINT = 768;

export function useMobileDetect() {
  const [isMobile, setIsMobile] = useState(false);
  const setStoreMobile = useIDEStore((state) => state.setIsMobile);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      setStoreMobile(mobile);
    };

    // Initial check
    checkMobile();

    // Listen for resize events
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [setStoreMobile]);

  return isMobile;
}

// Hook to get mobile state from store (for components that don't need to detect)
export function useIsMobile() {
  return useIDEStore((state) => state.isMobile);
}
