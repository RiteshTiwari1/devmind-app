#!/bin/sh
INPUT=$(cat)
echo "[$(date)] ERROR: $INPUT" >> /tmp/devmind-errors.log
echo '{"action": "allow"}'
