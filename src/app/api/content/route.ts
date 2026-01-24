import { NextRequest, NextResponse } from 'next/server';
import {
  getAllContent,
  getContentBySlug,
  createContent,
  updateContent,
  deleteContent,
} from '@/lib/storage/collections';

/**
 * Content API - File-based Storage
 *
 * Stores content in .local-ide/data/content.json
 */

// GET - Retrieve content
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const status = searchParams.get('status');

    // Get by slug
    if (slug) {
      const item = await getContentBySlug(slug);
      if (!item) {
        return NextResponse.json(
          { data: null, error: 'Content not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ data: item, error: null });
    }

    // Get all
    let items = await getAllContent();

    // Filter by status
    if (status && ['draft', 'published', 'archived'].includes(status)) {
      items = items.filter(item => item.status === status);
    }

    // Sort by updated_at descending
    items.sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    return NextResponse.json({
      data: {
        items,
        pagination: {
          total: items.length,
          limit: items.length,
          offset: 0,
          hasMore: false,
        },
      },
      error: null,
    });
  } catch (error) {
    console.error('Content GET error:', error);
    return NextResponse.json(
      { data: null, error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

// POST - Create content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.slug || !body.title) {
      return NextResponse.json(
        { data: null, error: 'slug and title are required' },
        { status: 400 }
      );
    }

    // Check for duplicate slug
    const existing = await getContentBySlug(body.slug);
    if (existing) {
      return NextResponse.json(
        { data: null, error: 'Content with this slug already exists' },
        { status: 409 }
      );
    }

    const newContent = await createContent({
      slug: body.slug,
      title: body.title,
      description: body.description || null,
      body: body.body || null,
      featured_image: body.featured_image || null,
      status: body.status || 'draft',
      author_id: body.author_id || null,
      metadata: body.metadata || null,
      published_at: body.status === 'published' ? new Date().toISOString() : null,
    });

    return NextResponse.json({ data: newContent, error: null }, { status: 201 });
  } catch (error) {
    console.error('Content POST error:', error);
    return NextResponse.json(
      { data: null, error: 'Failed to create content' },
      { status: 500 }
    );
  }
}

// PATCH - Update content
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json();
    const id = searchParams.get('id') || body.id;

    if (!id) {
      return NextResponse.json(
        { data: null, error: 'Content ID is required' },
        { status: 400 }
      );
    }

    // If changing slug, check for duplicates
    if (body.slug) {
      const existing = await getContentBySlug(body.slug);
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { data: null, error: 'Content with this slug already exists' },
          { status: 409 }
        );
      }
    }

    // Handle publish date
    const updates = { ...body };
    delete updates.id; // Don't include id in updates

    if (body.status === 'published' && !body.published_at) {
      updates.published_at = new Date().toISOString();
    }

    const updated = await updateContent(id, updates);

    if (!updated) {
      return NextResponse.json(
        { data: null, error: 'Content not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updated, error: null });
  } catch (error) {
    console.error('Content PATCH error:', error);
    return NextResponse.json(
      { data: null, error: 'Failed to update content' },
      { status: 500 }
    );
  }
}

// DELETE - Delete content
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { data: null, error: 'Content ID is required' },
        { status: 400 }
      );
    }

    const deleted = await deleteContent(id);

    if (!deleted) {
      return NextResponse.json(
        { data: null, error: 'Content not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (error) {
    console.error('Content DELETE error:', error);
    return NextResponse.json(
      { data: null, error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}
