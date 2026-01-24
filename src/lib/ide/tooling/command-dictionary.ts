/**
 * Command Dictionary - All commands, agents, and skills organized by pillar
 *
 * Two Pillars:
 * - Planning: Ideation, requirements, architecture, design (before code)
 * - Development: Writing, reviewing, testing, shipping code
 */

import type { Pillar, AgentColor, WorkflowDefinition, WorkflowComplexity } from './types';

// ============================================================================
// Types
// ============================================================================

export interface DictionaryItem {
  id: string;
  name: string;
  displayName?: string; // Human name for planning agents (e.g., "Mary" for analyst)
  description: string;
  type: 'command' | 'skill' | 'agent';
  pillar: Pillar;
  category: string;
  color?: AgentColor;
  usage?: string; // e.g., "/autotask [task description]"
  argumentHint?: string;
  model?: 'opus' | 'sonnet' | 'haiku';
  systemPrompt?: string; // For agents
}

// ============================================================================
// Categories
// ============================================================================

export const PLANNING_CATEGORIES = {
  agents: ['Analysis', 'Product', 'Architecture', 'Design', 'Process', 'Documentation'],
  commands: ['Ideation', 'Documentation', 'Research', 'Collaboration'],
  skills: ['Reasoning', 'Research', 'Synthesis'],
};

export const DEVELOPMENT_CATEGORIES = {
  agents: [
    'Security',
    'Correctness',
    'Performance',
    'Testing',
    'Observability',
    'Style',
    'Design/UX',
    'Architecture',
  ],
  commands: ['Autonomous', 'Review', 'Environment', 'Session', 'Content'],
  skills: ['Debugging', 'Testing', 'Meta'],
};

// ============================================================================
// Planning Agents (11) - Includes BMAD Method agents
// ============================================================================

const planningAgents: DictionaryItem[] = [
  // BMAD Master - Core orchestrator
  {
    id: 'agent-bmad-master',
    name: 'bmad-master',
    displayName: 'BMAD',
    description: 'BMAD Method orchestrator - guides through planning workflows',
    type: 'agent',
    pillar: 'planning',
    category: 'Process',
    color: 'violet',
    model: 'opus',
    systemPrompt: `You are the BMAD Master, the orchestrator of the Breakthrough Method for Agile AI-Driven Development.

Your role is to:
- Guide users through the appropriate workflow (Quick Flow, BMad Method, or Enterprise)
- Recommend which specialized agent to engage based on the task
- Coordinate multi-agent collaboration sessions
- Ensure proper handoffs between planning and development phases

Workflows:
- Quick Flow (~10-30 min): Bug fixes, small features - minimal process
- BMad Method (~30 min-2 hrs): Products and platforms - full planning
- Enterprise (~1-3 hrs): Compliance-heavy systems - extended analysis

Always start by understanding the scope to recommend the right track.`,
  },
  {
    id: 'agent-analyst',
    name: 'analyst',
    displayName: 'Mary',
    description: 'Discovery, research, brainstorming, competitive analysis',
    type: 'agent',
    pillar: 'planning',
    category: 'Analysis',
    color: 'violet',
    model: 'opus',
    systemPrompt: `You are Mary, a senior Business Analyst. Your focus is:
- Discovery and research
- Brainstorming using 60+ ideation techniques
- Competitive analysis
- Stakeholder interviews
- Problem definition

Always ask clarifying questions before diving into solutions.
Use structured frameworks (5 Whys, SWOT, Jobs-to-be-Done).`,
  },
  {
    id: 'agent-pm',
    name: 'pm',
    displayName: 'John',
    description: 'PRDs, requirements, user stories, acceptance criteria',
    type: 'agent',
    pillar: 'planning',
    category: 'Product',
    color: 'indigo',
    model: 'opus',
    systemPrompt: `You are John, a Product Manager. Your focus is:
- Writing PRDs with clear acceptance criteria
- Breaking down features into user stories
- Prioritization frameworks (RICE, MoSCoW)
- Stakeholder alignment
- Success metrics definition

Be specific about what success looks like and how to measure it.`,
  },
  {
    id: 'agent-architect',
    name: 'architect',
    displayName: 'Winston',
    description: 'System design, ADRs, technical standards, API design',
    type: 'agent',
    pillar: 'planning',
    category: 'Architecture',
    color: 'sky',
    model: 'opus',
    systemPrompt: `You are Winston, a Solutions Architect. Your focus is:
- System design and architecture
- Writing ADRs (Architecture Decision Records)
- API design and contracts
- Technical standards and patterns
- Scalability and performance considerations

Consider trade-offs carefully and document your reasoning.`,
  },
  {
    id: 'agent-ux-designer',
    name: 'ux-designer',
    displayName: 'Sally',
    description: 'User journeys, wireframes, accessibility, design systems',
    type: 'agent',
    pillar: 'planning',
    category: 'Design',
    color: 'teal',
    model: 'sonnet',
    systemPrompt: `You are Sally, a UX Designer. Your focus is:
- User journey mapping
- Wireframes and mockups
- Accessibility (WCAG compliance)
- Design system consistency
- Usability testing plans

Always advocate for the user experience.`,
  },
  {
    id: 'agent-scrum-master',
    name: 'scrum-master',
    displayName: 'Bob',
    description: 'Sprint planning, retrospectives, team coordination',
    type: 'agent',
    pillar: 'planning',
    category: 'Process',
    color: 'emerald',
    model: 'sonnet',
    systemPrompt: `You are Bob, a Scrum Master. Your focus is:
- Sprint planning and estimation
- Retrospectives and continuous improvement
- Removing blockers
- Team coordination
- Process optimization

Keep the team focused and unblocked.`,
  },
  {
    id: 'agent-dev-lead',
    name: 'dev-lead',
    displayName: 'Amelia',
    description: 'Implementation guidance, code review strategy, mentorship',
    type: 'agent',
    pillar: 'planning',
    category: 'Architecture',
    color: 'sky',
    model: 'opus',
    systemPrompt: `You are Amelia, a Development Lead. Your focus is:
- Implementation strategy and guidance
- Code review best practices
- Technical mentorship
- Team coding standards
- Technical debt management

Bridge the gap between architecture and implementation.`,
  },
  {
    id: 'agent-test-architect',
    name: 'test-architect',
    displayName: 'Murat',
    description: 'Test strategy, quality gates, coverage requirements',
    type: 'agent',
    pillar: 'planning',
    category: 'Process',
    color: 'emerald',
    model: 'sonnet',
    systemPrompt: `You are Murat, a Test Architect. Your focus is:
- Test strategy and planning
- Quality gates and criteria
- Coverage requirements
- Test automation strategy
- Performance testing approach

Quality is everyone's responsibility, but you define the standards.`,
  },
  {
    id: 'agent-quick-dev',
    name: 'quick-dev',
    displayName: 'Barry',
    description: 'Rapid solo development for small changes, bug fixes',
    type: 'agent',
    pillar: 'planning',
    category: 'Process',
    color: 'emerald',
    model: 'haiku',
    systemPrompt: `You are Barry, a Quick Flow Developer. Your focus is:
- Rapid bug fixes
- Small, well-scoped changes
- Minimal process overhead
- Quick turnaround
- Tech spec only (no full PRD needed)

Move fast but don't break things.`,
  },
  {
    id: 'agent-tech-writer',
    name: 'tech-writer',
    displayName: 'Docs',
    description: 'Technical documentation, API docs, user guides, READMEs',
    type: 'agent',
    pillar: 'planning',
    category: 'Documentation',
    color: 'sky',
    model: 'sonnet',
    systemPrompt: `You are a Technical Writer. Your focus is:
- Clear, comprehensive documentation
- API documentation and examples
- User guides and tutorials
- README files and getting started guides
- Architecture documentation

Write for your audience - developers need different docs than end users.
Prioritize clarity, examples, and keeping docs in sync with code.`,
  },
];

