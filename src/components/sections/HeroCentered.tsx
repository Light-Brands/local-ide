'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { gsap } from 'gsap';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeroCenteredProps {
  badge?: { text: string; href?: string };
  title: string;
  titleHighlight?: string;
  description: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string; icon?: 'arrow' | 'play' };
  trustedBy?: { label: string; logos: React.ReactNode[] };
}

export function HeroCentered({
  badge,
  title,
  titleHighlight,
  description,
  primaryCta = { label: 'Get Started', href: '#' },
  secondaryCta,
  trustedBy,
}: HeroCenteredProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [isHoveredPrimary, setIsHoveredPrimary] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Prevent hydration mismatch by deferring animated title rendering
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Parallax scroll effect
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Smooth spring physics for parallax
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Parallax transforms with organic easing
  const backgroundY = useTransform(smoothProgress, [0, 1], ['0%', '25%']);
  const contentY = useTransform(smoothProgress, [0, 1], ['0px', '80px']);
  const contentOpacity = useTransform(smoothProgress, [0, 0.3], [1, 0]);
  const orbScale = useTransform(smoothProgress, [0, 0.5], [1, 1.2]);
  const orbOpacity = useTransform(smoothProgress, [0, 0.4], [1, 0.3]);

  useEffect(() => {
    // Simple fade-in animation for the title (no word splitting to avoid hydration issues)
    if (!hasMounted) return;

    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current,
          { opacity: 0, y: 40, filter: 'blur(4px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.8,
            ease: 'power3.out',
            delay: 0.2,
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [hasMounted]);

  // Render title with optional highlight
  // Always returns plain text/fragments to avoid hydration mismatch
  const renderTitle = () => {
    if (!titleHighlight) {
      return title;
    }

    // Use fragments instead of spans to avoid element mismatch
    const parts = title.split(titleHighlight);
    return (
      <>
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {part}
            {i < parts.length - 1 && (
              <span className="gradient-text">{titleHighlight}</span>
            )}
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100svh] flex items-center justify-center overflow-hidden"
    >
      {/* Layered Background - Refined with depth */}
      <motion.div
        style={{ y: backgroundY }}
        className="absolute inset-0 bg-neutral-50 dark:bg-neutral-950"
      />

      {/* Mesh gradient with parallax */}
      <motion.div
        style={{ y: backgroundY }}
        className="absolute inset-0 mesh-gradient opacity-80 dark:opacity-60"
      />

      {/* Gradient fade to content sections */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/80 dark:to-neutral-950/90" />

      {/* Decorative orbs - Refined with organic positioning */}
      <motion.div
        style={{ scale: orbScale, opacity: orbOpacity }}
        className="absolute top-[15%] left-[20%] w-[500px] h-[500px] bg-primary-500/8 dark:bg-primary-400/15 rounded-full blur-[100px] animate-breathe"
      />
      <motion.div
        style={{ scale: orbScale, opacity: orbOpacity }}
        className="absolute bottom-[20%] right-[15%] w-[450px] h-[450px] bg-secondary-500/6 dark:bg-secondary-400/12 rounded-full blur-[80px] animate-breathe delay-700"
      />
      {/* Accent orb - asymmetric placement */}
      <motion.div
        style={{ scale: orbScale, opacity: orbOpacity }}
        className="absolute top-[60%] left-[5%] w-[300px] h-[300px] bg-pink-500/4 dark:bg-pink-400/8 rounded-full blur-[60px] animate-breathe delay-1000"
      />

      {/* Content */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="container-premium relative z-10 pt-28 pb-16 lg:pt-36 lg:pb-24"
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge - Refined with subtle animation */}
          {badge && (
            <motion.div
              initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {badge.href ? (
                <Link
                  href={badge.href}
                  className={cn(
                    'group inline-flex items-center gap-2.5 px-4 py-2 mb-8',
                    'bg-white/80 dark:bg-neutral-900/60',
                    'text-primary-600 dark:text-primary-400',
                    'text-sm font-medium rounded-full',
                    'border border-neutral-200/60 dark:border-neutral-700/50',
                    'shadow-sm hover:shadow-md',
                    'backdrop-blur-sm',
                    'hover:border-primary-200 dark:hover:border-primary-700/50',
                    'transition-all duration-300 ease-out'
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary-500 animate-pulse-subtle" />
                  <span>{badge.text}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                </Link>
              ) : (
                <span
                  className={cn(
                    'inline-flex items-center gap-2.5 px-4 py-2 mb-8',
                    'bg-white/80 dark:bg-neutral-900/60',
                    'text-primary-600 dark:text-primary-400',
                    'text-sm font-medium rounded-full',
                    'border border-neutral-200/60 dark:border-neutral-700/50',
                    'shadow-sm backdrop-blur-sm'
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary-500 animate-pulse-subtle" />
                  {badge.text}
                </span>
              )}
            </motion.div>
          )}

          {/* Title - Refined typography */}
          <h1
            ref={titleRef}
            className={cn(
              'text-[2.5rem] sm:text-5xl md:text-6xl lg:text-[4.25rem] xl:text-7xl',
              'font-extrabold tracking-display leading-[1.05]',
              'text-neutral-900 dark:text-white',
              'mb-6 lg:mb-8',
              'text-balance'
            )}
          >
            {renderTitle()}
          </h1>

          {/* Description - Refined with better line length */}
          <motion.p
            initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'text-lg md:text-xl lg:text-[1.375rem]',
              'text-neutral-600 dark:text-neutral-400',
              'max-w-2xl mx-auto mb-10 lg:mb-12',
              'leading-relaxed tracking-normal'
            )}
          >
            {description}
          </motion.p>

          {/* CTAs - Refined with premium interactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {/* Primary CTA - Premium with glow effect */}
            <Link
              href={primaryCta.href}
              onMouseEnter={() => setIsHoveredPrimary(true)}
              onMouseLeave={() => setIsHoveredPrimary(false)}
              className={cn(
                'group relative flex items-center gap-2 px-7 py-3.5 lg:px-8 lg:py-4',
                'bg-neutral-900 dark:bg-white',
                'text-white dark:text-neutral-900',
                'text-base font-semibold rounded-xl lg:rounded-2xl',
                'shadow-lg',
                'hover:bg-neutral-800 dark:hover:bg-neutral-50',
                'transition-all duration-300 ease-out',
                'overflow-hidden'
              )}
            >
              {/* Glow effect on hover */}
              <span
                className={cn(
                  'absolute inset-0 -z-10 rounded-inherit',
                  'bg-gradient-to-r from-primary-500/20 to-secondary-500/20',
                  'blur-xl transition-opacity duration-500',
                  isHoveredPrimary ? 'opacity-100' : 'opacity-0'
                )}
              />
              <span className="relative">{primaryCta.label}</span>
              <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>

            {secondaryCta && (
              <Link
                href={secondaryCta.href}
                className={cn(
                  'group flex items-center gap-2 px-7 py-3.5 lg:px-8 lg:py-4',
                  'text-neutral-700 dark:text-neutral-300',
                  'text-base font-semibold rounded-xl lg:rounded-2xl',
                  'border border-neutral-200 dark:border-neutral-700',
                  'hover:border-neutral-300 dark:hover:border-neutral-600',
                  'hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50',
                  'transition-all duration-300 ease-out',
                  'backdrop-blur-sm'
                )}
              >
                {secondaryCta.icon === 'play' && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors duration-200">
                    <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                  </span>
                )}
                {secondaryCta.label}
                {secondaryCta.icon === 'arrow' && (
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                )}
              </Link>
            )}
          </motion.div>

          {/* Trusted By - Refined with better spacing */}
          {trustedBy && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="mt-16 lg:mt-20"
            >
              <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-5 tracking-wide uppercase font-medium">
                {trustedBy.label}
              </p>
              <div className="flex items-center justify-center flex-wrap gap-x-10 gap-y-4 opacity-50 hover:opacity-70 transition-opacity duration-500">
                {trustedBy.logos}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Scroll indicator - Refined */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 rounded-full border-2 border-neutral-300 dark:border-neutral-700 flex justify-center pt-2"
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5], y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1 h-2 bg-neutral-400 dark:bg-neutral-600 rounded-full"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

export default HeroCentered;
