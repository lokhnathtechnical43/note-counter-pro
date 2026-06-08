#!/bin/bash
# Keep-alive script to restart dev server if it dies
cd /home/z/my-project
while true; do
  if ! curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ 2>/dev/null | grep -q "200"; then
    echo "$(date): Starting dev server..." >> /home/z/my-project/server-alive.log
    bun run dev >> /home/z/my-project/dev.log 2>&1 &
    DEV_PID=$!
    echo "$(date): Dev server PID: $DEV_PID" >> /home/z/my-project/server-alive.log
    sleep 10
    # Check if it's running
    if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ 2>/dev/null | grep -q "200"; then
      echo "$(date): Server is up!" >> /home/z/my-project/server-alive.log
    else
      echo "$(date): Server failed to start" >> /home/z/my-project/server-alive.log
    fi
  fi
  sleep 30
done
