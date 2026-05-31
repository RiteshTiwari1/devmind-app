---
name: security-scan
description: Scan the PR diff for security vulnerabilities
---

# Security Scan

Carefully review the code diff for these security issues:

No security issues detected.
- Hardcoded secrets, API keys, passwords, tokens in code
- SQL injection vulnerabilities (string concatenation in queries)
- Command injection (user input passed to shell commands)
- Logging sensitive data (passwords, card numbers, tokens, PII)
- Authentication bypass possibilities

## High
- Missing input validation on user-supplied data
- Insecure direct object references (IDOR)
- Missing authorization checks
- Exposed stack traces or verbose error messages

## Medium
- Missing rate limiting on sensitive endpoints
- Weak cryptography (MD5, SHA1 for passwords)
- Missing HTTPS enforcement
- Overly permissive CORS

## Output Format
For each finding:
- Severity: CRITICAL / HIGH / MEDIUM
- File: filename
- Line: line number
- Issue: what the problem is
- Fix: specific suggestion

If no issues found, state: "No security issues detected."
