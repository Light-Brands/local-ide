// Demo data for Content & Media section

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string | null;
  status: 'draft' | 'published' | 'archived' | 'scheduled';
  publishedAt: string | null;
  scheduledAt: string | null;
  author: string;
  authorAvatar: string;
  categories: string[];
  tags: string[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'archive';
  url: string;
  thumbnail: string | null;
  size: number;
  dimensions?: { width: number; height: number };
  altText: string;
  folder: string;
  usageCount: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  postCount: number;
  color: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

export interface AIGeneration {
  id: string;
  type: 'post' | 'social' | 'meta' | 'alt-text' | 'rewrite';
  prompt: string;
  output: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  postId: string | null;
  createdAt: string;
}

export interface BatchJob {
  id: string;
  type: 'ai-generate' | 'publish' | 'optimize' | 'schedule';
  title: string;
  items: string[];
  status: 'queued' | 'processing' | 'complete' | 'failed' | 'paused';
  progress: number;
  total: number;
  createdAt: string;
  completedAt: string | null;
}

// Demo posts
export const demoPosts: Post[] = [
  {
    id: 'post-1',
    title: 'Getting Started with Next.js 16',
    slug: 'getting-started-nextjs-16',
    excerpt: 'Learn the fundamentals of building modern web applications with Next.js 16 and React 19.',
    content: '<p>Next.js 16 introduces powerful new features...</p>',
    featuredImage: '/images/nextjs-guide.jpg',
    status: 'published',
    publishedAt: '2024-01-15T10:00:00Z',
    scheduledAt: null,
    author: 'John Doe',
    authorAvatar: 'JD',
    categories: ['tutorials'],
    tags: ['nextjs', 'react', 'web-development'],
    viewCount: 2847,
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'post-2',
    title: 'Mastering Tailwind CSS 4',
    slug: 'mastering-tailwind-css-4',
    excerpt: 'Deep dive into Tailwind CSS 4 features and best practices for modern UI development.',
    content: '<p>Tailwind CSS 4 brings significant improvements...</p>',
    featuredImage: '/images/tailwind-guide.jpg',
    status: 'published',
    publishedAt: '2024-01-12T14:00:00Z',
    scheduledAt: null,
    author: 'Jane Smith',
    authorAvatar: 'JS',
    categories: ['tutorials', 'design'],
    tags: ['tailwindcss', 'css', 'ui-design'],
    viewCount: 1923,
    createdAt: '2024-01-08T12:00:00Z',
    updatedAt: '2024-01-12T14:00:00Z',
  },
  {
    id: 'post-3',
    title: 'Building AI-Powered Features',
    slug: 'building-ai-powered-features',
    excerpt: 'Integrate AI capabilities into your applications using modern APIs and best practices.',
    content: '<p>AI integration is becoming essential...</p>',
    featuredImage: null,
    status: 'draft',
    publishedAt: null,
    scheduledAt: null,
    author: 'Mike Johnson',
    authorAvatar: 'MJ',
    categories: ['tutorials'],
    tags: ['ai', 'gemini', 'integration'],
    viewCount: 0,
    createdAt: '2024-01-18T09:00:00Z',
    updatedAt: '2024-01-18T16:30:00Z',
  },
  {
    id: 'post-4',
    title: 'Product Launch Announcement',
    slug: 'product-launch-announcement',
    excerpt: 'Exciting news about our upcoming product launch and new features.',
    content: '<p>We are thrilled to announce...</p>',
    featuredImage: '/images/product-launch.jpg',
    status: 'scheduled',
    publishedAt: null,
    scheduledAt: '2024-01-25T09:00:00Z',
    author: 'Sarah Wilson',
    authorAvatar: 'SW',
    categories: ['announcements'],
    tags: ['product', 'launch', 'news'],
    viewCount: 0,
    createdAt: '2024-01-17T11:00:00Z',
    updatedAt: '2024-01-17T15:00:00Z',
  },
  {
    id: 'post-5',
    title: 'Legacy API Migration Guide',
    slug: 'legacy-api-migration-guide',
    excerpt: 'Complete guide for migrating from our legacy API to the new v2 endpoints.',
    content: '<p>This guide covers the migration process...</p>',
    featuredImage: null,
    status: 'archived',
    publishedAt: '2023-06-15T10:00:00Z',
    scheduledAt: null,
    author: 'John Doe',
    authorAvatar: 'JD',
    categories: ['documentation'],
    tags: ['api', 'migration', 'legacy'],
    viewCount: 5421,
    createdAt: '2023-06-10T08:00:00Z',
    updatedAt: '2023-12-01T12:00:00Z',
  },
];

// Demo media files
export const demoMedia: MediaFile[] = [
  {
    id: 'media-1',
    name: 'hero-banner.jpg',
    type: 'image',
    url: '/uploads/hero-banner.jpg',
    thumbnail: '/uploads/thumbnails/hero-banner.jpg',
    size: 245000,
    dimensions: { width: 1920, height: 1080 },
    altText: 'Hero banner image',
    folder: 'banners',
    usageCount: 3,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'media-2',
    name: 'product-demo.mp4',
    type: 'video',
    url: '/uploads/product-demo.mp4',
    thumbnail: '/uploads/thumbnails/product-demo.jpg',
    size: 15000000,
    altText: 'Product demonstration video',
    folder: 'videos',
    usageCount: 1,
    createdAt: '2024-01-14T14:30:00Z',
  },
  {
    id: 'media-3',
    name: 'team-photo.png',
    type: 'image',
    url: '/uploads/team-photo.png',
    thumbnail: '/uploads/thumbnails/team-photo.png',
    size: 890000,
    dimensions: { width: 2400, height: 1600 },
    altText: 'Team photo',
    folder: 'team',
    usageCount: 5,
    createdAt: '2024-01-10T09:00:00Z',
  },
  {
    id: 'media-4',
    name: 'whitepaper.pdf',
    type: 'document',
    url: '/uploads/whitepaper.pdf',
    thumbnail: null,
    size: 2500000,
    altText: 'Technical whitepaper',
    folder: 'documents',
    usageCount: 12,
    createdAt: '2024-01-08T16:00:00Z',
  },
  {
    id: 'media-5',
    name: 'podcast-ep1.mp3',
    type: 'audio',
    url: '/uploads/podcast-ep1.mp3',
    thumbnail: null,
    size: 45000000,
    altText: 'Podcast episode 1',
    folder: 'audio',
    usageCount: 1,
    createdAt: '2024-01-05T11:00:00Z',
  },
  {
    id: 'media-6',
    name: 'icon-set.svg',
    type: 'image',
    url: '/uploads/icon-set.svg',
    thumbnail: '/uploads/thumbnails/icon-set.svg',
    size: 45000,
    dimensions: { width: 512, height: 512 },
    altText: 'Custom icon set',
    folder: 'icons',
    usageCount: 8,
    createdAt: '2024-01-03T13:00:00Z',
  },
];

// Demo categories
export const demoCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Tutorials',
    slug: 'tutorials',
    description: 'Step-by-step guides and how-to articles',
    postCount: 24,
    color: 'blue',
  },
  {
    id: 'cat-2',
    name: 'Announcements',
    slug: 'announcements',
    description: 'Product updates and company news',
    postCount: 12,
    color: 'emerald',
  },
  {
    id: 'cat-3',
    name: 'Design',
    slug: 'design',
    description: 'UI/UX design tips and inspiration',
    postCount: 18,
    color: 'violet',
  },
  {
    id: 'cat-4',
    name: 'Documentation',
    slug: 'documentation',
    description: 'Technical documentation and references',
    postCount: 31,
    color: 'amber',
  },
  {
    id: 'cat-5',
    name: 'Case Studies',
    slug: 'case-studies',
    description: 'Real-world implementation examples',
    postCount: 8,
    color: 'rose',
  },
];