// ============================================================================
// Planning Commands (8)
// ============================================================================

const planningCommands: DictionaryItem[] = [
  {
    id: 'cmd-brainstorm',
    name: 'brainstorm',
    description: 'Explore options with 60+ ideation techniques',
    type: 'command',
    pillar: 'planning',
    category: 'Ideation',
    usage: '/brainstorm [topic or problem]',
    argumentHint: '[topic]',
  },
  {
    id: 'cmd-prd',
    name: 'prd',
    description: 'Generate a Product Requirements Document',
    type: 'command',
    pillar: 'planning',
    category: 'Documentation',
    usage: '/prd [feature name]',
    argumentHint: '[feature]',
  },
  {
    id: 'cmd-architecture',
    name: 'architecture',
    description: 'Create architecture decision records (ADRs)',
    type: 'command',
    pillar: 'planning',
    category: 'Documentation',
    usage: '/architecture [decision topic]',
    argumentHint: '[topic]',
  },
  {
    id: 'cmd-user-stories',
    name: 'user-stories',
    description: 'Break down features into user stories with acceptance criteria',
    type: 'command',
    pillar: 'planning',
    category: 'Documentation',
    usage: '/user-stories [feature]',
    argumentHint: '[feature]',
  },
  {
    id: 'cmd-research',
    name: 'research',
    description: 'Web research for APIs, docs, competitive intel',
    type: 'command',
    pillar: 'planning',
    category: 'Research',
    usage: '/research [topic]',
    argumentHint: '[topic]',
  },
  {
    id: 'cmd-product-intel',
    name: 'product-intel',
    description: 'Competitive analysis and market research',
    type: 'command',
    pillar: 'planning',
    category: 'Research',
    usage: '/product-intel [competitor or market]',
    argumentHint: '[topic]',
  },
  {
    id: 'cmd-knowledge',
    name: 'knowledge',
    description: 'Maintain living product understanding and context',
    type: 'command',
    pillar: 'planning',
    category: 'Documentation',
    usage: '/knowledge [action]',
    argumentHint: '[update|query]',
  },
  {
    id: 'cmd-party-mode',
    name: 'party-mode',
    description: 'Multi-agent collaboration on complex topics',
    type: 'command',
    pillar: 'planning',
    category: 'Collaboration',
    usage: '/party-mode [topic or question]',
    argumentHint: '[topic]',
  },
];

// ============================================================================
// Planning Skills (4)
// ============================================================================

const planningSkills: DictionaryItem[] = [
  {
    id: 'skill-brainstorming',
    name: 'brainstorming',
    description: '60+ ideation techniques (First Principles, SCAMPER, Six Hats, etc.)',
    type: 'skill',
    pillar: 'planning',
    category: 'Reasoning',
  },
  {
    id: 'skill-elicitation',
    name: 'elicitation',
    description: '50+ reasoning methods (Red Team, Devils Advocate, Socratic, etc.)',
    type: 'skill',
    pillar: 'planning',
    category: 'Reasoning',
  },
  {
    id: 'skill-research',
    name: 'research',
    description: 'Web research with source synthesis and citation',
    type: 'skill',
    pillar: 'planning',
    category: 'Research',
  },
  {
    id: 'skill-synthesis',
    name: 'synthesis',
    description: 'M-of-N synthesis for hard architectural decisions',
    type: 'skill',
    pillar: 'planning',
    category: 'Synthesis',
  },
];

// ============================================================================
// Development Agents (24)
// ============================================================================

