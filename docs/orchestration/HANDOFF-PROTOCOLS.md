# Handoff Protocols

> **Specifications for Agent-to-Agent Communication**
>
> This document defines exactly how agents pass work to each other, preserving context and ensuring smooth transitions.

---

## CRITICAL: Mandatory Clarification Before Any Handoff

**Before ANY workflow begins and at each major handoff:**

### The Clarification Requirement

Every agent MUST follow this protocol:

```
┌─────────────────────────────────────────────────────────────────────┐
│                  MANDATORY CLARIFICATION PROTOCOL                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. ENTER PLANNING MODE                                             │
│     ├─ Pause before taking action                                  │
│     └─ Analyze the full scope of the task                          │
│                                                                     │
│  2. ASK QUALIFYING QUESTIONS UNTIL 100% CERTAIN                     │
│     ├─ Do NOT make assumptions                                      │
│     ├─ Ask about: requirements, edge cases, integration, UX        │
│     ├─ Continue asking until you have complete clarity             │
│     └─ "Please ask me qualifying questions until you are 100%      │
│         certain you understand what I am requesting"               │
│                                                                     │
│  3. CONFIRM UNDERSTANDING                                           │
│     ├─ Summarize your understanding back to the user/previous agent│
│     ├─ List all assumptions explicitly                             │
│     └─ Wait for confirmation before proceeding                     │
│                                                                     │
│  4. DOCUMENT IN HANDOFF                                             │
│     └─ Include clarifications received in handoff packet           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## The Handoff Packet

Every agent transition uses a standardized handoff packet. This ensures:
- No context loss between agents
- Clear accountability
- Auditable decision trail
- Resumable work streams

### Packet Schema

```yaml
handoff:
  # Metadata
  id: "uuid-v4"
  timestamp: "ISO-8601"
  workflow_id: "parent-workflow-uuid"

  # Participants
  from:
    agent: "Agent Name"
    persona: "Persona Name (if any)"
    phase_completed: "Phase name"

  to:
    agent: "Target Agent"
    expected_action: "What they should do"

  # Task Context
  task:
    id: "task-identifier"
    name: "Human-readable task name"
    type: "feature|bugfix|refactor|review|architecture"
    complexity: "quick|balanced|deep"
    priority: "low|medium|high|critical"

  # Work Completed
  deliverables:
    - path: "/path/to/file"
      type: "spec|code|test|doc"
      status: "complete|partial|draft"
      description: "What this deliverable contains"

  # Context
  context:
    clarifications_received:
      - question: "What clarifying question was asked"
        answer: "User's response"
      - question: "Another clarifying question"
        answer: "User's response"

    decisions:
      - decision: "What was decided"
        rationale: "Why"
        alternatives_considered: ["Option A", "Option B"]

    constraints:
      - "Constraint 1"
      - "Constraint 2"

    assumptions:
      - "Assumption 1 (confirmed by user)"

  # State
  state:
    blockers: []
    open_questions: []
    risks: []

  # Quality
  quality_gates:
    passed:
      - "Gate 1"
      - "Gate 2"
    pending:
      - "Gate 3"

  # Instructions
  next_steps:
    - "Step 1 for receiving agent"
    - "Step 2 for receiving agent"

  # Files
  files:
    modified:
      - "/path/to/file1"
      - "/path/to/file2"
    created:
      - "/path/to/new-file"
    key_files:
      - path: "/path/to/important"
        reason: "Why this file matters"
```

---

## Handoff Types

### 1. Sequential Handoff

One agent completes, another begins.

```
Agent A ───[handoff]───► Agent B
```

**Example: PM → Architect**

```yaml
handoff:
  id: "hnd-001"
  timestamp: "2024-01-15T10:30:00Z"

  from:
    agent: "Product Manager"
    persona: "John"
    phase_completed: "specification"

  to:
    agent: "Architect"
    expected_action: "Create technical design"

  task:
    id: "user-notifications"
    name: "User Notifications System"
    type: "feature"
    complexity: "deep"

  deliverables:
    - path: "/docs/features/notifications.md"
      type: "spec"
      status: "complete"
      description: "Full PRD with user stories and acceptance criteria"

  context:
    decisions:
      - decision: "Real-time updates required"
        rationale: "User research shows 80% expect instant notifications"
        alternatives_considered: ["Polling", "Email-only"]

      - decision: "Support mobile push notifications"
        rationale: "60% of users access via mobile"

    constraints:
      - "Must work offline (queue notifications)"
      - "Must respect user preferences"
      - "Max 100ms latency for real-time"

  next_steps:
    - "Design WebSocket architecture for real-time"
    - "Define notification data model"
    - "Specify API endpoints for preferences"
    - "Plan push notification integration"

  files:
    created:
      - "/docs/features/notifications.md"
