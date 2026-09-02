#!/bin/bash
set -e

echo "=========================================="
echo "⚡ Starting OmniTranscript Suite"
echo "=========================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Setup Backend
echo "[1/3] Checking Backend Python Environment..."
if [ ! -d "$ROOT_DIR/backend/venv" ]; then
    echo "Creating virtualenv..."
    python3 -m venv "$ROOT_DIR/backend/venv"
    "$ROOT_DIR/backend/venv/bin/pip" install -r "$ROOT_DIR/backend/requirements.txt"
fi

# 2. Setup Frontend
echo "[2/3] Checking Frontend Dependencies..."
if [ ! -d "$ROOT_DIR/frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd "$ROOT_DIR/frontend" && npm install
fi

# 3. Launch Services Concurrently
echo "[3/3] Launching Backend & Frontend..."
trap 'kill $(jobs -p) 2>/dev/null' EXIT

echo "Starting Backend API on http://localhost:8000..."
cd "$ROOT_DIR/backend"
PYTHONPATH=. "$ROOT_DIR/backend/venv/bin/python" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &

echo "Starting Frontend Web App on http://localhost:3000..."
cd "$ROOT_DIR/frontend"
npm run dev &

wait