const developmentAgents: DictionaryItem[] = [
  // Security
  {
    id: 'agent-security-reviewer',
    name: 'security-reviewer',
    description: 'Injection flaws, authentication, OWASP vulnerabilities',
    type: 'agent',
    pillar: 'development',
    category: 'Security',
    color: 'red',
    systemPrompt: `You are a Security Reviewer. Analyze code for:
- Injection vulnerabilities (SQL, XSS, Command)
- Authentication/authorization flaws
- OWASP Top 10 vulnerabilities
- Secrets exposure
- Input validation gaps

Be specific about line numbers and provide fixes.`,
  },

  // Correctness
  {
    id: 'agent-logic-reviewer',
    name: 'logic-reviewer',
    description: 'Logic bugs, edge cases, off-by-one errors, race conditions',
    type: 'agent',
    pillar: 'development',
    category: 'Correctness',
    color: 'orange',
    systemPrompt: `You are a Logic Reviewer. Analyze code for:
- Logic bugs and edge cases
- Off-by-one errors
- Race conditions
- Null/undefined handling
- State management issues

Trace through code paths methodically.`,
  },
  {
    id: 'agent-error-handling-reviewer',
    name: 'error-handling-reviewer',
    description: 'Silent failures, try-catch patterns, actionable error feedback',
    type: 'agent',
    pillar: 'development',
    category: 'Correctness',
    color: 'orange',
    systemPrompt: `You are an Error Handling Reviewer. Analyze code for:
- Silent failures
- Proper try-catch patterns
- Actionable error messages
- Error propagation
- Recovery mechanisms`,
  },
  {
    id: 'agent-robustness-reviewer',
    name: 'robustness-reviewer',
    description: 'Production readiness, fragile code, resilience, reliability',
    type: 'agent',
    pillar: 'development',
    category: 'Correctness',
    color: 'orange',
    systemPrompt: `You are a Robustness Reviewer. Analyze code for:
- Production readiness
- Fragile dependencies
- Resilience patterns
- Reliability concerns
- Failure modes`,
  },

  // Performance
  {
    id: 'agent-performance-reviewer',
    name: 'performance-reviewer',
    description: 'N+1 queries, algorithmic complexity, efficiency problems',
    type: 'agent',
    pillar: 'development',
    category: 'Performance',
    color: 'yellow',
    systemPrompt: `You are a Performance Reviewer. Analyze code for:
- N+1 query problems
- Algorithmic complexity (Big O)
- Memory leaks
- Unnecessary re-renders
- Caching opportunities`,
  },

  // Testing
  {
    id: 'agent-test-analyzer',
    name: 'test-analyzer',
    description: 'Test coverage, test quality, brittle tests, coverage gaps',
    type: 'agent',
    pillar: 'development',
    category: 'Testing',
    color: 'green',
    systemPrompt: `You are a Test Analyzer. Analyze tests for:
- Coverage gaps
- Test quality and value
- Brittle tests
- Missing edge cases
- Test organization`,
  },
  {
    id: 'agent-test-engineer',
    name: 'test-engineer',
    description: 'Write tests, generate coverage, unit/integration tests',
    type: 'agent',
    pillar: 'development',
    category: 'Testing',
    color: 'green',
    systemPrompt: `You are a Test Engineer. Your focus is:
- Writing comprehensive tests
- Unit and integration tests
- Mocking strategies
- Test data generation
- Coverage improvement`,
  },
  {
    id: 'agent-test-runner',
    name: 'test-runner',
    description: 'Run tests, check results, get pass/fail status',
    type: 'agent',
    pillar: 'development',
    category: 'Testing',
    color: 'green',
    model: 'haiku',
    systemPrompt: `You are a Test Runner. Your focus is:
- Executing test suites
- Reporting results
- Identifying flaky tests
- Performance of test runs`,
  },

  // Observability
  {
    id: 'agent-observability-reviewer',
    name: 'observability-reviewer',
    description: 'Logging, error tracking, monitoring, debuggability',
    type: 'agent',
    pillar: 'development',
    category: 'Observability',
    color: 'cyan',
    systemPrompt: `You are an Observability Reviewer. Analyze code for:
- Logging completeness
- Error tracking integration
- Monitoring hooks
- Debuggability
- Tracing support`,
  },
  {
    id: 'agent-site-keeper',
    name: 'site-keeper',
    description: 'Monitor production health, triage errors, reliability checks',
    type: 'agent',
    pillar: 'development',
    category: 'Observability',
    color: 'cyan',
    systemPrompt: `You are a Site Keeper. Your focus is:
- Production health monitoring
- Error triage and prioritization
- Reliability checks
- Incident response
- SLA compliance`,
  },

  // Style
  {
    id: 'agent-style-reviewer',
    name: 'style-reviewer',
    description: 'Code style, naming conventions, project patterns, consistency',
    type: 'agent',
    pillar: 'development',
    category: 'Style',
    color: 'blue',
    systemPrompt: `You are a Style Reviewer. Analyze code for:
- Code style consistency
- Naming conventions
- Project patterns
- Readability
- Idioms and best practices`,
  },
  {
    id: 'agent-comment-analyzer',
    name: 'comment-analyzer',
    description: 'Review comments, docstrings, documentation accuracy',
    type: 'agent',
    pillar: 'development',
    category: 'Style',
    color: 'blue',
    systemPrompt: `You are a Comment Analyzer. Analyze code for:
- Comment quality and accuracy
- Docstring completeness
- Documentation sync with code
- Unnecessary comments
- Missing explanations for complex logic`,
  },

  // Design/UX
  {
    id: 'agent-ux-reviewer',
    name: 'ux-reviewer',
    description: 'User interfaces, user-facing content, error messages, polish',
    type: 'agent',
    pillar: 'development',
    category: 'Design/UX',
    color: 'purple',
    systemPrompt: `You are a UX Reviewer. Analyze code for:
- User interface quality
- User-facing content clarity
- Error message helpfulness
- Loading states
- Edge case UI handling`,
  },
  {
    id: 'agent-empathy-reviewer',
    name: 'empathy-reviewer',
    description: 'UX review from user perspective, user experience, friction points',
    type: 'agent',
    pillar: 'development',
    category: 'Design/UX',
    color: 'purple',
    systemPrompt: `You are an Empathy Reviewer. Review from user perspective:
- User confusion points
- Friction in workflows
- Accessibility concerns
- Cognitive load
- Delightful moments`,
  },
  {
    id: 'agent-design-reviewer',
    name: 'design-reviewer',
    description: 'Frontend design, UI quality, visual consistency, responsive',
    type: 'agent',
    pillar: 'development',
    category: 'Design/UX',
    color: 'purple',
    systemPrompt: `You are a Design Reviewer. Analyze UI for:
- Visual consistency
- Design system adherence
- Responsive design
- Animation quality
- Spacing and typography`,
  },
  {
    id: 'agent-mobile-ux-reviewer',
    name: 'mobile-ux-reviewer',
    description: 'Mobile UX, responsive design, touch interactions',
    type: 'agent',
    pillar: 'development',
    category: 'Design/UX',
    color: 'purple',
    systemPrompt: `You are a Mobile UX Reviewer. Analyze for:
- Touch target sizes
- Mobile-first patterns
- Responsive breakpoints
- Gesture support
- Performance on mobile`,
  },
  {
    id: 'agent-seo-specialist',
    name: 'seo-specialist',
    description: 'SEO audit, search rankings, structured data, Core Web Vitals',
    type: 'agent',
    pillar: 'development',
    category: 'Design/UX',
    color: 'purple',
    systemPrompt: `You are an SEO Specialist. Analyze for:
- Meta tags and Open Graph
- Structured data (JSON-LD)
- Core Web Vitals
- Semantic HTML
- Crawlability`,
  },

  // Architecture
  {
    id: 'agent-architecture-auditor',
    name: 'architecture-auditor',
    description: 'Architecture review, design patterns, dependency audit',
    type: 'agent',
    pillar: 'development',
    category: 'Architecture',
    color: 'magenta',
    systemPrompt: `You are an Architecture Auditor. Analyze code for:
- Architectural patterns
- Dependency health
- Module boundaries
- Coupling and cohesion
- Technical debt`,
  },
  {
    id: 'agent-simplifier',
    name: 'simplifier',
    description: 'Simplify code, reduce complexity, eliminate redundancy',
    type: 'agent',
    pillar: 'development',
    category: 'Architecture',
    color: 'magenta',
    systemPrompt: `You are a Simplifier. Your focus is:
- Reducing complexity
- Eliminating redundancy
- Improving readability
- Removing dead code
- Consolidating similar patterns`,
  },
  {
    id: 'agent-debugger',
    name: 'debugger',
    description: 'Debug errors, investigate failures, find root causes',
    type: 'agent',
    pillar: 'development',
    category: 'Architecture',
    color: 'magenta',
    systemPrompt: `You are a Debugger. Your focus is:
- Systematic debugging
- Root cause analysis
- Error reproduction
- Log analysis
- State inspection`,
  },
  {
    id: 'agent-prompt-engineer',
    name: 'prompt-engineer',
    description: 'Write prompts, agent instructions, LLM-to-LLM communication',
    type: 'agent',
    pillar: 'development',
    category: 'Architecture',
    color: 'magenta',
    systemPrompt: `You are a Prompt Engineer. Your focus is:
- Writing effective prompts
- Agent instructions
- System prompt design
- Few-shot examples
- Output formatting`,
  },
  {
    id: 'agent-git-writer',
    name: 'git-writer',
    description: 'Commit messages, PR descriptions, branch naming',
    type: 'agent',
    pillar: 'development',
    category: 'Architecture',
    color: 'magenta',
    model: 'haiku',
    systemPrompt: `You are a Git Writer. Your focus is:
- Clear commit messages
- Comprehensive PR descriptions
- Consistent branch naming
- Changelog entries
- Release notes`,
  },
  {
    id: 'agent-library-advisor',
    name: 'library-advisor',
    description: 'Choose libraries, evaluate packages, build vs buy decisions',
    type: 'agent',
    pillar: 'development',
    category: 'Architecture',
    color: 'magenta',
    systemPrompt: `You are a Library Advisor. Your focus is:
- Library evaluation
- Package health assessment
- Build vs buy decisions
- Dependency risk analysis
- Migration planning`,
  },
  {
    id: 'agent-autonomous-developer',
    name: 'autonomous-developer',
    description: 'Complete tasks autonomously, deliver PR-ready code',
    type: 'agent',
    pillar: 'development',
    category: 'Architecture',
    color: 'magenta',
    model: 'opus',
    systemPrompt: `You are an Autonomous Developer. Your focus is:
- End-to-end task completion
- PR-ready code delivery
- Self-review before submission
- Test coverage
- Documentation updates`,
  },
];

