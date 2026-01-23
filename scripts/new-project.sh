#!/bin/bash

# Light Brands AI - New Project Setup Script
# Usage: ./scripts/new-project.sh my-website-name

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if project name is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide a project name${NC}"
    echo "Usage: ./scripts/new-project.sh my-website-name"
    exit 1
fi

PROJECT_NAME=$1
PROJECT_DIR="../$PROJECT_NAME"

echo -e "${BLUE}🚀 Creating new Light Brands AI project: ${PROJECT_NAME}${NC}"
echo ""

# Check if directory already exists
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${RED}Error: Directory $PROJECT_DIR already exists${NC}"
    exit 1
fi

# Clone the boilerplate (or copy if local)
echo -e "${YELLOW}📦 Setting up project structure...${NC}"
cp -r . "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Remove git history and initialize fresh
rm -rf .git
git init

# Remove this setup script from the new project
rm -f scripts/new-project.sh

# Create .env.local from example
echo -e "${YELLOW}🔐 Creating environment file...${NC}"
cat > .env.local << 'EOF'
# Supabase Configuration
# Get these from: https://supabase.com/dashboard/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: AI Features
# Get from: https://console.anthropic.com/
ANTHROPIC_API_KEY=your-claude-api-key

# Optional: Vercel Deployment
# Get from: https://vercel.com/account/tokens
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
EOF

# Update package.json with new project name
echo -e "${YELLOW}📝 Updating project name...${NC}"
if command -v jq &> /dev/null; then
    tmp=$(mktemp)
    jq ".name = \"$PROJECT_NAME\"" package.json > "$tmp" && mv "$tmp" package.json
else
    # Fallback if jq is not installed
    sed -i.bak "s/\"name\": \".*\"/\"name\": \"$PROJECT_NAME\"/" package.json
    rm -f package.json.bak
fi

# Create project-specific CLAUDE.md
echo -e "${YELLOW}🤖 Setting up AI configuration...${NC}"
cat > .claude/CLAUDE.md << EOF
# $PROJECT_NAME - Claude Configuration

## Project Overview
This is a premium website built with the Light Brands AI Next.js Boilerplate.

## Key Files
- \`/AI-RULES.md\` - Development guidelines (MUST follow)
- \`/src/design-system/tokens.ts\` - Design tokens
- \`/src/design-system/DESIGN-PRINCIPLES.md\` - Design guidelines

## Project-Specific Notes
[Add your project-specific notes here]

## Current Focus
[Update this as you work on different features]
EOF

mkdir -p .claude

# Create docs folder for feature specs
mkdir -p docs/features

# Install dependencies
echo -e "${YELLOW}📥 Installing dependencies...${NC}"
if command -v pnpm &> /dev/null; then
    pnpm install
elif command -v npm &> /dev/null; then
    npm install
else
    echo -e "${RED}Error: No package manager found. Please install pnpm or npm.${NC}"
    exit 1
fi

# Initial commit
echo -e "${YELLOW}📸 Creating initial commit...${NC}"
git add .
git commit -m "Initial commit from Light Brands AI Boilerplate

Features:
- Next.js 14+ with App Router
- TypeScript + Tailwind CSS v4
- Premium design system with tokens
- UI components (Button, Card, Input, Modal, etc.)
- Hero sections and CTA components
- Supabase integration ready
- AI-powered components
- GitHub Actions CI/CD

Co-Authored-By: Light Brands AI <noreply@lightbrands.dev>"

echo ""
echo -e "${GREEN}✅ Project created successfully!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo "  1. cd $PROJECT_NAME"
echo ""
echo "  2. Set up Supabase (optional):"
echo "     - Create project at https://supabase.com"
echo "     - Run /supabase/schema.sql in SQL editor"
echo "     - Update .env.local with your keys"
echo ""
echo "  3. Start development:"
echo "     pnpm dev"
echo ""
echo "  4. Open KICKOFF.md and copy the template to Claude"
echo "     to start planning your website"
echo ""
echo -e "${GREEN}Happy building! 🎉${NC}"
