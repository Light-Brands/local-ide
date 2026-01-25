/**
 * Project API - Get, Update, Delete a specific project
 *
 * GET /api/project/[id] - Get project details
 * PUT /api/project/[id] - Update project
 * DELETE /api/project/[id] - Delete project
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  loadProject,
  saveProject,
  getProjectProgress,
  getTrackerData
} from '@/lib/project';
import fs from 'fs';
import path from 'path';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const project = loadProject(id);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if tracker data format is requested
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    if (format === 'tracker') {
      const trackerData = getTrackerData(id);
      return NextResponse.json(trackerData);
    }

    // Include progress in response
    const progress = getProjectProgress(id);
    return NextResponse.json({ project, progress });
  } catch (error) {
    console.error('Error loading project:', error);
    return NextResponse.json(
      { error: 'Failed to load project' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const project = loadProject(id);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const updates = await request.json();

    // Merge updates
    const updatedProject = {
      ...project,
      ...updates,
      meta: { ...project.meta, ...updates.meta },
      plan: { ...project.plan, ...updates.plan },
      brand: { ...project.brand, ...updates.brand }
    };

    saveProject(updatedProject);

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const projectPath = path.join(
      process.cwd(),
      'docs',
      'planning',
      'projects',
      `${id}.json`
    );

    if (!fs.existsSync(projectPath)) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    fs.unlinkSync(projectPath);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
