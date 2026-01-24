# Workflow Routes

> **Complete Routing Logic for Every Development Scenario**
>
> This document defines how any request is routed through the optimal agent sequence based on complexity, task type, and context.

---

## Route Detection Engine

### Step 1: Complexity Classification

The orchestrator first determines task complexity:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     COMPLEXITY CLASSIFIER                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  INPUT SIGNALS:                                                     │
│  ├─ File count: How many files will be touched?                    │
│  ├─ Scope: Single component vs system-wide?                        │
│  ├─ Dependencies: External integrations involved?                  │
│  ├─ Risk: Security/data implications?                              │
│  ├─ Novelty: New patterns or existing patterns?                    │
│  └─ User indication: "quick", "simple", "complex", "architecture"  │
│                                                                     │
│  CLASSIFICATION RULES:                                              │
│                                                                     │
│  QUICK when:                                                        │
│  ├─ Single file change                                              │
│  ├─ Bug fix with known location                                     │
│  ├─ Text/content updates                                            │
│  ├─ Style adjustments                                               │
│  └─ User says "quick" or "simple"                                  │
│                                                                     │
│  BALANCED when:                                                     │
│  ├─ 2-5 files involved                                              │
│  ├─ New component with API                                          │
│  ├─ Feature enhancement                                             │
│  ├─ Integration with existing system                                │
│  └─ Standard development work                                       │
│                                                                     │
│  DEEP when:                                                         │
│  ├─ 5+ files or new subsystem                                       │
│  ├─ Architectural changes                                           │
│  ├─ Security-critical features                                      │
│  ├─ Database schema changes                                         │
│  ├─ External API integrations                                       │
│  └─ User says "architecture" or "design"                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 2: Task Type Detection

After complexity, determine the task type:

```
┌─────────────────────────────────────────────────────────────────────┐
│                       TASK TYPE DETECTOR                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  FEATURE DEVELOPMENT                                                │
│  Triggers: "build", "create", "implement", "add", "new feature"    │
│  → Route: Feature Workflow                                          │
│                                                                     │
│  BUG FIX                                                            │
│  Triggers: "fix", "bug", "broken", "doesn't work", "error"         │
│  → Route: Bug Fix Workflow                                          │
│                                                                     │
│  REFACTOR                                                           │
│  Triggers: "refactor", "clean up", "simplify", "reorganize"        │
│  → Route: Refactor Workflow                                         │
│                                                                     │
│  CODE REVIEW                                                        │
│  Triggers: "review", "check", "audit", "look at"                   │
│  → Route: Review Workflow                                           │
│                                                                     │
│  ARCHITECTURE                                                       │
│  Triggers: "design", "architect", "structure", "how should we"     │
│  → Route: Architecture Workflow                                     │
│                                                                     │
│  DOCUMENTATION                                                      │
│  Triggers: "document", "explain", "write docs", "readme"           │
│  → Route: Documentation Workflow                                    │
│                                                                     │
│  TESTING                                                            │
│  Triggers: "test", "coverage", "write tests"                       │
│  → Route: Testing Workflow                                          │
│                                                                     │
│  DEPLOYMENT                                                         │
│  Triggers: "deploy", "release", "ship", "publish"                  │
│  → Route: Deployment Workflow                                       │
│                                                                     │
│  INVESTIGATION                                                      │
│  Triggers: "investigate", "why", "understand", "how does"          │
│  → Route: Investigation Workflow                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Complete Workflow Routes

### Route: Feature Development

**Complexity Variants:**

#### QUICK Feature (Single Component)

```yaml
trigger: "Add a loading state to the Button component"
complexity: quick
duration: 10-30 minutes

sequence:
  1. developer:
      action: "Implement loading state"
      phase: [scaffold, ui, logic]

  2. testing:
      action: "Add basic test"
      scope: unit

  3. git-writer:
      action: "Commit changes"
      message: "feat(ui): add loading state to Button"
```

#### BALANCED Feature (Component + API)

```yaml
trigger: "Build a user profile page with settings"
complexity: balanced
duration: 30 min - 2 hours

sequence:
  1. pm:
      action: "Create quick spec"
      output: "/docs/features/user-profile.md"

  2. architect:
      action: "Define data model and API"
      output: "Technical approach"

  3. developer:
      action: "Full implementation"
      phases: [scaffold, ui, logic, animation, integration]

  4. testing:
      action: "Comprehensive tests"
      scope: [unit, integration]

  5. parallel_review:
      agents: [security, performance]

  6. ui-refinement:
      action: "Polish"
      focus: full-audit

  7. git-writer:
      action: "Create PR"
