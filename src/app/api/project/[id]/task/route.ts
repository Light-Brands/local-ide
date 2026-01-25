/**
 * Task API - Manage tasks within a project
 *
 * POST /api/project/[id]/task - Add a task
 * PUT /api/project/[id]/task - Update task status
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  loadProject,
  addTask,
  updateTaskStatus,
  addActivity,
  TaskType,
  TaskStatus,
  Task
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
    const body = await request.json();
    const { epicId, taskType, task } = body as {
      epicId: string;
      taskType: TaskType;
      task: Task;
    };

    if (!epicId || !taskType || !task) {
      return NextResponse.json(
        { error: 'epicId, taskType, and task are required' },
        { status: 400 }
      );
    }

    const project = addTask(projectId, epicId, taskType, task);

    if (!project) {
      return NextResponse.json(
        { error: 'Project or epic not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    console.error('Error adding task:', error);
    return NextResponse.json(
      { error: 'Failed to add task' },
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
    const { epicId, taskId, status, agent } = body as {
      epicId: string;
      taskId: string;
      status: TaskStatus;
      agent?: string;
    };

    if (!epicId || !taskId || !status) {
      return NextResponse.json(
        { error: 'epicId, taskId, and status are required' },
        { status: 400 }
      );
    }

    const project = updateTaskStatus(projectId, epicId, taskId, status, agent);

    if (!project) {
      return NextResponse.json(
        { error: 'Project, epic, or task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}
