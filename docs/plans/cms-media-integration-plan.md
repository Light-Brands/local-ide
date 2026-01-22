# CMS → Media Integration Plan

## Overview

Enhance the existing Media section with powerful CMS capabilities from design-system-v2, creating a unified content management hub that combines media library functionality with blog editing, AI content generation, and batch processing.

---

## Current State Analysis

### Media Section (local-ide)
- **Location**: `/admin/media`
- **Features**:
  - Grid/list view toggle for media files
  - File upload with Sharp image optimization
  - File preview panel with metadata
  - Search functionality
  - Type filtering (images, videos, documents)
  - API routes at `/api/media`

### Content Section (local-ide)
- **Location**: `/admin/content`
- **Features**:
  - Content items with status system (draft/published/archived)
  - Bulk actions (publish, archive, delete)
  - Search and filtering
  - CRUD operations

### CMS (design-system-v2)
- **Features to Bring**:
  - Rich text blog editor (RichTextEditor component)
  - AI content generation (Gemini API integration)
  - Batch queue processing for multiple posts
  - ThumbnailUploader component
  - Category/tag management
  - CMSContext for state management

---

## Integration Strategy

### New Navigation Structure

Transform the Media section into a comprehensive Content & Media hub:

```
📁 Content & Media (collapsible)
├── 📊 Overview          → /admin/content
├── 📝 Posts             → /admin/content/posts
├── 🖼️ Media Library     → /admin/content/media
├── ✨ AI Generator      → /admin/content/generator
├── 📦 Batch Queue       → /admin/content/batch
└── 🏷️ Categories        → /admin/content/categories
```

### Phase 1: Route Restructuring

**Move existing routes:**
- `/admin/media` → `/admin/content/media`
- `/admin/content` → `/admin/content/posts`

**Create new overview:**
- `/admin/content` → Dashboard overview (new)

### Phase 2: Component Migration

| Component | Source | Target | Purpose |
|-----------|--------|--------|---------|
| RichTextEditor | design-system-v2 | `/components/content/RichTextEditor.tsx` | Blog post editing |
| ThumbnailUploader | design-system-v2 | `/components/content/ThumbnailUploader.tsx` | Featured images |
| AIGenerator | new | `/components/content/AIGenerator.tsx` | AI content creation |
| BatchQueue | new | `/components/content/BatchQueue.tsx` | Bulk post processing |
| PostEditor | new | `/components/content/PostEditor.tsx` | Full post editing page |
| CategoryManager | new | `/components/content/CategoryManager.tsx` | Tag/category CRUD |

### Phase 3: Shared Components

Create reusable components in `/components/content/shared.tsx`:
- `ContentStatusBadge` - Draft/Published/Archived/Scheduled
- `ContentCard` - Unified post/media card component
- `ContentStats` - Statistics display
- `ContentFilters` - Advanced filtering UI
- `AIPromptInput` - AI generation input with presets
- `QueueItem` - Batch queue item display
- `ProgressIndicator` - Generation/upload progress

---

## Feature Specifications

### 1. Content Overview Dashboard (`/admin/content`)

**Stats Grid:**
- Total Posts (published/draft/archived)
- Media Files (by type)
- AI Generations (this month)
- Storage Used

**Quick Actions:**
- New Post
- Upload Media
- AI Generate
- View Queue

**Recent Activity:**
- Latest posts with status
- Recent uploads
- AI generation history

### 2. Posts Management (`/admin/content/posts`)

**List View:**
- Sortable table with columns: Title, Status, Author, Date, Views
- Bulk actions: Publish, Archive, Delete
- Quick edit inline
- Search and filters

**Post Editor:**
- Rich text editor with formatting toolbar
- Markdown support
- Image embedding from media library
- SEO metadata fields
- Category/tag assignment
- Featured image selector
- Publish scheduling
- Auto-save drafts

### 3. Media Library (`/admin/content/media`)

**Enhanced from current:**
- Keep existing grid/list toggle
- Add drag-and-drop multi-upload
- Folder organization
- Image editing (crop, resize)
- Alt text management
- Usage tracking (where media is used)
- Bulk operations

**New Features:**
- AI image generation integration
- Smart tagging suggestions
- Image optimization presets
- CDN integration ready

### 4. AI Generator (`/admin/content/generator`)

**Generation Types:**
- Blog post from topic/outline
- Social media content
- Meta descriptions
- Image alt text
- Content rewrites

**Interface:**
- Prompt input with templates
- Tone selector (professional, casual, technical)
- Length control
- Preview panel
- Edit before saving
- Direct publish or queue

**AI Provider:**
- Google Gemini API (existing integration)
- Configurable prompts
- Usage tracking

### 5. Batch Queue (`/admin/content/batch`)

**Queue Management:**
- Visual queue list
- Status indicators (pending, processing, complete, failed)
- Priority ordering
- Pause/resume/cancel
- Retry failed items

**Batch Operations:**
- Bulk AI generation
- Mass publish/unpublish
- Bulk image optimization
- Scheduled publishing queue

### 6. Categories & Tags (`/admin/content/categories`)

**Management:**
- Create/edit/delete categories
- Tag cloud view
- Merge/rename tags
- Category hierarchy
- Post count per category

---

## Data Models