```

#### DEEP Feature (New Subsystem)

```yaml
trigger: "Build a real-time notifications system"
complexity: deep
duration: 2+ hours

sequence:
  1. analyst:
      action: "Research notification patterns"
      output: "/docs/research/notifications-discovery.md"

  2. pm:
      action: "Full PRD"
      output: "/docs/features/notifications.md"
      includes: [user_stories, acceptance_criteria, phases]

  3. architect:
      action: "System design"
      output: "/docs/architecture/notifications-tech.md"
      includes: [data_models, api_contracts, realtime_design]

  4. ux:
      action: "Interface design"
      output: "/docs/ux/notifications-ux.md"

  5. scrum-master:
      action: "Break into stories"
      output: "Sprint plan"

  6. developer:
      action: "Phased implementation"
      phases: [scaffold, ui, logic, animation, integration, test, polish]
      iterations: "Per story"

  7. testing:
      action: "Full test suite"
      scope: [unit, integration, e2e, accessibility]

  8. parallel_review:
      agents: [security, performance, auditor]
      priority: security  # Real-time systems need extra scrutiny

  9. ui-refinement:
      action: "Final polish"
      focus: full-audit

  10. git-writer:
       action: "Create PR with full documentation"
```

---

### Route: Bug Fix

```yaml
trigger: "The submit button isn't working on the contact form"
complexity: auto-detect

sequence:
  1. debugger:
      action: "Diagnose issue"
      output:
        - root_cause
        - affected_files
        - fix_approach

  2. developer:
      action: "Implement fix"
      include_regression_test: true

  3. testing:
      action: "Verify fix"
      command: "/verify-fix"

  4. git-writer:
      action: "Commit fix"
      message: "fix(contact): resolve submit button handler"

escalation:
  if_unclear:
    route_to: analyst
    action: "Investigate root cause"
  if_architectural:
    route_to: architect
    action: "Design proper solution"
```

---

### Route: Refactor

```yaml
trigger: "Clean up the authentication module"
complexity: balanced

sequence:
  1. auditor:
      action: "Analyze current structure"
      output:
        - code_smells
        - coupling_issues
        - improvement_opportunities

  2. simplifier:
      action: "Plan refactor"
      principles:
        - "Don't change behavior"
        - "Incremental changes"
        - "Keep tests passing"

  3. developer:
      action: "Execute refactor"
      constraints:
        - "Atomic commits"
        - "Tests must pass after each commit"

  4. testing:
      action: "Verify no regression"

  5. parallel_review:
      agents: [auditor, performance]

  6. git-writer:
      action: "Commit with clear history"
```

---

### Route: Code Review

```yaml
trigger: "Review PR #42"
complexity: auto-detect from PR size

sequence:
  parallel_dispatch:
    always:
      - consistency_reviewer:
          focus: "Pattern compliance"
      - logic_reviewer:
          focus: "Correctness"

    if_security_relevant:
      - security_reviewer:
          threshold: 80%

    if_performance_relevant:
      - performance_reviewer:
          targets: lighthouse_95+

    if_architectural:
      - auditor:
          focus: "Coupling and patterns"

  synthesis:
    action: "Combine findings"
    output:
      - prioritized_issues
      - required_changes
      - suggested_improvements
      - approval_status
```

---

### Route: Architecture Design

```yaml
trigger: "Design the database schema for the new feature"
complexity: deep

sequence:
  1. analyst:
      action: "Research patterns"
      output: "Technology options and tradeoffs"

  2. pm:
      action: "Clarify requirements"
      output: "Constraints and non-functionals"

  3. architect:
      action: "Create design"
      output:
        - system_diagram
        - data_models
        - api_contracts
        - technology_decisions
        - ADRs

  4. auditor:
      action: "Review design"
      focus:
        - "Scalability"
        - "Maintainability"
        - "Security"

  5. security:
      action: "Security review"
      if_applicable: true

  6. documentation:
      action: "Document decisions"
      output: "/docs/architecture/{name}.md"
```

---

### Route: Testing

```yaml
trigger: "Add tests for the checkout flow"
complexity: balanced

sequence:
  1. testing:
      action: "Analyze coverage gaps"
      output: "Test plan"

  2. testing:
      action: "Write tests"
      scope:
        - unit: "Component behavior"
        - integration: "API interactions"
        - e2e: "User flows"
        - accessibility: "WCAG compliance"

  3. developer:
      action: "Fix any issues found"
      if: tests_reveal_bugs

  4. git-writer:
      action: "Commit tests"
      message: "test(checkout): add comprehensive test coverage"
```

---

### Route: Documentation

```yaml
trigger: "Document the API endpoints"
complexity: balanced

