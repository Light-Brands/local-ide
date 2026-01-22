import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type {
  FeedbackCategory,
  FeedbackPriority,
  FeedbackStatus,
  FeedbackPosition,
  TextContext,
} from '@/lib/feedback/types';

/**
 * Enhanced Feedback API
 *
 * Handles CRUD operations for the feedback system with:
 * - Supabase storage for feedback items
 * - Screenshot upload to Supabase Storage
 * - Filtering by page ID
 */

// Types for request payloads
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

interface UpdateFeedbackRequest {
  status?: FeedbackStatus;
  resolution?: string;
  resolved_at?: string;
  priority?: FeedbackPriority;
  title?: string;
  notes?: string;
}

// Helper to upload screenshot to Supabase Storage
async function uploadScreenshot(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  base64Data: string,
  feedbackId: string
): Promise<string | null> {
  try {
    // Extract the base64 content and mime type
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      console.error('Invalid base64 data');
      return null;
    }

    const mimeType = matches[1];
    const base64Content = matches[2];
    const buffer = Buffer.from(base64Content, 'base64');

    // Determine file extension
    const extension = mimeType.includes('png') ? 'png' : 'jpg';
    const fileName = `feedback/${feedbackId}.${extension}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Screenshot upload error:', uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName);

    return urlData?.publicUrl || null;
  } catch (error) {
    console.error('Screenshot upload failed:', error);
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

    const supabase = await createServerSupabaseClient();

    // Get current user (optional)
    const { data: { user } } = await supabase.auth.getUser();

    // Generate a temporary ID for screenshot upload
    const tempId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Upload screenshot if provided
    let screenshotUrl: string | null = null;
    if (body.screenshot) {
      screenshotUrl = await uploadScreenshot(supabase, body.screenshot, tempId);
    }

    // Insert feedback
    const { data, error } = await supabase
      .from('feedback')
      .insert({
        page_id: body.page_id,
        page_url: body.page_url,
        section_path: body.section_path,
        component_name: body.component_name,
        position: body.position as unknown as null, // JSONB
        text_context: body.text_context as unknown as null, // JSONB
        category: body.category,
        priority: body.priority || 'medium',
        status: 'new' as const,
        title: body.title,
        notes: body.notes || '',
        screenshot_url: screenshotUrl,
        user_id: user?.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Feedback insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Feedback POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Retrieve feedback (optionally filtered by pageId)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);

    const pageId = searchParams.get('pageId');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (pageId) {
      query = query.eq('page_id', pageId);
    }
    if (status && ['new', 'in-progress', 'resolved', 'blocked'].includes(status)) {
      query = query.eq('status', status as FeedbackStatus);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Feedback fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
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

    const body: UpdateFeedbackRequest = await request.json();
    const supabase = await createServerSupabaseClient();

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.status !== undefined) updates.status = body.status;
    if (body.resolution !== undefined) updates.resolution = body.resolution;
    if (body.resolved_at !== undefined) updates.resolved_at = body.resolved_at;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.title !== undefined) updates.title = body.title;
    if (body.notes !== undefined) updates.notes = body.notes;

    const { data, error } = await supabase
      .from('feedback')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Feedback update error:', error);
      return NextResponse.json(
        { error: 'Failed to update feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
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

    const supabase = await createServerSupabaseClient();

    // First get the feedback to check for screenshot
    const { data: existing } = await supabase
      .from('feedback')
      .select('screenshot_url')
      .eq('id', id)
      .single();

    // Delete screenshot from storage if exists
    if (existing?.screenshot_url) {
      const path = existing.screenshot_url.split('/').pop();
      if (path) {
        await supabase.storage.from('media').remove([`feedback/${path}`]);
      }
    }

    // Delete the feedback
    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Feedback delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