// ============================================================================
// Development Commands (14)
// ============================================================================

const developmentCommands: DictionaryItem[] = [
  // Autonomous
  {
    id: 'cmd-autotask',
    name: 'autotask',
    description: 'Execute task autonomously from description to PR-ready',
    type: 'command',
    pillar: 'development',
    category: 'Autonomous',
    usage: '/autotask [task description]',
    argumentHint: '[task]',
  },
  {
    id: 'cmd-troubleshoot',
    name: 'troubleshoot',
    description: 'Autonomous production error resolution from Sentry or logs',
    type: 'command',
    pillar: 'development',
    category: 'Autonomous',
    usage: '/troubleshoot [error or issue]',
    argumentHint: '[error]',
  },
  {
    id: 'cmd-quick-fix',
    name: 'quick-fix',
    description: 'Quick flow for bug fixes with minimal process',
    type: 'command',
    pillar: 'development',
    category: 'Autonomous',
    usage: '/quick-fix [bug description]',
    argumentHint: '[bug]',
  },
  {
    id: 'cmd-enterprise-task',
    name: 'enterprise-task',
    description: 'Enterprise flow with extended analysis and compliance',
    type: 'command',
    pillar: 'development',
    category: 'Autonomous',
    usage: '/enterprise-task [task description]',
    argumentHint: '[task]',
  },

  // Review
  {
    id: 'cmd-multi-review',
    name: 'multi-review',
    description: 'Multi-agent code review with diverse perspectives',
    type: 'command',
    pillar: 'development',
    category: 'Review',
    usage: '/multi-review [file or PR]',
    argumentHint: '[target]',
  },
  {
    id: 'cmd-verify-fix',
    name: 'verify-fix',
    description: 'Verify a fix actually works before claiming success',
    type: 'command',
    pillar: 'development',
    category: 'Review',
    usage: '/verify-fix',
  },
  {
    id: 'cmd-address-pr-comments',
    name: 'address-pr-comments',
    description: 'Triage and address PR comments from code review bots',
    type: 'command',
    pillar: 'development',
    category: 'Review',
    usage: '/address-pr-comments [PR number]',
    argumentHint: '[PR#]',
  },
  {
    id: 'cmd-load-rules',
    name: 'load-rules',
    description: 'Load relevant coding rules for the current task',
    type: 'command',
    pillar: 'development',
    category: 'Review',
    usage: '/load-rules',
  },

  // Environment
  {
    id: 'cmd-setup-environment',
    name: 'setup-environment',
    description: 'Initialize development environment for git worktree',
    type: 'command',
    pillar: 'development',
    category: 'Environment',
    usage: '/setup-environment',
  },
  {
    id: 'cmd-cleanup-worktree',
    name: 'cleanup-worktree',
    description: 'Clean up a git worktree after its PR has been merged',
    type: 'command',
    pillar: 'development',
    category: 'Environment',
    usage: '/cleanup-worktree',
  },

  // Session
  {
    id: 'cmd-session',
    name: 'session',
    description: 'Save and resume development sessions across conversations',
    type: 'command',
    pillar: 'development',
    category: 'Session',
    usage: '/session [save|resume|list] [name]',
    argumentHint: '[action] [name]',
  },
  {
    id: 'cmd-handoff-context',
    name: 'handoff-context',
    description: 'Generate context handoff for new session or team member',
    type: 'command',
    pillar: 'development',
    category: 'Session',
    usage: '/handoff-context',
  },

  // Content
  {
    id: 'cmd-create-prompt',
    name: 'create-prompt',
    description: 'Create optimized prompts following prompt-engineering principles',
    type: 'command',
    pillar: 'development',
    category: 'Content',
    usage: '/create-prompt [purpose]',
    argumentHint: '[purpose]',
  },
  {
    id: 'cmd-generate-agents-file',
    name: 'generate-AGENTS-file',
    description: 'Generate AGENTS.md with project context for AI assistants',
    type: 'command',
    pillar: 'development',
    category: 'Content',
    usage: '/generate-AGENTS-file',
  },
];

