/**
 * Project Store - Single Source of Truth
 *
 * This module provides read/write access to the project.json file
 * that powers the dev dashboard and orchestration layer.
 *
 * File location: /docs/planning/projects/[project-id].json
 */

import fs from 'fs';
import path from 'path';

// ============================================================================
// Types
// ============================================================================

export type TaskStatus = 'pending' | 'in-progress' | 'complete' | 'blocked';
export type EpicStatus = 'not-started' | 'in-progress' | 'blocked' | 'complete';
export type ProjectStatus = 'planning' | 'in-progress' | 'paused' | 'complete';
export type Phase = 'foundation' | 'mvp' | 'growth' | 'scale';
export type TaskType = 'tables' | 'endpoints' | 'services' | 'components' | 'tests' | 'config';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Tone = 'formal' | 'casual' | 'professional' | 'playful' | 'technical' | 'approachable';
export type Style = 'modern' | 'classic' | 'minimal' | 'bold' | 'clean' | 'decorative';

export interface Task {
  id: string;
  name: string;
  description?: string;
  status: TaskStatus;
  priority?: Priority;
  filePath?: string;
  acceptanceCriteria?: string[];
  relatedTests?: string[];
  assignee?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
}

export interface Epic {
  id: string;
  name: string;
  description?: string;
  phase: Phase;
  status: EpicStatus;
  dependencies: string[];
  tasks: {
    tables: Task[];
    endpoints: Task[];
    services: Task[];
    components: Task[];
    tests: Task[];
    config: Task[];
  };
}

export interface UserStory {
  id: string;
  persona: string;
  want: string;
  benefit: string;
  acceptanceCriteria?: string[];
}

export interface Risk {
  description: string;
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface Goal {
  id: string;
  description: string;
  completed: boolean;
}

export interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  auth: boolean;
  status: TaskStatus;
}

export interface ActivityEntry {
  timestamp: string;
  agent: string;
  action: string;
  details: string;
  affectedItems?: string[];
}

export interface ProjectData {
  meta: {
    id: string;
    name: string;
    description?: string;
    created: string;
    updated?: string;
    status: ProjectStatus;
    version: string;
  };
  plan: {
    problem: string;
    targetUsers?: string;
    goals: Goal[];
    userStories: UserStory[];
    constraints: string[];
    outOfScope: string[];
    successCriteria: string[];
    risks: Risk[];
    approval: {
      approved: boolean;
      approvedBy?: string;
      approvedAt?: string;
      notes?: string;
    };
  };
  brand: {
    colors: {
      primary: string;
      secondary: string;
      accent?: string;
      background?: string;
      foreground?: string;
      muted?: string;
      success?: string;
      warning?: string;
      error?: string;
    };
    typography: {
      headingFont: string;
      bodyFont: string;
      codeFont?: string;
      scale?: Record<string, string>;
    };
    tone: Tone;
    style: Style;
    references: string[];
    approval: {
      approved: boolean;
      approvedBy?: string;
      approvedAt?: string;
    };
  };
  epics: Epic[];
  routes: Route[];
  tooling: {
    commands: Array<{ name: string; command: string; description: string }>;
    agents: Array<{ name: string; invocation: string; description: string }>;
  };
  activity: ActivityEntry[];
}

// ============================================================================
// File Paths
// ============================================================================

const PROJECTS_DIR = path.join(process.cwd(), 'docs', 'planning', 'projects');
const TEMPLATE_PATH = path.join(PROJECTS_DIR, '_template.json');

