'use client';

import { memo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Table, Loader2, Key, Edit3, Trash2, Save, X } from 'lucide-react';
import {
  formatValue,
  truncateValue,
  getTypeColor,
  updateRow,
  deleteRow,
} from '@/lib/ide/services/supabase-db';
import type { TableSchema, QueryResult } from '@/lib/ide/services/supabase-db';
import { getActivityService } from '@/lib/ide/services/activity';

interface DataTableProps {
  tableName: string;
  schema: TableSchema | null;
  data: QueryResult | null;
  isLoading: boolean;
  onRefresh: () => void;
  onError: (error: string) => void;
}

export const DataTable = memo(function DataTable({
  tableName,
  schema,
  data,
  isLoading,
  onRefresh,
  onError,
}: DataTableProps) {
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Record<string, unknown>>({});

  const startEdit = (rowIndex: number) => {
    if (!data) return;
    setEditingRow(rowIndex);
    setEditValues({ ...data.rows[rowIndex] });
  };

  const cancelEdit = () => {
    setEditingRow(null);
    setEditValues({});
  };

  const saveEdit = useCallback(async () => {
    if (editingRow === null || !schema || !data) return;

    const primaryKey = schema.primaryKey[0] || 'id';
    const primaryValue = data.rows[editingRow][primaryKey];

    try {
      await updateRow(tableName, primaryKey, primaryValue, editValues);
      onRefresh();
      setEditingRow(null);
      setEditValues({});

      getActivityService().trackDatabaseQuery(
        `UPDATE ${tableName} SET ... WHERE ${primaryKey} = ${primaryValue}`
      );
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to save changes');
      getActivityService().trackError(
        'Row update failed',
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  }, [editingRow, schema, data, tableName, editValues, onRefresh, onError]);

  const handleDelete = useCallback(async (rowIndex: number) => {
    if (!schema || !data) return;

    const primaryKey = schema.primaryKey[0] || 'id';
    const primaryValue = data.rows[rowIndex][primaryKey];

    if (!confirm('Are you sure you want to delete this row?')) return;

    try {
      await deleteRow(tableName, primaryKey, primaryValue);
      onRefresh();

      getActivityService().trackDatabaseQuery(
        `DELETE FROM ${tableName} WHERE ${primaryKey} = ${primaryValue}`
      );
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to delete row');
      getActivityService().trackError(
        'Row deletion failed',
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  }, [schema, data, tableName, onRefresh, onError]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!data || data.rows.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-500">
        <div className="text-center">
          <Table className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
          <p>No data in this table</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-neutral-100 dark:bg-neutral-800">
          <tr>
            {data.columns.map((col) => {
              const colSchema = schema?.columns.find((c) => c.name === col);
              return (
                <th
                  key={col}
                  className="px-3 py-2 text-left font-medium text-neutral-600 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700"
                >
                  <div className="flex items-center gap-1">
                    {colSchema?.isPrimaryKey && (
                      <Key className="w-3 h-3 text-amber-500" />
                    )}
                    <span>{col}</span>
                    {colSchema && (
                      <span className={cn('text-xs', getTypeColor(colSchema.type))}>
                        ({colSchema.type})
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
            <th className="px-3 py-2 text-left font-medium text-neutral-600 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700 w-20">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800"
            >
              {data.columns.map((col) => (
                <td
                  key={col}
                  className="px-3 py-2 text-neutral-700 dark:text-neutral-300"
                >
                  {editingRow === rowIndex ? (
                    <input
                      type="text"
                      value={formatValue(editValues[col])}
                      onChange={(e) =>
                        setEditValues((prev) => ({
                          ...prev,
                          [col]: e.target.value,
                        }))
                      }
                      className="w-full px-2 py-1 text-sm bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded"
                    />
                  ) : (
                    <span
                      className="block max-w-[200px] truncate"
                      title={formatValue(row[col])}
                    >
                      {truncateValue(formatValue(row[col]))}
                    </span>
                  )}
                </td>
              ))}
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  {editingRow === rowIndex ? (
                    <>
                      <button
                        onClick={saveEdit}
                        className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(rowIndex)}
                        className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(rowIndex)}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
