'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowUpRight, Check, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type CardVariant = 'default' | 'elevated' | 'bordered' | 'glass' | 'gradient';

interface CardProps {
  variant?: CardVariant;
  children: React.ReactNode;
  className?: string;
  href?: string;
  hover?: boolean;
}

// Refined variant styles with better depth
const variantStyles: Record<CardVariant, string> = {
  default: cn(
    'bg-white dark:bg-neutral-900',
    'border border-neutral-200/80 dark:border-neutral-800/80'
  ),
  elevated: cn(
    'bg-white dark:bg-neutral-900',
    'shadow-lg shadow-neutral-900/[0.04] dark:shadow-neutral-950/20'
  ),
  bordered: cn(
    'bg-transparent',
    'border border-neutral-200 dark:border-neutral-800'
  ),
  glass: cn(
    'bg-white/60 dark:bg-neutral-900/60',
    'backdrop-blur-xl backdrop-saturate-150',
    'border border-white/30 dark:border-neutral-700/30',
    'shadow-lg shadow-neutral-900/[0.04]'
  ),
  gradient: cn(
    'bg-white dark:bg-neutral-900',
    'border border-neutral-200/60 dark:border-neutral-800/60'
  ),
};

export function Card({
  variant = 'default',
  children,
  className,
  href,
  hover = true,
}: CardProps) {
  const baseStyles = cn(
    'rounded-2xl overflow-hidden',
    hover && 'transition-all duration-400 ease-out',
    hover && 'hover:shadow-xl hover:shadow-neutral-900/[0.08] dark:hover:shadow-neutral-950/30',
    hover && 'hover:-translate-y-[3px]',
    hover && 'hover:border-neutral-300/80 dark:hover:border-neutral-700/80',
    variantStyles[variant],
    className
  );

  if (href) {
    return (
      <Link href={href} className={cn(baseStyles, 'block')}>
        {children}
      </Link>
    );
  }

  return <div className={baseStyles}>{children}</div>;
}

