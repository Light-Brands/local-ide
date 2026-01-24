import type { Metadata } from 'next';

/**
 * =============================================================================
 * PUBLIC LAYOUT
 * =============================================================================
 *
 * This layout wraps all your public-facing pages.
 * Add navigation, footers, analytics, etc. here.
 *
 * =============================================================================
 */

export const metadata: Metadata = {
  title: 'My App',
  description: 'Built with Local IDE',
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Add your navigation here */}
      {children}
      {/* Add your footer here */}
    </>
  );
}
