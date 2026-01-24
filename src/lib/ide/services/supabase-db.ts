/**
 * Supabase Database Service
 * Handles database operations for the IDE's database browser
 */

// =============================================================================
// TYPES
// =============================================================================

export interface TableInfo {
  name: string;
  schema: string;
  rowCount: number;
  sizeBytes: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  defaultValue: string | null;
  foreignKey?: {
    table: string;
    column: string;
  };
}

export interface TableSchema {
  name: string;
  columns: ColumnInfo[];
  primaryKey: string[];
  foreignKeys: {
    column: string;
    referencedTable: string;
    referencedColumn: string;
  }[];
}

export interface QueryResult {
  rows: Record<string, unknown>[];
  columns: string[];
  rowCount: number;
  executionTime: number;
}

export interface DatabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

// =============================================================================
// STORAGE
// =============================================================================

const SUPABASE_CONFIG_KEY = 'local-ide-supabase-config';
// Legacy keys from old onboarding implementation
const LEGACY_URL_KEY = 'supabase_ide_url';
const LEGACY_KEY_KEY = 'supabase_ide_key';

export function getStoredSupabaseConfig(): DatabaseConfig | null {
  if (typeof window === 'undefined') return null;

  // Try the new format first
  const stored = localStorage.getItem(SUPABASE_CONFIG_KEY);
  if (stored) {
    return JSON.parse(stored);
  }

  // Fallback: check for legacy keys and migrate them
  const legacyUrl = localStorage.getItem(LEGACY_URL_KEY);
  const legacyKey = localStorage.getItem(LEGACY_KEY_KEY);

  if (legacyUrl && legacyKey) {
    // Migrate to new format
    const config: DatabaseConfig = {
      url: legacyUrl,
      anonKey: legacyKey,
      serviceRoleKey: legacyKey,
    };
    // Save in new format and clean up legacy keys
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
    localStorage.removeItem(LEGACY_URL_KEY);
    localStorage.removeItem(LEGACY_KEY_KEY);
    return config;
  }

  return null;
}

export function setStoredSupabaseConfig(config: DatabaseConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
}

export function clearStoredSupabaseConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SUPABASE_CONFIG_KEY);
}

// =============================================================================
// API HELPERS
// =============================================================================

async function supabaseFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config = getStoredSupabaseConfig();

  if (!config) {
    throw new Error('No Supabase configuration available');
  }

  // Use service role key if available for admin operations
  const apiKey = config.serviceRoleKey || config.anonKey;

  const response = await fetch(`${config.url}${endpoint}`, {
    ...options,
    headers: {
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || error.error || `Supabase API error: ${response.status}`
    );
  }

  // Handle empty responses
  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}

// =============================================================================
// METADATA OPERATIONS
// =============================================================================

/**
 * List all tables in the database
 */
export async function listTables(): Promise<TableInfo[]> {
  const config = getStoredSupabaseConfig();
  if (!config) throw new Error('No Supabase configuration');

  // Use PostgREST's built-in schema endpoint if available
  // or query pg_catalog directly
  const query = `
    SELECT
      tablename as name,
      schemaname as schema,
      n_live_tup as row_count
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;

  try {
    // Try using the REST API to query system tables
    const result = await executeQuery(query);
    return result.rows.map((row) => ({
      name: row.name as string,
      schema: row.schema as string,
      rowCount: Number(row.row_count) || 0,
      sizeBytes: 0,
    }));
  } catch {
    // Fallback: Try to get tables from OpenAPI spec
    const response = await fetch(`${config.url}/rest/v1/`, {
      headers: {
        'apikey': config.anonKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to list tables');
    }

    const spec = await response.json();
    const paths = spec.paths || {};

    return Object.keys(paths)
      .filter((path) => path.startsWith('/') && !path.includes('{'))
      .map((path) => ({
        name: path.slice(1),
        schema: 'public',
        rowCount: 0,
        sizeBytes: 0,
      }));
  }
}

/**
 * Get schema information for a table
 */
export async function getTableSchema(tableName: string): Promise<TableSchema> {
  const query = `
    SELECT
      c.column_name,
      c.data_type,
      c.is_nullable,
      c.column_default,
      CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary,
      fk.foreign_table_name,
      fk.foreign_column_name
    FROM information_schema.columns c
    LEFT JOIN (
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = '${tableName}'
        AND tc.constraint_type = 'PRIMARY KEY'
    ) pk ON c.column_name = pk.column_name
    LEFT JOIN (
      SELECT
        kcu.column_name,
        ccu.table_name as foreign_table_name,
        ccu.column_name as foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = '${tableName}'
        AND tc.constraint_type = 'FOREIGN KEY'
    ) fk ON c.column_name = fk.column_name
    WHERE c.table_name = '${tableName}'
    ORDER BY c.ordinal_position
  `;

  try {
    const result = await executeQuery(query);

    const columns: ColumnInfo[] = result.rows.map((row) => ({
      name: row.column_name as string,
      type: row.data_type as string,
      isNullable: row.is_nullable === 'YES',
      isPrimaryKey: row.is_primary as boolean,
      defaultValue: row.column_default as string | null,
      foreignKey: row.foreign_table_name
        ? {
            table: row.foreign_table_name as string,
            column: row.foreign_column_name as string,
          }
        : undefined,
    }));

    return {
      name: tableName,
      columns,
      primaryKey: columns.filter((c) => c.isPrimaryKey).map((c) => c.name),
      foreignKeys: columns
        .filter((c) => c.foreignKey)
        .map((c) => ({
          column: c.name,
          referencedTable: c.foreignKey!.table,
          referencedColumn: c.foreignKey!.column,
        })),
    };
  } catch {
    // Fallback: Get columns from sample data
    const sample = await getTableData(tableName, 1);
    if (sample.rows.length === 0) {
      return { name: tableName, columns: [], primaryKey: [], foreignKeys: [] };
    }

    const columns: ColumnInfo[] = sample.columns.map((name) => ({
      name,
      type: typeof sample.rows[0][name],
      isNullable: true,
      isPrimaryKey: name === 'id',
      defaultValue: null,
    }));

    return {
      name: tableName,
      columns,
      primaryKey: columns.filter((c) => c.isPrimaryKey).map((c) => c.name),
      foreignKeys: [],
    };
  }
}

// =============================================================================
// DATA OPERATIONS
// =============================================================================

/**
 * Get data from a table with pagination
 */
export async function getTableData(
  tableName: string,
  limit: number = 50,
  offset: number = 0,
  orderBy?: string,
  orderDirection: 'asc' | 'desc' = 'asc'
): Promise<QueryResult> {
  const start = Date.now();

  let endpoint = `/rest/v1/${tableName}?limit=${limit}&offset=${offset}`;

  if (orderBy) {
    endpoint += `&order=${orderBy}.${orderDirection}`;
  }

  const rows = await supabaseFetch<Record<string, unknown>[]>(endpoint, {
    headers: {
      'Prefer': 'count=exact',
    },
  });

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return {
    rows,
    columns,
    rowCount: rows.length,
    executionTime: Date.now() - start,
  };
}

/**
 * Insert a new row into a table
 */
export async function insertRow(
  tableName: string,
  data: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const result = await supabaseFetch<Record<string, unknown>[]>(
    `/rest/v1/${tableName}`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );

  return result[0];
}

/**
 * Update a row in a table
 */
export async function updateRow(
  tableName: string,
  primaryKey: string,
  primaryValue: unknown,
  data: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const result = await supabaseFetch<Record<string, unknown>[]>(
    `/rest/v1/${tableName}?${primaryKey}=eq.${primaryValue}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );

  return result[0];
}