// Feature Card with icon - Refined with premium styling
interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  gradient?: boolean;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
  gradient = false,
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card
        variant={gradient ? 'gradient' : 'default'}
        href={href}
        className="group p-6 lg:p-7 h-full"
      >
        {/* Icon container - Refined with better depth */}
        <div
          className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center mb-5',
            'transition-all duration-300',
            gradient
              ? 'bg-gradient-to-br from-primary-500 to-secondary-500 shadow-lg shadow-primary-500/20'
              : cn(
                  'bg-primary-50 dark:bg-primary-950/50',
                  'group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50',
                  'group-hover:shadow-md group-hover:shadow-primary-500/10'
                )
          )}
        >
          <Icon
            className={cn(
              'w-5 h-5 transition-transform duration-300 group-hover:scale-110',
              gradient ? 'text-white' : 'text-primary-600 dark:text-primary-400'
            )}
          />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2.5 tracking-tight">
          {title}
        </h3>

        {/* Description */}
        <p className="text-neutral-600 dark:text-neutral-400 text-[15px] leading-relaxed">
          {description}
        </p>

        {/* Learn more link */}
        {href && (
          <div className="mt-5 flex items-center gap-1.5 text-primary-600 dark:text-primary-400 text-sm font-medium">
            <span className="group-hover:underline underline-offset-2">Learn more</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// Interactive 3D Card with mouse tracking - Refined
interface Interactive3DCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

export function Interactive3DCard({
  children,
  className,
  intensity = 10,
}: Interactive3DCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smoother spring physics
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [intensity, -intensity]), {
    stiffness: 250,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-intensity, intensity]), {
    stiffness: 250,
    damping: 30,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set((e.clientX - centerX) / rect.width);
    mouseY.set((e.clientY - centerY) / rect.height);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={cn(
        'relative rounded-2xl',
        'bg-white dark:bg-neutral-900',
        'border border-neutral-200/80 dark:border-neutral-800/80',
        'transition-shadow duration-400',
        isHovered && 'shadow-2xl shadow-neutral-900/[0.1] dark:shadow-neutral-950/40',
        className
      )}
    >
      {/* Gradient overlay on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/5 to-secondary-500/5 pointer-events-none"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{ opacity: isHovered ? 0.08 : 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: `radial-gradient(circle at ${(mouseX.get() + 0.5) * 100}% ${(mouseY.get() + 0.5) * 100}%, white 0%, transparent 50%)`,
        }}
      />

      <div style={{ transform: 'translateZ(40px)' }}>{children}</div>
    </motion.div>
  );
}

// Pricing Card - Refined with premium styling
interface PricingCardProps {
  name: string;
  description: string;
  price: string | number;
  period?: string;
  features: string[];
  cta: { label: string; href: string };
  popular?: boolean;
}

export function PricingCard({
  name,
  description,
  price,
  period = '/month',
  features,
  cta,
  popular = false,
}: PricingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: popular ? -6 : -4 }}
      className={cn(
        'relative rounded-2xl p-7 lg:p-8',
        'transition-shadow duration-400',
        popular
          ? cn(
              'bg-neutral-900 dark:bg-white',
              'border-2 border-primary-500/80',
              'shadow-xl shadow-primary-500/10',
              'hover:shadow-2xl hover:shadow-primary-500/15'
            )
          : cn(
              'bg-white dark:bg-neutral-900',
              'border border-neutral-200/80 dark:border-neutral-800/80',
              'hover:shadow-xl hover:shadow-neutral-900/[0.08]'
            )
      )}
    >
      {/* Popular badge - Refined positioning */}
      {popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-xs font-semibold rounded-full shadow-lg shadow-primary-500/25">
            Most Popular
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-5">
        <h3
          className={cn(
            'text-lg font-semibold mb-1.5 tracking-tight',
            popular ? 'text-white dark:text-neutral-900' : 'text-neutral-900 dark:text-white'
          )}
        >
          {name}
        </h3>
        <p
          className={cn(
            'text-sm',
            popular ? 'text-neutral-400 dark:text-neutral-600' : 'text-neutral-500'
          )}
        >
          {description}
        </p>
      </div>

      {/* Price - Refined typography */}
      <div className="mb-6 pb-6 border-b border-neutral-700/20 dark:border-neutral-200/10">
        <span
          className={cn(
            'text-[3rem] font-bold tracking-tight leading-none',
            popular ? 'text-white dark:text-neutral-900' : 'text-neutral-900 dark:text-white'
          )}
        >
          {typeof price === 'number' ? `$${price}` : price}
        </span>
        <span
          className={cn(
            'text-sm ml-1',
            popular ? 'text-neutral-400 dark:text-neutral-600' : 'text-neutral-500'
          )}
        >
          {period}
        </span>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-7">
        {features.map((feature, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className={cn(
              'flex items-start gap-3 text-sm',
              popular ? 'text-neutral-300 dark:text-neutral-700' : 'text-neutral-600 dark:text-neutral-400'
            )}
          >
            <Check
              className={cn(
                'w-4.5 h-4.5 flex-shrink-0 mt-0.5',
                popular ? 'text-primary-400' : 'text-primary-500'
              )}
              strokeWidth={2.5}
            />
            <span>{feature}</span>
          </motion.li>
        ))}
      </ul>

      {/* CTA Button */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
      >
        <Link
          href={cta.href}
          className={cn(
            'block w-full py-3 text-center font-medium rounded-xl',
            'transition-all duration-200',
            popular
              ? cn(
                  'bg-white dark:bg-neutral-900',
                  'text-neutral-900 dark:text-white',
                  'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                  'shadow-sm'
                )
              : cn(
                  'bg-neutral-900 dark:bg-white',
                  'text-white dark:text-neutral-900',
                  'hover:bg-neutral-800 dark:hover:bg-neutral-100',
                  'shadow-sm'
                )
          )}
        >
          {cta.label}
        </Link>
      </motion.div>
    </motion.div>
  );
}

// Testimonial Card - Refined with premium styling
interface TestimonialCardProps {
  quote: string;
  author: {
    name: string;
    title: string;
    avatar?: string;
  };
  rating?: number;
}

export function TestimonialCard({ quote, author, rating }: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card variant="glass" className="group p-6 lg:p-7 h-full">
        {/* Rating stars */}
        {rating && (
          <div className="flex gap-1 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.svg
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className={cn(
                  'w-4 h-4',
                  i < rating ? 'text-amber-400' : 'text-neutral-200 dark:text-neutral-700'
                )}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </motion.svg>
            ))}
          </div>
        )}

        {/* Quote - Refined typography */}
        <blockquote className="text-[15px] lg:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
          &ldquo;{quote}&rdquo;
        </blockquote>

        {/* Author */}
        <div className="flex items-center gap-3.5">
          {author.avatar ? (
            <Image
              src={author.avatar}
              alt={author.name}
              width={44}
              height={44}
              className="rounded-full ring-2 ring-white/80 dark:ring-neutral-800/80"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-primary-500/20">
              {author.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-semibold text-neutral-900 dark:text-white text-sm">
              {author.name}
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">{author.title}</div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default Card;
