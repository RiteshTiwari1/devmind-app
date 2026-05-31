---
name: fetch-pr-diff
description: Fetch the PR diff, changed files, and PR description from GitHub
---

# Fetch PR Diff

When this skill is invoked, you will receive PR context variables: REPO, PR_NUMBER, GITHUB_TOKEN.

Steps:
1. Use the cli tool to call GitHub API and fetch the PR details:
   ```
   curl -s -H "Authorization: token $GITHUB_TOKEN" \
     https://api.github.com/repos/$REPO/pulls/$PR_NUMBER
   ```
2. Extract: title, body (PR description), user.login (author), head.sha
3. Fetch the diff:
   ```
   curl -s -H "Authorization: token $GITHUB_TOKEN" \
     -H "Accept: application/vnd.github.v3.diff" \
     https://api.github.com/repos/$REPO/pulls/$PR_NUMBER
   ```
4. Store these values for use in subsequent skills:
   - PR title
   - PR description (the CLAIM)
   - PR author username
   - Full diff (the REALITY)
   - List of changed files
