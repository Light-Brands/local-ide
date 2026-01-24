import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings, type IDESettings } from '@/lib/storage/configStorage';

/**
 * Settings API - IDE preferences
 */

// GET - Retrieve settings
export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    );
  }
}

// PATCH - Update settings
export async function PATCH(request: NextRequest) {
  try {
    const updates: Partial<IDESettings> = await request.json();
    const settings = await updateSettings(updates);
    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error('Settings PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
