/**
 * File-based Storage System
 *
 * Simple JSON file storage for local IDE data.
 * Stores data in .local-ide/ directory at project root.
 */

import { promises as fs } from 'fs';
import path from 'path';

// Storage directory - relative to project root
const STORAGE_DIR = process.cwd() + '/.local-ide/data';

/**
 * Ensure storage directory exists
 */
async function ensureStorageDir(subdir?: string): Promise<string> {
  const dir = subdir ? path.join(STORAGE_DIR, subdir) : STORAGE_DIR;
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Get the file path for a collection
 */
function getCollectionPath(collection: string): string {
  return path.join(STORAGE_DIR, `${collection}.json`);
}

/**
 * Read all items from a collection
 */
export async function readCollection<T>(collection: string): Promise<T[]> {
  try {
    await ensureStorageDir();
    const filePath = getCollectionPath(collection);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T[];
  } catch (error: unknown) {
    // File doesn't exist yet - return empty array
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    console.error(`Error reading collection ${collection}:`, error);
    return [];
  }
}

/**
 * Write all items to a collection
 */
export async function writeCollection<T>(collection: string, items: T[]): Promise<void> {
  await ensureStorageDir();
  const filePath = getCollectionPath(collection);
  await fs.writeFile(filePath, JSON.stringify(items, null, 2), 'utf-8');
}

/**
 * Get a single item by ID
 */
export async function getItem<T extends { id: string }>(
  collection: string,
  id: string
): Promise<T | null> {
  const items = await readCollection<T>(collection);
  return items.find(item => item.id === id) || null;
}

/**
 * Create a new item
 */
export async function createItem<T extends { id: string }>(
  collection: string,
  item: T
): Promise<T> {
  const items = await readCollection<T>(collection);
  items.push(item);
  await writeCollection(collection, items);
  return item;
}

/**
 * Update an item by ID
 */
export async function updateItem<T extends { id: string }>(
  collection: string,
  id: string,
  updates: Partial<T>
): Promise<T | null> {
  const items = await readCollection<T>(collection);
  const index = items.findIndex(item => item.id === id);

  if (index === -1) {
    return null;
  }

  items[index] = { ...items[index], ...updates };
  await writeCollection(collection, items);
  return items[index];
}

/**
 * Delete an item by ID
 */
export async function deleteItem<T extends { id: string }>(
  collection: string,
  id: string
): Promise<boolean> {
  const items = await readCollection<T>(collection);
  const filtered = items.filter(item => item.id !== id);

  if (filtered.length === items.length) {
    return false; // Item not found
  }

  await writeCollection(collection, filtered);
  return true;
}

/**
 * Query items with a filter function
 */
export async function queryItems<T>(
  collection: string,
  filter: (item: T) => boolean
): Promise<T[]> {
  const items = await readCollection<T>(collection);
  return items.filter(filter);
}

/**
 * Save a file to storage (for screenshots, etc.)
 */
export async function saveFile(
  subdir: string,
  filename: string,
  data: Buffer | string
): Promise<string> {
  const dir = await ensureStorageDir(subdir);
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, data);
  return filePath;
}

/**
 * Read a file from storage
 */
export async function readFile(subdir: string, filename: string): Promise<Buffer | null> {
  try {
    const filePath = path.join(STORAGE_DIR, subdir, filename);
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(subdir: string, filename: string): Promise<boolean> {
  try {
    const filePath = path.join(STORAGE_DIR, subdir, filename);
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
