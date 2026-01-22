#!/usr/bin/env npx ts-node

/**
 * Light Brands Boilerplate - Interactive Project Setup
 *
 * Run with: npx ts-node setup/init.ts
 * Or: pnpm setup
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const c = (color: keyof typeof colors, text: string) =>
  `${colors[color]}${text}${colors.reset}`;

interface ProjectConfig {
  name: string;
  type: string;
  description: string;
  targetAudience: string;
  primaryGoal: string;
  style: string;
  pages: string[];
  features: string[];
  colorScheme: string;
}

const projectTypes = [
  { key: '1', value: 'saas', label: 'SaaS Landing Page' },
  { key: '2', value: 'portfolio', label: 'Portfolio / Personal' },
  { key: '3', value: 'agency', label: 'Agency / Studio' },
  { key: '4', value: 'ecommerce', label: 'E-commerce / Product' },
  { key: '5', value: 'blog', label: 'Blog / Content' },
  { key: '6', value: 'startup', label: 'Startup / Launch' },
  { key: '7', value: 'other', label: 'Other' },
];

const styleOptions = [
  { key: '1', value: 'minimal', label: 'Minimal & Clean (like Linear, Vercel)' },
  { key: '2', value: 'bold', label: 'Bold & Expressive (like Stripe, Framer)' },
  { key: '3', value: 'playful', label: 'Playful & Friendly (like Notion, Figma)' },
  { key: '4', value: 'corporate', label: 'Professional & Corporate' },
  { key: '5', value: 'dark', label: 'Dark & Dramatic' },
];

const featureOptions = [
  { key: 'auth', label: 'User Authentication (login/signup)' },
  { key: 'db', label: 'Database (store content, users)' },
  { key: 'blog', label: 'Blog / Content Management' },
  { key: 'contact', label: 'Contact Form' },
  { key: 'newsletter', label: 'Newsletter Signup' },
  { key: 'pricing', label: 'Pricing Tables' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'faq', label: 'FAQ Section' },
  { key: 'team', label: 'Team Section' },
  { key: 'portfolio', label: 'Portfolio / Case Studies' },
];

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function printHeader() {
  console.clear();
  console.log('');
  console.log(c('blue', '  ╔═══════════════════════════════════════════╗'));
  console.log(c('blue', '  ║') + c('bright', '     🚀 ORACLE BOILERPLATE SETUP          ') + c('blue', '║'));
  console.log(c('blue', '  ║') + c('dim', '     Let\'s build something amazing        ') + c('blue', '║'));
  console.log(c('blue', '  ╚═══════════════════════════════════════════╝'));
  console.log('');
}

function printSection(title: string) {
  console.log('');
  console.log(c('cyan', `  ── ${title} ──`));
  console.log('');
}

async function getProjectType(): Promise<string> {
  printSection('PROJECT TYPE');
  console.log(c('dim', '  What kind of website are you building?\n'));

  projectTypes.forEach((t) => {
    console.log(`    ${c('yellow', t.key)}. ${t.label}`);
  });
  console.log('');

  const answer = await ask(c('green', '  Enter number (1-7): '));
  const selected = projectTypes.find((t) => t.key === answer);
  return selected?.value || 'other';
}

async function getStyle(): Promise<string> {
  printSection('VISUAL STYLE');
  console.log(c('dim', '  What style fits your brand?\n'));

  styleOptions.forEach((s) => {
    console.log(`    ${c('yellow', s.key)}. ${s.label}`);
  });
  console.log('');

  const answer = await ask(c('green', '  Enter number (1-5): '));
  const selected = styleOptions.find((s) => s.key === answer);
  return selected?.value || 'minimal';
}

async function getFeatures(): Promise<string[]> {
  printSection('FEATURES');
  console.log(c('dim', '  What features do you need? (comma-separated numbers)\n'));

  featureOptions.forEach((f, i) => {
    console.log(`    ${c('yellow', String(i + 1))}. ${f.label}`);
  });
  console.log('');

  const answer = await ask(c('green', '  Enter numbers (e.g., 1,4,5): '));
  const indices = answer.split(',').map((n) => parseInt(n.trim()) - 1);
  return indices
    .filter((i) => i >= 0 && i < featureOptions.length)
    .map((i) => featureOptions[i].key);
}

async function getPages(projectType: string): Promise<string[]> {
  printSection('PAGES');

  const defaultPages: Record<string, string[]> = {
    saas: ['Homepage', 'Features', 'Pricing', 'About', 'Contact'],
    portfolio: ['Homepage', 'Work/Projects', 'About', 'Contact'],
    agency: ['Homepage', 'Services', 'Work', 'About', 'Contact'],
    ecommerce: ['Homepage', 'Products', 'About', 'Contact'],
    blog: ['Homepage', 'Blog', 'About', 'Contact'],
    startup: ['Homepage', 'Product', 'Pricing', 'About', 'Contact'],
    other: ['Homepage', 'About', 'Contact'],
  };

  const suggested = defaultPages[projectType] || defaultPages.other;

  console.log(c('dim', '  Suggested pages for your project type:\n'));
  suggested.forEach((p, i) => {
    console.log(`    ${c('yellow', String(i + 1))}. ${p}`);
  });
  console.log('');
  console.log(c('dim', '  Press Enter to use these, or type your own (comma-separated)'));
  console.log('');

  const answer = await ask(c('green', '  Pages: '));

  if (!answer) {
    return suggested;
  }

  return answer.split(',').map((p) => p.trim()).filter(Boolean);
}

function generateClaudePrompt(config: ProjectConfig): string {
  const featureLabels = config.features
    .map((f) => featureOptions.find((fo) => fo.key === f)?.label)
    .filter(Boolean);

  return `You are helping me build "${config.name}" - a ${config.type} website.

## Project Context

I'm using the Light Brands Next.js Boilerplate with:
- Next.js 14+ App Router, TypeScript, Tailwind CSS v4
- Design tokens: primary blue (#5a6df2), secondary violet (#a855f7), 4px grid
- Components: Button, Card, Input, Modal, Toast, Tabs, Accordion, Navigation, Footer
- Sections: HeroCentered, HeroSplit, HeroMinimal, CTASection

**CRITICAL RULES:**
- Use design tokens only (bg-primary-500, never hardcode colors)
- 4px/8px spacing grid
- Support light AND dark modes
- Use cn() for class merging
- TypeScript for all components

## My Project

**Name:** ${config.name}
**Type:** ${config.type}
**Description:** ${config.description}
**Target Audience:** ${config.targetAudience}
**Primary Goal:** ${config.primaryGoal}
**Visual Style:** ${config.style}

**Pages:**
${config.pages.map((p, i) => `${i + 1}. ${p}`).join('\n')}

**Features Needed:**
${featureLabels.map((f) => `- ${f}`).join('\n')}

**Color Preference:** ${config.colorScheme}

## Your Task

1. **Confirm** you understand my project (1-2 sentences)
2. **Create a site plan** showing:
   - Each page with its sections
   - Which existing components to use
   - Any new components needed
3. **Ask me** if I want to proceed or make changes
4. **Start building** the homepage when I confirm

Keep responses focused and practical. Let's build this!`;
}

function generateProjectFile(config: ProjectConfig): string {
  return `# ${config.name} - Project Configuration

Generated by Light Brands Setup on ${new Date().toISOString().split('T')[0]}

## Overview

- **Type:** ${config.type}
- **Style:** ${config.style}
- **Description:** ${config.description}

## Target Audience

${config.targetAudience}

## Primary Goal

${config.primaryGoal}

## Pages

${config.pages.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## Features

${config.features.map((f) => `- [${f}] ${featureOptions.find((fo) => fo.key === f)?.label}`).join('\n')}

## Color Scheme

${config.colorScheme}

---

## Development Notes

[Add notes as you build]

## AI Conversation Log

[Paste key decisions from your Claude conversations here]
`;
}

async function main() {
  printHeader();

  console.log(c('dim', '  Answer a few questions and I\'ll generate everything you need'));
  console.log(c('dim', '  to start building with AI assistance.\n'));

  await ask(c('green', '  Press Enter to begin...'));

  // Gather project info
  printSection('PROJECT BASICS');

  const name = await ask(c('green', '  Website name: '));
  const description = await ask(c('green', '  One-line description: '));
  const targetAudience = await ask(c('green', '  Target audience: '));
  const primaryGoal = await ask(c('green', '  Primary goal (what should visitors do?): '));

  const type = await getProjectType();
  const style = await getStyle();
  const pages = await getPages(type);
  const features = await getFeatures();

  printSection('COLOR SCHEME');
  console.log(c('dim', '  The default is blue/violet. Want to customize?\n'));
  console.log(`    ${c('yellow', '1')}. Keep default (blue primary, violet secondary)`);
  console.log(`    ${c('yellow', '2')}. Customize colors`);
  console.log('');

  const colorChoice = await ask(c('green', '  Enter 1 or 2: '));
  let colorScheme = 'Use default blue (#5a6df2) and violet (#a855f7)';

  if (colorChoice === '2') {
    colorScheme = await ask(c('green', '  Describe your color preferences: '));
  }

  // Build config
  const config: ProjectConfig = {
    name,
    type,
    description,
    targetAudience,
    primaryGoal,
    style,
    pages,
    features,
    colorScheme,
  };

  // Generate outputs
  printSection('GENERATING FILES');

  const claudePrompt = generateClaudePrompt(config);
  const projectFile = generateProjectFile(config);

  // Save files
  const docsDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const promptPath = path.join(docsDir, 'CLAUDE-PROMPT.md');
  const configPath = path.join(docsDir, 'PROJECT-CONFIG.md');

  fs.writeFileSync(promptPath, `# Claude Prompt for ${name}\n\nCopy everything below this line and paste to Claude:\n\n---\n\n${claudePrompt}`);
  fs.writeFileSync(configPath, projectFile);

  console.log(c('green', '  ✓ ') + 'Created docs/CLAUDE-PROMPT.md');
  console.log(c('green', '  ✓ ') + 'Created docs/PROJECT-CONFIG.md');

  // Print summary
  printSection('SETUP COMPLETE! 🎉');

  console.log(c('bright', '  Your project is configured. Here\'s what to do next:\n'));

  console.log(c('yellow', '  1. Start the dev server:'));
  console.log(c('dim', '     pnpm dev\n'));

  console.log(c('yellow', '  2. Open your Claude prompt:'));
  console.log(c('dim', '     docs/CLAUDE-PROMPT.md\n'));

  console.log(c('yellow', '  3. Copy the prompt to Claude and start building!\n'));

  console.log(c('cyan', '  ─────────────────────────────────────────────'));
  console.log('');
  console.log(c('bright', '  YOUR CLAUDE PROMPT (also saved to docs/CLAUDE-PROMPT.md):'));
  console.log(c('cyan', '  ─────────────────────────────────────────────'));
  console.log('');
  console.log(c('dim', claudePrompt));
  console.log('');
  console.log(c('cyan', '  ─────────────────────────────────────────────'));
  console.log('');

  rl.close();
}

main().catch(console.error);
