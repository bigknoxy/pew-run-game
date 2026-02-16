---
name: dev-server
description: Start the game dev server on port 8000. Kills any existing process on port 8000 first, then starts a Python HTTP server in the background. Use after completing any code change or when the user asks to start/restart the server.
allowed-tools: Bash(dev-server:*)
user-invocable: true
---

# Dev Server

Start the game development server on port 8000.

## Steps

1. Kill any existing process on port 8000:
   ```bash
   kill $(lsof -t -i:8000) 2>/dev/null || true
   ```

2. Start the server in the background from the project root:
   ```bash
   cd /root/pew-run-game && python3 -m http.server 8000
   ```
   Run this as a background command.

3. Confirm the server is running at http://localhost:8000

## Rules

- ALWAYS use port 8000. No other port.
- If port 8000 is busy, kill the occupying process first.
- Run the server in the background so the user can continue working.
