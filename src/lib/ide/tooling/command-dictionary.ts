/**
 * Command Dictionary - All commands, agents, and skills organized by pillar
 *
 * Two Pillars:
 * - Planning: Ideation, requirements, architecture, design (before code)
 * - Development: Writing, reviewing, testing, shipping code
 */

import type { Pillar, AgentColor } from './types';

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
