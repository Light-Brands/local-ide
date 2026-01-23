#!/usr/bin/env node

/**
 * Light Brands AI - Interactive Setup Wizard
 *
 * Run with: node setup/wizard.mjs
 * Or: pnpm setup
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Colors
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
};

const color = (col, text) => `${c[col]}${text}${c.reset}`;

// Options
const projectTypes = [
  { key: '1', value: 'SaaS / Web App', sections: ['Hero', 'Features', 'How it works', 'Testimonials', 'Pricing', 'FAQ', 'CTA'] },
  { key: '2', value: 'Portfolio / Personal', sections: ['Hero', 'About', 'Work/Projects', 'Skills', 'Contact'] },
  { key: '3', value: 'Agency / Studio', sections: ['Hero', 'Services', 'Work', 'Process', 'Team', 'Testimonials', 'Contact'] },
  { key: '4', value: 'Product / Launch', sections: ['Hero', 'Problem/Solution', 'Features', 'Demo', 'Pricing', 'FAQ', 'CTA'] },
  { key: '5', value: 'Blog / Content', sections: ['Hero', 'Featured Posts', 'Categories', 'Newsletter', 'About'] },
  { key: '6', value: 'Other', sections: ['Hero', 'Content', 'CTA'] },
];

const styles = [
  { key: '1', value: 'Minimal & Clean', ref: 'Linear, Vercel, Raycast' },
  { key: '2', value: 'Bold & Modern', ref: 'Stripe, Framer, Arc' },
  { key: '3', value: 'Friendly & Warm', ref: 'Notion, Slack, Figma' },
  { key: '4', value: 'Dark & Premium', ref: 'Apple, Nothing, Porsche' },
  { key: '5', value: 'Corporate & Trust', ref: 'Salesforce, IBM, Microsoft' },
];

const features = [
  { key: '1', id: 'auth', label: 'User login/signup' },
  { key: '2', id: 'database', label: 'Database (Supabase)' },
  { key: '3', id: 'blog', label: 'Blog / CMS' },
  { key: '4', id: 'contact', label: 'Contact form' },
  { key: '5', id: 'newsletter', label: 'Newsletter signup' },
  { key: '6', id: 'analytics', label: 'Analytics' },
];

// Helpers
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function clear() {
  console.clear();
}

function header() {
  clear();
  console.log('');
  console.log(color('blue', '  ┌─────────────────────────────────────────┐'));
  console.log(color('blue', '  │') + color('bright', '   🚀 LIGHT BRANDS AI SETUP WIZARD     ') + color('blue', '│'));
  console.log(color('blue', '  │') + color('dim', '   Build your website with AI           ') + color('blue', '│'));
  console.log(color('blue', '  └─────────────────────────────────────────┘'));
  console.log('');
}

function section(title) {
  console.log('');
  console.log(color('cyan', `  ─── ${title} ───`));
  console.log('');
}

// Main wizard
async function wizard() {
  header();

  console.log(color('dim', '  I\'ll ask a few questions, then generate a perfect'));
  console.log(color('dim', '  prompt for Claude to build your website.\n'));

  await ask(color('green', '  Press Enter to start → '));

  // Step 1: Basics
  header();
  section('STEP 1/5: THE BASICS');

  const name = await ask(color('yellow', '  Website name: '));
  const oneLiner = await ask(color('yellow', '  Describe it in one line: '));

  // Step 2: Type
  header();
  section('STEP 2/5: PROJECT TYPE');

  console.log(color('dim', '  What are you building?\n'));
  projectTypes.forEach(t => {
    console.log(`    ${color('yellow', t.key)}) ${t.value}`);
  });
  console.log('');

  const typeAnswer = await ask(color('green', '  Pick (1-6): '));
  const selectedType = projectTypes.find(t => t.key === typeAnswer) || projectTypes[5];

  // Step 3: Style
  header();
  section('STEP 3/5: VISUAL STYLE');

  console.log(color('dim', '  What vibe are you going for?\n'));
  styles.forEach(s => {
    console.log(`    ${color('yellow', s.key)}) ${s.value} ${color('dim', `(like ${s.ref})`)}`);
  });
  console.log('');

  const styleAnswer = await ask(color('green', '  Pick (1-5): '));
  const selectedStyle = styles.find(s => s.key === styleAnswer) || styles[0];

  // Step 4: Goal
  header();
  section('STEP 4/5: YOUR GOAL');

  console.log(color('dim', '  What should visitors do on your site?\n'));
  console.log(`    ${color('yellow', '1')}) Sign up / Start free trial`);
  console.log(`    ${color('yellow', '2')}) Book a call / Contact`);
  console.log(`    ${color('yellow', '3')}) Buy a product`);
  console.log(`    ${color('yellow', '4')}) Learn more / Read content`);
  console.log(`    ${color('yellow', '5')}) Other`);
  console.log('');

  const goalAnswer = await ask(color('green', '  Pick (1-5): '));
  const goals = ['Sign up for free trial', 'Book a consultation call', 'Purchase product', 'Explore content', 'Other'];
  let selectedGoal = goals[parseInt(goalAnswer) - 1] || goals[0];

  if (goalAnswer === '5') {
    selectedGoal = await ask(color('yellow', '  Describe your goal: '));
  }

  // Step 5: Features
  header();
  section('STEP 5/5: FEATURES');

  console.log(color('dim', '  Which features do you need? (type numbers, comma-separated)\n'));
  features.forEach(f => {
    console.log(`    ${color('yellow', f.key)}) ${f.label}`);
  });
  console.log(`    ${color('dim', '0')}) None / Skip`);
  console.log('');

  const featuresAnswer = await ask(color('green', '  Pick (e.g. 1,4,5): '));
  const selectedFeatures = featuresAnswer === '0' ? [] :
    featuresAnswer.split(',')
      .map(n => features.find(f => f.key === n.trim()))
      .filter(Boolean)
      .map(f => f.label);

  // Generate prompt
  header();
  section('GENERATING YOUR PROMPT');

  console.log(color('green', '  ✓ ') + 'Analyzing your choices...');
  await new Promise(r => setTimeout(r, 300));
  console.log(color('green', '  ✓ ') + 'Building AI context...');
  await new Promise(r => setTimeout(r, 300));
  console.log(color('green', '  ✓ ') + 'Creating optimal prompt...');
  await new Promise(r => setTimeout(r, 300));

  const prompt = generatePrompt({
    name,
    oneLiner,
    type: selectedType,
    style: selectedStyle,
    goal: selectedGoal,
    features: selectedFeatures,
  });

  // Save files
  const docsDir = path.join(rootDir, 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(docsDir, 'MY-PROJECT.md'),
    `# ${name}\n\n${oneLiner}\n\n## Configuration\n\n- **Type:** ${selectedType.value}\n- **Style:** ${selectedStyle.value}\n- **Goal:** ${selectedGoal}\n- **Features:** ${selectedFeatures.join(', ') || 'None'}\n\n## Sections\n\n${selectedType.sections.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n`
  );

  fs.writeFileSync(
    path.join(docsDir, 'CLAUDE-PROMPT.md'),
    `# Paste This to Claude\n\nCopy everything below the line:\n\n---\n\n${prompt}`
  );

  console.log(color('green', '  ✓ ') + 'Saved docs/MY-PROJECT.md');
  console.log(color('green', '  ✓ ') + 'Saved docs/CLAUDE-PROMPT.md');

  // Show result
  console.log('');
  console.log(color('cyan', '  ═══════════════════════════════════════════'));
  console.log(color('bright', '\n  🎉 DONE! Here\'s your Claude prompt:\n'));
  console.log(color('cyan', '  ═══════════════════════════════════════════'));
  console.log('');
  console.log(color('dim', prompt));
  console.log('');
  console.log(color('cyan', '  ═══════════════════════════════════════════'));
  console.log('');
  console.log(color('bright', '  NEXT STEPS:'));
  console.log('');
  console.log(`  ${color('yellow', '1.')} Copy the prompt above (or from docs/CLAUDE-PROMPT.md)`);
  console.log(`  ${color('yellow', '2.')} Paste it to Claude`);
  console.log(`  ${color('yellow', '3.')} Start building! 🚀`);
  console.log('');
  console.log(color('dim', '  Your dev server: ') + color('cyan', 'pnpm dev'));
  console.log('');

  rl.close();
}

function generatePrompt({ name, oneLiner, type, style, goal, features }) {
  return `I'm building "${name}" - ${oneLiner}

## Tech Context

Using Light Brands AI Next.js Boilerplate:
- Next.js 14+, TypeScript, Tailwind v4, Framer Motion
- Design tokens: primary blue, secondary violet, 4px grid
- Components: Button, Card, Input, Modal, Toast, Tabs, Navigation, Footer
- Sections: HeroCentered, HeroMinimal, HeroSplit, CTASection

**Rules (MUST follow):**
- Use design tokens (bg-primary-500), never hardcode colors
- 4px/8px spacing grid
- Support light + dark modes
- Use cn() for classes

## My Project

**Type:** ${type.value}
**Style:** ${style.value} (like ${style.ref})
**Goal:** ${goal}
${features.length ? `**Features:** ${features.join(', ')}` : ''}

**Homepage Sections:**
${type.sections.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## What I Need

1. Confirm you understand (1 sentence)
2. Show me a quick plan for the homepage
3. Start building when I say "go"

Let's make this amazing!`;
}

// Run
wizard().catch(console.error);
