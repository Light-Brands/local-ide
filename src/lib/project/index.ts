/**
 * Project Store - Single Source of Truth
 *
 * This module provides the foundation for file-based project tracking.
 * The project.json file powers:
 * - Dev Dashboard (reads progress, tasks, epics)
 * - Orchestration Layer (agents read context, write updates)
 * - Planning Documents (source of truth for plan & brand)
 *
 * Usage:
 *   import { createProject, loadProject, updateTaskStatus } from '@/lib/project';
 */

export * from './project-store';

// Re-export commonly used types
export type {
  ProjectData,
  Epic,
  Task,
  TaskStatus,
  EpicStatus,
  ProjectStatus,
  TaskType,
  UserStory,
  Goal,
  Risk,
  Route,
  ActivityEntry
} from './project-store';
