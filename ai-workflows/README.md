# AI Workflow Automation

> Claude Code integration for AI-first development with the Light Brands AI Boilerplate

## Quick Start

1. **Copy Claude configuration**:
   ```bash
   cp ai-workflows/CLAUDE.md ~/.claude/CLAUDE.md
   ```

2. **Set up hooks** (optional):
   ```bash
   # Link hooks to your Claude Code installation
   ln -s $(pwd)/ai-workflows/hooks/hooks.json ~/.claude/hooks.json
   ```

3. **Start developing** with AI-assisted workflows

## Directory Structure

```
ai-workflows/
├── CLAUDE.md              # Main Claude Code configuration
├── README.md              # This file
├── skills/
│   ├── plan-feature.md    # /plan-feature command
│   └── dev.md             # /dev command for phased development
├── hooks/
│   └── hooks.json         # Automated hooks configuration
├── scripts/
│   ├── check-tokens.js    # Design token enforcement
│   └── update-changelog.js # Automatic changelog updates
└── subagents/
    ├── testing-agent.md   # Testing specialist
    └── ui-refinement-agent.md # UI polish specialist
```

## Available Commands

### `/plan-feature [name]`

Generates a comprehensive feature specification:

```bash
/plan-feature user-authentication
```

Creates `/docs/features/user-authentication.md` with:
- User stories
- Technical specification
- API endpoints
- Component hierarchy
- Implementation phases

### `/dev [component] [phase]`

Implements components in systematic phases:

```bash
/dev UserProfile scaffold   # Create file structure
/dev UserProfile ui         # Build visual layer
/dev UserProfile logic      # Add interactivity
/dev UserProfile animation  # Add micro-interactions
/dev UserProfile integration # Connect to APIs
/dev UserProfile test       # Write tests
/dev UserProfile polish     # Final refinements
```

## Hooks

### Automatic Hooks

| Hook | Trigger | Action |
|------|---------|--------|
| `design-token-check` | Pre-edit | Validates no hardcoded values |
| `lint-fix` | Post-edit | Auto-fixes linting issues |
| `format` | Post-edit | Formats code with Prettier |
| `changelog` | Post-commit | Updates CHANGELOG.md |
| `type-check` | Pre-push | Verifies TypeScript types |

### On-Demand Hooks

```bash
# Run Lighthouse audit
claude run lighthouse

# Analyze bundle size
claude run bundle-analyze

# Accessibility audit
claude run a11y-audit
```

## Subagents

### Testing Agent

Specialized for writing comprehensive tests:

```bash
@testing src/components/ui/Button.tsx
```

Generates:
- Unit tests with React Testing Library
- Accessibility tests with jest-axe
- Edge case coverage
- API route tests if applicable

### UI Refinement Agent

Iterative UI polish specialist:

```bash
@ui-refinement src/components/sections/HeroCentered.tsx spacing
```

Focus areas:
- `spacing` - Grid alignment and rhythm
- `colors` - Contrast and dark mode
- `animation` - Micro-interactions
- `full-audit` - Complete review

## Best Practices

### Context Hygiene

Keep Claude focused by:

1. **Working in small chunks** - One feature/component at a time
2. **Clearing context** - Start fresh sessions for new features
3. **Using specs** - Reference `/docs/features/` specs for context

### Effective Prompting

```bash
# Bad: Vague request
"Make the button better"

# Good: Specific with context
"Enhance Button.tsx hover state using the 'smooth' easing curve
from tokens.ts. Add a subtle scale transform and update the
shadow on hover. Ensure dark mode contrast is maintained."
```

### Iterative Refinement

For UI polish, run multiple passes:

```bash
# Run 1: Structure
@ui-refinement ComponentName spacing

# Run 2: Colors
@ui-refinement ComponentName colors

# Run 3: Animation
@ui-refinement ComponentName animation

# Repeat with "ultrathink" for deep improvements
```

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
# Enable verbose hook output
CLAUDE_HOOKS_VERBOSE=true

# Skip design token checks (not recommended)
CLAUDE_SKIP_TOKEN_CHECK=false
```

### Custom Rules

Extend `CLAUDE.md` with project-specific rules:

```markdown
## Project-Specific Rules

### Database Naming
- Use snake_case for table/column names
- Prefix junction tables with both entity names

### API Patterns
- All endpoints return { data, error } shape
- Use HTTP status codes correctly
```

## Troubleshooting

### Hook not running

1. Verify hook is enabled in `hooks.json`
2. Check file pattern matches
3. Run manually: `node ./ai-workflows/scripts/check-tokens.js`

### Token check false positive

Add exception to `check-tokens.js`:

```javascript
const ALLOWED_PATTERNS = [
  // Add your pattern
  /your-allowed-pattern/,
];
```

### Subagent not responding

1. Ensure subagent file exists in `subagents/`
2. Check syntax in markdown file
3. Try restarting Claude Code session
