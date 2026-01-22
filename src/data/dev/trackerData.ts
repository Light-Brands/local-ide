// =============================================================================
// Dev Tracker Data - Development tracking for local-ide
// =============================================================================

export type EpicStatus = 'not-started' | 'in-progress' | 'blocked' | 'complete';
export type TaskStatus = 'pending' | 'in-progress' | 'complete' | 'blocked';
export type TaskType = 'table' | 'endpoint' | 'service' | 'component' | 'test' | 'config';

export interface TrackerTask {
  id: string;
  type: TaskType;
  name: string;
  description?: string;
  status: TaskStatus;
  epic: string;
  category: string;
  filePath?: string;
  acceptanceCriteria?: string[];
  relatedTests?: string[];
  implementation?: string;
}

export interface EpicData {
  epicId: string;
  epicName: string;
  phase: 'Foundation' | 'MVP' | 'Growth';
  dependencies: string[];
  tasks: {
    tables: TrackerTask[];
    endpoints: TrackerTask[];
    services: TrackerTask[];
    components: TrackerTask[];
    tests: TrackerTask[];
    config: TrackerTask[];
  };
}

export interface RouteParam {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface RouteData {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  epic: string;
  auth: boolean;
  status: TaskStatus;
  params?: RouteParam[];
  requestBody?: string;
  responseBody?: string;
  example?: string;
  relatedService?: string;
  relatedTest?: string;
}

// =============================================================================
// Demo Epic Data for Local-IDE
// =============================================================================

export const epicData: EpicData[] = [
  {
    epicId: 'epic-00',
    epicName: 'Foundation',
    phase: 'Foundation',
    dependencies: [],
    tasks: {
      tables: [
        { id: 'e00-t1', type: 'table', name: 'users', description: 'User accounts with Supabase auth', status: 'complete', epic: 'epic-00', category: 'Database' },
        { id: 'e00-t2', type: 'table', name: 'sessions', description: 'User session management', status: 'complete', epic: 'epic-00', category: 'Database' },
        { id: 'e00-t3', type: 'table', name: 'settings', description: 'User and app settings', status: 'in-progress', epic: 'epic-00', category: 'Database' },
      ],
      endpoints: [
        { id: 'e00-e1', type: 'endpoint', name: 'GET /api/health', description: 'System health check', status: 'complete', epic: 'epic-00', category: 'API' },
        { id: 'e00-e2', type: 'endpoint', name: 'GET /api/auth/session', description: 'Get current session', status: 'complete', epic: 'epic-00', category: 'API' },
        { id: 'e00-e3', type: 'endpoint', name: 'POST /api/auth/login', description: 'User login', status: 'complete', epic: 'epic-00', category: 'API' },
      ],
      services: [
        { id: 'e00-s1', type: 'service', name: 'AuthService', description: 'Authentication flows', status: 'complete', epic: 'epic-00', category: 'Services' },
        { id: 'e00-s2', type: 'service', name: 'SessionService', description: 'Session management', status: 'complete', epic: 'epic-00', category: 'Services' },
      ],
      components: [
        { id: 'e00-c1', type: 'component', name: 'AdminLayout', description: 'Admin dashboard layout', status: 'complete', epic: 'epic-00', category: 'Components' },
        { id: 'e00-c2', type: 'component', name: 'AdminSidebar', description: 'Navigation sidebar', status: 'complete', epic: 'epic-00', category: 'Components' },
        { id: 'e00-c3', type: 'component', name: 'AdminHeader', description: 'Dashboard header', status: 'complete', epic: 'epic-00', category: 'Components' },
      ],
      tests: [
        { id: 'e00-ts1', type: 'test', name: 'auth.test.ts', description: 'Auth flow tests', status: 'pending', epic: 'epic-00', category: 'Tests' },
      ],
      config: [
        { id: 'e00-cfg1', type: 'config', name: 'Supabase setup', description: 'Database configuration', status: 'complete', epic: 'epic-00', category: 'Config' },
        { id: 'e00-cfg2', type: 'config', name: 'Next.js config', description: 'App configuration', status: 'complete', epic: 'epic-00', category: 'Config' },
      ],
    },
  },
  {
    epicId: 'epic-01',
    epicName: 'Content Management',
    phase: 'MVP',
    dependencies: ['epic-00'],
    tasks: {
      tables: [
        { id: 'e01-t1', type: 'table', name: 'content', description: 'CMS content storage', status: 'complete', epic: 'epic-01', category: 'Database' },
        { id: 'e01-t2', type: 'table', name: 'media', description: 'Media file metadata', status: 'complete', epic: 'epic-01', category: 'Database' },
      ],
      endpoints: [
        { id: 'e01-e1', type: 'endpoint', name: 'GET /api/content', description: 'List content items', status: 'complete', epic: 'epic-01', category: 'API' },
        { id: 'e01-e2', type: 'endpoint', name: 'POST /api/content', description: 'Create content', status: 'complete', epic: 'epic-01', category: 'API' },
        { id: 'e01-e3', type: 'endpoint', name: 'GET /api/media', description: 'List media files', status: 'complete', epic: 'epic-01', category: 'API' },
      ],
      services: [
        { id: 'e01-s1', type: 'service', name: 'ContentService', description: 'Content CRUD operations', status: 'complete', epic: 'epic-01', category: 'Services' },
        { id: 'e01-s2', type: 'service', name: 'MediaService', description: 'File upload/management', status: 'in-progress', epic: 'epic-01', category: 'Services' },
      ],
      components: [
        { id: 'e01-c1', type: 'component', name: 'ContentEditor', description: 'Rich text editor', status: 'in-progress', epic: 'epic-01', category: 'Components' },
        { id: 'e01-c2', type: 'component', name: 'MediaLibrary', description: 'Media browser', status: 'complete', epic: 'epic-01', category: 'Components' },
      ],
      tests: [
        { id: 'e01-ts1', type: 'test', name: 'content.test.ts', description: 'Content service tests', status: 'pending', epic: 'epic-01', category: 'Tests' },
      ],
      config: [],
    },
  },
  {
    epicId: 'epic-02',
    epicName: 'Analytics & Insights',
    phase: 'MVP',
    dependencies: ['epic-00'],
    tasks: {
      tables: [
        { id: 'e02-t1', type: 'table', name: 'analytics_events', description: 'Event tracking', status: 'in-progress', epic: 'epic-02', category: 'Database' },
        { id: 'e02-t2', type: 'table', name: 'page_views', description: 'Page view metrics', status: 'pending', epic: 'epic-02', category: 'Database' },
      ],
      endpoints: [
        { id: 'e02-e1', type: 'endpoint', name: 'GET /api/analytics', description: 'Get analytics data', status: 'in-progress', epic: 'epic-02', category: 'API' },
        { id: 'e02-e2', type: 'endpoint', name: 'POST /api/analytics/track', description: 'Track event', status: 'pending', epic: 'epic-02', category: 'API' },
      ],
      services: [
        { id: 'e02-s1', type: 'service', name: 'AnalyticsService', description: 'Analytics processing', status: 'in-progress', epic: 'epic-02', category: 'Services' },
      ],
      components: [
        { id: 'e02-c1', type: 'component', name: 'AnalyticsDashboard', description: 'Analytics overview', status: 'in-progress', epic: 'epic-02', category: 'Components' },
        { id: 'e02-c2', type: 'component', name: 'ChartWidgets', description: 'Data visualization', status: 'pending', epic: 'epic-02', category: 'Components' },
      ],
      tests: [],
      config: [],
    },
  },
  {
    epicId: 'epic-03',
    epicName: 'Developer Tools',
    phase: 'Growth',
    dependencies: ['epic-00', 'epic-01'],
    tasks: {
      tables: [
        { id: 'e03-t1', type: 'table', name: 'dev_feedback', description: 'Developer feedback items', status: 'in-progress', epic: 'epic-03', category: 'Database' },
        { id: 'e03-t2', type: 'table', name: 'dev_tasks', description: 'Task tracking', status: 'pending', epic: 'epic-03', category: 'Database' },
      ],
      endpoints: [
        { id: 'e03-e1', type: 'endpoint', name: 'GET /api/dev/feedback', description: 'Get feedback items', status: 'pending', epic: 'epic-03', category: 'API' },
        { id: 'e03-e2', type: 'endpoint', name: 'POST /api/dev/feedback', description: 'Submit feedback', status: 'pending', epic: 'epic-03', category: 'API' },
      ],
      services: [
        { id: 'e03-s1', type: 'service', name: 'DevFeedbackService', description: 'Feedback management', status: 'pending', epic: 'epic-03', category: 'Services' },
        { id: 'e03-s2', type: 'service', name: 'AutoDevService', description: 'AI automation', status: 'pending', epic: 'epic-03', category: 'Services' },
      ],
      components: [
        { id: 'e03-c1', type: 'component', name: 'DevDashboard', description: 'Developer dashboard', status: 'in-progress', epic: 'epic-03', category: 'Components' },
        { id: 'e03-c2', type: 'component', name: 'DevTracker', description: 'Task tracker', status: 'in-progress', epic: 'epic-03', category: 'Components' },
        { id: 'e03-c3', type: 'component', name: 'FeedbackCapture', description: 'Feedback overlay', status: 'pending', epic: 'epic-03', category: 'Components' },
        { id: 'e03-c4', type: 'component', name: 'AutoDevPanel', description: 'AI operations', status: 'pending', epic: 'epic-03', category: 'Components' },
      ],
      tests: [],
      config: [],
    },
  },
];

// =============================================================================
// Demo Route Data
// =============================================================================

export const routeData: RouteData[] = [
  { method: 'GET', path: '/api/health', description: 'Health check', epic: 'epic-00', auth: false, status: 'complete' },
  { method: 'GET', path: '/api/auth/session', description: 'Get session', epic: 'epic-00', auth: true, status: 'complete' },
  { method: 'POST', path: '/api/auth/login', description: 'Login', epic: 'epic-00', auth: false, status: 'complete' },
  { method: 'POST', path: '/api/auth/logout', description: 'Logout', epic: 'epic-00', auth: true, status: 'complete' },
  { method: 'GET', path: '/api/content', description: 'List content', epic: 'epic-01', auth: true, status: 'complete' },
  { method: 'POST', path: '/api/content', description: 'Create content', epic: 'epic-01', auth: true, status: 'complete' },
  { method: 'PUT', path: '/api/content/:id', description: 'Update content', epic: 'epic-01', auth: true, status: 'complete' },
  { method: 'DELETE', path: '/api/content/:id', description: 'Delete content', epic: 'epic-01', auth: true, status: 'complete' },
  { method: 'GET', path: '/api/media', description: 'List media', epic: 'epic-01', auth: true, status: 'complete' },
  { method: 'POST', path: '/api/media/upload', description: 'Upload file', epic: 'epic-01', auth: true, status: 'in-progress' },
  { method: 'GET', path: '/api/analytics', description: 'Get analytics', epic: 'epic-02', auth: true, status: 'in-progress' },
  { method: 'POST', path: '/api/analytics/track', description: 'Track event', epic: 'epic-02', auth: false, status: 'pending' },
  { method: 'GET', path: '/api/dev/feedback', description: 'Get dev feedback', epic: 'epic-03', auth: true, status: 'pending' },
  { method: 'POST', path: '/api/dev/feedback', description: 'Submit feedback', epic: 'epic-03', auth: true, status: 'pending' },
];

// =============================================================================
// Demo Tooling Data
// =============================================================================

export const toolingCommands = [
  {
    name: 'npm run dev',
    description: 'Start development server',
    usage: 'npm run dev',
    parameters: [],
    examples: ['npm run dev'],
    output: 'Starts Next.js dev server on port 3000',
  },
  {
    name: 'npm run build',
    description: 'Build for production',
    usage: 'npm run build',
    parameters: [],
    examples: ['npm run build'],
    output: 'Creates optimized production build',
  },
  {
    name: 'npm run lint',
    description: 'Run ESLint',
    usage: 'npm run lint',
    parameters: [],
    examples: ['npm run lint', 'npm run lint -- --fix'],
    output: 'Reports linting errors and warnings',
  },
];

export const toolingAgents = [
  {
    name: 'Claude Code',
    specialization: 'Full-stack Development',
    description: 'AI-powered development assistant',
    capabilities: ['Code generation', 'Debugging', 'Refactoring', 'Documentation'],
    invocation: 'claude-code',
    useCases: ['Feature development', 'Bug fixes', 'Code review'],
  },
];

export const toolingRules = [
  {
    name: 'TypeScript Strict',
    description: 'Enforce strict TypeScript rules',
    alwaysApply: true,
    triggers: ['*.ts', '*.tsx'],
    keyPoints: ['No implicit any', 'Strict null checks', 'No unused variables'],
  },
  {
    name: 'Component Naming',
    description: 'PascalCase for React components',
    alwaysApply: true,
    triggers: ['*.tsx'],
    keyPoints: ['PascalCase names', 'Descriptive naming', 'Single responsibility'],
  },
];

// =============================================================================
// Helper Functions
// =============================================================================

export function getEpicStatus(epic: EpicData): EpicStatus {
  const allTasks = getAllTasksForEpic(epic);
  if (allTasks.length === 0) return 'not-started';

  const blockedDeps = epic.dependencies.some(depId => {
    const dep = epicData.find(e => e.epicId === depId);
    return dep && getEpicStatus(dep) !== 'complete';
  });

  if (blockedDeps) return 'blocked';

  const completed = allTasks.filter(t => t.status === 'complete').length;
  const total = allTasks.length;

  if (completed === total) return 'complete';
  if (completed > 0 || allTasks.some(t => t.status === 'in-progress')) return 'in-progress';
  return 'not-started';
}

export function getEpicProgress(epic: EpicData): number {
  const allTasks = getAllTasksForEpic(epic);
  if (allTasks.length === 0) return 0;
  const completed = allTasks.filter(t => t.status === 'complete').length;
  return (completed / allTasks.length) * 100;
}

export function getEpicTaskCounts(epic: EpicData) {
  const allTasks = getAllTasksForEpic(epic);
  return {
    total: allTasks.length,
    completed: allTasks.filter(t => t.status === 'complete').length,
    inProgress: allTasks.filter(t => t.status === 'in-progress').length,
    pending: allTasks.filter(t => t.status === 'pending').length,
    blocked: allTasks.filter(t => t.status === 'blocked').length,
  };
}

function getAllTasksForEpic(epic: EpicData): TrackerTask[] {
  return [
    ...epic.tasks.tables,
    ...epic.tasks.endpoints,
    ...epic.tasks.services,
    ...epic.tasks.components,
    ...epic.tasks.tests,
    ...epic.tasks.config,
  ];
}

export function getAllTasks(): TrackerTask[] {
  return epicData.flatMap(epic => getAllTasksForEpic(epic));
}

export function getTotalProgress() {
  const allTasks = getAllTasks();
  const completed = allTasks.filter(t => t.status === 'complete').length;
  return {
    total: allTasks.length,
    completed,
    percentage: allTasks.length > 0 ? (completed / allTasks.length) * 100 : 0,
  };
}
