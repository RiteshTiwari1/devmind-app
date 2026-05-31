#!/bin/sh
# Block destructive commands — DevMind should only read GitHub + post comments
INPUT=$(cat)

TOOL=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('toolName',''))" 2>/dev/null)
COMMAND=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('args',{}).get('command',''))" 2>/dev/null)

# Block dangerous shell commands
if echo "$COMMAND" | grep -qE "rm -rf|git push|git reset|drop table|DELETE FROM"; then
  echo '{"action": "block", "reason": "DevMind: Destructive command blocked for safety"}'
  exit 0
fi

echo '{"action": "allow"}'