function getProjectPath(projectId: string): string {
  return path.join(PROJECTS_DIR, `${projectId}.json`);
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Load a project by ID
 */
export function loadProject(projectId: string): ProjectData | null {
  const filePath = getProjectPath(projectId);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as ProjectData;
}

/**
 * Save a project
 */
export function saveProject(project: ProjectData): void {
  const filePath = getProjectPath(project.meta.id);

  // Update the timestamp
  project.meta.updated = new Date().toISOString();

  // Ensure directory exists
  if (!fs.existsSync(PROJECTS_DIR)) {
    fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  }

  fs.writeFileSync(filePath, JSON.stringify(project, null, 2), 'utf-8');
}

/**
 * Create a new project from template
 */
export function createProject(
  projectId: string,
  name: string,
  description?: string
): ProjectData {
  // Load template
  const templateContent = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  const project = JSON.parse(templateContent) as ProjectData;

  // Customize
  project.meta.id = projectId;
  project.meta.name = name;
  project.meta.description = description || '';
  project.meta.created = new Date().toISOString().split('T')[0];
  project.meta.updated = new Date().toISOString();
  project.meta.status = 'planning';

  // Save
  saveProject(project);

  // Log activity
  addActivity(projectId, 'system', 'created', `Project "${name}" created`);

  return project;
}

/**
 * List all projects
 */
export function listProjects(): Array<{ id: string; name: string; status: ProjectStatus }> {
  if (!fs.existsSync(PROJECTS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(PROJECTS_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('_'));

  return files.map(f => {
    const project = loadProject(f.replace('.json', ''));
    return project ? {
      id: project.meta.id,
      name: project.meta.name,
      status: project.meta.status
    } : null;
  }).filter(Boolean) as Array<{ id: string; name: string; status: ProjectStatus }>;
}

// ============================================================================
// Plan Functions
// ============================================================================

/**
 * Update the project plan
 */
export function updatePlan(
  projectId: string,
  planUpdates: Partial<ProjectData['plan']>
): ProjectData | null {
  const project = loadProject(projectId);
  if (!project) return null;

  project.plan = { ...project.plan, ...planUpdates };
  saveProject(project);

  addActivity(projectId, 'orchestration', 'plan-updated', 'Plan updated');

  return project;
}

/**
 * Approve the plan
 */
export function approvePlan(projectId: string, approvedBy: string, notes?: string): ProjectData | null {
  const project = loadProject(projectId);
  if (!project) return null;

  project.plan.approval = {
    approved: true,
    approvedBy,
    approvedAt: new Date().toISOString(),
    notes
  };

  saveProject(project);
  addActivity(projectId, approvedBy, 'plan-approved', 'Plan approved');

  return project;
}

// ============================================================================
// Brand Functions
// ============================================================================

/**
 * Update brand guidelines
 */
export function updateBrand(
  projectId: string,
  brandUpdates: Partial<ProjectData['brand']>
): ProjectData | null {
  const project = loadProject(projectId);
  if (!project) return null;

  project.brand = { ...project.brand, ...brandUpdates };
  saveProject(project);

  addActivity(projectId, 'orchestration', 'brand-updated', 'Brand guidelines updated');

  return project;
}

/**
 * Approve brand guidelines
 */
export function approveBrand(projectId: string, approvedBy: string): ProjectData | null {
  const project = loadProject(projectId);
  if (!project) return null;

  project.brand.approval = {
    approved: true,
    approvedBy,
    approvedAt: new Date().toISOString()
  };

  saveProject(project);
  addActivity(projectId, approvedBy, 'brand-approved', 'Brand guidelines approved');

  return project;
}

// ============================================================================
// Epic & Task Functions
// ============================================================================

/**
 * Add an epic
 */
export function addEpic(projectId: string, epic: Epic): ProjectData | null {
  const project = loadProject(projectId);
  if (!project) return null;

  project.epics.push(epic);
  saveProject(project);

  addActivity(projectId, 'orchestration', 'epic-added', `Epic "${epic.name}" added`);

  return project;
}

/**
 * Update an epic
 */
export function updateEpic(
  projectId: string,
  epicId: string,
  updates: Partial<Epic>
): ProjectData | null {
  const project = loadProject(projectId);
  if (!project) return null;

  const epicIndex = project.epics.findIndex(e => e.id === epicId);
  if (epicIndex === -1) return null;

  project.epics[epicIndex] = { ...project.epics[epicIndex], ...updates };
  saveProject(project);

  addActivity(projectId, 'orchestration', 'epic-updated', `Epic "${epicId}" updated`);

  return project;
}

/**
 * Add a task to an epic
 */
export function addTask(
  projectId: string,
  epicId: string,
  taskType: TaskType,
  task: Task
): ProjectData | null {
  const project = loadProject(projectId);
  if (!project) return null;

  const epic = project.epics.find(e => e.id === epicId);
  if (!epic) return null;

  task.createdAt = new Date().toISOString();
  epic.tasks[taskType].push(task);

  saveProject(project);
  addActivity(projectId, 'orchestration', 'task-added', `Task "${task.name}" added to ${epicId}`);

  return project;
}

/**
 * Update a task status
 */
export function updateTaskStatus(
  projectId: string,
  epicId: string,
  taskId: string,
  status: TaskStatus,
  agent?: string
): ProjectData | null {
  const project = loadProject(projectId);
  if (!project) return null;

  const epic = project.epics.find(e => e.id === epicId);
  if (!epic) return null;

  // Find task in any category
  for (const taskType of Object.keys(epic.tasks) as TaskType[]) {
    const task = epic.tasks[taskType].find(t => t.id === taskId);
    if (task) {
      task.status = status;
      task.updatedAt = new Date().toISOString();
      if (status === 'complete') {
        task.completedAt = new Date().toISOString();
      }
      break;
    }
  }

  // Update epic status based on tasks
  updateEpicStatusFromTasks(epic);

  saveProject(project);
  addActivity(projectId, agent || 'system', 'task-status-changed', `Task "${taskId}" status changed to ${status}`);

  return project;
}

/**
 * Helper to update epic status based on task statuses
 */
function updateEpicStatusFromTasks(epic: Epic): void {
  const allTasks = [
    ...epic.tasks.tables,
    ...epic.tasks.endpoints,
    ...epic.tasks.services,
    ...epic.tasks.components,
    ...epic.tasks.tests,
    ...epic.tasks.config
  ];

  if (allTasks.length === 0) {
    epic.status = 'not-started';
    return;
  }

  const statuses = allTasks.map(t => t.status);

  if (statuses.every(s => s === 'complete')) {
    epic.status = 'complete';
  } else if (statuses.some(s => s === 'blocked')) {
    epic.status = 'blocked';
  } else if (statuses.some(s => s === 'in-progress' || s === 'complete')) {
    epic.status = 'in-progress';
  } else {
    epic.status = 'not-started';
  }
}

// ============================================================================
// Activity Log
// ============================================================================

/**
 * Add an activity entry
 */
export function addActivity(
  projectId: string,
  agent: string,
  action: string,
  details: string,
  affectedItems?: string[]
): void {
  const project = loadProject(projectId);
  if (!project) return;

  project.activity.unshift({
    timestamp: new Date().toISOString(),
    agent,
    action,
    details,
    affectedItems
  });

  // Keep only last 100 entries
  project.activity = project.activity.slice(0, 100);

  saveProject(project);
}

// ============================================================================
// Progress Calculations
// ============================================================================

/**
 * Get overall project progress
 */
export function getProjectProgress(projectId: string): {
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  pending: number;
  percentage: number;
} {
  const project = loadProject(projectId);
  if (!project) {
    return { total: 0, completed: 0, inProgress: 0, blocked: 0, pending: 0, percentage: 0 };
  }

  let total = 0;
  let completed = 0;
  let inProgress = 0;
  let blocked = 0;
  let pending = 0;

  for (const epic of project.epics) {
    for (const taskType of Object.keys(epic.tasks) as TaskType[]) {
      for (const task of epic.tasks[taskType]) {
        total++;
        switch (task.status) {
          case 'complete': completed++; break;
          case 'in-progress': inProgress++; break;
          case 'blocked': blocked++; break;
          case 'pending': pending++; break;
        }
      }
    }
  }

  return {
    total,
    completed,
    inProgress,
    blocked,
    pending,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0
  };
}

/**
 * Get epic progress
 */
export function getEpicProgress(projectId: string, epicId: string): {
  total: number;
  completed: number;
  percentage: number;
} {
  const project = loadProject(projectId);
  if (!project) {
    return { total: 0, completed: 0, percentage: 0 };
  }

  const epic = project.epics.find(e => e.id === epicId);
  if (!epic) {
    return { total: 0, completed: 0, percentage: 0 };
  }

  let total = 0;
  let completed = 0;

  for (const taskType of Object.keys(epic.tasks) as TaskType[]) {
    for (const task of epic.tasks[taskType]) {
      total++;
      if (task.status === 'complete') completed++;
    }
  }

  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0
  };
}

// ============================================================================
// Export for Dashboard
// ============================================================================

/**
 * Get data formatted for the dev dashboard
 * This converts project.json format to the format expected by trackerData.ts
 */
export function getTrackerData(projectId: string) {
  const project = loadProject(projectId);
  if (!project) return null;

  return {
    meta: project.meta,
    plan: project.plan,
    brand: project.brand,
    epics: project.epics,
    routes: project.routes,
    tooling: project.tooling,
    activity: project.activity,
    progress: getProjectProgress(projectId)
  };
}