// ============================================================================
// Development Skills (4)
// ============================================================================

const developmentSkills: DictionaryItem[] = [
  {
    id: 'skill-systematic-debugging',
    name: 'systematic-debugging',
    description: 'Find root cause before fixing - understand why before how',
    type: 'skill',
    pillar: 'development',
    category: 'Debugging',
  },
  {
    id: 'skill-playwright-browser',
    name: 'playwright-browser',
    description: 'Automate browsers, test pages, take screenshots, check UI',
    type: 'skill',
    pillar: 'development',
    category: 'Testing',
  },
  {
    id: 'skill-skill-creator',
    name: 'skill-creator',
    description: 'Create and edit SKILL.md files for new reusable techniques',
    type: 'skill',
    pillar: 'development',
    category: 'Meta',
  },
  {
    id: 'skill-youtube-transcript',
    name: 'youtube-transcript-analyzer',
    description: 'Analyze YouTube videos, extract insights from tutorials and talks',
    type: 'skill',
    pillar: 'development',
    category: 'Meta',
  },
];

// ============================================================================
// Orchestration Workflows (8)
// Pre-built workflows that load the right agents, commands, and skills
// ============================================================================

export const workflowDefinitions: WorkflowDefinition[] = [
  // 1. Quick Fix - Fast bug fix with minimal process
  {
    id: 'workflow-quick-fix',
    name: 'quick-fix',
    displayName: 'Quick Fix',
    description: 'Fast bug fix or small change with minimal process overhead',
    complexity: 'quick',
    estimatedTime: '10-30 min',
    color: 'emerald',
    icon: 'Zap',
    agents: ['quick-dev', 'debugger', 'test-runner'],
    commands: ['quick-fix', 'verify-fix'],
    skills: ['systematic-debugging'],
    strategyPrompt: `You are orchestrating a Quick Fix workflow. This is for small, well-scoped changes.

**Workflow Strategy:**
1. @quick-dev (Barry) leads - rapid development with minimal process
2. Use *systematic-debugging to understand the issue before fixing
3. @debugger assists if root cause is unclear
4. @test-runner verifies the fix works
5. Use /verify-fix before declaring success

**Rules:**
- No PRD needed - just a clear tech spec
- Focus on surgical fixes, not refactoring
- Test the specific fix, not comprehensive coverage
- Commit with clear message explaining the fix`,
    examples: [
      'Fix the login button not responding on mobile',
      'Correct the date formatting in the dashboard',
      'Fix the API returning 500 on empty input',
    ],
  },

  // 2. Feature Sprint - Single feature development
  {
    id: 'workflow-feature-sprint',
    name: 'feature-sprint',
    displayName: 'Feature Sprint',
    description: 'Develop a single well-defined feature from spec to deployment',
    complexity: 'sprint',
    estimatedTime: '2-4 hrs',
    color: 'sky',
    icon: 'Rocket',
    agents: ['pm', 'dev-lead', 'autonomous-developer', 'test-engineer', 'security-reviewer'],
    commands: ['user-stories', 'autotask', 'multi-review'],
    skills: ['systematic-debugging', 'playwright-browser'],
    strategyPrompt: `You are orchestrating a Feature Sprint workflow. This is for building a single, well-defined feature.

**Workflow Strategy:**
1. @pm (John) creates user stories with acceptance criteria using /user-stories
2. @dev-lead (Amelia) reviews the approach and identifies risks
3. @autonomous-developer implements the feature using /autotask
4. @test-engineer writes and runs tests
5. @security-reviewer checks for vulnerabilities
6. Use /multi-review for final quality check

**Phases:**
- **Plan (15 min):** User stories, acceptance criteria, edge cases
- **Build (1-2 hrs):** Implementation with incremental commits
- **Verify (30 min):** Tests, security review, manual verification
- **Ship (15 min):** Final review, documentation, PR

**Quality Gates:**
- All acceptance criteria met
- Tests pass with good coverage
- No security vulnerabilities
- Code reviewed and approved`,
    examples: [
      'Add user profile image upload',
      'Implement password reset flow',
      'Build notification preferences panel',
    ],
  },

  // 3. Component Build - Build a complete UI component
  {
    id: 'workflow-component-build',
    name: 'component-build',
    displayName: 'Component Build',
    description: 'Build a polished, reusable UI component with full design consideration',
    complexity: 'sprint',
    estimatedTime: '1-3 hrs',
    color: 'purple',
    icon: 'Layers',
    agents: ['ux-designer', 'design-reviewer', 'autonomous-developer', 'mobile-ux-reviewer', 'test-engineer'],
    commands: ['autotask', 'multi-review'],
    skills: ['playwright-browser'],
    strategyPrompt: `You are orchestrating a Component Build workflow. This is for creating polished, reusable UI components.

**Workflow Strategy:**
1. @ux-designer (Sally) defines the component spec - states, variants, accessibility
2. @autonomous-developer implements with Tailwind/design system
3. @design-reviewer checks visual consistency and polish
4. @mobile-ux-reviewer verifies responsive behavior
5. @test-engineer writes component tests
6. Use *playwright-browser to visually verify

**Component Checklist:**
- [ ] All states (default, hover, active, disabled, loading, error)
- [ ] Responsive at all breakpoints
- [ ] Keyboard navigation works
- [ ] Screen reader accessible (ARIA)
- [ ] Matches design system tokens
- [ ] Documented with examples
- [ ] Unit tests for logic
- [ ] Visual regression baseline

**Quality Focus:**
- Pixel-perfect implementation
- Smooth animations (60fps)
- Accessible by default
- Props API is intuitive`,
    examples: [
      'Build a dropdown select component',
      'Create an image carousel with lightbox',
      'Design a data table with sorting and filtering',
    ],
  },

  // 4. Full Stack Feature - End-to-end with frontend + backend
  {
    id: 'workflow-fullstack-feature',
    name: 'fullstack-feature',
    displayName: 'Full Stack Feature',
    description: 'End-to-end feature spanning frontend, backend, and database',
    complexity: 'project',
    estimatedTime: '4-8 hrs',
    color: 'indigo',
    icon: 'Database',
    agents: ['architect', 'pm', 'dev-lead', 'autonomous-developer', 'security-reviewer', 'performance-reviewer', 'test-engineer'],
    commands: ['prd', 'architecture', 'user-stories', 'autotask', 'multi-review'],
    skills: ['systematic-debugging', 'research'],
    strategyPrompt: `You are orchestrating a Full Stack Feature workflow. This spans frontend, backend, and data layers.

**Workflow Strategy:**
1. @pm (John) writes a focused PRD with /prd
2. @architect (Winston) designs the technical approach:
   - API contracts (OpenAPI/GraphQL schema)
   - Database schema changes
   - Component architecture
3. @dev-lead (Amelia) breaks into implementation tasks
4. @autonomous-developer implements in order:
   - Database migrations first
   - Backend API endpoints
   - Frontend components
   - Integration wiring
5. @security-reviewer audits each layer
6. @performance-reviewer checks for N+1 queries, bundle size
7. @test-engineer writes integration tests

**Architecture First:**
- Define API contract before implementation
- Design database schema with indexes
- Plan error handling across layers
- Consider caching strategy

**Integration Points:**
- Type safety end-to-end (TypeScript + Zod/Prisma)
- Error propagation from backend to UI
- Loading and optimistic states
- Real-time updates if needed`,
    examples: [
      'Build user comments system with replies',
      'Implement payment processing integration',
      'Create team permissions and roles system',
    ],
  },

  // 5. Code Quality Audit - Comprehensive review and improvement
  {
    id: 'workflow-quality-audit',
    name: 'quality-audit',
    displayName: 'Code Quality Audit',
    description: 'Comprehensive code review with security, performance, and quality fixes',
    complexity: 'sprint',
    estimatedTime: '2-4 hrs',
    color: 'red',
    icon: 'Shield',
    agents: [
      'security-reviewer',
      'performance-reviewer',
      'logic-reviewer',
      'error-handling-reviewer',
      'architecture-auditor',
      'test-analyzer',
      'simplifier',
    ],
    commands: ['multi-review', 'load-rules'],
    skills: ['systematic-debugging'],
    strategyPrompt: `You are orchestrating a Code Quality Audit workflow. This is a comprehensive review of code health.

**Workflow Strategy:**
Run these reviews in parallel, then synthesize findings:

1. **Security Sweep** - @security-reviewer
   - OWASP Top 10 vulnerabilities
   - Authentication/authorization gaps
   - Input validation
   - Secrets exposure

2. **Performance Analysis** - @performance-reviewer
   - N+1 queries
   - Bundle size issues
   - Memory leaks
   - Render performance

3. **Logic Review** - @logic-reviewer
   - Edge cases
   - Race conditions
   - Null handling

4. **Error Handling** - @error-handling-reviewer
   - Silent failures
   - Error recovery
   - User feedback

5. **Architecture** - @architecture-auditor
   - Technical debt
   - Coupling issues
   - Pattern violations

6. **Test Coverage** - @test-analyzer
   - Coverage gaps
   - Test quality
   - Missing edge cases

7. **Simplification** - @simplifier
   - Complexity reduction
   - Dead code removal
   - Redundancy elimination

**Output:**
- Prioritized issues list (Critical/High/Medium/Low)
- Specific fixes with line numbers
- Refactoring recommendations
- Test improvement plan`,
    examples: [
      'Audit the authentication module before launch',
      'Review the checkout flow for production readiness',
      'Analyze the API layer for security issues',
    ],
  },

  // 6. Product Discovery - Research and planning phase
  {
    id: 'workflow-product-discovery',
    name: 'product-discovery',
    displayName: 'Product Discovery',
    description: 'Research, brainstorm, and plan before building - the thinking phase',
    complexity: 'sprint',
    estimatedTime: '1-2 hrs',
    color: 'violet',
    icon: 'Lightbulb',
    agents: ['analyst', 'pm', 'architect', 'ux-designer', 'bmad-master'],
    commands: ['brainstorm', 'research', 'product-intel', 'prd', 'architecture', 'party-mode'],
    skills: ['brainstorming', 'elicitation', 'research', 'synthesis'],
    strategyPrompt: `You are orchestrating a Product Discovery workflow. This is the thinking phase before building.

**Workflow Strategy:**
1. @bmad-master (BMAD) coordinates the discovery process
2. @analyst (Mary) leads discovery:
   - /brainstorm to explore solutions (60+ techniques)
   - /research for technical feasibility
   - /product-intel for competitive analysis
3. @pm (John) synthesizes into requirements:
   - Problem statement
   - Success metrics
   - User stories
4. @architect (Winston) evaluates technical approaches:
   - /architecture for key decisions
   - Trade-off analysis
5. @ux-designer (Sally) considers user experience:
   - User journeys
   - Key interactions
6. /party-mode for multi-agent discussion on hard decisions

**Discovery Outputs:**
- Problem Definition (why are we building this?)
- Solution Options (what could we build?)
- Technical Feasibility (can we build it?)
- User Impact (will users want it?)
- Recommendation (what should we build?)

**Techniques to Use:**
- First Principles thinking
- Jobs-to-be-Done framework
- SWOT analysis
- 5 Whys for problem clarity
- Design thinking exercises`,
    examples: [
      'Explore how to add AI features to the product',
      'Research approaches for improving onboarding',
      'Analyze competitor features and find gaps',
    ],
  },

  // 7. MVP Build - Minimum viable product development
  {
    id: 'workflow-mvp-build',
    name: 'mvp-build',
    displayName: 'MVP Build',
    description: 'Build a minimum viable product with core features only',
    complexity: 'project',
    estimatedTime: '1-2 days',
    color: 'teal',
    icon: 'Package',
    agents: [
      'bmad-master',
      'analyst',
      'pm',
      'architect',
      'ux-designer',
      'dev-lead',
      'autonomous-developer',
      'test-architect',
      'test-engineer',
      'security-reviewer',
    ],
    commands: ['brainstorm', 'prd', 'architecture', 'user-stories', 'autotask', 'multi-review', 'handoff-context'],
    skills: ['brainstorming', 'research', 'systematic-debugging', 'playwright-browser'],
    strategyPrompt: `You are orchestrating an MVP Build workflow. Build the smallest thing that delivers value.

**Workflow Strategy:**
@bmad-master coordinates using the BMad Method:

**Phase 1: Discovery (30 min)**
- @analyst (Mary) clarifies the core problem
- Define the ONE key metric for success
- Ruthlessly cut scope to essentials

**Phase 2: Planning (1 hr)**
- @pm (John) writes lean PRD - only core features
- @architect (Winston) designs simple architecture
- @ux-designer (Sally) sketches minimal UI
- @test-architect (Murat) defines quality bar

**Phase 3: Build (4-8 hrs)**
- @dev-lead (Amelia) sequences the work
- @autonomous-developer implements features
- Focus on happy path first
- Ship incremental slices

**Phase 4: Verify (1 hr)**
- @test-engineer writes critical path tests
- @security-reviewer checks auth and data handling
- Manual testing of core flows
- /multi-review final check

**MVP Principles:**
- If in doubt, leave it out
- Optimize for learning, not perfection
- Ship something users can try
- Plan for iteration, not completion
- Document what's deferred, not deleted`,
    examples: [
      'Build MVP for a todo app with sharing',
      'Create basic landing page with waitlist',
      'Ship minimal dashboard with key metrics',
    ],
  },

  // 8. Platform Build - Full platform from scratch
  {
    id: 'workflow-platform-build',
    name: 'platform-build',
    displayName: 'Platform Build',
    description: 'Build an entire platform from concept to production - the full BMAD method',
    complexity: 'platform',
    estimatedTime: '1-2 weeks',
    color: 'orange',
    icon: 'Building',
    agents: [
      'bmad-master',
      'analyst',
      'pm',
      'architect',
      'ux-designer',
      'scrum-master',
      'dev-lead',
      'test-architect',
      'tech-writer',
      'autonomous-developer',
      'security-reviewer',
      'performance-reviewer',
      'architecture-auditor',
      'test-engineer',
      'observability-reviewer',
      'site-keeper',
    ],
    commands: [
      'brainstorm',
      'research',
      'product-intel',
      'prd',
      'architecture',
      'user-stories',
      'knowledge',
      'party-mode',
      'autotask',
      'enterprise-task',
      'multi-review',
      'session',
      'handoff-context',
      'generate-AGENTS-file',
    ],
    skills: ['brainstorming', 'elicitation', 'research', 'synthesis', 'systematic-debugging', 'playwright-browser'],
    strategyPrompt: `You are orchestrating a Platform Build workflow. This is the full BMAD Method for building complete platforms.

**BMAD Method - Full Orchestration:**

@bmad-master coordinates all phases and agent handoffs.

**Phase 1: Discovery & Research (2-4 hrs)**
- @analyst (Mary) leads comprehensive discovery
  - /brainstorm with multiple techniques
  - /research for technical landscape
  - /product-intel for competitive analysis
  - Stakeholder interviews and synthesis
- Output: Problem Definition, Opportunity Assessment

**Phase 2: Product Definition (2-4 hrs)**
- @pm (John) creates comprehensive PRD
  - User personas and journeys
  - Feature prioritization (MoSCoW)
  - Success metrics and KPIs
- @ux-designer (Sally) designs user experience
  - Information architecture
  - Key user flows
  - Accessibility requirements
- Output: PRD, User Stories, Design Specs

**Phase 3: Architecture & Planning (2-4 hrs)**
- @architect (Winston) designs the system
  - /architecture for key decisions (ADRs)
  - Data model design
  - API contracts
  - Infrastructure requirements
- @test-architect (Murat) defines quality strategy
- @dev-lead (Amelia) creates implementation plan
- @scrum-master (Bob) organizes into sprints
- Output: Technical Spec, Sprint Plan

**Phase 4: Implementation (days)**
- @autonomous-developer builds features
- Use /autotask for each work item
- @test-engineer writes tests alongside
- Daily /multi-review cycles
- @security-reviewer audits as features complete
- @performance-reviewer monitors metrics

**Phase 5: Quality & Polish (4-8 hrs)**
- Full /multi-review with all reviewers
- @observability-reviewer adds monitoring
- @site-keeper sets up alerting
- @tech-writer creates documentation
- Performance optimization pass

**Phase 6: Launch Prep (2-4 hrs)**
- Final security audit
- Load testing
- Runbook creation
- /handoff-context for operations team
- /generate-AGENTS-file for future development

**Orchestration Patterns:**
- Use /party-mode for complex decisions
- Use /session save to checkpoint progress
- Use /knowledge to maintain context
- Regular /handoff-context for continuity`,
    examples: [
      'Build a SaaS analytics platform',
      'Create a marketplace with payments',
      'Develop a real-time collaboration tool',
    ],
  },
];

