# Slash Commands, Agents & Skills Integration Plan

## Overview

This plan integrates a comprehensive command system into the local-ide with two major pillars: **Planning** and **Development**. The system enables developers to invoke specialized agents, commands, and skills directly from the chat interface through intuitive `/slash` commands and `@agent` mentions.

---

## Architecture: Two Pillars

### Planning
Everything related to ideation, requirements, architecture, and design before code is written.

**Planning Agents** (8 specialized personas):
| Agent | Name | Focus |
|-------|------|-------|
| `@analyst` | Mary | Discovery, research, brainstorming, competitive analysis |
| `@pm` | John | PRDs, requirements, user stories, acceptance criteria |
| `@architect` | Winston | System design, ADRs, technical standards, API design |
| `@ux-designer` | Sally | User journeys, wireframes, accessibility, design systems |
| `@scrum-master` | Bob | Sprint planning, retrospectives, team coordination |
| `@dev-lead` | Amelia | Implementation guidance, code review strategy, mentorship |
| `@test-architect` | Murat | Test strategy, quality gates, coverage requirements |
| `@quick-dev` | Barry | Rapid solo development for small changes, bug fixes |

**Planning Commands**:
| Command | Description |
|---------|-------------|
| `/brainstorm` | Explore options with 60+ ideation techniques |
| `/prd` | Generate a Product Requirements Document |
| `/architecture` | Create architecture decision records (ADRs) |
| `/user-stories` | Break down features into user stories |
| `/research` | Web research for APIs, docs, competitive intel |
| `/product-intel` | Competitive analysis and market research |
| `/knowledge` | Maintain living product understanding |
| `/party-mode` | Multi-agent collaboration on complex topics |

