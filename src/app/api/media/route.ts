import { NextRequest, NextResponse } from 'next/server';
import {
  getAllMedia,
  createMedia,
  deleteMedia,
} from '@/lib/storage/collections';

/**
 * Media API - File-based Storage
 *
 * Stores media metadata in .local-ide/data/media.json
 * Files stored in .local-ide/data/uploads/
 */

// Allowed file types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * GET /api/media
 * List media files
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'image', 'pdf', etc.

    let items = await getAllMedia();

    // Filter by file type if specified
    if (type === 'image') {
      items = items.filter(item => item.file_type.startsWith('image/'));
    } else if (type) {
      items = items.filter(item => item.file_type === type);
    }

    // Sort by created_at descending
    items.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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
    console.error('Media GET error:', error);
    return NextResponse.json(
      { data: null, error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/media
 * Upload a new media file
 *
 * Accepts FormData with 'file' field
 * Optional 'alt_text' field
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const altText = formData.get('alt_text') as string | null;

    if (!file) {
      return NextResponse.json(
        { data: null, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { data: null, error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { data: null, error: 'File too large (max 10MB)' },
        { status: 400 }
      );
    }

    // Get file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Get image dimensions if it's an image
    let width: number | null = null;
    let height: number | null = null;

    if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
      try {
        // Try to get dimensions without sharp (basic approach)
        // For production, you'd want to use sharp for proper image handling
        // but we're keeping it simple to avoid dependencies
      } catch {
        // Ignore dimension extraction errors
      }
    }

    // Create media record and save file
    const mediaItem = await createMedia(buffer, {
      name: file.name,
      file_type: file.type,
      file_size: buffer.length,
      width,
      height,
      alt_text: altText,
      uploaded_by: null, // No auth in local mode
    });

    return NextResponse.json(
      { data: mediaItem, error: null },
      { status: 201 }
    );
  } catch (error) {
    console.error('Media POST error:', error);
    return NextResponse.json(
      { data: null, error: 'Failed to upload media' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/media
 * Delete a media file
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { data: null, error: 'Media ID is required' },
        { status: 400 }
      );
    }

    const deleted = await deleteMedia(id);

    if (!deleted) {
      return NextResponse.json(
        { data: null, error: 'Media not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (error) {
    console.error('Media DELETE error:', error);
    return NextResponse.json(
      { data: null, error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}