// Demo tags
export const demoTags: Tag[] = [
  { id: 'tag-1', name: 'Next.js', slug: 'nextjs', postCount: 15 },
  { id: 'tag-2', name: 'React', slug: 'react', postCount: 22 },
  { id: 'tag-3', name: 'TypeScript', slug: 'typescript', postCount: 18 },
  { id: 'tag-4', name: 'Tailwind CSS', slug: 'tailwindcss', postCount: 14 },
  { id: 'tag-5', name: 'AI', slug: 'ai', postCount: 9 },
  { id: 'tag-6', name: 'API', slug: 'api', postCount: 11 },
  { id: 'tag-7', name: 'Design', slug: 'design', postCount: 16 },
  { id: 'tag-8', name: 'Performance', slug: 'performance', postCount: 7 },
];

// Demo AI generations
export const demoAIGenerations: AIGeneration[] = [
  {
    id: 'gen-1',
    type: 'post',
    prompt: 'Write a blog post about the benefits of using TypeScript in large-scale applications',
    output: 'TypeScript has become an essential tool for building robust applications...',
    status: 'complete',
    postId: null,
    createdAt: '2024-01-18T14:00:00Z',
  },
  {
    id: 'gen-2',
    type: 'meta',
    prompt: 'Generate SEO meta description for Next.js tutorial article',
    output: 'Learn how to build modern web applications with Next.js 16. This comprehensive tutorial covers routing, data fetching, and deployment.',
    status: 'complete',
    postId: 'post-1',
    createdAt: '2024-01-18T13:30:00Z',
  },
  {
    id: 'gen-3',
    type: 'social',
    prompt: 'Create a Twitter thread about our new product features',
    output: '1/ Excited to announce our latest update! Here\'s what\'s new...',
    status: 'processing',
    postId: null,
    createdAt: '2024-01-18T15:00:00Z',
  },
];

