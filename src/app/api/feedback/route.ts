import { NextRequest, NextResponse } from 'next/server';
import {
  readCollection,
  createItem,
  writeCollection,
  saveFile,
  generateId,
} from '@/lib/storage/fileStorage';
import type {
  FeedbackCategory,
  FeedbackPriority,
  FeedbackStatus,
  FeedbackPosition,
  TextContext,
} from '@/lib/feedback/types';

/**
 * Feedback API - File-based Storage
 *
 * Stores feedback items locally in .local-ide/data/feedback.json
 * Screenshots saved to .local-ide/data/screenshots/
 */

interface FeedbackRecord {
  id: string;
  created_at: string;
  updated_at: string;
  page_id: string;
  page_url: string;
  section_path: string;
  component_name?: string;
  position: FeedbackPosition;
  text_context: TextContext;
  category: FeedbackCategory;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  title: string;
  notes: string;
  screenshot_url?: string;
  user_id?: string;
  resolution?: string;
  resolved_at?: string;
}

interface CreateFeedbackRequest {
  page_id: string;
  page_url: string;
  section_path: string;
  component_name?: string;
  position: FeedbackPosition;
  text_context: TextContext;
  category: FeedbackCategory;
  priority: FeedbackPriority;
  title: string;
  notes: string;
  screenshot?: string; // base64 data URL
}

const COLLECTION = 'feedback';

// Helper to save screenshot from base64
async function saveScreenshot(base64Data: string, feedbackId: string): Promise<string | null> {
  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return null;
    }

    const mimeType = matches[1];
    const base64Content = matches[2];
    const buffer = Buffer.from(base64Content, 'base64');
    const extension = mimeType.includes('png') ? 'png' : 'jpg';
    const filename = `${feedbackId}.${extension}`;

    await saveFile('screenshots', filename, buffer);
    return `/api/feedback/screenshots/${filename}`;
  } catch (error) {
    console.error('Screenshot save error:', error);
    return null;
  }
}

// POST - Create new feedback
export async function POST(request: NextRequest) {
  try {
    const body: CreateFeedbackRequest = await request.json();

    // Validate required fields
    if (!body.page_id || !body.category || !body.title) {
      return NextResponse.json(
        { error: 'page_id, category, and title are required' },
        { status: 400 }
      );
    }

    const id = generateId();
    const now = new Date().toISOString();

    // Save screenshot if provided
    let screenshotUrl: string | undefined;
    if (body.screenshot) {
      const url = await saveScreenshot(body.screenshot, id);
      if (url) screenshotUrl = url;
    }

    const newFeedback: FeedbackRecord = {
      id,
      created_at: now,
      updated_at: now,
      page_id: body.page_id,
      page_url: body.page_url,
      section_path: body.section_path,
      component_name: body.component_name,
      position: body.position,
      text_context: body.text_context,
      category: body.category,
      priority: body.priority || 'medium',
      status: 'new',
      title: body.title,
      notes: body.notes || '',
      screenshot_url: screenshotUrl,
    };

    await createItem(COLLECTION, newFeedback);

    return NextResponse.json({ success: true, data: newFeedback });
  } catch (error) {
    console.error('Feedback POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Retrieve feedback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    const status = searchParams.get('status');

    let items = await readCollection<FeedbackRecord>(COLLECTION);

    // Apply filters
    if (pageId) {
      items = items.filter(item => item.page_id === pageId);
    }
    if (status && ['new', 'in-progress', 'resolved', 'blocked'].includes(status)) {
      items = items.filter(item => item.status === status);
    }

    // Sort by created_at descending
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ data: items });
  } catch (error) {
    console.error('Feedback GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update feedback (by ID in query param)
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
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

// DELETE - Delete feedback (by ID in query param)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    const items = await readCollection<FeedbackRecord>(COLLECTION);
    const filtered = items.filter(item => item.id !== id);

    if (filtered.length === items.length) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

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