**Planning Skills**:
| Skill | Description |
|-------|-------------|
| `brainstorming` | 60+ ideation techniques (First Principles, SCAMPER, etc.) |
| `elicitation` | 50+ reasoning methods (Red Team, Devil's Advocate, etc.) |
| `research` | Web research with source synthesis |
| `synthesis` | M-of-N synthesis for hard decisions |

---

### Development
Everything related to writing, reviewing, testing, and shipping code.

**Development Agents** (24+ specialized reviewers):

| Category | Agents | Color |
|----------|--------|-------|
| **Security** | `@security-reviewer` | Red |
| **Correctness** | `@logic-reviewer`, `@error-handling-reviewer`, `@robustness-reviewer` | Orange |
| **Performance** | `@performance-reviewer` | Yellow |
| **Testing** | `@test-analyzer`, `@test-engineer`, `@test-runner` | Green |
| **Observability** | `@observability-reviewer`, `@site-keeper` | Cyan |
| **Style** | `@style-reviewer`, `@comment-analyzer` | Blue |
| **Design/UX** | `@ux-designer`, `@empathy-reviewer`, `@design-reviewer`, `@mobile-ux-reviewer`, `@seo-specialist` | Purple |
| **Architecture** | `@architecture-auditor`, `@simplifier`, `@debugger`, `@prompt-engineer`, `@git-writer`, `@library-advisor`, `@autonomous-developer` | Magenta |

**Development Commands**:
| Command | Description |
|---------|-------------|
| `/autotask` | Execute task autonomously from description to PR-ready |
| `/multi-review` | Multi-agent code review with diverse perspectives |
| `/verify-fix` | Verify a fix actually works before claiming success |
| `/address-pr-comments` | Triage and address PR bot comments |
| `/setup-environment` | Initialize dev environment for git worktree |
| `/cleanup-worktree` | Clean up worktree after PR merge |
| `/session` | Save and resume development sessions |
| `/handoff-context` | Generate context handoff for new session |
| `/troubleshoot` | Autonomous production error resolution |
| `/load-rules` | Load relevant coding rules for current task |

**Development Skills**:
| Skill | Description |
|-------|-------------|
| `systematic-debugging` | Find root cause before fixing |
| `playwright-browser` | Automate browsers, test UI, take screenshots |
| `skill-creator` | Create new reusable skill definitions |
| `youtube-transcript-analyzer` | Extract insights from video tutorials |

---

## Phase 1: Data Layer

### 1.1 Command Dictionary Structure

**File**: `src/lib/ide/tooling/command-dictionary.ts`

```typescript
// Two-pillar organization
type Pillar = 'planning' | 'development';

interface DictionaryItem {
  id: string;
  name: string;
  displayName?: string;      // e.g., "Mary" for @analyst
  description: string;
  type: 'command' | 'skill' | 'agent';
  pillar: Pillar;            // NEW: Which pillar this belongs to
  category: string;
  color?: string;
  usage?: string;
  argumentHint?: string;
  model?: 'opus' | 'sonnet' | 'haiku';  // Preferred model
}

// Categories by pillar
const planningCategories = {
  agents: ['Analysis', 'Product', 'Architecture', 'Design', 'Process'],
  commands: ['Ideation', 'Documentation', 'Research', 'Collaboration'],
  skills: ['Reasoning', 'Research', 'Synthesis'],
};

const developmentCategories = {
  agents: ['Security', 'Correctness', 'Performance', 'Testing', 'Observability', 'Style', 'Design/UX', 'Architecture'],
  commands: ['Autonomous', 'Review', 'Environment', 'Session'],
  skills: ['Debugging', 'Testing', 'Meta'],
};
```

### 1.2 Color System

```typescript
// Agent colors by category
const agentColors = {
  // Planning (cooler tones)
  analysis: '#8b5cf6',      // Violet
  product: '#6366f1',       // Indigo
  architecture: '#0ea5e9',  // Sky
  design: '#14b8a6',        // Teal
  process: '#10b981',       // Emerald

  // Development (warmer/action tones)
  security: '#ef4444',      // Red
  correctness: '#f97316',   // Orange
  performance: '#eab308',   // Yellow
  testing: '#22c55e',       // Green
  observability: '#06b6d4', // Cyan
  style: '#3b82f6',         // Blue
  'design-ux': '#a855f7',   // Purple
  'architecture-dev': '#ec4899', // Pink
};

// Pillar accent colors
const pillarColors = {
  planning: '#8b5cf6',      // Violet
  development: '#22c55e',   // Green
};
```

---

## Phase 2: UI Components

### 2.1 Command Dictionary Modal (Two-Tab Design)

**File**: `src/app/ide/components/modals/CommandDictionary.tsx`

```
┌──────────────────────────────────────────────────────────────┐
│ Command Dictionary                                       [×] │
├──────────────────────────────────────────────────────────────┤
│  [  Planning  ]  [  Development  ]                           │
│      ────────                                                │
├──────────────────────────────────────────────────────────────┤
│ 🔍 Search planning commands, agents, skills...               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ @ PLANNING AGENTS                                        [▼] │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ ┌─────┐                                                │   │
│ │ │  M  │  @analyst (Mary)                               │   │
│ │ └─────┘  Discovery, research, brainstorming            │   │
│ │                                                        │   │
│ │ ┌─────┐                                                │   │
│ │ │  J  │  @pm (John)                                    │   │
│ │ └─────┘  PRDs, requirements, user stories              │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ / PLANNING COMMANDS                                      [▼] │
│ ┌────────────────────────────────────────────────────────┐   │
│ │  /brainstorm                                           │   │
│ │  Explore options with 60+ ideation techniques          │   │
│ │                                                        │   │
│ │  /prd                                                  │   │
│ │  Generate a Product Requirements Document              │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Type / for commands, @ for agents                            │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Slash Autocomplete (Pillar-Aware)

**File**: `src/app/ide/components/chat/SlashAutocomplete.tsx`

Shows commands and skills from BOTH pillars, grouped:

```
┌─────────────────────────────────────────────────────────────┐
│ COMMANDS & SKILLS                      ↑↓ navigate, ↵ select│
├─────────────────────────────────────────────────────────────┤
│ PLANNING                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ /brainstorm              [COMMAND]                      │ │
│ │ Explore options with 60+ ideation techniques            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ DEVELOPMENT                                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ /autotask                [COMMAND]                      │ │
│ │ Execute task autonomously from description to PR        │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ /multi-review            [COMMAND]                      │ │
│ │ Multi-agent code review with diverse perspectives       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 At-Mention Autocomplete (Pillar-Aware)

**File**: `src/app/ide/components/chat/AtMentionAutocomplete.tsx`

Shows agents from BOTH pillars, with persona names for planning agents:

```
┌─────────────────────────────────────────────────────────────┐
│ @ MENTION AN AGENT                     ↑↓ navigate, ↵ select│
├─────────────────────────────────────────────────────────────┤
│ PLANNING                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [M]  @analyst (Mary)           ANALYSIS                 │ │
│ │      Discovery, research, brainstorming                 │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ [W]  @architect (Winston)      ARCHITECTURE             │ │
│ │      System design, ADRs, technical standards           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ DEVELOPMENT                                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [@]  @security-reviewer        SECURITY                 │ │
│ │      Injection flaws, authentication, OWASP             │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ [@]  @autonomous-developer     ARCHITECTURE             │ │
│ │      Complete tasks autonomously, deliver PR-ready      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 3: Workflow Integration

### 3.1 Development Tracks (Surfaced via Commands)

Three tracks that guide users through appropriate workflows:

| Track | Trigger | Use Case | Flow |
|-------|---------|----------|------|
| **Quick Flow** | `/quick-fix` | Bug fixes, small changes | Tech spec only → Implement → Review → PR |
| **Standard** | `/autotask` | Features, enhancements | PRD → Architecture → Implement → Multi-review → PR |
| **Enterprise** | `/enterprise-task` | Compliance-heavy | Extended analysis → PRD → ADR → Implement → Full audit → PR |

### 3.2 Session Management

```
/session save [name]     - Save current context and decisions
/session resume [name]   - Restore prior session state
/session list            - Show saved sessions
/handoff-context         - Generate handoff doc for team transitions
```

### 3.3 Party Mode (Multi-Agent Collaboration)

Trigger: `/party-mode [topic]`

Enables multiple planning agents to collaborate:
```
User: /party-mode Should we use GraphQL or REST for the new API?

[System spawns relevant agents]
@architect (Winston): From a system design perspective...
@pm (John): Considering our product requirements...
@dev-lead (Amelia): For implementation, I'd recommend...

[Synthesis provided at end]
```

---

## Phase 4: Agent Context & Execution

### 4.1 Planning Agent System Prompts

Each planning agent has a persona with specific expertise:

```typescript
const planningAgentPrompts = {
  analyst: {
    name: 'Mary',
    systemPrompt: `You are Mary, a senior Business Analyst. Your focus is:
      - Discovery and research
      - Brainstorming using 60+ ideation techniques
      - Competitive analysis
      - Stakeholder interviews
      - Problem definition

      Always ask clarifying questions before diving into solutions.
      Use structured frameworks (5 Whys, SWOT, Jobs-to-be-Done).`,
  },
  pm: {
    name: 'John',
    systemPrompt: `You are John, a Product Manager. Your focus is:
      - Writing PRDs with clear acceptance criteria
      - Breaking down features into user stories
      - Prioritization frameworks (RICE, MoSCoW)
      - Stakeholder alignment
      - Success metrics definition`,
  },
  architect: {
    name: 'Winston',
    systemPrompt: `You are Winston, a Solutions Architect. Your focus is:
      - System design and architecture
      - Writing ADRs (Architecture Decision Records)
      - API design and contracts
      - Technical standards and patterns
      - Scalability and performance considerations`,
  },
  // ... other agents
};
```

### 4.2 Development Agent System Prompts

Development agents are more focused on specific review perspectives:

```typescript
const developmentAgentPrompts = {
  'security-reviewer': {
    systemPrompt: `You are a Security Reviewer. Analyze code for:
      - Injection vulnerabilities (SQL, XSS, Command)
      - Authentication/authorization flaws
      - OWASP Top 10 vulnerabilities
      - Secrets exposure
      - Input validation gaps

      Be specific about line numbers and provide fixes.`,
    color: 'red',
  },
  'logic-reviewer': {
    systemPrompt: `You are a Logic Reviewer. Analyze code for:
      - Logic bugs and edge cases
      - Off-by-one errors
      - Race conditions
      - Null/undefined handling
      - State management issues

      Trace through code paths methodically.`,
    color: 'orange',
  },
  // ... other agents
};
```

### 4.3 Command Execution Flow

```typescript
// When user sends: "/autotask fix the login bug"
async function executeCommand(message: string) {
  const { command, args } = parseCommand(message);

  // Get command definition
  const commandDef = getCommand(command);

  // Build enriched context
  const context = {
    command: commandDef.name,
    description: commandDef.description,
    pillar: commandDef.pillar,
    instructions: commandDef.content,
    userArgs: args,
  };

  // For /autotask, this triggers the autonomous pipeline:
  // 1. Analyze complexity
  // 2. Explore codebase
  // 3. Create implementation outline
  // 4. Execute with @autonomous-developer
  // 5. Run @test-engineer
  // 6. Run /multi-review
  // 7. Create PR

  return sendToBackend(context);
}
```

---

## Phase 5: Visual Design

### 5.1 Pillar Tab Styling

```css
/* Tab bar */
.dictionary-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dictionary-tab {
  flex: 1;
  padding: 12px 20px;
  font-weight: 600;
  color: var(--color-text-muted);
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.dictionary-tab.active[data-pillar="planning"] {
  color: #8b5cf6;
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.05);
}

.dictionary-tab.active[data-pillar="development"] {
  color: #22c55e;
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.05);
}
```

### 5.2 Planning Agent Avatars

Planning agents get personalized avatars with initials:

```css
.planning-agent-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: white;
}

