import { NextRequest, NextResponse } from 'next/server';
import {
  readCollection,
  writeCollection,
  deleteFile,
} from '@/lib/storage/fileStorage';
import type {
  FeedbackStatus,
  FeedbackPriority,
} from '@/lib/feedback/types';

interface FeedbackRecord {
  id: string;
  created_at: string;
  updated_at: string;
  page_id: string;
  page_url: string;
  section_path: string;
  component_name?: string;
  position: unknown;
  text_context: unknown;
  category: string;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  title: string;
  notes: string;
  screenshot_url?: string;
  user_id?: string;
  resolution?: string;
  resolved_at?: string;
}

interface UpdateFeedbackRequest {
  status?: FeedbackStatus;
  resolution?: string;
  resolved_at?: string;
  priority?: FeedbackPriority;
  title?: string;
  notes?: string;
}

const COLLECTION = 'feedback';

// GET - Get single feedback by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const items = await readCollection<FeedbackRecord>(COLLECTION);
    const item = items.find(i => i.id === id);

    if (!item) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: item });
  } catch (error) {
    console.error('Feedback GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update feedback by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateFeedbackRequest = await request.json();
    const items = await readCollection<FeedbackRecord>(COLLECTION);
    const index = items.findIndex(item => item.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    // Update fields
    const updated: FeedbackRecord = {
      ...items[index],
      updated_at: new Date().toISOString(),
    };

    if (body.status !== undefined) updated.status = body.status;
    if (body.resolution !== undefined) updated.resolution = body.resolution;
    if (body.resolved_at !== undefined) updated.resolved_at = body.resolved_at;
    if (body.priority !== undefined) updated.priority = body.priority;
    if (body.title !== undefined) updated.title = body.title;
    if (body.notes !== undefined) updated.notes = body.notes;

    items[index] = updated;
    await writeCollection(COLLECTION, items);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Feedback PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete feedback by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const items = await readCollection<FeedbackRecord>(COLLECTION);
    const item = items.find(i => i.id === id);

    if (!item) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    // Delete screenshot if exists
    if (item.screenshot_url) {
      const filename = item.screenshot_url.split('/').pop();
      if (filename) {
        await deleteFile('screenshots', filename);
      }
    }

    // Remove from collection
    const filtered = items.filter(i => i.id !== id);
    await writeCollection(COLLECTION, filtered);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
