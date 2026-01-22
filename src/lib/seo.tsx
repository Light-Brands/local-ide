import { Metadata } from 'next';

/**
 * SEO Configuration
 * Centralized SEO settings for the entire site
 */

export const siteConfig = {
  name: 'Light Brands',
  description: 'Premium Next.js boilerplate for building beautiful, high-performance websites.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com',
  ogImage: '/og-image.jpg',
  creator: '@yourtwitterhandle',
  keywords: [
    'Next.js',
    'React',
    'TypeScript',
    'Tailwind CSS',
    'Web Development',
    'Premium Website',
  ],
};

/**
 * Generate metadata for a page
 * @param options - Page-specific metadata options
 * @returns Complete metadata object
 */
export function generateMetadata({
  title,
  description,
  image,
  noIndex = false,
  keywords,
  pathname = '',
}: {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
  pathname?: string;
}): Metadata {
  const pageTitle = title
    ? `${title} | ${siteConfig.name}`
    : siteConfig.name;

  const pageDescription = description || siteConfig.description;
  const pageImage = image || siteConfig.ogImage;
  const url = `${siteConfig.url}${pathname}`;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: keywords || siteConfig.keywords,
    authors: [{ name: siteConfig.name }],
    creator: siteConfig.creator,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      title: pageTitle,
      description: pageDescription,
      siteName: siteConfig.name,
      images: [
        {
          url: pageImage,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [pageImage],
      creator: siteConfig.creator,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

/**
 * Generate JSON-LD structured data for organization
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    sameAs: [
      // Add your social media URLs
      // 'https://twitter.com/yourbrand',
      // 'https://github.com/yourbrand',
    ],
  };
}

/**
 * Generate JSON-LD structured data for a webpage
 */
export function generateWebPageSchema({
  title,
  description,
  pathname = '',
}: {
  title: string;
  description: string;
  pathname?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: `${siteConfig.url}${pathname}`,
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
    },
  };
}

/**
 * Generate JSON-LD structured data for a product
 */
export function generateProductSchema({
  name,
  description,
  image,
  price,
  currency = 'USD',
  availability = 'InStock',
  url,
}: {
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    url,
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
    },
  };
}

/**
 * Generate JSON-LD structured data for a FAQ page
 */
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate JSON-LD structured data for breadcrumbs
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * JSON-LD Script component helper
 * Use this to render structured data in your pages
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