/* Mary (Analyst) - Violet */
.planning-agent-avatar[data-agent="analyst"] {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
}

/* John (PM) - Indigo */
.planning-agent-avatar[data-agent="pm"] {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
}

/* Winston (Architect) - Sky */
.planning-agent-avatar[data-agent="architect"] {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
}
```

### 5.3 Pillar Section Headers in Autocomplete

```css
.autocomplete-pillar-header {
  padding: 8px 12px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.autocomplete-pillar-header[data-pillar="planning"] {
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.08);
  border-left: 2px solid #8b5cf6;
}

.autocomplete-pillar-header[data-pillar="development"] {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.08);
  border-left: 2px solid #22c55e;
}
```

---

## Phase 6: State Management

### 6.1 IDE Store Updates

```typescript
// src/app/ide/stores/ideStore.ts

interface IDEState {
  // Command Dictionary
  commandDictionaryOpen: boolean;
  commandDictionaryPillar: 'planning' | 'development';
  setCommandDictionaryOpen: (open: boolean) => void;
  setCommandDictionaryPillar: (pillar: 'planning' | 'development') => void;

  // Active Context
  activeAgents: string[];           // Can have multiple active
  activeCommand: string | null;
  activePillar: 'planning' | 'development' | null;

  // Session
  currentSession: string | null;
  savedSessions: SessionInfo[];

