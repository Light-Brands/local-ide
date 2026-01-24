'use client';

import { memo } from 'react';
import { Table, ChevronRight, Loader2 } from 'lucide-react';
import type { TableInfo } from '@/lib/ide/services/supabase-db';

interface TableListProps {
  tables: TableInfo[];
  isLoading: boolean;
  onSelectTable: (name: string) => void;
}

export const TableList = memo(function TableList({
  tables,
  isLoading,
  onSelectTable,
}: TableListProps) {
  if (isLoading && tables.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Table className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mb-3" />
        <p className="text-neutral-500">No tables found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {tables.map((table) => (
        <button
          key={table.name}
          onClick={() => onSelectTable(table.name)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Table className="w-5 h-5 text-primary-500" />
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              {table.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">
              {table.rowCount.toLocaleString()} rows
            </span>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </div>
        </button>
      ))}
    </div>
  );
});
