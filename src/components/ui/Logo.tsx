'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  href?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const sizeMap = {
  sm: { image: 120 },
  md: { image: 160 },
  lg: { image: 240 },
};

export function Logo({
  href = '/',
  className,
  size = 'md',
  onClick,
}: LogoProps) {
  const sizes = sizeMap[size];
  const logoContent = (
    <div className={cn('flex items-center gap-2', className)}>
      <Image
        src="/lb-logo.svg"
        alt="Light Brands"
        width={sizes.image}
        height={Math.round(sizes.image * 0.15)}
        className="object-contain invert dark:invert-0 transition-all duration-200"
        priority
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="inline-flex">
        {logoContent}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="inline-flex">
        {logoContent}
      </button>
    );
  }

  return logoContent;
}