  // Party Mode
  partyModeActive: boolean;
  partyModeAgents: string[];
}
```

### 6.2 Tooling Context Updates

```typescript
// src/app/ide/contexts/ToolingContext.tsx

interface ToolingContextType {
  // Existing
  searchCommands: (query: string, pillar?: Pillar) => Command[];
  searchAgents: (query: string, pillar?: Pillar) => Agent[];
  searchSkills: (query: string, pillar?: Pillar) => Skill[];

  // NEW: Pillar-aware
  getPlanningAgents: () => Agent[];
  getDevelopmentAgents: () => Agent[];
  getPlanningCommands: () => Command[];
  getDevelopmentCommands: () => Command[];

  // NEW: Agent persona
  getAgentPersona: (name: string) => AgentPersona | undefined;
}
```

---

## Implementation Sprints

### Sprint 1: Data Layer & Types (Foundation)
1. Create `command-dictionary.ts` with all items organized by pillar
2. Add planning agents with personas (Mary, John, Winston, etc.)
3. Add development agents (24 reviewers)
4. Update types for pillar support
5. Add helper functions (filterByPillar, searchAll, etc.)

### Sprint 2: Autocomplete Components
1. Build `SlashAutocomplete.tsx` with pillar grouping
2. Build `AtMentionAutocomplete.tsx` with persona display
3. Add CSS styles with pillar colors
4. Integrate with `ChatInput.tsx`

### Sprint 3: Command Dictionary Modal
1. Build two-tab modal with Planning/Development
2. Add search that filters within active tab
3. Add keyboard shortcuts (Cmd+/)
4. Mobile-responsive bottom sheet

### Sprint 4: Agent Execution
1. Implement planning agent system prompts
2. Implement development agent system prompts
3. Add agent context injection to chat
4. Build `/party-mode` multi-agent support

### Sprint 5: Session & Workflow
1. Implement `/session save/resume/list`
2. Implement `/handoff-context`
3. Add development track routing (quick/standard/enterprise)
4. Add workflow state persistence

### Sprint 6: Polish & Testing
1. Keyboard navigation testing
2. Mobile testing
3. Accessibility audit
4. Performance optimization
5. Documentation

---

## File Structure

```
src/
├── app/ide/
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatInput.tsx              # Updated
│   │   │   ├── SlashAutocomplete.tsx      # NEW
│   │   │   ├── AtMentionAutocomplete.tsx  # NEW
│   │   │   └── MessageBadges.tsx          # NEW
│   │   ├── modals/
│   │   │   └── CommandDictionary.tsx      # NEW (two-tab)
│   │   └── ...
│   ├── styles/
│   │   └── command-dictionary.css         # NEW
│   └── stores/
│       └── ideStore.ts                    # Updated
└── lib/ide/
    └── tooling/
        ├── types.ts                       # Updated
        ├── command-dictionary.ts          # NEW (all items)
        ├── planning-agents.ts             # NEW (personas)
        ├── development-agents.ts          # NEW (reviewers)
        └── index.ts                       # Updated exports