```

---

### 2. Parallel Handoff

Multiple agents receive work simultaneously.

```
                ┌───► Agent B
Agent A ───────┼───► Agent C
                └───► Agent D
```

**Example: Developer → Multi-Review**

```yaml
handoff:
  id: "hnd-002"
  timestamp: "2024-01-15T14:00:00Z"

  from:
    agent: "Autonomous Developer"
    phase_completed: "implementation"

  to:
    agents:
      - agent: "Security Reviewer"
        expected_action: "Security audit"
        priority: "high"

      - agent: "Performance Reviewer"
        expected_action: "Performance analysis"
        priority: "medium"

      - agent: "Logic Reviewer"
        expected_action: "Correctness verification"
        priority: "medium"

  task:
    id: "user-notifications"
    type: "feature"
    complexity: "deep"

  deliverables:
    - path: "src/components/NotificationCenter/"
      type: "code"
      status: "complete"

    - path: "src/app/api/notifications/"
      type: "code"
      status: "complete"

    - path: "src/lib/websocket/"
      type: "code"
      status: "complete"

  context:
    security_relevant:
      - "WebSocket connections require auth"
      - "Notification content may contain sensitive data"
      - "User preferences stored in database"

    performance_relevant:
      - "Real-time WebSocket connections"
      - "Large notification lists possible"
      - "Mobile network considerations"

  files:
    modified:
      - "src/components/NotificationCenter/index.tsx"
      - "src/components/NotificationCenter/NotificationItem.tsx"
      - "src/app/api/notifications/route.ts"
      - "src/app/api/notifications/preferences/route.ts"
      - "src/lib/websocket/client.ts"
      - "src/lib/websocket/handlers.ts"
```

---

### 3. Conditional Handoff

Next agent depends on outcome.

```
                    ┌───► Agent B (if success)
Agent A ───[check]──┤
                    └───► Agent C (if failure)
```

**Example: Testing → (UI Refinement or Developer)**

```yaml
handoff:
  id: "hnd-003"
  timestamp: "2024-01-15T15:30:00Z"

  from:
    agent: "Test Engineer"
    persona: "Tessa"
    phase_completed: "testing"

  condition:
    check: "all_tests_passing"
    result: true  # or false

  to:
    if_success:
      agent: "UI Refinement Agent"
      expected_action: "Visual polish"

    if_failure:
      agent: "Autonomous Developer"
      expected_action: "Fix failing tests"
      include:
        - failing_tests
        - error_messages

  task:
    id: "user-notifications"

  # If success
  deliverables:
    - path: "src/components/NotificationCenter/__tests__/"
      type: "test"
      status: "complete"
      description: "87% coverage, all passing"

  quality_gates:
    passed:
      - "Coverage > 80%"
      - "All unit tests passing"
      - "Integration tests passing"
      - "Accessibility tests passing"

  # If failure (would include instead)
  # failures:
  #   - test: "NotificationItem.test.tsx"
  #     error: "Expected 'unread' class but found 'read'"
  #     suggestion: "Check notification state toggle logic"
```

---

### 4. Escalation Handoff

Issue requires higher-level intervention.

```
Agent A ───[escalate]───► Senior Agent
```

**Example: Security Reviewer → Architect (Critical Finding)**

```yaml
handoff:
  id: "hnd-004"
  timestamp: "2024-01-15T16:00:00Z"
  type: "escalation"

  from:
    agent: "Security Reviewer"
    phase_completed: "security_audit"

  to:
    agent: "Architect"
    expected_action: "Redesign authentication flow"
    urgency: "high"

  escalation:
    reason: "Critical security vulnerability found"
    severity: "high"
    requires_redesign: true

  findings:
    - issue: "WebSocket connections not re-authenticating on reconnect"
      severity: "high"
      confidence: 95
      impact: "Session hijacking possible"
      recommendation: "Implement token refresh on reconnect"

    - issue: "Notification content not sanitized"
      severity: "medium"
      confidence: 88
      impact: "XSS via notification content"
      recommendation: "Sanitize all notification text"

  context:
    blocked_until: "Security issues resolved"
    cannot_proceed_to: "UI Refinement"

  next_steps:
    - "Architect: Review WebSocket auth design"
    - "Architect: Define secure reconnection flow"
    - "Developer: Implement fixes"
    - "Security: Re-review"
