import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// File-based database for activity persistence
const DATA_DIR = path.join(process.cwd(), '.local-ide-data');
const ACTIVITY_FILE = path.join(DATA_DIR, 'activity-log.json');
const MAX_ACTIVITIES = 1000; // Keep more in file storage

interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string; // ISO string for JSON storage
  metadata?: Record<string, unknown>;
}

async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readActivities(): Promise<Activity[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(ACTIVITY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeActivities(activities: Activity[]): Promise<void> {
  await ensureDataDir();
  // Keep only the most recent activities
  const toSave = activities.slice(-MAX_ACTIVITIES);
  await fs.writeFile(ACTIVITY_FILE, JSON.stringify(toSave, null, 2));
}

// GET - Retrieve all activities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type');
    const since = searchParams.get('since'); // ISO date string

    let activities = await readActivities();

    // Filter by type if specified
    if (type) {
      activities = activities.filter(a => a.type === type);
    }

    // Filter by date if specified
    if (since) {
      const sinceDate = new Date(since);
      activities = activities.filter(a => new Date(a.timestamp) >= sinceDate);
    }

    // Apply pagination (newest first)
    const total = activities.length;
    const paginated = activities.slice(-limit - offset, activities.length - offset || undefined).reverse();

    return NextResponse.json({
      activities: paginated,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error reading activities:', error);
    return NextResponse.json(
      { error: 'Failed to read activities' },
      { status: 500 }
    );
  }
}

// POST - Add new activity or sync multiple activities
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const existingActivities = await readActivities();

    // Handle single activity or array of activities
    const newActivities: Activity[] = Array.isArray(body.activities)
      ? body.activities
      : [body];

    // If syncing, merge by ID to avoid duplicates
    if (body.sync) {
      const existingIds = new Set(existingActivities.map(a => a.id));
      const toAdd = newActivities.filter(a => !existingIds.has(a.id));
      const merged = [...existingActivities, ...toAdd];
      // Sort by timestamp
      merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      await writeActivities(merged);
      return NextResponse.json({ added: toAdd.length, total: merged.length });
    }

    // Regular add - append new activities
    const allActivities = [...existingActivities, ...newActivities];
    await writeActivities(allActivities);

    return NextResponse.json({
      success: true,
      added: newActivities.length,
      total: allActivities.length,
    });
  } catch (error) {
    console.error('Error saving activity:', error);
    return NextResponse.json(
      { error: 'Failed to save activity' },
      { status: 500 }
    );
  }
}

// DELETE - Clear all activities or specific ones
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const before = searchParams.get('before'); // ISO date string

    if (id) {
      // Delete specific activity
      const activities = await readActivities();
      const filtered = activities.filter(a => a.id !== id);
      await writeActivities(filtered);
      return NextResponse.json({ deleted: 1, remaining: filtered.length });
    }

    if (before) {
      // Delete activities before a certain date
      const activities = await readActivities();
      const beforeDate = new Date(before);
      const filtered = activities.filter(a => new Date(a.timestamp) >= beforeDate);
      const deleted = activities.length - filtered.length;
      await writeActivities(filtered);
      return NextResponse.json({ deleted, remaining: filtered.length });
    }

    // Clear all activities
    await writeActivities([]);
    return NextResponse.json({ success: true, message: 'All activities cleared' });
  } catch (error) {
    console.error('Error deleting activities:', error);
    return NextResponse.json(
      { error: 'Failed to delete activities' },
      { status: 500 }
    );
  }
}