// ============================================================================
// Full Dictionary
// ============================================================================

export const commandDictionary: DictionaryItem[] = [
  ...planningAgents,
  ...planningCommands,
  ...planningSkills,
  ...developmentAgents,
  ...developmentCommands,
  ...developmentSkills,
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the type icon/prefix for an item
 */
export function getTypeIcon(type: DictionaryItem['type']): string {
  switch (type) {
    case 'command':
      return '/';
    case 'agent':
      return '@';
    case 'skill':
      return '*';
  }
}

/**
 * Filter dictionary by search term
 */
export function filterDictionary(
  items: DictionaryItem[],
  searchTerm: string,
  pillar?: Pillar
): DictionaryItem[] {
  let filtered = items;

  // Filter by pillar if specified
  if (pillar) {
    filtered = filtered.filter((item) => item.pillar === pillar);
  }

  // Filter by search term
  const term = searchTerm.toLowerCase().trim();
  if (term) {
    filtered = filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.displayName?.toLowerCase().includes(term)
    );
  }

  return filtered;
}

/**
 * Filter by type
 */
export function filterByType(
  items: DictionaryItem[],
  type: DictionaryItem['type']
): DictionaryItem[] {
  return items.filter((item) => item.type === type);
}

/**
 * Filter by pillar
 */
