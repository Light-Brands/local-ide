#!/bin/bash
# =============================================================================
# Local IDE Launcher
# =============================================================================
# Starts the IDE with an optional project path.
#
# Usage:
#   ./scripts/start-ide.sh                    # Opens IDE's own directory
#   ./scripts/start-ide.sh /path/to/project   # Opens specified project
#   ./scripts/start-ide.sh .                  # Opens current directory
#
# =============================================================================

# Get the directory where this script lives (the IDE root)
IDE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Default to no project path (uses IDE directory)
PROJECT_PATH=""

# If argument provided, resolve to absolute path
if [ -n "$1" ]; then
    if [ "$1" = "." ]; then
        PROJECT_PATH="$(pwd)"
    elif [ -d "$1" ]; then
        PROJECT_PATH="$(cd "$1" && pwd)"
    else
        echo "Error: Directory does not exist: $1"
        exit 1
    fi
fi

echo "=============================================="
echo "  Local IDE"
echo "=============================================="
echo ""
echo "  IDE Location:  $IDE_DIR"

if [ -n "$PROJECT_PATH" ]; then
    echo "  Project Path:  $PROJECT_PATH"
    export IDE_PROJECT_PATH="$PROJECT_PATH"
else
    echo "  Project Path:  $IDE_DIR (default)"
fi

echo ""
echo "  Starting servers..."
echo ""

# Change to IDE directory
cd "$IDE_DIR"

# Start terminal server in background
echo "  → Starting terminal server on port 4001..."
npx tsx server/terminal-server.ts &
TERMINAL_PID=$!

# Give terminal server a moment to start
sleep 1

# Start Next.js dev server
echo "  → Starting IDE on port 4000..."
echo ""
npm run dev

# Cleanup on exit
trap "kill $TERMINAL_PID 2>/dev/null" EXIT