/**
 * Delete a row from a table
 */
export async function deleteRow(
  tableName: string,
  primaryKey: string,
  primaryValue: unknown
): Promise<void> {
  await supabaseFetch(
    `/rest/v1/${tableName}?${primaryKey}=eq.${primaryValue}`,
    {
      method: 'DELETE',
    }
  );
}

// =============================================================================
// QUERY OPERATIONS
// =============================================================================

/**
 * Execute a raw SQL query (requires service role key)
 */
export async function executeQuery(sql: string): Promise<QueryResult> {
  const config = getStoredSupabaseConfig();
  if (!config) throw new Error('No Supabase configuration');

  const start = Date.now();

  // Use the REST RPC endpoint if available
  const response = await fetch(`${config.url}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': config.serviceRoleKey || config.anonKey,
      'Authorization': `Bearer ${config.serviceRoleKey || config.anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    // Fallback to using pg_query if exec_sql doesn't exist
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Query execution failed');
  }

  const data = await response.json();
  const rows = Array.isArray(data) ? data : [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return {
    rows,
    columns,
    rowCount: rows.length,
    executionTime: Date.now() - start,
  };
}

/**
 * Execute a query with filters (using PostgREST syntax)
 */
export async function queryTable(
  tableName: string,
  filters: { column: string; operator: string; value: unknown }[],
  select: string = '*',
  limit: number = 100
): Promise<QueryResult> {
  const start = Date.now();

  let endpoint = `/rest/v1/${tableName}?select=${select}&limit=${limit}`;

  for (const filter of filters) {
    const op = mapOperator(filter.operator);
    endpoint += `&${filter.column}=${op}.${filter.value}`;
  }

  const rows = await supabaseFetch<Record<string, unknown>[]>(endpoint);
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return {
    rows,
    columns,
    rowCount: rows.length,
    executionTime: Date.now() - start,
  };
}

// Map SQL operators to PostgREST operators
function mapOperator(op: string): string {
  const operatorMap: Record<string, string> = {
    '=': 'eq',
    '!=': 'neq',
    '<': 'lt',
    '<=': 'lte',
    '>': 'gt',
    '>=': 'gte',
    'LIKE': 'like',
    'ILIKE': 'ilike',
    'IN': 'in',
    'IS': 'is',
  };

  return operatorMap[op.toUpperCase()] || 'eq';
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format a value for display
 */
export function formatValue(value: unknown): string {
  if (value === null) return 'NULL';
  if (value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Get type color for display
 */
export function getTypeColor(type: string): string {
  const typeColors: Record<string, string> = {
    integer: 'text-blue-500',
    bigint: 'text-blue-500',
    smallint: 'text-blue-500',
    decimal: 'text-blue-500',
    numeric: 'text-blue-500',
    real: 'text-blue-500',
    'double precision': 'text-blue-500',
    text: 'text-green-500',
    'character varying': 'text-green-500',
    varchar: 'text-green-500',
    char: 'text-green-500',
    boolean: 'text-purple-500',
    bool: 'text-purple-500',
    timestamp: 'text-amber-500',
    'timestamp with time zone': 'text-amber-500',
    'timestamp without time zone': 'text-amber-500',
    date: 'text-amber-500',
    time: 'text-amber-500',
    uuid: 'text-pink-500',
    json: 'text-cyan-500',
    jsonb: 'text-cyan-500',
    array: 'text-red-500',
  };

  const lowerType = type.toLowerCase();
  return typeColors[lowerType] || 'text-neutral-500';
}

/**
 * Truncate long strings for display
 */
export function truncateValue(value: string, maxLength: number = 50): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength) + '...';
}
