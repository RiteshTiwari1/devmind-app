import hashlib
import hmac
import os
from fastapi import Request, HTTPException

WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")

def verify_signature(payload: bytes, signature: str) -> bool:
    if not WEBHOOK_SECRET:
        return True
    expected = "sha256=" + hmac.new(
        WEBHOOK_SECRET.encode(), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)

def parse_pr_event(payload: dict) -> "dict | None":
    """Extract PR info from GitHub webhook payload. Returns None if not a PR open event."""
    action = payload.get("action")
    if action not in ("opened", "reopened"):
        return None

    pr = payload.get("pull_request", {})
    repo = payload.get("repository", {}).get("full_name", "")

    return {
        "repo": repo,
        "pr_number": pr.get("number"),
        "pr_title": pr.get("title", ""),
        "pr_author": pr.get("user", {}).get("login", "unknown"),
        "pr_body": pr.get("body", ""),
        "pr_url": pr.get("html_url", ""),
    }