```

---

### 5. Return Handoff

Work returns to previous agent after intervention.

```
Agent A ───► Agent B ───► Agent A (resume)
```

**Example: Architect → Developer → Architect (Clarification)**

```yaml
handoff:
  id: "hnd-005"
  timestamp: "2024-01-15T11:00:00Z"
  type: "clarification_request"

  from:
    agent: "Autonomous Developer"
    phase: "implementation"
    paused_at: "API integration"

  to:
    agent: "Architect"
    expected_action: "Clarify API contract"

  question:
    topic: "Pagination strategy"
    detail: "Tech spec doesn't specify pagination for large notification lists"
    options:
      - "Cursor-based pagination (better for real-time)"
      - "Offset-based pagination (simpler)"
    recommendation: "Cursor-based for consistency with WebSocket updates"

  blocked_work:
    file: "src/app/api/notifications/route.ts"
    function: "GET handler"
    waiting_for: "Pagination specification"

  resume_instructions:
    after_clarification:
      return_to: "Autonomous Developer"
      continue_from: "API integration"
      include: "Updated pagination specification"
```

---

## Handoff Triggers

### Automatic Triggers

| Condition | From | To | Type |
|-----------|------|-----|------|
| Spec complete | PM | Architect | Sequential |
| Tech design complete | Architect | Developer | Sequential |
| Implementation complete | Developer | Testing | Sequential |
| Tests passing | Testing | UI Refinement | Conditional |
| Tests failing | Testing | Developer | Conditional |
| Security issue found | Security | Architect | Escalation |
| Polish complete | UI Refinement | Git Writer | Sequential |
| All reviews done | Multiple | Synthesis | Parallel |

### Manual Triggers

```markdown
## REQUEST HANDOFF: Developer → Architect

I need clarification on [specific issue].

**Context**: [What I was working on]
**Question**: [Specific question]
**Options I see**: [My analysis]
**Recommendation**: [My suggestion]
**Blocked until**: [What I need to continue]
```

---

## Context Preservation

### Session Files

Every handoff persists context to disk:

```
~/.claude-sessions/{workflow-id}/
├── metadata.json          # Workflow info
├── handoffs/
│   ├── hnd-001.yaml      # PM → Architect
│   ├── hnd-002.yaml      # Developer → Reviews
│   └── hnd-003.yaml      # Testing → Polish
├── decisions.md           # All decisions made
├── blockers.md           # Current blockers
└── progress.json         # Phase completion status
```

### Resuming After Interruption

```yaml
resume:
  workflow_id: "wf-notifications-001"
  last_handoff: "hnd-003"
  resume_from:
    agent: "UI Refinement Agent"
    phase: "polish"
    context_file: "~/.claude-sessions/wf-notifications-001/handoffs/hnd-003.yaml"

  completed_phases:
    - "specification"
    - "architecture"
    - "implementation"
    - "testing"

  in_progress: "polish"

  pending_phases:
    - "final_review"
    - "commit"
```

---

## Handoff Commands

### Creating Handoffs

```markdown
/handoff-context
```
Generates a complete handoff packet for the current state.

### Viewing Handoffs

```markdown
/session list
```
Shows all workflows and their handoff history.

### Resuming from Handoff

```markdown
/session resume [workflow-id]
```
Loads context from last handoff and continues.

---

## Quality Verification

### Pre-Handoff Checklist

Before any handoff, verify:

```markdown
## Handoff Readiness Check

### Deliverables
- [ ] All promised outputs exist
- [ ] Files are in expected locations
- [ ] Status accurately reflects completion

### Context
- [ ] Key decisions documented
- [ ] Rationale included
- [ ] Alternatives noted

### Quality
- [ ] Required gates passed
- [ ] No critical blockers
- [ ] Next steps clear

### Files
- [ ] Modified files listed
- [ ] Key files highlighted
- [ ] No uncommitted work (if applicable)
```

### Post-Handoff Verification

Receiving agent confirms:

```markdown
## Handoff Receipt Confirmation