export function filterByPillar(items: DictionaryItem[], pillar: Pillar): DictionaryItem[] {
  return items.filter((item) => item.pillar === pillar);
}

/**
 * Group items by category
 */
export function groupByCategory(items: DictionaryItem[]): Record<string, DictionaryItem[]> {
  return items.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, DictionaryItem[]>
  );
}

/**
 * Group items by type
 */
export function groupByType(items: DictionaryItem[]): Record<string, DictionaryItem[]> {
  return items.reduce(
    (acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = [];
      }
      acc[item.type].push(item);
      return acc;
    },
    {} as Record<string, DictionaryItem[]>
  );
}

/**
 * Group items by pillar
 */
export function groupByPillar(items: DictionaryItem[]): Record<Pillar, DictionaryItem[]> {
  return {
    planning: items.filter((item) => item.pillar === 'planning'),
    development: items.filter((item) => item.pillar === 'development'),
  };
}

/**
 * Get all planning items
 */
export function getPlanningItems(): DictionaryItem[] {
  return filterByPillar(commandDictionary, 'planning');
}

/**
 * Get all development items
 */
export function getDevelopmentItems(): DictionaryItem[] {
  return filterByPillar(commandDictionary, 'development');
}

/**
 * Get item by name and type
 */
export function getItem(name: string, type?: DictionaryItem['type']): DictionaryItem | undefined {
  return commandDictionary.find(
    (item) => item.name === name && (type === undefined || item.type === type)
  );
}

