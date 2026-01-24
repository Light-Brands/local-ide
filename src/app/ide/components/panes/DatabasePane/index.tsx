'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useIDEStore, useMigrations } from '../../../stores/ideStore';
import type { MigrationFile, MigrationRunResult } from '../../../stores/ideStore';
import { useMobileDetect } from '../../../hooks';
import {
  listTables,
  getTableData,
  getTableSchema,
  executeQuery,
  insertRow,
  updateRow,
  deleteRow,
  getStoredSupabaseConfig,
  formatValue,
  truncateValue,
} from '@/lib/ide/services/supabase-db';
import type { TableInfo, TableSchema, QueryResult, ColumnInfo } from '@/lib/ide/services/supabase-db';
import {
  Database,
  Table,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Settings,
  ExternalLink,
  Plus,
  Edit3,
  Trash2,
  X,
  Play,
  FileCode,
  Layers,
  GitBranch,
  CheckCircle,
  Circle,
  AlertTriangle,
  GripHorizontal,
} from 'lucide-react';

// Import CSS
import '../../../styles/panes/database.css';

// Types
type TabType = 'tables' | 'schema' | 'query' | 'migrations';
type MobileView = 'tables' | 'rows' | 'detail';

interface TableData {
  rows: Record<string, unknown>[];
  columns: string[];
  rowCount: number;
  executionTime: number;
  schema?: TableSchema;
}

// Postgres types for add column modal
const POSTGRES_TYPES = [
  { value: 'text', label: 'text', description: 'Variable-length string' },
  { value: 'varchar(255)', label: 'varchar(255)', description: 'Variable-length string with limit' },
  { value: 'integer', label: 'integer', description: '4-byte signed integer' },
  { value: 'bigint', label: 'bigint', description: '8-byte signed integer' },
  { value: 'boolean', label: 'boolean', description: 'True or false' },
  { value: 'uuid', label: 'uuid', description: 'Universally unique identifier' },
  { value: 'timestamptz', label: 'timestamptz', description: 'Date and time with timezone' },
  { value: 'jsonb', label: 'jsonb', description: 'Binary JSON data' },
  { value: 'numeric', label: 'numeric', description: 'Arbitrary precision number' },
  { value: 'date', label: 'date', description: 'Calendar date' },
];

// Helper to format SQL values
function formatSqlValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

// Haptic feedback helper
const haptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const durations = { light: 10, medium: 20, heavy: 30 };
    navigator.vibrate(durations[style]);
  }
};

