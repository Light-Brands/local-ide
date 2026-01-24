/**
 * useOperationSync Hook
 *
 * Bridges the OperationTracker service to the Zustand store,
 * keeping the store's operations state in sync with the service.
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useIDEStore } from '@/app/ide/stores/ideStore';
import {
  getOperationTracker,
  type Operation,
  type OperationType,
  TOOL_TO_OPERATION_TYPE,
} from '../services/operations';

// =============================================================================
// HOOK
// =============================================================================

export interface UseOperationSyncReturn {
  /** Start tracking an operation */
  startOperation: (type: OperationType, title: string, options?: {
    id?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }) => Operation;
  /** Complete an operation */
  completeOperation: (id: string, status?: 'success' | 'error' | 'cancelled', options?: {
    error?: string;
    metadata?: Record<string, unknown>;
  }) => void;
  /** Track a tool use event from chat SSE */
  handleToolStart: (toolName: string, input: Record<string, unknown>, id: string) => void;
  /** Handle tool completion from chat SSE */
  handleToolEnd: (id: string, status: 'success' | 'error', error?: string) => void;
  /** Track thinking state */
  handleThinkingStart: (id?: string) => Operation;
  /** Complete thinking state */
  handleThinkingEnd: (id: string) => void;
  /** Get currently running operations */
  getRunningOperations: () => Operation[];
  /** Clear all operations */
  clearOperations: () => void;
}

export function useOperationSync(): UseOperationSyncReturn {
  const setOperations = useIDEStore((state) => state.setOperations);

  // Subscribe to operation tracker updates and sync to store
  useEffect(() => {
    const tracker = getOperationTracker();
    const unsubscribe = tracker.subscribe((operations) => {
      setOperations(operations);
    });

    return () => {
      unsubscribe();
    };
  }, [setOperations]);

  // Start an operation
  const startOperation = useCallback((
    type: OperationType,
    title: string,
    options?: {
      id?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    }
  ): Operation => {
    const tracker = getOperationTracker();
    return tracker.startOperation(type, title, options);
  }, []);

  // Complete an operation
  const completeOperation = useCallback((
    id: string,
    status: 'success' | 'error' | 'cancelled' = 'success',
    options?: {
      error?: string;
      metadata?: Record<string, unknown>;
    }
  ): void => {
    const tracker = getOperationTracker();
    tracker.completeOperation(id, status, options);
  }, []);

  // Handle tool start from chat SSE
  const handleToolStart = useCallback((
    toolName: string,
    input: Record<string, unknown>,
    id: string
  ): void => {
    const tracker = getOperationTracker();

    // Skip if not a tracked tool type
    if (!TOOL_TO_OPERATION_TYPE[toolName]) return;

    tracker.trackToolUse(toolName, input, id);
  }, []);

  // Handle tool end from chat SSE
  const handleToolEnd = useCallback((
    id: string,
    status: 'success' | 'error',
    error?: string
  ): void => {
    const tracker = getOperationTracker();
    tracker.completeOperation(id, status === 'success' ? 'success' : 'error', { error });
  }, []);

  // Handle thinking start
  const handleThinkingStart = useCallback((id?: string): Operation => {
    const tracker = getOperationTracker();
    return tracker.trackThinking(id);
  }, []);

  // Handle thinking end
  const handleThinkingEnd = useCallback((id: string): void => {
    const tracker = getOperationTracker();
    tracker.completeOperation(id, 'success');
  }, []);

  // Get running operations
  const getRunningOperations = useCallback((): Operation[] => {
    const tracker = getOperationTracker();
    return tracker.getRunning();
  }, []);

  // Clear all operations
  const clearOperations = useCallback((): void => {
    const tracker = getOperationTracker();
    tracker.clear();
  }, []);

  return {
    startOperation,
    completeOperation,
    handleToolStart,
    handleToolEnd,
    handleThinkingStart,
    handleThinkingEnd,
    getRunningOperations,
    clearOperations,
  };
}
