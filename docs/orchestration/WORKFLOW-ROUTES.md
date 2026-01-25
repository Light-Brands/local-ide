# Workflow Routes

> **Complete Routing Logic for Every Development Scenario**
>
> This document defines how any request is routed through the optimal agent sequence based on complexity, task type, and context.

---

## Route Detection Engine

### Step 0: Plan First (MANDATORY)

**Before ANY route detection occurs, the orchestrator MUST:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PLAN-FIRST GATE (MANDATORY)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  STEP 0A: ASK FOR THEIR PLAN                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ "Do you have a plan for how you'd like this implemented?"   │   │
│  │                                                             │   │
│  │ - If YES: Share it and I'll ask follow-up questions        │   │
│  │ - If NO: Let's build one together                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  IF THEY HAVE A PLAN:                                               │
│  ├─ Let them share it completely                                   │
│  ├─ Ask follow-up questions to understand deeply:                  │
│  │   • "Tell me more about [specific part]?"                       │
│  │   • "What's your thinking behind [decision]?"                   │
│  │   • "How should [edge case] work?"                              │
│  └─ Continue until 100% certain you understand                     │
│                                                                     │
│  IF THEY DON'T HAVE A PLAN:                                         │
│  ├─ Help build one by asking:                                      │
│  │   • "What problem are we solving?"                              │
│  │   • "Who are the users?"                                        │
│  │   • "What are the key features?"                                │
│  │   • "What are the constraints?"                                 │
│  ├─ Synthesize into a proposed plan                                │
│  └─ Present for approval                                           │
│                                                                     │
│  STEP 0B: ASK FOR BRAND GUIDELINES                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ "Do you have brand guidelines I should follow?"             │   │
│  │                                                             │   │
│  │ - If YES: Please share them                                 │   │
│  │ - If NO: Let's establish some basic guidelines together     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  IF THEY DON'T HAVE BRAND GUIDELINES:                               │
│  ├─ Help establish basics:                                         │
│  │   • Colors (primary, secondary, accent)                         │
│  │   • Typography preferences                                      │
│  │   • Tone and voice                                              │
│  │   • Visual style (modern, classic, playful, professional)      │
│  │   • Any existing assets or references                          │
│  └─ Document for consistent use                                    │
│                                                                     │
│  STEP 0C: SAVE TO PROJECT JSON (MANDATORY - SINGLE SOURCE OF TRUTH)│
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Create/update the project JSON file:                        │   │
│  │                                                             │   │
│  │ Location: /docs/planning/projects/[project-id].json         │   │
│  │                                                             │   │
│  │ This file contains EVERYTHING:                              │   │
│  │ • meta: Project info, status, dates                         │   │
│  │ • plan: Problem, goals, user stories, constraints           │   │
│  │ • brand: Colors, typography, tone, style                    │   │
│  │ • epics: All features broken into tasks                     │   │
│  │ • routes: API endpoints                                     │   │
│  │ • activity: Change log                                      │   │
│  │                                                             │   │
│  │ Template: /docs/planning/projects/_template.json            │   │
│  │ Schema: /docs/planning/PROJECT-SCHEMA.json                  │   │
│  │                                                             │   │
│  │ This powers the Dev Dashboard at /admin/dev/tracker         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  STEP 0D: CREATE INITIAL EPICS & TASKS                              │
│  ├─ Break the plan into epics (major feature areas)                │
│  ├─ Break epics into tasks (tables, endpoints, services, etc.)     │
│  ├─ Set initial status: "pending" for all tasks                    │
│  └─ Add to the epics array in project.json                         │
│                                                                     │
│  CONFIRM BEFORE PROCEEDING:                                         │
│  ├─ Share: "I've saved the project to /docs/planning/projects/X"   │
│  ├─ Get explicit approval                                          │
│  └─ "Does this capture what you want? Should I proceed?"          │
│                                                                     │
│  ONLY AFTER USER CONFIRMS → Proceed to Step 1                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

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
  0. clarification:
      action: "Enter planning mode, ask clarifying questions"
      questions:
        - "What should the loading state look like visually?"
        - "Should the button be disabled while loading?"
        - "What triggers the loading state?"
        - "How long should loading typically last?"
      gate: "User confirms understanding before proceeding"

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
  0. clarification:
      action: "Enter planning mode, ask clarifying questions until 100% certain"
      questions:
        - "What user data should be displayed on the profile?"
        - "What settings should be editable?"
        - "How should validation work for profile updates?"
        - "Are there any privacy considerations?"
        - "Should there be a profile picture upload?"
        - "What happens on save - immediate or confirmation?"
      gate: "User confirms understanding before proceeding"

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
  0. clarification:
      action: "Enter planning mode, ask extensive clarifying questions until 100% certain"
      questions:
        - "What types of notifications are needed (in-app, email, push)?"
        - "What events should trigger notifications?"
        - "How should users manage notification preferences?"
        - "What is the expected notification volume?"
        - "Should notifications be real-time or batched?"
        - "How should read/unread state be managed?"
        - "What about notification history and archiving?"
        - "Are there any rate limiting requirements?"
        - "How should offline/reconnect scenarios be handled?"
      gate: "User confirms complete understanding before proceeding"

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
  0. clarification:
      action: "Enter planning mode, ask clarifying questions"
      questions:
        - "What exactly happens when you click the button?"
        - "Does it show any error messages?"
        - "When did this start happening?"
        - "Does it happen consistently or intermittently?"
        - "Have any recent changes been made to this area?"
        - "What is the expected behavior?"
      gate: "User confirms understanding of the bug before proceeding"

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
  0. clarification:
      action: "Enter planning mode, ask clarifying questions until 100% certain"
      questions:
        - "What specific pain points are you experiencing with this code?"
        - "Are there any behaviors that must NOT change?"
        - "What is the desired end state?"
        - "Are there any performance concerns to address?"
        - "Should this be done incrementally or all at once?"
        - "Are there tests in place to verify behavior is preserved?"
      gate: "User confirms scope and constraints before proceeding"

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
  0. clarification:
      action: "Ask clarifying questions about review scope"
      questions:
        - "What areas should I focus on most?"
        - "Are there specific concerns you want me to check?"
        - "Should I prioritize security, performance, or correctness?"
        - "What level of detail do you want in the review?"
      gate: "User confirms review focus before proceeding"

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
  0. clarification:
      action: "Enter planning mode, ask extensive clarifying questions until 100% certain"
      questions:
        - "What entities/data need to be stored?"
        - "What are the relationships between entities?"
        - "What queries will be most common?"
        - "What are the expected data volumes?"
        - "Are there any compliance requirements (GDPR, etc.)?"
        - "What are the scalability expectations?"
        - "Are there existing patterns we should follow?"
        - "What about data migration from existing systems?"
      gate: "User confirms all requirements before proceeding"

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
  0. clarification:
      action: "Enter planning mode, ask clarifying questions"
      questions:
        - "What are the critical paths that must be tested?"
        - "What is the target coverage percentage?"
        - "Should I include E2E tests or just unit/integration?"
        - "Are there specific edge cases you want covered?"
        - "What test frameworks are already in use?"
      gate: "User confirms test scope before proceeding"

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
  0. clarification:
      action: "Enter planning mode, ask clarifying questions"
      questions:
        - "What format should the documentation be in?"
        - "Who is the target audience (developers, end-users)?"
        - "Should I include code examples?"
        - "Are there existing documentation standards to follow?"
        - "Which endpoints are highest priority?"
      gate: "User confirms documentation scope before proceeding"

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
  0. clarification:
      action: "Enter planning mode, ask clarifying questions"
      questions:
        - "How slow is it (specific load times)?"
        - "Is it slow on initial load, navigation, or both?"
        - "Does it happen in all browsers?"
        - "Are there specific components that seem slow?"
        - "When did you first notice the slowdown?"
      gate: "User confirms investigation context before proceeding"

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
