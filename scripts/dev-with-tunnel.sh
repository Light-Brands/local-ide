#!/bin/bash

# Development server with Cloudflare tunnel
# Usage: ./scripts/dev-with-tunnel.sh [start|stop|restart]

TUNNEL_NAME="local-ide"
DEV_PORT=4000
PIDFILE_TUNNEL="/tmp/local-ide-tunnel.pid"
PIDFILE_SERVER="/tmp/local-ide-server.pid"

start_server() {
  echo "Starting Next.js dev server on port $DEV_PORT..."
  cd "$(dirname "$0")/.."
  npm run dev &
  echo $! > "$PIDFILE_SERVER"
  sleep 3
}

start_tunnel() {
  echo "Starting Cloudflare tunnel ($TUNNEL_NAME)..."
  cloudflared tunnel --url http://localhost:$DEV_PORT run $TUNNEL_NAME &
  echo $! > "$PIDFILE_TUNNEL"
  sleep 2
}

stop_server() {
  echo "Stopping Next.js dev server..."
  if [ -f "$PIDFILE_SERVER" ]; then
    kill $(cat "$PIDFILE_SERVER") 2>/dev/null
    rm -f "$PIDFILE_SERVER"
  fi
  pkill -f "next dev" 2>/dev/null
  lsof -ti :$DEV_PORT | xargs kill -9 2>/dev/null
}

stop_tunnel() {
  echo "Stopping Cloudflare tunnel..."
  if [ -f "$PIDFILE_TUNNEL" ]; then
    kill $(cat "$PIDFILE_TUNNEL") 2>/dev/null
    rm -f "$PIDFILE_TUNNEL"
  fi
  pkill -f "cloudflared tunnel" 2>/dev/null
}

status() {
  echo "=== Status ==="
  if pgrep -f "next dev" > /dev/null; then
    echo "Next.js server: RUNNING"
  else
    echo "Next.js server: STOPPED"
  fi

  if pgrep -f "cloudflared" > /dev/null; then
    echo "Cloudflare tunnel: RUNNING"
  else
    echo "Cloudflare tunnel: STOPPED"
  fi
}

case "${1:-start}" in
  start)
    stop_server
    stop_tunnel
    sleep 1
    start_server
    start_tunnel
    echo ""
    status
    echo ""
    echo "IDE available at: https://ide.lightbrands.ai"
    ;;
  stop)
    stop_server
    stop_tunnel
    echo "Stopped."
    ;;
  restart)
    stop_server
    stop_tunnel
    sleep 2
    start_server
    start_tunnel
    echo ""
    status
    echo ""
    echo "IDE available at: https://ide.lightbrands.ai"
    ;;
  status)
    status
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac
