'use client';

// =============================================================================
// Feedback System - Single client component that renders all feedback UI
// Only renders in development mode to avoid SSR/SSG issues
// =============================================================================

import React, { useEffect, useState } from 'react';
import { FEEDBACK_ENABLED, isBrowser } from '@/lib/feedback';
import { FeedbackProvider } from '@/contexts/FeedbackContext';
import { FeedbackButton } from './FeedbackButton';
import { FeedbackMode } from './FeedbackMode';
import { FeedbackModal } from './FeedbackModal';
import { FeedbackMarkerLayer } from './FeedbackMarkerLayer';

interface FeedbackSystemProps {
  children: React.ReactNode;
}

export function FeedbackSystem({ children }: FeedbackSystemProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // In production or during SSR, just render children without feedback
  if (!FEEDBACK_ENABLED || !isBrowser || !mounted) {
    return <>{children}</>;
  }

  return (
    <FeedbackProvider>
      {children}
      <FeedbackButton />
      <FeedbackMode />
      <FeedbackModal />
      <FeedbackMarkerLayer />
    </FeedbackProvider>
  );
}
