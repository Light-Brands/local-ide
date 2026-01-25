/**
 * Project API - List and Create Projects
 *
 * GET /api/project - List all projects
 * POST /api/project - Create a new project
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  listProjects,
  createProject,
  loadProject
} from '@/lib/project';

export async function GET() {
  try {
    const projects = listProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error listing projects:', error);
    return NextResponse.json(
      { error: 'Failed to list projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: 'id and name are required' },
        { status: 400 }
      );
    }

    // Check if project already exists
    const existing = loadProject(id);
    if (existing) {
      return NextResponse.json(
        { error: 'Project already exists' },
        { status: 409 }
      );
    }

    const project = createProject(id, name, description);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