```

---

## Complete Item Inventory

### Planning Pillar (Total: ~20 items)

**Agents (8)**:
- `@analyst` (Mary), `@pm` (John), `@architect` (Winston), `@ux-designer` (Sally)
- `@scrum-master` (Bob), `@dev-lead` (Amelia), `@test-architect` (Murat), `@quick-dev` (Barry)

**Commands (8)**:
- `/brainstorm`, `/prd`, `/architecture`, `/user-stories`
- `/research`, `/product-intel`, `/knowledge`, `/party-mode`

**Skills (4)**:
- `brainstorming`, `elicitation`, `research`, `synthesis`

### Development Pillar (Total: ~45 items)

**Agents (24)**:
- Security: `@security-reviewer`
- Correctness: `@logic-reviewer`, `@error-handling-reviewer`, `@robustness-reviewer`
- Performance: `@performance-reviewer`
- Testing: `@test-analyzer`, `@test-engineer`, `@test-runner`
- Observability: `@observability-reviewer`, `@site-keeper`
- Style: `@style-reviewer`, `@comment-analyzer`
- Design/UX: `@ux-reviewer`, `@empathy-reviewer`, `@design-reviewer`, `@mobile-ux-reviewer`, `@seo-specialist`
- Architecture: `@architecture-auditor`, `@simplifier`, `@debugger`, `@prompt-engineer`, `@git-writer`, `@library-advisor`, `@autonomous-developer`

**Commands (14)**:
- `/autotask`, `/multi-review`, `/verify-fix`, `/address-pr-comments`
- `/setup-environment`, `/cleanup-worktree`, `/session`, `/handoff-context`
- `/troubleshoot`, `/load-rules`, `/quick-fix`, `/enterprise-task`
- `/create-prompt`, `/generate-AGENTS-file`

**Skills (4)**:
- `systematic-debugging`, `playwright-browser`, `skill-creator`, `youtube-transcript-analyzer`

---

## Success Metrics

1. **Discoverability**: Users find commands in <3 seconds
2. **Pillar Clarity**: Users understand Planning vs Development distinction
3. **Agent Adoption**: Planning agents used for 50%+ of new features
4. **Workflow Completion**: 80%+ of started workflows reach PR stage
5. **Session Continuity**: Users successfully resume 90%+ of saved sessions
