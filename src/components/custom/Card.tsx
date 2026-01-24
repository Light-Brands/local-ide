'use client';

import { cn } from '@/lib/utils';

/**
 * =============================================================================
 * CUSTOM CARD COMPONENT
 * =============================================================================
 *
 * This is YOUR component. Customize it however you want.
 * Create more components in this folder - they're all yours.
 *
 * Usage:
 *   import { Card } from '@/components/custom/Card';
 *
 *   <Card title="Hello">Content here</Card>
 *
 * =============================================================================
 */

interface CardProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'outline';
}

export function Card({
  title,
  description,
  children,
  className,
  variant = 'default',
}: CardProps) {
  const variants = {
    default: 'bg-neutral-800/50 border-neutral-700/50',
    gradient: 'bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-700/30',
    outline: 'bg-transparent border-neutral-600',
  };

  return (
    <div
      className={cn(
        'rounded-2xl border p-6 backdrop-blur transition-all hover:border-neutral-600',
        variants[variant],
        className
      )}
    >
      {title && (
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-neutral-400 mb-4">{description}</p>
      )}
      {children}
    </div>
  );
}

/**
 * Card Grid - for laying out multiple cards
 */
export function CardGrid({
  children,
  columns = 3,
  className,
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const colsClass = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  };

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6',
        colsClass[columns],
        className
      )}
    >
      {children}
    </div>
  );
}