sequence:
  1. analyst:
      action: "Gather information"
      sources:
        - code_comments
        - existing_docs
        - api_routes

  2. developer:
      action: "Generate API documentation"
      format: "OpenAPI/Swagger"

  3. git-writer:
      action: "Commit documentation"
```

---

### Route: Investigation

```yaml
trigger: "Why is the dashboard loading slowly?"
complexity: quick

sequence:
  1. debugger:
      action: "Profile performance"
      tools:
        - lighthouse
        - browser_devtools
        - bundle_analyzer

  2. output:
      format: "Investigation report"
      includes:
        - findings
        - root_causes
        - recommendations

  3. optional_handoff:
      if_action_needed:
        route_to: [developer, performance]
```

---

## Route Selection Decision Tree

```
                         START
                           │
                           ▼
              ┌───────────────────────┐
              │  What is the task?    │
              └───────────┬───────────┘
                          │
        ┌────────┬────────┼────────┬────────┐
        ▼        ▼        ▼        ▼        ▼
     ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌──────┐
     │Build│ │ Fix │ │Clean│ │Check│ │Design│
     └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘ └──┬───┘
        │       │       │       │       │
        ▼       ▼       ▼       ▼       ▼
   FEATURE   BUGFIX  REFACTOR  REVIEW  ARCHITECTURE
        │       │       │       │       │
        ▼       ▼       ▼       ▼       ▼
   ┌────────────────────────────────────────┐
   │         COMPLEXITY ASSESSMENT          │
   └────────────────────────────────────────┘
        │           │           │
        ▼           ▼           ▼
     QUICK      BALANCED      DEEP
        │           │           │
        ▼           ▼           ▼
   ┌────────┐  ┌────────┐  ┌────────┐
   │Minimal │  │Standard│  │  Full  │
   │Pipeline│  │Pipeline│  │Pipeline│
   └────────┘  └────────┘  └────────┘
```

---

## Pipeline Definitions

### Minimal Pipeline (QUICK)

```
Developer → Test → Commit
```

- Skip planning agents
- Skip parallel reviews
- Skip polish
- Direct implementation

### Standard Pipeline (BALANCED)

```
PM → Architect → Developer → Testing → Review → Polish → Commit
```

- Light planning
- Full implementation phases
- Targeted reviews
- Standard polish

### Full Pipeline (DEEP)

```
Analyst → PM → Architect → UX → Scrum → Developer → Testing →
Security → Performance → Auditor → UI Refinement → Commit → PR
```

- Complete planning cycle
- All implementation phases
- All review agents
- Full polish
- PR with documentation

---

## Context-Aware Routing

### Technology Stack Awareness

```yaml
if_stack_includes:
  supabase:
    add_agent: "Supabase integration reviewer"

  authentication:
    priority_agent: security
    mandatory_review: true

  payments:
    priority_agent: security
    mandatory_review: true
    escalate: true

  realtime:
    add_phase: "WebSocket testing"
    performance_focus: true
```

### File Type Routing

```yaml
file_patterns:
  "*.tsx":
    agents: [developer, testing, ui-refinement]
    hooks: [design-token-check, lint]

  "*/api/*.ts":
    agents: [developer, testing, security]
    priority: security

  "*.test.ts":
    agents: [testing]
    skip_design_check: true

  "schema.prisma":
    agents: [architect, security]
    escalate: deep
```

### Risk-Based Escalation

```yaml
escalation_triggers:
  - pattern: "auth|login|password|token|secret"
    escalate_to: security
    mandatory: true

  - pattern: "payment|billing|credit|card"
    escalate_to: security
    mandatory: true
    notify: true

  - pattern: "delete|drop|truncate|destroy"
    escalate_to: architect
    confirm_required: true

  - pattern: "migration|schema"
    escalate_to: architect
    backup_required: true
```

---

## Command Reference

| Command | Route | Complexity |
|---------|-------|------------|
| `/plan-feature [name]` | Feature (planning only) | BALANCED |
| `/dev [file] [phase]` | Feature (execution) | Inherits |
| `/autotask [desc]` | Auto-detected | Auto |
| `/verify-fix` | Bug Fix (verification) | QUICK |
| `/multi-review [depth]` | Review | Auto |
| `/troubleshoot` | Investigation | QUICK |
| `@testing [file]` | Testing | BALANCED |
| `@ui-refinement [path] [focus]` | Polish | QUICK |
| `@security` | Review | BALANCED |
| `@auditor` | Architecture Review | BALANCED |

---

*This routing system ensures every request flows through the optimal path. The orchestrator automatically detects complexity and task type, then executes the appropriate agent sequence.*