// Demo batch jobs
export const demoBatchJobs: BatchJob[] = [
  {
    id: 'batch-1',
    type: 'ai-generate',
    title: 'Generate Meta Descriptions',
    items: ['post-1', 'post-2', 'post-3'],
    status: 'processing',
    progress: 67,
    total: 3,
    createdAt: '2024-01-18T14:00:00Z',
    completedAt: null,
  },
  {
    id: 'batch-2',
    type: 'optimize',
    title: 'Optimize Images',
    items: ['media-1', 'media-3', 'media-6'],
    status: 'queued',
    progress: 0,
    total: 3,
    createdAt: '2024-01-18T14:30:00Z',
    completedAt: null,
  },
  {
    id: 'batch-3',
    type: 'publish',
    title: 'Bulk Publish Drafts',
    items: ['post-3'],
    status: 'complete',
    progress: 100,
    total: 1,
    createdAt: '2024-01-17T10:00:00Z',
    completedAt: '2024-01-17T10:02:00Z',
  },
  {
    id: 'batch-4',
    type: 'ai-generate',
    title: 'Generate Alt Text',
    items: ['media-1', 'media-2'],
    status: 'failed',
    progress: 50,
    total: 2,
    createdAt: '2024-01-16T09:00:00Z',
    completedAt: null,
  },
];

// Helper functions
export function getPostsByStatus(status: Post['status']) {
  return demoPosts.filter((post) => post.status === status);
}

export function getMediaByType(type: MediaFile['type']) {
  return demoMedia.filter((media) => media.type === type);
}

export function getCategoryById(id: string) {
  return demoCategories.find((cat) => cat.id === id);
}

export function getTagById(id: string) {
  return demoTags.find((tag) => tag.id === id);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function getContentStats() {
  const posts = demoPosts;
  const media = demoMedia;

  return {
    totalPosts: posts.length,
    publishedPosts: posts.filter((p) => p.status === 'published').length,
    draftPosts: posts.filter((p) => p.status === 'draft').length,
    scheduledPosts: posts.filter((p) => p.status === 'scheduled').length,
    totalMedia: media.length,
    totalViews: posts.reduce((sum, p) => sum + p.viewCount, 0),
    totalStorage: media.reduce((sum, m) => sum + m.size, 0),
    aiGenerationsThisMonth: demoAIGenerations.length,
  };
}