/**
 * Search all items with pillar grouping for autocomplete
 */
export function searchForAutocomplete(
  query: string,
  options?: {
    type?: DictionaryItem['type'];
    maxPerPillar?: number;
  }
): { planning: DictionaryItem[]; development: DictionaryItem[] } {
  const { type, maxPerPillar = 4 } = options ?? {};

  let items = commandDictionary;
  if (type) {
    items = filterByType(items, type);
  }

  const filtered = filterDictionary(items, query);
  const grouped = groupByPillar(filtered);

  return {
    planning: grouped.planning.slice(0, maxPerPillar),
    development: grouped.development.slice(0, maxPerPillar),
  };
}

// ============================================================================
// Workflow Helper Functions
// ============================================================================

/**
 * Get all workflow definitions
 */
export function getWorkflows(): WorkflowDefinition[] {
  return workflowDefinitions;
}

/**
 * Get workflow by name
 */
export function getWorkflow(name: string): WorkflowDefinition | undefined {
  return workflowDefinitions.find((w) => w.name === name);
}

/**
 * Get workflow by ID
 */
export function getWorkflowById(id: string): WorkflowDefinition | undefined {
  return workflowDefinitions.find((w) => w.id === id);
}

/**
 * Filter workflows by complexity
 */
export function filterWorkflowsByComplexity(complexity: WorkflowComplexity): WorkflowDefinition[] {
  return workflowDefinitions.filter((w) => w.complexity === complexity);
}

/**
 * Search workflows by query
 */
export function searchWorkflows(query: string): WorkflowDefinition[] {
  const term = query.toLowerCase().trim();
  if (!term) return workflowDefinitions;

  return workflowDefinitions.filter(
    (w) =>
      w.name.toLowerCase().includes(term) ||
      w.displayName.toLowerCase().includes(term) ||
      w.description.toLowerCase().includes(term) ||
      w.examples.some((e) => e.toLowerCase().includes(term))
  );
}

/**
 * Group workflows by complexity for UI display
 */
export function groupWorkflowsByComplexity(): Record<WorkflowComplexity, WorkflowDefinition[]> {
  return {
    quick: workflowDefinitions.filter((w) => w.complexity === 'quick'),
    sprint: workflowDefinitions.filter((w) => w.complexity === 'sprint'),
    project: workflowDefinitions.filter((w) => w.complexity === 'project'),
    platform: workflowDefinitions.filter((w) => w.complexity === 'platform'),
  };
}

/**
 * Complexity labels for display
 */
export const COMPLEXITY_LABELS: Record<WorkflowComplexity, { label: string; description: string }> = {
  quick: { label: 'Quick', description: 'Minutes to complete' },
  sprint: { label: 'Sprint', description: 'Hours to complete' },
  project: { label: 'Project', description: 'Days to complete' },
  platform: { label: 'Platform', description: 'Weeks to complete' },
};

/**
 * Complexity colors for UI
 */
export const COMPLEXITY_COLORS: Record<WorkflowComplexity, string> = {
  quick: '#10b981', // Emerald
  sprint: '#0ea5e9', // Sky
  project: '#8b5cf6', // Violet
  platform: '#f97316', // Orange
};
