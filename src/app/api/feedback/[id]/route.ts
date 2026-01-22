import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type {
  FeedbackStatus,
  FeedbackPriority,
} from '@/lib/feedback/types';

interface UpdateFeedbackRequest {
  status?: FeedbackStatus;
  resolution?: string;
  resolved_at?: string;
  priority?: FeedbackPriority;
  title?: string;
  notes?: string;
}

// GET - Get single feedback by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Feedback not found' },
          { status: 404 }
        );
      }
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

// PATCH - Update feedback by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

// DELETE - Delete feedback by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // First get the feedback to check for screenshot
    const { data: existing } = await supabase
      .from('feedback')
      .select('screenshot_url')
      .eq('id', id)
      .single();

    // Delete screenshot from storage if exists
    if (existing?.screenshot_url) {
      const urlParts = existing.screenshot_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      if (fileName) {
        await supabase.storage.from('media').remove([`feedback/${fileName}`]);
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
