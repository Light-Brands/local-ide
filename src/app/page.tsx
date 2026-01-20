'use client';

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import {
  Zap,
  Shield,
  Palette,
  Code2,
  Layers,
  Sparkles,
  ArrowRight,
  Star,
} from 'lucide-react';

import { Navigation } from '@/components/ui/Navigation';
import { Footer } from '@/components/ui/Footer';
import { Button } from '@/components/ui/Button';
import { FeatureCard, PricingCard, TestimonialCard } from '@/components/ui/Card';
import { HeroCentered } from '@/components/sections/HeroCentered';
import { CTASection } from '@/components/sections/CTASection';
import { cn } from '@/lib/utils';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const featuresRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate features on scroll with staggered reveal
      gsap.from('.feature-card', {
        y: 48,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: featuresRef.current,
          start: 'top 80%',
        },
      });

      // Animate stats with counter effect
      gsap.from('.stat-item', {
        y: 32,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: statsRef.current,
          start: 'top 85%',
        },
      });
    });

    return () => ctx.revert();
  }, []);

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized for Core Web Vitals with 90+ Lighthouse scores out of the box.',
    },
    {
      icon: Palette,
      title: 'Premium Design',
      description: 'Apple-inspired aesthetics with carefully crafted design tokens and components.',
    },
    {
      icon: Shield,
      title: 'Type Safe',
      description: 'Full TypeScript support with strict type checking for better developer experience.',
    },
    {
      icon: Code2,
      title: 'AI-First Workflow',
      description: 'Built-in AI rules and guidelines for consistent, high-quality development.',
    },
    {
      icon: Layers,
      title: 'Component Library',
      description: 'Pre-built, animated components that follow design system principles.',
    },
    {
      icon: Sparkles,
      title: 'Dark Mode Ready',
      description: 'Seamless light and dark mode support with automatic system detection.',
    },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      description: 'Perfect for side projects',
      price: 0,
      period: '/forever',
      features: [
        'All core components',
        'Design system tokens',
        'Basic documentation',
        'Community support',
      ],
      cta: { label: 'Get Started', href: '#' },
    },
    {
      name: 'Pro',
      description: 'For professional developers',
      price: 49,
      period: '/one-time',
      features: [
        'Everything in Starter',
        'Premium components',
        'Advanced animations',
        'Priority support',
        'Lifetime updates',
      ],
      cta: { label: 'Buy Now', href: '#' },
      popular: true,
    },
    {
      name: 'Enterprise',
      description: 'For teams and agencies',
      price: 199,
      period: '/one-time',
      features: [
        'Everything in Pro',
        'Multiple project license',
        'Custom component requests',
        'Dedicated support',
        'White-label option',
      ],
      cta: { label: 'Contact Sales', href: '#' },
    },
  ];

  const testimonials = [
    {
      quote: 'This boilerplate saved us weeks of development time. The design system is incredibly well thought out.',
      author: {
        name: 'Sarah Chen',
        title: 'Lead Developer at TechCorp',
      },
      rating: 5,
    },
    {
      quote: 'The AI-first approach is a game changer. Every component feels premium and consistent.',
      author: {
        name: 'Michael Torres',
        title: 'Founder at StartupX',
      },
      rating: 5,
    },
    {
      quote: 'Best boilerplate I have ever used. The attention to detail in animations and accessibility is impressive.',
      author: {
        name: 'Emily Johnson',
        title: 'Senior Engineer at DesignCo',
      },
      rating: 5,
    },
  ];

  return (
    <>
      <Navigation transparent />

      <main>
        {/* Hero Section */}
        <HeroCentered
          badge={{ text: 'v1.0 Now Available', href: '#' }}
          title="Build Premium Websites at Lightning Speed"
          titleHighlight="Lightning Speed"
          description="A production-ready Next.js boilerplate with a premium design system, AI-first workflows, and beautiful animations. Ship faster, look better."
          primaryCta={{ label: 'Get Started Free', href: '#' }}
          secondaryCta={{ label: 'View Demo', href: '#', icon: 'play' }}
          trustedBy={{
            label: 'Trusted by developers at',
            logos: [
              <span key={1} className="text-neutral-400 font-semibold tracking-tight">Vercel</span>,
              <span key={2} className="text-neutral-400 font-semibold tracking-tight">Stripe</span>,
              <span key={3} className="text-neutral-400 font-semibold tracking-tight">Linear</span>,
              <span key={4} className="text-neutral-400 font-semibold tracking-tight">Notion</span>,
            ],
          }}
        />

        {/* Features Section - Refined with asymmetric header alignment */}
        <section
          ref={featuresRef}
          className="section-padding bg-white dark:bg-neutral-950 relative overflow-hidden"
        >
          {/* Subtle background accent */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/[0.02] dark:bg-primary-400/[0.03] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />

          <div className="container-premium relative">
            {/* Section Header - Refined with left-aligned option for variation */}
            <div className="max-w-2xl mb-14 lg:mb-16">
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="inline-block text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-3"
              >
                Features
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-neutral-900 dark:text-white mb-4 leading-tight"
              >
                Everything you need to build premium sites
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed"
              >
                A carefully crafted foundation that helps you build beautiful,
                performant websites without starting from scratch.
              </motion.p>
            </div>

            {/* Features Grid - Refined with asymmetric gap */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {features.map((feature, index) => (
                <div key={index} className="feature-card">
                  <FeatureCard
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                    gradient={index === 0}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section - Refined with better visual hierarchy */}
        <section
          ref={statsRef}
          className="py-16 lg:py-20 bg-neutral-50 dark:bg-neutral-900/50 border-y border-neutral-200/50 dark:border-neutral-800/50"
        >
          <div className="container-premium">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
              {[
                { value: '10k+', label: 'Downloads', suffix: '' },
                { value: '90+', label: 'Lighthouse Score', suffix: '' },
                { value: '50+', label: 'Components', suffix: '' },
                { value: '4.9', label: 'Rating', suffix: '/5' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="stat-item text-center"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-1.5 tracking-tight">
                    {stat.value}
                    <span className="text-neutral-400 text-2xl md:text-3xl">{stat.suffix}</span>
                  </div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Code Preview Section - Refined with better balance */}
        <section className="section-padding bg-white dark:bg-neutral-950">
          <div className="container-premium">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-center">
              {/* Content */}
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="inline-block text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-3">
                  Developer Experience
                </span>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white mb-5 leading-tight">
                  Build with confidence using our design tokens
                </h2>
                <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
                  Never hardcode colors or spacing again. Our design system ensures
                  consistency across your entire application with a single source of truth.
                </p>
                <ul className="space-y-3.5 mb-8">
                  {[
                    'Semantic color variables for light/dark mode',
                    'Consistent spacing based on 4px/8px grid',
                    'Premium typography with perfect hierarchy',
                    'Pre-configured animations and transitions',
                  ].map((item, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.08, duration: 0.4 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                        <Star className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                      </div>
                      <span className="text-neutral-700 dark:text-neutral-300">{item}</span>
                    </motion.li>
                  ))}
                </ul>
                <Button href="#" variant="primary" icon={<ArrowRight className="w-4 h-4" />}>
                  View Documentation
                </Button>
              </motion.div>

              {/* Code Block - Refined styling */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                className={cn(
                  'rounded-2xl overflow-hidden',
                  'bg-[#0d1117] dark:bg-neutral-950',
                  'border border-neutral-800/80',
                  'shadow-2xl shadow-neutral-900/20'
                )}
              >
                {/* Window controls */}
                <div className="flex items-center gap-2 px-4 py-3.5 border-b border-neutral-800/80 bg-neutral-900/50">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  </div>
                  <span className="ml-4 text-sm text-neutral-500 font-mono">tokens.ts</span>
                </div>
                {/* Code content */}
                <pre className="p-5 text-sm overflow-x-auto scrollbar-thin">
                  <code className="text-neutral-300 font-mono leading-relaxed">
                    <span className="text-[#ff7b72]">export const</span>{' '}
                    <span className="text-[#d2a8ff]">colors</span>{' '}
                    <span className="text-neutral-500">=</span> {'{'}
                    {'\n'}
                    {'  '}
                    <span className="text-[#79c0ff]">primary</span>
                    <span className="text-neutral-500">:</span> {'{'}
                    {'\n'}
                    {'    '}
                    <span className="text-[#79c0ff]">50</span>
                    <span className="text-neutral-500">:</span>{' '}
                    <span className="text-[#a5d6ff]">&apos;#f0f4ff&apos;</span>
                    <span className="text-neutral-500">,</span>
                    {'\n'}
                    {'    '}
                    <span className="text-[#79c0ff]">500</span>
                    <span className="text-neutral-500">:</span>{' '}
                    <span className="text-[#a5d6ff]">&apos;#6366f1&apos;</span>
                    <span className="text-neutral-500">,</span>
                    {'\n'}
                    {'    '}
                    <span className="text-[#79c0ff]">900</span>
                    <span className="text-neutral-500">:</span>{' '}
                    <span className="text-[#a5d6ff]">&apos;#312e81&apos;</span>
                    <span className="text-neutral-500">,</span>
                    {'\n'}
                    {'  '}
                    {'}'}
                    <span className="text-neutral-500">,</span>
                    {'\n'}
                    {'  '}
                    <span className="text-neutral-500">{'// Semantic colors'}</span>
                    {'\n'}
                    {'  '}
                    <span className="text-[#79c0ff]">background</span>
                    <span className="text-neutral-500">:</span>{' '}
                    <span className="text-[#a5d6ff]">&apos;var(--color-neutral-0)&apos;</span>
                    <span className="text-neutral-500">,</span>
                    {'\n'}
                    {'  '}
                    <span className="text-[#79c0ff]">foreground</span>
                    <span className="text-neutral-500">:</span>{' '}
                    <span className="text-[#a5d6ff]">&apos;var(--color-neutral-900)&apos;</span>
                    <span className="text-neutral-500">,</span>
                    {'\n'}
                    {'}'}<span className="text-neutral-500">;</span>
                  </code>
                </pre>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing Section - Refined spacing */}
        <section className="section-padding bg-neutral-50 dark:bg-neutral-900/50">
          <div className="container-premium">
            {/* Section Header - Centered for pricing */}
            <div className="max-w-2xl mx-auto text-center mb-12 lg:mb-14">
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="inline-block text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-3"
              >
                Pricing
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-neutral-900 dark:text-white mb-4"
              >
                Simple, transparent pricing
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg text-neutral-600 dark:text-neutral-400"
              >
                Choose the plan that works best for you. All plans include lifetime access.
              </motion.p>
            </div>

            {/* Pricing Grid */}
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <PricingCard key={index} {...plan} />
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section - Refined */}
        <section className="section-padding bg-white dark:bg-neutral-950 relative overflow-hidden">
          {/* Background accent */}
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary-500/[0.02] dark:bg-secondary-400/[0.03] rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3" />

          <div className="container-premium relative">
            {/* Section Header */}
            <div className="max-w-2xl mx-auto text-center mb-12 lg:mb-14">
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="inline-block text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-3"
              >
                Testimonials
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-neutral-900 dark:text-white"
              >
                Loved by developers worldwide
              </motion.h2>
            </div>

            {/* Testimonials Grid */}
            <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={index} {...testimonial} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <CTASection
          variant="gradient"
          eyebrow="Ready to start?"
          title="Build your next premium website today"
          description="Get started with the most complete Next.js boilerplate and ship faster than ever."
          primaryCta={{ label: 'Get Started Free', href: '#' }}
          secondaryCta={{ label: 'View Documentation', href: '#' }}
        />
      </main>

      <Footer
        newsletter={{
          title: 'Stay updated',
          description: 'Get notified about new features and updates.',
          placeholder: 'Enter your email',
          buttonText: 'Subscribe',
        }}
        bottomLinks={[
          { label: 'Privacy Policy', href: '/privacy' },
          { label: 'Terms of Service', href: '/terms' },
        ]}
      />
    </>
  );
}
