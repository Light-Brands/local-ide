'use client';

import { memo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Database, Loader2, Play, Clock, Trash2 } from 'lucide-react';
import { getTableData, formatValue, truncateValue } from '@/lib/ide/services/supabase-db';
import type { QueryResult } from '@/lib/ide/services/supabase-db';
import { getActivityService } from '@/lib/ide/services/activity';
import { useIDEStore } from '../../../stores/ideStore';

interface SQLEditorProps {
  onError: (error: string) => void;
}

export const SQLEditor = memo(function SQLEditor({ onError }: SQLEditorProps) {
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const currentQuery = useIDEStore((state) => state.database.currentQuery);
  const queryHistory = useIDEStore((state) => state.database.queryHistory);
  const setCurrentQuery = useIDEStore((state) => state.setCurrentQuery);
  const addQueryToHistory = useIDEStore((state) => state.addQueryToHistory);

  const runQuery = useCallback(async () => {
    if (!currentQuery.trim()) return;

    setIsRunning(true);

    try {
      // Extract table name from query for REST API fallback
      const tableMatch = currentQuery.match(/FROM\s+(\w+)/i);
      const tableName = tableMatch?.[1] || '';

      const result = await getTableData(tableName, 100, 0);
      setQueryResult(result);
      addQueryToHistory(currentQuery);

      getActivityService().trackDatabaseQuery(currentQuery);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Query failed');
      getActivityService().trackError(
        'Query failed',
        err instanceof Error ? err.message : 'Unknown error'
      );
    } finally {
      setIsRunning(false);
    }
  }, [currentQuery, addQueryToHistory, onError]);

  const loadFromHistory = (query: string) => {
    setCurrentQuery(query);
    setShowHistory(false);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* SQL input */}
      <div className="flex-shrink-0 p-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="relative">
          <textarea
            value={currentQuery}
            onChange={(e) => setCurrentQuery(e.target.value)}
            placeholder="SELECT * FROM users LIMIT 10;"
            className={cn(
              'w-full h-32 p-3 rounded-lg',
              'bg-neutral-50 dark:bg-neutral-800',
              'border border-neutral-200 dark:border-neutral-700',
              'font-mono text-sm',
              'resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20'
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                runQuery();
              }
            }}
          />
          <div className="absolute top-2 right-2 text-[10px] text-neutral-400">
            {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to run
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          {/* History button */}
          <div className="relative">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <Clock className="w-3.5 h-3.5" />
              History ({queryHistory.length})
            </button>

            {/* History dropdown */}
            {showHistory && queryHistory.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-80 max-h-60 overflow-y-auto bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-10">
                {queryHistory.slice().reverse().map((query, i) => (
                  <button
                    key={i}
                    onClick={() => loadFromHistory(query)}
                    className="w-full px-3 py-2 text-left text-xs font-mono text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 border-b border-neutral-100 dark:border-neutral-700 last:border-b-0 truncate"
                  >
                    {query}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Run button */}
          <button
            onClick={runQuery}
            disabled={isRunning || !currentQuery.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run Query
          </button>
        </div>
      </div>

      {/* Results */}
      {queryResult ? (
        <div className="flex-1 overflow-auto">
          <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-900/50 text-xs text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
            {queryResult.rowCount} rows returned in {queryResult.executionTime}ms
          </div>
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-neutral-100 dark:bg-neutral-800">
              <tr>
                {queryResult.columns.map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2 text-left font-medium text-neutral-600 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queryResult.rows.map((row, i) => (
                <tr
                  key={i}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800"
                >
                  {queryResult.columns.map((col) => (
                    <td
                      key={col}
                      className="px-3 py-2 text-neutral-700 dark:text-neutral-300"
                    >
                      {truncateValue(formatValue(row[col]))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-neutral-500">
          <div className="text-center">
            <Database className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
            <p>Run a query to see results</p>
          </div>
        </div>
      )}
    </div>
  );
});