export function DatabasePane() {
  const isMobile = useMobileDetect();
  const [activeTab, setActiveTab] = useState<TabType>('tables');
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [tableSchemas, setTableSchemas] = useState<Record<string, TableSchema>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Table browser state
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [tableDataLoading, setTableDataLoading] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  // Query editor state
  const [query, setQuery] = useState('SELECT * FROM ');
  const [queryResults, setQueryResults] = useState<QueryResult | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Modal state
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [isAddingColumn, setIsAddingColumn] = useState(false);

  // Mobile drill-down state
  const [mobileView, setMobileView] = useState<MobileView>('tables');
  const [selectedRowForDetail, setSelectedRowForDetail] = useState<Record<string, unknown> | null>(null);

  const supabase = useIDEStore((state) => state.integrations.supabase);
  const hasConfig = !!getStoredSupabaseConfig();

  // Migrations state
  const {
    migrations,
    migrationsLoading,
    migrationsSummary,
    migrationRunResults,
    autoApplyMigrations,
    setMigrations,
    setMigrationsLoading,
    setMigrationRunResult,
    clearMigrationRunResult,
    setAutoApplyMigrations,
  } = useMigrations();

  // Fetch migrations
  const fetchMigrations = useCallback(async () => {
    setMigrationsLoading(true);
    try {
      const response = await fetch('/api/ide/migrations');
      const data = await response.json();
      if (data.success) {
        setMigrations(data.migrations || [], data.summary || null);
      }
    } catch (err) {
      console.error('Failed to fetch migrations:', err);
    } finally {
      setMigrationsLoading(false);
    }
  }, [setMigrations, setMigrationsLoading]);

  // Run a migration
  const runMigration = useCallback(async (version: string) => {
    try {
      const response = await fetch('/api/ide/migrations/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version }),
      });
      const data = await response.json();
      if (data.result) {
        setMigrationRunResult(version, data.result);
        // Refresh migrations list
        fetchMigrations();
      }
    } catch (err) {
      setMigrationRunResult(version, {
        version,
        success: false,
        message: 'Failed to run migration',
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: Date.now(),
      });
    }
  }, [setMigrationRunResult, fetchMigrations]);

  // Fetch migrations on tab switch
  useEffect(() => {
    if (activeTab === 'migrations') {
      fetchMigrations();
    }
  }, [activeTab, fetchMigrations]);

  // Fetch tables list
  const fetchTables = useCallback(async () => {
    if (!hasConfig) return;

    setIsLoading(true);
    setError(null);

    try {
      const tableList = await listTables();
      setTables(tableList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tables');
    } finally {
      setIsLoading(false);
    }
  }, [hasConfig]);

  // Fetch table data
  const fetchTableData = useCallback(async (tableName: string, offset = 0) => {
    setTableDataLoading(true);
    try {
      const [schema, data] = await Promise.all([
        getTableSchema(tableName),
        getTableData(tableName, PAGE_SIZE, offset),
      ]);

      setTableData({
        ...data,
        schema,
      });
      setTableSchemas(prev => ({ ...prev, [tableName]: schema }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch table data');
    } finally {
      setTableDataLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if ((supabase.connected || hasConfig) && activeTab === 'tables') {
      fetchTables();
    }
  }, [supabase.connected, hasConfig, activeTab, fetchTables]);

  // Handle table selection
  const handleSelectTable = useCallback((tableName: string) => {
    setSelectedTable(tableName);
    setPage(0);
    fetchTableData(tableName, 0);
    if (isMobile) {
      haptic('light');
      setMobileView('rows');
    }
  }, [fetchTableData, isMobile]);

  // Handle pagination
  const handlePageChange = useCallback((newPage: number) => {
    if (!selectedTable) return;
    setPage(newPage);
    fetchTableData(selectedTable, newPage * PAGE_SIZE);
  }, [selectedTable, fetchTableData]);

  // Mobile navigation
  const handleMobileBack = useCallback(() => {
    haptic('light');
    if (mobileView === 'detail') {
      setMobileView('rows');
      setSelectedRowForDetail(null);
    } else if (mobileView === 'rows') {
      setMobileView('tables');
      setSelectedTable(null);
      setTableData(null);
    }
  }, [mobileView]);

  const handleMobileRowSelect = useCallback((row: Record<string, unknown>) => {
    haptic('light');
    setSelectedRowForDetail(row);
    setMobileView('detail');
  }, []);

  // Row operations
  const handleSaveRow = useCallback(async (row: Record<string, unknown>) => {
    if (!selectedTable || !tableData?.schema) return;

    try {
      if (editingRow) {
        // Update existing row
        const pkColumn = tableData.schema.primaryKey[0] || 'id';
        const pkValue = editingRow[pkColumn];
        await updateRow(selectedTable, pkColumn, pkValue, row);
      } else {
        // Insert new row
        await insertRow(selectedTable, row);
      }

      setEditingRow(null);
      setIsAddingRow(false);
      fetchTableData(selectedTable, page * PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save row');
    }
  }, [selectedTable, tableData, editingRow, page, fetchTableData]);

  const handleDeleteRow = useCallback(async (row: Record<string, unknown>) => {
    if (!selectedTable || !tableData?.schema) return;
    if (!confirm('Are you sure you want to delete this row?')) return;

    try {
      const pkColumn = tableData.schema.primaryKey[0] || 'id';
      const pkValue = row[pkColumn];
      await deleteRow(selectedTable, pkColumn, pkValue);
      fetchTableData(selectedTable, page * PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete row');
    }
  }, [selectedTable, tableData, page, fetchTableData]);

  // Schema expansion
  const toggleTableExpand = useCallback(async (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
      // Fetch schema if not cached
      if (!tableSchemas[tableName]) {
        try {
          const schema = await getTableSchema(tableName);
          setTableSchemas(prev => ({ ...prev, [tableName]: schema }));
        } catch (err) {
          console.error('Failed to fetch schema:', err);
        }
      }
    }
    setExpandedTables(newExpanded);
  }, [expandedTables, tableSchemas]);

  // Run SQL query
  const runQuery = useCallback(async () => {
    if (!query.trim()) return;

    setQueryLoading(true);
    setQueryError(null);
    setQueryResults(null);

    try {
      const results = await executeQuery(query);
      setQueryResults(results);
    } catch (err) {
      setQueryError(err instanceof Error ? err.message : 'Query execution failed');
    } finally {
      setQueryLoading(false);
    }
  }, [query]);

  // Not connected state
  if (!supabase.connected && !hasConfig) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-neutral-950">
        <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center mb-4">
          <Database className="w-8 h-8 text-neutral-400" />
        </div>
        <h3 className="text-lg font-medium text-neutral-300 mb-2">
          Database not connected
        </h3>
        <p className="text-sm text-neutral-500 mb-4 max-w-sm">
          Connect your Supabase database to view and manage your data.
        </p>
        <a
          href="/ide/onboarding"
          className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Connect Supabase
        </a>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0d0d0f] overflow-hidden">
      {/* Tabs */}
      <div className="flex-shrink-0 flex items-center gap-1 px-2 py-2 bg-[#0a0a0c] border-b border-[#1a1a1f]">
        <button
          onClick={() => setActiveTab('tables')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-2',
            activeTab === 'tables'
              ? 'bg-[#2d2d44] border border-[#3d3d5c] text-neutral-200'
              : 'text-neutral-500 hover:text-neutral-300 border border-transparent'
          )}
        >
          <Table className="w-3.5 h-3.5" />
          Tables
        </button>
        <button
          onClick={() => setActiveTab('schema')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-2',
            activeTab === 'schema'
              ? 'bg-[#2d2d44] border border-[#3d3d5c] text-neutral-200'
              : 'text-neutral-500 hover:text-neutral-300 border border-transparent'
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          Schema
        </button>
        <button
          onClick={() => setActiveTab('query')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-2',
            activeTab === 'query'
              ? 'bg-[#2d2d44] border border-[#3d3d5c] text-neutral-200'
              : 'text-neutral-500 hover:text-neutral-300 border border-transparent'
          )}
        >
          <FileCode className="w-3.5 h-3.5" />
          Query
        </button>
        <button
          onClick={() => setActiveTab('migrations')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-2',
            activeTab === 'migrations'
              ? 'bg-[#2d2d44] border border-[#3d3d5c] text-neutral-200'
              : 'text-neutral-500 hover:text-neutral-300 border border-transparent'
          )}
        >
          <GitBranch className="w-3.5 h-3.5" />
          Migrations
          {migrationsSummary && migrationsSummary.pending > 0 && (
            <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-semibold rounded-full bg-amber-500 text-black">
              {migrationsSummary.pending}
            </span>
          )}
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* External link to Supabase */}
        {supabase.projectRef && (
          <a
            href={`https://supabase.com/dashboard/project/${supabase.projectRef}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-500 hover:text-emerald-500 transition-colors"
            title="Open in Supabase Dashboard"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="px-3 py-2 bg-red-900/20 border-b border-red-900/30">
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-xs underline">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* Tables Tab */}
        {activeTab === 'tables' && (
          isMobile ? (
            <MobileTablesBrowser
              tables={tables}
              isLoading={isLoading}
              mobileView={mobileView}
              selectedTable={selectedTable}
              tableData={tableData}
              tableDataLoading={tableDataLoading}
              selectedRowForDetail={selectedRowForDetail}
              onSelectTable={handleSelectTable}
              onBack={handleMobileBack}
              onRowSelect={handleMobileRowSelect}
              onRefresh={fetchTables}
              onEditRow={setEditingRow}
              onDeleteRow={handleDeleteRow}
              onAddRow={() => setIsAddingRow(true)}
              onPageChange={handlePageChange}
              page={page}
              pageSize={PAGE_SIZE}
            />
          ) : (
            <DesktopTablesBrowser
              tables={tables}
              isLoading={isLoading}
              selectedTable={selectedTable}
              tableData={tableData}
              tableDataLoading={tableDataLoading}
              onSelectTable={handleSelectTable}
              onRefresh={fetchTables}
              onEditRow={setEditingRow}
              onDeleteRow={handleDeleteRow}
              onAddRow={() => setIsAddingRow(true)}
              onAddColumn={() => setIsAddingColumn(true)}
              onPageChange={handlePageChange}
              page={page}
              pageSize={PAGE_SIZE}
            />
          )
        )}

        {/* Schema Tab */}
        {activeTab === 'schema' && (
          <SchemaViewer
            tables={tables}
            expandedTables={expandedTables}
            tableSchemas={tableSchemas}
            isLoading={isLoading}
            onToggleExpand={toggleTableExpand}
            onRefresh={fetchTables}
          />
        )}

        {/* Query Tab */}
        {activeTab === 'query' && (
          <QueryEditor
            query={query}
            results={queryResults}
            isLoading={queryLoading}
            error={queryError}
            onQueryChange={setQuery}
            onRun={runQuery}
          />
        )}

        {/* Migrations Tab */}
        {activeTab === 'migrations' && (
          <MigrationsViewer
            migrations={migrations}
            isLoading={migrationsLoading}
            summary={migrationsSummary}
            runResults={migrationRunResults}
            autoApply={autoApplyMigrations}
            onRefresh={fetchMigrations}
            onRunMigration={runMigration}
            onDismissResult={clearMigrationRunResult}
            onToggleAutoApply={setAutoApplyMigrations}
            supabaseConnected={supabase.connected}
          />
        )}
      </div>

      {/* Row Editor Modal */}
      {(editingRow !== null || isAddingRow) && tableData?.schema && (
        <RowEditorModal
          columns={tableData.schema.columns}
          row={editingRow}
          onSave={handleSaveRow}
          onClose={() => { setEditingRow(null); setIsAddingRow(false); }}
        />
      )}

      {/* Add Column Modal */}
      {isAddingColumn && selectedTable && (
        <AddColumnModal
          tableName={selectedTable}
          onAdd={async (column) => {
            // Execute ALTER TABLE
            const sql = `ALTER TABLE "${selectedTable}" ADD COLUMN "${column.name}" ${column.type}${!column.nullable ? ' NOT NULL' : ''}${column.defaultValue ? ` DEFAULT ${column.defaultValue}` : ''}`;
            try {
              await executeQuery(sql);
              setIsAddingColumn(false);
              fetchTableData(selectedTable, page * PAGE_SIZE);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to add column');
            }
          }}
          onClose={() => setIsAddingColumn(false)}
        />
      )}
    </div>
  );
}

// Desktop Tables Browser Component
function DesktopTablesBrowser({
  tables,
  isLoading,
  selectedTable,
  tableData,
  tableDataLoading,
  onSelectTable,
  onRefresh,
  onEditRow,
  onDeleteRow,
  onAddRow,
  onAddColumn,
  onPageChange,
  page,
  pageSize,
}: {
  tables: TableInfo[];
  isLoading: boolean;
  selectedTable: string | null;
  tableData: TableData | null;
  tableDataLoading: boolean;
  onSelectTable: (name: string) => void;
  onRefresh: () => void;
  onEditRow: (row: Record<string, unknown>) => void;
  onDeleteRow: (row: Record<string, unknown>) => void;
  onAddRow: () => void;
  onAddColumn: () => void;
  onPageChange: (page: number) => void;
  page: number;
  pageSize: number;
}) {
  // Resizable sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(176);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  // Resizable table height state
  const [tableHeight, setTableHeight] = useState<number | null>(null); // null = auto (flex-1)
  const [isResizingTable, setIsResizingTable] = useState(false);

  // Handle sidebar resize
  const handleSidebarResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSidebar(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      const newWidth = Math.max(120, Math.min(400, startWidth + delta));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle table height resize
  const handleTableResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingTable(true);
    const startY = e.clientY;
    const container = e.currentTarget.parentElement;
    const startHeight = tableHeight || (container?.querySelector('.data-table-container') as HTMLElement)?.offsetHeight || 300;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientY - startY;
      const newHeight = Math.max(100, Math.min(800, startHeight + delta));
      setTableHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizingTable(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="h-full flex">
      {/* Table list sidebar - resizable */}
      <div
        className="flex flex-col bg-[#0a0a0c] flex-shrink-0"
        style={{ width: sidebarWidth }}
      >
        <div className="flex items-center justify-between px-3 py-2 text-xs text-neutral-500 border-b border-[#1a1a1f]">
          <span>Tables ({tables.length})</span>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1 rounded hover:bg-neutral-800 disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {isLoading ? (
            <div className="px-3 py-4 text-center text-neutral-600 text-xs">Loading...</div>
          ) : tables.length === 0 ? (
            <div className="px-3 py-4 text-center text-neutral-600 text-xs">No tables</div>
          ) : (
            tables.map(table => (
              <button
                key={table.name}
                onClick={() => onSelectTable(table.name)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-1.5 text-left text-[13px] transition-colors',
                  selectedTable === table.name
                    ? 'bg-violet-600/20 text-violet-400 border-l-2 border-violet-600'
                    : 'text-neutral-400 hover:bg-[#1a1a2e] hover:text-neutral-200'
                )}
              >
                <Table className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{table.name}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Sidebar resize handle */}
      <div
        className={cn(
          'w-1 cursor-col-resize bg-[#1a1a1f] hover:bg-violet-600/50 transition-colors flex-shrink-0',
          isResizingSidebar && 'bg-violet-600'
        )}
        onMouseDown={handleSidebarResizeStart}
      />

      {/* Table data area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedTable ? (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-600">
            <Table className="w-8 h-8 mb-2" />
            <p className="text-sm">Select a table to view data</p>
          </div>
        ) : tableDataLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-neutral-600">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading data...</span>
          </div>
        ) : !tableData || tableData.rows.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-neutral-600">
            <p className="text-sm">No data in {selectedTable}</p>
            <button
              onClick={onAddRow}
              className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 text-white rounded-md text-sm hover:bg-violet-700"
            >
              <Plus className="w-4 h-4" /> Add Row
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a1f] bg-[#0a0a0c] flex-shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-medium text-neutral-200">{selectedTable}</h3>
                <span className="text-xs text-neutral-500">{tableData.rowCount} rows</span>
              </div>
              <button
                onClick={onAddRow}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-600 text-white rounded-md text-xs hover:bg-violet-700"
              >
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>

            {/* Data table - resizable */}
            <div
              className="data-table-container overflow-auto flex-shrink-0"
              style={{ height: tableHeight || undefined, flex: tableHeight ? 'none' : 1 }}
            >
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#1a1a2e]">
                    {tableData.schema?.columns.map(col => (
                      <th key={col.name} className="px-3 py-2 text-left border-b border-[#2d2d44]">
                        <span className="block text-neutral-200">{col.name}</span>
                        <span className="block text-[10px] text-neutral-600 font-normal">{col.type}</span>
                      </th>
                    ))}
                    <th className="w-8 px-1 py-2 border-b border-[#2d2d44]">
                      <button
                        onClick={onAddColumn}
                        className="p-1 border border-dashed border-[#3d3d5c] rounded text-neutral-600 hover:border-violet-500 hover:text-violet-500"
                        title="Add Column"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="w-16 px-2 py-2 text-center border-b border-[#2d2d44] text-neutral-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#1a1a2e]">
                      {tableData.schema?.columns.map(col => (
                        <td key={col.name} className="px-3 py-2 border-b border-[#2d2d44]">
                          <span
                            className={cn(
                              'block max-w-[200px] truncate',
                              row[col.name] === null && 'text-neutral-600 italic'
                            )}
                            title={formatValue(row[col.name])}
                          >
                            {truncateValue(formatValue(row[col.name]))}
                          </span>
                        </td>
                      ))}
                      <td className="w-8 border-b border-[#2d2d44]" />
                      <td className="w-16 px-2 py-1 border-b border-[#2d2d44]">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditRow(row)}
                            className="p-1.5 rounded hover:bg-[#2d2d44] text-neutral-500 hover:text-violet-400"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRow(row)}
                            className="p-1.5 rounded hover:bg-[#2d2d44] text-neutral-500 hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table resize handle */}
            <div
              className={cn(
                'h-2 cursor-row-resize bg-[#0a0a0c] hover:bg-violet-600/30 transition-colors flex items-center justify-center border-y border-[#2d2d44] flex-shrink-0',
                isResizingTable && 'bg-violet-600/50'
              )}
              onMouseDown={handleTableResizeStart}
            >
              <GripHorizontal className="w-4 h-4 text-neutral-600" />
            </div>

            {/* Bottom area - for additional info or future use */}
            <div className="flex-1 min-h-[40px] bg-[#0d0d0f] p-2 overflow-auto">
              <div className="text-[10px] text-neutral-600 text-center">
                Drag the handle above to resize the table view
              </div>
            </div>

            {/* Pagination */}
            {tableData.rowCount > pageSize && (
              <div className="flex items-center justify-center gap-4 px-4 py-2 border-t border-[#2d2d44] bg-[#1a1a2e] flex-shrink-0">
                <button
                  onClick={() => onPageChange(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 text-xs bg-[#0d0d1a] border border-[#2d2d44] rounded text-neutral-300 hover:border-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                <span className="text-xs text-neutral-500">
                  {page + 1} / {Math.ceil(tableData.rowCount / pageSize)}
                </span>
                <button
                  onClick={() => onPageChange(page + 1)}
                  disabled={(page + 1) * pageSize >= tableData.rowCount}
                  className="px-3 py-1 text-xs bg-[#0d0d1a] border border-[#2d2d44] rounded text-neutral-300 hover:border-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Mobile Tables Browser Component
function MobileTablesBrowser({
  tables,
  isLoading,
  mobileView,
  selectedTable,
  tableData,
  tableDataLoading,
  selectedRowForDetail,
  onSelectTable,
  onBack,
  onRowSelect,
  onRefresh,
  onEditRow,
  onDeleteRow,
  onAddRow,
  onPageChange,
  page,
  pageSize,
}: {
  tables: TableInfo[];
  isLoading: boolean;
  mobileView: MobileView;
  selectedTable: string | null;
  tableData: TableData | null;
  tableDataLoading: boolean;
  selectedRowForDetail: Record<string, unknown> | null;
  onSelectTable: (name: string) => void;
  onBack: () => void;
  onRowSelect: (row: Record<string, unknown>) => void;
  onRefresh: () => void;
  onEditRow: (row: Record<string, unknown>) => void;
  onDeleteRow: (row: Record<string, unknown>) => void;
  onAddRow: () => void;
  onPageChange: (page: number) => void;
  page: number;
  pageSize: number;
}) {
  // Tables list view
  if (mobileView === 'tables') {
    return (
      <div className="h-full overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-neutral-200">Tables</h3>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-500 disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
        </div>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-neutral-600">
            <RefreshCw className="w-5 h-5 animate-spin mb-2" />
            <span className="text-sm">Loading tables...</span>
          </div>
        ) : tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-neutral-600">
            <Database className="w-8 h-8 mb-2" />
            <p className="text-sm">No tables found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tables.map(table => (
              <button
                key={table.name}
                onClick={() => onSelectTable(table.name)}
                className="w-full flex items-center gap-3 p-3 bg-[#1a1a2e] rounded-lg hover:bg-[#2d2d44] transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#2d2d44] flex items-center justify-center">
                  <Table className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex-1 text-left">
                  <span className="block text-sm font-medium text-neutral-200">{table.name}</span>
                  <span className="block text-xs text-neutral-500">{table.schema}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-600" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Rows view
  if (mobileView === 'rows' && selectedTable) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1a1a1f] bg-[#0a0a0c]">
          <button onClick={onBack} className="flex items-center gap-1 text-neutral-400 hover:text-neutral-200">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Tables</span>
          </button>
          <div className="flex-1" />
          <button
            onClick={onAddRow}
            className="p-1.5 rounded-md bg-violet-600 text-white hover:bg-violet-700"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="px-3 py-2 border-b border-[#1a1a1f]">
          <h3 className="text-sm font-medium text-neutral-200">{selectedTable}</h3>
          {tableData && <span className="text-xs text-neutral-500">{tableData.rowCount} rows</span>}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {tableDataLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-neutral-600">
              <RefreshCw className="w-5 h-5 animate-spin mb-2" />
              <span className="text-sm">Loading data...</span>
            </div>
          ) : !tableData || tableData.rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-neutral-600">
              <p className="text-sm mb-3">No data in this table</p>
              <button
                onClick={onAddRow}
                className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 text-white rounded-md text-sm"
              >
                <Plus className="w-4 h-4" /> Add Row
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {tableData.rows.map((row, idx) => {
                const previewCols = tableData.schema?.columns.slice(0, 3) || [];
                return (
                  <button
                    key={idx}
                    onClick={() => onRowSelect(row)}
                    className="w-full p-3 bg-[#1a1a2e] rounded-lg hover:bg-[#2d2d44] text-left transition-colors"
                  >
                    <div className="space-y-1">
                      {previewCols.map(col => (
                        <div key={col.name} className="flex items-center gap-2">
                          <span className="text-[10px] uppercase text-neutral-600 w-20 truncate">{col.name}</span>
                          <span className={cn(
                            'text-sm truncate',
                            row[col.name] === null ? 'text-neutral-600 italic' : 'text-neutral-300'
                          )}>
                            {truncateValue(formatValue(row[col.name]), 30)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-600 absolute right-3 top-1/2 -translate-y-1/2" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {tableData && tableData.rowCount > pageSize && (
          <div className="flex items-center justify-center gap-4 px-4 py-3 border-t border-[#2d2d44]">
            <button
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-sm bg-[#0d0d1a] border border-[#2d2d44] rounded text-neutral-300 disabled:opacity-50"
            >
              ← Prev
            </button>
            <span className="text-sm text-neutral-500">
              {page + 1} / {Math.ceil(tableData.rowCount / pageSize)}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={(page + 1) * pageSize >= tableData.rowCount}
              className="px-3 py-1.5 text-sm bg-[#0d0d1a] border border-[#2d2d44] rounded text-neutral-300 disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    );
  }

  // Detail view
  if (mobileView === 'detail' && selectedRowForDetail && tableData?.schema) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1a1a1f] bg-[#0a0a0c]">
          <button onClick={onBack} className="flex items-center gap-1 text-neutral-400 hover:text-neutral-200">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">{selectedTable}</span>
          </button>
          <div className="flex-1" />
          <button
            onClick={() => onEditRow(selectedRowForDetail)}
            className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => { onDeleteRow(selectedRowForDetail); onBack(); }}
            className="p-1.5 rounded-md hover:bg-neutral-800 text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-3">
            {tableData.schema.columns.map(col => (
              <div key={col.name} className="p-3 bg-[#1a1a2e] rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-neutral-400">{col.name}</span>
                  <span className="text-[10px] text-neutral-600">{col.type}</span>
                </div>
                <div className={cn(
                  'text-sm break-words',
                  selectedRowForDetail[col.name] === null ? 'text-neutral-600 italic' : 'text-neutral-200'
                )}>
                  {formatValue(selectedRowForDetail[col.name])}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Schema Viewer Component
function SchemaViewer({
  tables,
  expandedTables,
  tableSchemas,
  isLoading,
  onToggleExpand,
  onRefresh,
}: {
  tables: TableInfo[];
  expandedTables: Set<string>;
  tableSchemas: Record<string, TableSchema>;
  isLoading: boolean;
  onToggleExpand: (name: string) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-neutral-500">Tables ({tables.length})</span>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-2 py-1 text-xs bg-transparent border border-[#3d3d5c] rounded text-neutral-500 hover:text-neutral-300 disabled:opacity-50"
        >
          {isLoading ? '...' : 'Refresh'}
        </button>
      </div>
      {isLoading ? (
        <div className="py-4 text-center text-neutral-600 text-sm">Loading schema...</div>
      ) : tables.length === 0 ? (
        <div className="py-4 text-center text-neutral-600 text-sm">No tables found</div>
      ) : (
        <div className="font-mono text-xs">
          {tables.map(table => {
            const isExpanded = expandedTables.has(table.name);
            const schema = tableSchemas[table.name];
            return (
              <div key={table.name}>
                <button
                  onClick={() => onToggleExpand(table.name)}
                  className="flex items-center gap-2 py-1.5 px-1 w-full text-left text-violet-400 hover:bg-violet-400/10 rounded"
                >
                  <span className="text-[10px] text-neutral-600 w-3">{isExpanded ? '▼' : '▶'}</span>
                  <Table className="w-4 h-4" />
                  <span>{table.name}</span>
                </button>
                {isExpanded && (
                  <div className="ml-6 border-l border-[#2d2d44] pl-3 py-1">
                    {!schema ? (
                      <div className="text-neutral-600 py-1">Loading columns...</div>
                    ) : (
                      schema.columns.map((col, idx) => (
                        <div key={col.name} className="text-neutral-500 py-0.5">
                          <span className="text-neutral-600">{idx === schema.columns.length - 1 ? '└─' : '├─'}</span>
                          {' '}{col.name}
                          <span className="text-neutral-700">
                            {' '}({col.type}
                            {col.isPrimaryKey && ', PK'}
                            {!col.isNullable && ', NOT NULL'})
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Query Editor Component
function QueryEditor({
  query,
  results,
  isLoading,
  error,
  onQueryChange,
  onRun,
}: {
  query: string;
  results: QueryResult | null;
  isLoading: boolean;
  error: string | null;
  onQueryChange: (query: string) => void;
  onRun: () => void;
}) {
  return (
    <div className="h-full flex flex-col p-3 gap-3">
      {/* Query input */}
      <div className="flex gap-2">
        <textarea
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Enter SQL query..."
          className="flex-1 min-h-[80px] px-3 py-2 bg-[#0d0d1a] border border-[#2d2d44] rounded-lg text-neutral-200 font-mono text-xs resize-y focus:outline-none focus:border-violet-500"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              onRun();
            }
          }}
        />
        <button
          onClick={onRun}
          disabled={isLoading || !query.trim()}
          className="self-start px-4 py-2 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {isLoading ? '...' : <><Play className="w-3 h-3" /> Run</>}
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {error ? (
          <div className="text-red-400 text-sm py-2">Error: {error}</div>
        ) : results ? (
          <>
            <div className="text-xs text-neutral-500 mb-2">
              Results ({results.rowCount} rows, {results.executionTime}ms)
            </div>
            {results.rows.length > 0 ? (
              <div className="flex-1 overflow-auto">
                <table className="w-full text-xs border-collapse">
                  <thead className="sticky top-0 bg-[#16162a]">
                    <tr>
                      {results.columns.map(col => (
                        <th key={col} className="px-3 py-2 text-left text-neutral-500 border-b border-[#2d2d44]">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.rows.map((row, idx) => (
                      <tr key={idx}>
                        {results.columns.map(col => (
                          <td key={col} className="px-3 py-2 border-b border-[#2d2d44] text-neutral-300">
                            {row[col] === null ? <em className="text-neutral-600">null</em> : String(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-6 text-center text-neutral-600 text-sm">
                Query executed successfully. No rows returned.
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-600">
            <p className="text-sm">Run a query to see results</p>
            <p className="text-xs text-neutral-700 mt-1">Press ⌘+Enter to execute</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Row Editor Modal
function RowEditorModal({
  columns,
  row,
  onSave,
  onClose,
}: {
  columns: ColumnInfo[];
  row: Record<string, unknown> | null;
  onSave: (row: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}) {
  const isEditing = row !== null;
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    columns.forEach(col => {
      initial[col.name] = row ? formatValue(row[col.name]) : '';
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const parsed: Record<string, unknown> = {};
      columns.forEach(col => {
        if (!isEditing && values[col.name] === '') return;
        const val = values[col.name];
        if (val === '' || val === 'null') {
          parsed[col.name] = null;
        } else if (col.type.includes('int') || col.type === 'numeric') {
          parsed[col.name] = Number(val);
        } else if (col.type === 'boolean') {
          parsed[col.name] = val.toLowerCase() === 'true';
        } else if (col.type.includes('json')) {
          try { parsed[col.name] = JSON.parse(val); } catch { parsed[col.name] = val; }
        } else {
          parsed[col.name] = val;
        }
      });
      await onSave(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d2d44]">
          <h2 className="text-sm font-medium text-neutral-200">{isEditing ? 'Edit Row' : 'Add Row'}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-neutral-700 text-neutral-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3">
          {columns.map(col => (
            <div key={col.name}>
              <label className="block text-xs text-neutral-400 mb-1">
                {col.name} <span className="text-neutral-600">({col.type})</span>
              </label>
              <input
                type="text"
                value={values[col.name]}
                onChange={(e) => setValues(prev => ({ ...prev, [col.name]: e.target.value }))}
                placeholder={`Enter ${col.name}...`}
                className="w-full px-3 py-2 bg-[#0d0d1a] border border-[#2d2d44] rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-violet-500"
              />
            </div>
          ))}
          {error && <div className="text-sm text-red-400">{error}</div>}
        </form>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#2d2d44]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-1.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEditing ? 'Update' : 'Insert'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Migrations Viewer Component
function MigrationsViewer({
  migrations,
  isLoading,
  summary,
  runResults,
  autoApply,
  onRefresh,
  onRunMigration,
  onDismissResult,
  onToggleAutoApply,
  supabaseConnected,
}: {
  migrations: MigrationFile[];
  isLoading: boolean;
  summary: { total: number; applied: number; pending: number } | null;
  runResults: Record<string, MigrationRunResult>;
  autoApply: boolean;
  onRefresh: () => void;
  onRunMigration: (version: string) => void;
  onDismissResult: (version: string) => void;
  onToggleAutoApply: (auto: boolean) => void;
  supabaseConnected: boolean;
}) {
  const [runningVersion, setRunningVersion] = useState<string | null>(null);
  const [listHeight, setListHeight] = useState<number>(300); // Default height in pixels
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleRun = async (version: string) => {
    setRunningVersion(version);
    await onRunMigration(version);
    setRunningVersion(null);
  };

  const pendingMigrations = migrations.filter(m => m.status === 'pending');

  // Handle resize drag
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startY = e.clientY;
    const startHeight = listHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientY - startY;
      const newHeight = Math.max(100, Math.min(600, startHeight + delta));
      setListHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="migrations-container h-full flex flex-col overflow-hidden">
      {/* Header with collapse toggle */}
      <div className="migrations-header flex items-center justify-between px-4 py-3 border-b border-[#1a1a1f] bg-[#0a0a0c]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-500"
            title={isCollapsed ? 'Expand list' : 'Collapse list'}
          >
            <ChevronRight className={cn('w-4 h-4 transition-transform', !isCollapsed && 'rotate-90')} />
          </button>
          <div>
            <h3 className="text-sm font-medium text-neutral-200">Migrations</h3>
            {summary && (
              <span className="text-xs text-neutral-500">
                {summary.applied} applied, {summary.pending} pending
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-neutral-500 cursor-pointer">
            <input
              type="checkbox"
              checked={autoApply}
              onChange={(e) => onToggleAutoApply(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-neutral-600 accent-violet-600"
            />
            Auto-apply
          </label>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-500 disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Pending alert - only show if not collapsed */}
      {!isCollapsed && pendingMigrations.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-xs text-amber-300">
            {pendingMigrations.length} pending migration{pendingMigrations.length > 1 ? 's' : ''} to apply
          </span>
        </div>
      )}

      {/* Not connected warning - only show if not collapsed */}
      {!isCollapsed && !supabaseConnected && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800/50 border-b border-[#1a1a1f]">
          <AlertCircle className="w-4 h-4 text-neutral-500 flex-shrink-0" />
          <span className="text-xs text-neutral-400">
            Connect Supabase to run migrations remotely
          </span>
        </div>
      )}

      {/* Migrations list - resizable */}
      {!isCollapsed && (
        <>
          <div
            className="overflow-y-auto p-3 flex-shrink-0"
            style={{ height: listHeight }}
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-neutral-600">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading migrations...</span>
              </div>
            ) : migrations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-neutral-600">
                <GitBranch className="w-10 h-10 mb-3 opacity-50" />
                <p className="text-sm">No migrations found</p>
                <p className="text-xs text-neutral-700 mt-1">
                  Create migrations in supabase/migrations/
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {migrations.map((migration) => {
                  const result = runResults[migration.version];
                  const isRunning = runningVersion === migration.version;

                  return (
                    <div
                      key={migration.version}
                      className={cn(
                        'p-3 rounded-lg bg-[#1a1a2e] border border-[#2d2d44]',
                        migration.status === 'pending' && 'border-l-2 border-l-amber-500',
                        migration.status === 'applied' && 'opacity-70'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Status icon */}
                        {migration.status === 'applied' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        )}

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-neutral-200">
                            {migration.displayName}
                          </div>
                          <div className="text-[11px] font-mono text-neutral-600 mt-0.5">
                            {migration.version}
                          </div>
                          {migration.status === 'applied' && migration.appliedAt && (
                            <div className="text-[11px] text-neutral-500 mt-1">
                              Applied {formatTimestamp(migration.appliedAt)}
                            </div>
                          )}
                          {migration.status === 'pending' && migration.createdAt && (
                            <div className="text-[11px] text-neutral-500 mt-1">
                              Created {migration.createdAt}
                            </div>
                          )}
                        </div>

                        {/* Run button */}
                        {migration.status === 'pending' && (
                          <button
                            onClick={() => handleRun(migration.version)}
                            disabled={isRunning || !supabaseConnected}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-600 text-white rounded-md text-xs font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                        {isRunning ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Running...
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            Run
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Result feedback */}
                  {result && (
                    <div
                      className={cn(
                        'flex items-center gap-2 mt-3 px-3 py-2 rounded-md text-xs',
                        result.success
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-red-500/10 text-red-400'
                      )}
                    >
                      {result.success ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                      <span className="flex-1">{result.message}</span>
                      <button
                        onClick={() => onDismissResult(migration.version)}
                        className="px-2 py-0.5 border border-current rounded text-[10px] opacity-70 hover:opacity-100"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
          </div>

          {/* Resize handle */}
          <div
            className={cn(
              'h-5 flex items-center justify-center cursor-row-resize border-y border-[#2d2d44] bg-[#0a0a0c] hover:bg-[#1a1a2e] transition-colors group',
              isResizing && 'bg-violet-600/20'
            )}
            onMouseDown={handleResizeStart}
          >
            <GripHorizontal className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400" />
          </div>

          {/* Bottom content area - shows when list is collapsed or as extra space */}
          <div className="flex-1 overflow-y-auto p-3 bg-[#0d0d0f]">
            <div className="text-center text-neutral-600 text-xs">
              {migrations.length > 0 && (
                <p className="mb-2">
                  Drag the handle above to resize the migrations list
                </p>
              )}
              {supabaseConnected && summary && summary.pending === 0 && (
                <p className="text-emerald-500/70">All migrations applied</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Collapsed state summary */}
      {isCollapsed && (
        <div className="flex-1 flex items-center justify-center p-4 text-neutral-500">
          <div className="text-center">
            <p className="text-sm">
              {migrations.length} migration{migrations.length !== 1 ? 's' : ''}
              {summary && summary.pending > 0 && (
                <span className="text-amber-400 ml-1">
                  ({summary.pending} pending)
                </span>
              )}
            </p>
            <button
              onClick={() => setIsCollapsed(false)}
              className="text-xs text-violet-400 hover:underline mt-1"
            >
              Click to expand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to format timestamps
function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return timestamp;
  }
}

// Add Column Modal
function AddColumnModal({
  tableName,
  onAdd,
  onClose,
}: {
  tableName: string;
  onAdd: (column: { name: string; type: string; nullable: boolean; defaultValue: string }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState('text');
  const [nullable, setNullable] = useState(true);
  const [defaultValue, setDefaultValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Column name is required');
      return;
    }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name.trim())) {
      setError('Invalid column name');
      return;
    }
    onAdd({ name: name.trim(), type, nullable, defaultValue: defaultValue.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d2d44]">
          <h3 className="text-sm font-medium text-neutral-200">
            Add Column to <span className="text-violet-400">{tableName}</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-neutral-700 text-neutral-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && <div className="text-sm text-red-400">{error}</div>}
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Column Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. created_at"
              autoFocus
              className="w-full px-3 py-2 bg-[#0d0d1a] border border-[#2d2d44] rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Data Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 bg-[#0d0d1a] border border-[#2d2d44] rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-violet-500"
            >
              {POSTGRES_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <span className="text-[10px] text-neutral-600 mt-1 block">
              {POSTGRES_TYPES.find(t => t.value === type)?.description}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="nullable"
              checked={nullable}
              onChange={(e) => setNullable(e.target.checked)}
              className="rounded border-neutral-600"
            />
            <label htmlFor="nullable" className="text-xs text-neutral-400">Allow NULL values</label>
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Default Value (optional)</label>
            <input
              type="text"
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
              placeholder="e.g. NOW()"
              className="w-full px-3 py-2 bg-[#0d0d1a] border border-[#2d2d44] rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-violet-500"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
            >
              Add Column
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