### Post Schema
```typescript
interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;          // Rich text/markdown
  excerpt: string;
  featuredImage: string | null;
  status: 'draft' | 'published' | 'archived' | 'scheduled';
  publishedAt: Date | null;
  scheduledAt: Date | null;
  author: string;
  categories: string[];
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### AIGeneration Schema
```typescript
interface AIGeneration {
  id: string;
  type: 'post' | 'social' | 'meta' | 'alt-text' | 'rewrite';
  prompt: string;
  output: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  postId: string | null;    // If saved to post
  createdAt: Date;
}
```

### BatchJob Schema
```typescript
interface BatchJob {
  id: string;
  type: 'ai-generate' | 'publish' | 'optimize' | 'schedule';
  items: string[];          // Post/media IDs
  status: 'queued' | 'processing' | 'complete' | 'failed' | 'paused';
  progress: number;
  total: number;
  createdAt: Date;
  completedAt: Date | null;
}
```

---

## Context & State Management

### ContentContext
```typescript
interface ContentState {
  posts: Post[];
  media: MediaFile[];
  categories: Category[];
  tags: Tag[];
  queue: BatchJob[];
  aiGenerations: AIGeneration[];
  filters: ContentFilters;
  selectedItems: string[];
}

type ContentAction =
  | { type: 'SET_POSTS'; payload: Post[] }
  | { type: 'ADD_POST'; payload: Post }
  | { type: 'UPDATE_POST'; payload: Post }
  | { type: 'DELETE_POST'; payload: string }
  | { type: 'SET_QUEUE'; payload: BatchJob[] }
  | { type: 'ADD_TO_QUEUE'; payload: BatchJob }
  | { type: 'UPDATE_QUEUE_ITEM'; payload: BatchJob }
  // ... more actions
```

---

## Implementation Phases

### Phase 1: Foundation (Routes & Navigation)
1. Update AdminSidebar with collapsible "Content & Media" section
2. Create route structure under `/admin/content`
3. Create Content Overview dashboard
4. Move existing media page to new location
5. Create shared components

### Phase 2: Posts & Editor
1. Build Posts list page with filters
2. Create PostEditor component
3. Implement RichTextEditor
4. Add ThumbnailUploader integration
5. Connect to existing content API

### Phase 3: AI Integration
1. Build AI Generator page
2. Create prompt templates
3. Integrate Gemini API
4. Add generation history
5. Preview and edit workflow

### Phase 4: Batch Processing
1. Create BatchQueue page
2. Build queue management UI
3. Implement background processing
4. Add progress notifications
5. Error handling and retry

### Phase 5: Categories & Polish
1. Build category/tag management
2. Add bulk operations
3. Performance optimization
4. Final UI polish

---

## Design System Alignment

### Colors & Theming
Use existing local-ide design tokens:
- `primary-*` - Main actions, links
- `secondary-*` - Secondary elements
- `neutral-*` - Text, borders, backgrounds
- Status colors: emerald (published), amber (draft), red (archived), blue (scheduled)

### Animation Patterns
- `containerVariants` / `itemVariants` - Page transitions
- `whileHover={{ y: -2 }}` - Card hover effects
- `AnimatePresence` - List transitions
- Spring physics: `[0.22, 1, 0.36, 1]` ease curve

### Card Styling
```tsx
cn(
  'bg-white dark:bg-neutral-900',
  'rounded-2xl',
  'border border-neutral-200/60 dark:border-neutral-800/60',
  'hover:shadow-lg transition-all duration-300'
)
```

---

## File Structure

```
src/
├── app/(admin)/admin/content/
│   ├── page.tsx                    # Overview dashboard
│   ├── posts/
│   │   ├── page.tsx                # Posts list
│   │   └── [id]/
│   │       └── page.tsx            # Post editor
│   ├── media/
│   │   └── page.tsx                # Media library (moved)
│   ├── generator/
│   │   └── page.tsx                # AI generator
│   ├── batch/
│   │   └── page.tsx                # Batch queue
│   └── categories/
│       └── page.tsx                # Category management
├── components/content/
│   ├── shared.tsx                  # Shared components
│   ├── RichTextEditor.tsx          # Rich text editing
│   ├── ThumbnailUploader.tsx       # Featured image upload
│   ├── PostEditor.tsx              # Full post editor
│   ├── AIGenerator.tsx             # AI generation UI
│   ├── BatchQueue.tsx              # Queue management
│   └── CategoryManager.tsx         # Category CRUD
├── data/content/
│   └── demoData.ts                 # Demo posts, categories
└── contexts/
    └── ContentContext.tsx          # State management
```

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/content/posts` | GET, POST | List/create posts |
| `/api/content/posts/[id]` | GET, PUT, DELETE | Single post CRUD |
| `/api/content/posts/bulk` | POST | Bulk operations |
| `/api/content/generate` | POST | AI generation |
| `/api/content/queue` | GET, POST | Batch queue |
| `/api/content/queue/[id]` | PUT, DELETE | Queue item management |
| `/api/content/categories` | GET, POST | Categories |
| `/api/content/tags` | GET, POST | Tags |

---

## Success Criteria

- [ ] Seamless navigation between content sections
- [ ] Full rich text editing with media embedding
- [ ] Working AI content generation
- [ ] Functional batch queue with progress
- [ ] Category/tag management
- [ ] Consistent design with existing admin UI
- [ ] Build passes with no TypeScript errors
- [ ] Responsive design on all screen sizes

---

## Notes

- Leverage existing Media API routes where possible
- Use demo data initially, Supabase integration later
- AI generation uses existing Gemini API pattern
- Maintain collapsible sidebar pattern from Dev Tools
- Keep performance in mind with large media libraries
