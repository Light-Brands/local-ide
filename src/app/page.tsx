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
      title: 'Self-Evolving',
      description: 'An intelligent platform that improves itself over time with AI-powered development.',
    },
    {
      icon: Palette,
      title: 'Premium Design',
      description: 'Apple-inspired aesthetics with carefully crafted design tokens and components.',
    },
    {
      icon: Shield,
      title: 'Built-in IDE',
      description: 'Full development environment embedded in your app. Edit code, preview changes, deploy.',
    },
    {
      icon: Code2,
      title: 'AI-First Workflow',
      description: 'Claude AI integration for intelligent code generation and continuous improvement.',
    },
    {
      icon: Layers,
      title: 'Component Library',
      description: 'Pre-built, animated components that follow design system principles.',
    },
    {
      icon: Sparkles,
      title: 'Deploy Once',
      description: 'Ship your app with the IDE included. Develop from anywhere, evolve continuously.',
    },
  ];

  const pricingPlans = [
    {
      name: 'Open Source',
      description: 'Self-host and customize',
      price: 0,
      period: '/forever',
      features: [
        'Full source code access',
        'Built-in IDE',
        'All components',
        'Community support',
      ],
      cta: { label: 'Get Started', href: '/ide' },
    },
    {
      name: 'Pro',
      description: 'For professional developers',
      price: 49,
      period: '/one-time',
      features: [
        'Everything in Open Source',
        'Premium components',
        'Advanced animations',
        'Priority support',
        'Lifetime updates',
      ],
      cta: { label: 'Coming Soon', href: '/ide' },
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
        'Custom integrations',
        'Dedicated support',
        'White-label option',
      ],
      cta: { label: 'Contact Us', href: '/admin' },
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
      <Navigation
        transparent
        items={[
          { label: 'Features', href: '#features' },
          { label: 'IDE', href: '/ide' },
          { label: 'Admin', href: '/admin' },
        ]}
        cta={{ label: 'Open IDE', href: '/ide' }}
      />

      <main className="relative">
        <HeroCentered
          badge={{ text: 'Self-Evolving Platform', href: '/ide' }}
          title="Build Apps That Build Themselves!!!!"
          titleHighlight="Build Themselves"
          description="A complete foundation for building modern applications with an intelligent IDE built right in. Deploy a single time, develop from anywhere, and watch your app evolve on its own."
          primaryCta={{ label: 'Open IDE', href: '/ide' }}
          secondaryCta={{ label: 'TESTING', href: '/admin', icon: 'arrow' }}
          trustedBy={{
            label: 'Powered by',
            logos: [
              <span key={1} className="text-neutral-400 font-semibold tracking-tight">Next.js</span>,
              <span key={2} className="text-neutral-400 font-semibold tracking-tight">TypeScript</span>,
              <span key={3} className="text-neutral-400 font-semibold tracking-tight">Tailwind</span>,
              <span key={4} className="text-neutral-400 font-semibold tracking-tight">Claude AI</span>,
            ],
          }}
        />

        <section
          id="features"
          ref={featuresRef}
          className="section-padding bg-white dark:bg-neutral-950 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/[0.02] dark:bg-primary-400/[0.03] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />

          <div className="container-premium relative">
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
                Everything you need to build and evolve
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed"
              >
                A carefully crafted foundation with a built-in IDE that helps you
                build, iterate, and evolve your application continuously.
              </motion.p>
            </div>

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

        <section
          ref={statsRef}
          className="py-16 lg:py-20 bg-neutral-50 dark:bg-neutral-900/50 border-y border-neutral-200/50 dark:border-neutral-800/50"
        >
          <div className="container-premium">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
              {[
                { value: '90+', label: 'Lighthouse Score', suffix: '' },
                { value: '55+', label: 'Components', suffix: '' },
                { value: '∞', label: 'Evolution Potential', suffix: '' },
                { value: '1', label: 'Deploy', suffix: '' },
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

        <section className="section-padding bg-white dark:bg-neutral-950">
          <div className="container-premium">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-center">
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
                <Button href="/ide" variant="primary" icon={<ArrowRight className="w-4 h-4" />}>
                  Open IDE
                </Button>
              </motion.div>

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
                <div className="flex items-center gap-2 px-4 py-3.5 border-b border-neutral-800/80 bg-neutral-900/50">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  </div>
                  <span className="ml-4 text-sm text-neutral-500 font-mono">tokens.ts</span>
                </div>
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

        <section className="section-padding bg-neutral-50 dark:bg-neutral-900/50">
          <div className="container-premium">
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
                Simple and Complex
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

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <PricingCard key={index} {...plan} />
              ))}
            </div>
          </div>
        </section>

        <section className="section-padding bg-white dark:bg-neutral-950 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary-500/[0.02] dark:bg-secondary-400/[0.03] rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3" />

          <div className="container-premium relative">
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

            <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={index} {...testimonial} />
              ))}
            </div>
          </div>
        </section>

        <CTASection
          variant="gradient"
          eyebrow="Ready to evolve?"
          title="Start building your self-evolving app today"
          description="Open the IDE and experience the future of application development. Your app learns and improves as you use it."
          primaryCta={{ label: 'Launch IDE', href: '/ide' }}
          secondaryCta={{ label: 'Explore Admin', href: '/admin' }}
        />
      </main>

      <Footer
        columns={[
          {
            title: 'Platform',
            links: [
              { label: 'Features', href: '#features' },
              { label: 'Open IDE', href: '/ide' },
              { label: 'Admin Dashboard', href: '/admin' },
            ],
          },
          {
            title: 'Resources',
            links: [
              { label: 'GitHub', href: 'https://github.com', external: true },
              { label: 'Next.js Docs', href: 'https://nextjs.org/docs', external: true },
              { label: 'Tailwind CSS', href: 'https://tailwindcss.com', external: true },
            ],
          },
        ]}
        bottomLinks={[
          { label: 'Built with Next.js', href: 'https://nextjs.org', external: true },
        ]}
      />
    </>
  );
}
