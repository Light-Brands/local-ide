/**
 * Collections Storage
 *
 * Type-safe collection management for Content, Media, etc.
 */

import {
  readCollection,
  writeCollection,
  generateId,
  saveFile,
  deleteFile,
} from './fileStorage';

// =============================================================================
// Content Collection
// =============================================================================

export interface ContentItem {
  id: string;
  created_at: string;
  updated_at: string;
  slug: string;
  title: string;
  description: string | null;
  body: string | null;
  featured_image: string | null;
  status: 'draft' | 'published' | 'archived';
  author_id: string | null;
  metadata: Record<string, unknown> | null;
  published_at: string | null;
}

const CONTENT_COLLECTION = 'content';

export async function getAllContent(): Promise<ContentItem[]> {
  return readCollection<ContentItem>(CONTENT_COLLECTION);
}

export async function getContentBySlug(slug: string): Promise<ContentItem | null> {
  const items = await readCollection<ContentItem>(CONTENT_COLLECTION);
  return items.find(item => item.slug === slug) || null;
}

export async function getContentById(id: string): Promise<ContentItem | null> {
  const items = await readCollection<ContentItem>(CONTENT_COLLECTION);
  return items.find(item => item.id === id) || null;
}

export async function createContent(
  data: Omit<ContentItem, 'id' | 'created_at' | 'updated_at'>
): Promise<ContentItem> {
  const items = await readCollection<ContentItem>(CONTENT_COLLECTION);
  const now = new Date().toISOString();

  const newItem: ContentItem = {
    id: generateId(),
    created_at: now,
    updated_at: now,
    ...data,
  };

  items.push(newItem);
  await writeCollection(CONTENT_COLLECTION, items);
  return newItem;
}

export async function updateContent(
  id: string,
  updates: Partial<Omit<ContentItem, 'id' | 'created_at'>>
): Promise<ContentItem | null> {
  const items = await readCollection<ContentItem>(CONTENT_COLLECTION);
  const index = items.findIndex(item => item.id === id);

  if (index === -1) return null;

  items[index] = {
    ...items[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  await writeCollection(CONTENT_COLLECTION, items);
  return items[index];
}

export async function deleteContent(id: string): Promise<boolean> {
  const items = await readCollection<ContentItem>(CONTENT_COLLECTION);
  const filtered = items.filter(item => item.id !== id);

  if (filtered.length === items.length) return false;

  await writeCollection(CONTENT_COLLECTION, filtered);
  return true;
}

// =============================================================================
// Media Collection
// =============================================================================

export interface MediaItem {
  id: string;
  created_at: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  uploaded_by: string | null;
}

const MEDIA_COLLECTION = 'media';

export async function getAllMedia(): Promise<MediaItem[]> {
  return readCollection<MediaItem>(MEDIA_COLLECTION);
}

export async function getMediaById(id: string): Promise<MediaItem | null> {
  const items = await readCollection<MediaItem>(MEDIA_COLLECTION);
  return items.find(item => item.id === id) || null;
}

export async function createMedia(
  file: Buffer,
  metadata: {
    name: string;
    file_type: string;
    file_size: number;
    width?: number | null;
    height?: number | null;
    alt_text?: string | null;
    uploaded_by?: string | null;
  }
): Promise<MediaItem> {
  const id = generateId();
  const extension = metadata.name.split('.').pop() || 'bin';
  const filename = `${id}.${extension}`;

  // Save file to uploads directory
  await saveFile('uploads', filename, file);

  const items = await readCollection<MediaItem>(MEDIA_COLLECTION);

  const newItem: MediaItem = {
    id,
    created_at: new Date().toISOString(),
    name: metadata.name,
    file_path: `/api/media/files/${filename}`,
    file_type: metadata.file_type,
    file_size: metadata.file_size,
    width: metadata.width || null,
    height: metadata.height || null,
    alt_text: metadata.alt_text || null,
    uploaded_by: metadata.uploaded_by || null,
  };

  items.push(newItem);
  await writeCollection(MEDIA_COLLECTION, items);
  return newItem;
}

export async function updateMedia(
  id: string,
  updates: Partial<Pick<MediaItem, 'name' | 'alt_text'>>
): Promise<MediaItem | null> {
  const items = await readCollection<MediaItem>(MEDIA_COLLECTION);
  const index = items.findIndex(item => item.id === id);

  if (index === -1) return null;

  items[index] = {
    ...items[index],
    ...updates,
  };

  await writeCollection(MEDIA_COLLECTION, items);
  return items[index];
}

export async function deleteMedia(id: string): Promise<boolean> {
  const items = await readCollection<MediaItem>(MEDIA_COLLECTION);
  const item = items.find(i => i.id === id);

  if (!item) return false;

  // Delete the file
  const filename = item.file_path.split('/').pop();
  if (filename) {
    await deleteFile('uploads', filename);
  }

  // Remove from collection
  const filtered = items.filter(i => i.id !== id);
  await writeCollection(MEDIA_COLLECTION, filtered);
  return true;
}

// =============================================================================
// Analytics Collection (optional, for local tracking)
// =============================================================================

export interface AnalyticsEvent {
  id: string;
  created_at: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  page_url: string | null;
}

const ANALYTICS_COLLECTION = 'analytics';

export async function logEvent(
  event_type: string,
  event_data?: Record<string, unknown>,
  page_url?: string
): Promise<void> {
  const items = await readCollection<AnalyticsEvent>(ANALYTICS_COLLECTION);

  items.push({
    id: generateId(),
    created_at: new Date().toISOString(),
    event_type,
    event_data: event_data || null,
    page_url: page_url || null,
  });

  // Keep only last 1000 events
  const trimmed = items.slice(-1000);
  await writeCollection(ANALYTICS_COLLECTION, trimmed);
}

export async function getAnalytics(limit = 100): Promise<AnalyticsEvent[]> {
  const items = await readCollection<AnalyticsEvent>(ANALYTICS_COLLECTION);
  return items.slice(-limit).reverse();
}
