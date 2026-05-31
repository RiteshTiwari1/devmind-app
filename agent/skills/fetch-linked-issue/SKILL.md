---
name: fetch-linked-issue
description: Find and fetch the GitHub Issue linked to this PR (the PROMISE)
---

# Fetch Linked Issue

Steps:
1. Look for issue references in the PR body: patterns like "Fixes #45", "Closes #12", "Resolves #7", or "#45"
2. If an issue number is found, fetch it:
   ```
   curl -s -H "Authorization: token $GITHUB_TOKEN" \
     https://api.github.com/repos/$REPO/issues/$ISSUE_NUMBER
   ```
3. Extract: issue title, issue body (full description), labels, comments if any
4. This is the PROMISE — what was asked for

If no issue is linked:
- Note: "No linked issue found. Reviewing code quality only."
- Set Truth Score as N/A
- Continue with security and quality checks only