- [ ] Handoff packet received
- [ ] Context understood
- [ ] Deliverables accessible
- [ ] Next steps clear
- [ ] Questions addressed (or raised)

Status: Ready to proceed / Need clarification
```

---

## Error Handling

### Missing Context

```yaml
error:
  type: "incomplete_handoff"
  from: "Product Manager"
  to: "Architect"
  missing:
    - "User stories for notification preferences"
    - "Acceptance criteria for offline mode"

  resolution:
    action: "Request clarification"
    return_to: "Product Manager"
    request: |
      Need clarification on:
      1. How should notification preferences UI work?
      2. What happens when user is offline?
```

### Failed Quality Gate

```yaml
error:
  type: "gate_failure"
  from: "Developer"
  to: "Testing"
  gate: "TypeScript compilation"
  failure: "3 type errors in NotificationItem.tsx"

  resolution:
    action: "Fix before handoff"
    blocked: true
    fixes_required:
      - "line 45: Property 'unread' does not exist"
      - "line 67: Argument of type 'string' is not assignable"
      - "line 89: Missing return type"
```

### Conflicting Instructions

```yaml
error:
  type: "conflict"
  agents: ["Product Manager", "Architect"]
  issue: "Conflicting requirements"
  detail:
    pm_says: "Notifications must be real-time"
    architect_says: "Real-time not feasible within latency constraints"

  resolution:
    escalate_to: "User"
    present_options:
      - "Reduce latency requirement from 100ms to 500ms"
      - "Use hybrid: real-time for priority, polling for others"
      - "Accept WebSocket infrastructure cost"
```

---

## Handoff Examples

### Example 1: Feature Start

```yaml
# User → Analyst

handoff:
  from:
    agent: "User"
  to:
    agent: "Analyst"
    expected_action: "Research notification patterns"

  task:
    name: "User Notifications System"
    description: "Build a real-time notification system"
    type: "feature"

  context:
    user_requirements:
      - "Real-time updates"
      - "Mobile push support"
      - "User preferences"
    constraints:
      - "Use existing Supabase backend"

  next_steps:
    - "Research notification patterns in similar apps"
    - "Evaluate real-time technologies"
    - "Assess mobile push options"
```

### Example 2: Implementation Complete

```yaml
# Developer → Multi-Review

handoff:
  from:
    agent: "Autonomous Developer"
    phase_completed: "all implementation phases"

  to:
    agents: ["Security", "Performance", "Logic"]
    mode: "parallel"

  deliverables:
    - path: "src/components/NotificationCenter/"
      files: 8
      coverage: "92%"
    - path: "src/app/api/notifications/"
      files: 4
      coverage: "88%"

  context:
    security_notes:
      - "WebSocket uses JWT authentication"
      - "All inputs validated with Zod"
    performance_notes:
      - "Virtualized list for 1000+ notifications"
      - "Debounced real-time updates"

  quality_gates:
    passed:
      - "TypeScript clean"
      - "ESLint clean"
      - "Design tokens validated"
      - "Unit tests passing"
      - "Coverage > 80%"
```

### Example 3: Ready for Commit

```yaml
# UI Refinement → Git Writer

handoff:
  from:
    agent: "UI Refinement Agent"
    phase_completed: "polish"

  to:
    agent: "Git Writer"
    expected_action: "Create PR"

  task:
    id: "user-notifications"
    status: "ready for review"

  deliverables:
    all_complete: true

  quality_gates:
    all_passed: true
    summary:
      - "Specification: Complete"
      - "Architecture: Approved"
      - "Implementation: Complete"
      - "Tests: Passing (89% coverage)"
      - "Security: Approved"
      - "Performance: Lighthouse 97"
      - "Polish: Complete"

  pr_details:
    title: "feat(notifications): add real-time notification system"
    description: |
      ## Summary
      - Real-time notification center with WebSocket updates
      - User preference management
      - Mobile-responsive design

      ## Test Plan
      - [x] Unit tests (89% coverage)
      - [x] Integration tests
      - [x] E2E tests
      - [x] Accessibility audit

    files_changed: 24
    lines_added: 1847
    lines_removed: 12
```

---

*This handoff protocol ensures seamless agent-to-agent communication with full context preservation. Every transition is documented, verifiable, and resumable.*
