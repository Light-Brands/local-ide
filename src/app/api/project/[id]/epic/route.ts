/**
 * Epic API - Manage epics within a project
 *
 * POST /api/project/[id]/epic - Add an epic
 * PUT /api/project/[id]/epic - Update an epic
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  loadProject,
  addEpic,
  updateEpic,
  Epic
} from '@/lib/project';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: projectId } = await params;
    const epic = await request.json() as Epic;

    if (!epic.id || !epic.name) {
      return NextResponse.json(
        { error: 'Epic id and name are required' },
        { status: 400 }
      );
    }

    // Set defaults
    epic.status = epic.status || 'not-started';
    epic.phase = epic.phase || 'foundation';
    epic.dependencies = epic.dependencies || [];
    epic.tasks = epic.tasks || {
      tables: [],
      endpoints: [],
      services: [],
      components: [],
      tests: [],
      config: []
    };

    const project = addEpic(projectId, epic);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    console.error('Error adding epic:', error);
    return NextResponse.json(
      { error: 'Failed to add epic' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { epicId, updates } = body as {
      epicId: string;
      updates: Partial<Epic>;
    };

    if (!epicId) {
      return NextResponse.json(
        { error: 'epicId is required' },
        { status: 400 }
      );
    }

    const project = updateEpic(projectId, epicId, updates);

    if (!project) {
      return NextResponse.json(
        { error: 'Project or epic not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error('Error updating epic:', error);
    return NextResponse.json(
      { error: 'Failed to update epic' },
      { status: 500 }
    );
  }
}
