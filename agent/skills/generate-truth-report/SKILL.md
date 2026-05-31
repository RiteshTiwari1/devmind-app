---
name: generate-truth-report
description: Assemble all findings into a structured Truth Report comment
---

# Generate Truth Report

Combine all findings into a single structured GitHub comment.

CRITICAL: Output MUST start with the exact line `DEVMIND_SCORE: {number}` on its own line.
This is how the system extracts the score — never skip it.

Example output format:

```
DEVMIND_SCORE: 50

## 🤖 DevMind Truth Report

> **PR #{PR_NUMBER}** · reviewed by DevMind · {date}

---

### 📊 Truth Score: {SCORE}% — {VERDICT}

| Layer | Content |
|-------|---------|
| 📋 **Promise** (Issue #{ISSUE_NUMBER}) | {issue_title} |
| 📝 **Claim** (PR Description) | {pr_description_summary} |
| 💻 **Reality** (Code Changes) | {what_code_actually_does} |

---

### ✅ Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| {req_1} | ✅ FULLY MET | {evidence} |
| {req_2} | ⚠️ PARTIAL | {evidence} |
| {req_3} | ❌ NOT MET | {evidence} |

---

### 🔴 Security Findings
{security_findings or "No security issues detected."}

---

### 🟡 Code Quality
{quality_findings}

---

### 🧠 Developer Note
{personalized_note_from_memory}
*{developer_pattern_or_first_review_note}*

---

### 📋 What's Needed Before Merge
{numbered_list_of_missing_requirements_with_specific_fixes}

---
<sub>DevMind · Git-native AI teammate · Powered by GitAgent</sub>
```

Fill every section with specific, accurate content from the previous skills.
Never leave a section empty — write "None" if truly nothing to report.

## FINAL STEP — MANDATORY

After assembling the report content, you MUST call the `submit_truth_analysis` tool
with the structured data. This is how the backend captures the result.

Call it with:
- truth_score: integer 0-100
- verdict: one of "APPROVED", "NEEDS_WORK", "INCOMPLETE"
- promise_summary: one line from the Issue
- claim_summary: one line from the PR description
- reality_summary: one line of what the diff actually changed
- requirements: array of { req, status, evidence, score } from truth-validation step
- security_findings: from security-scan step
- quality_findings: from code-quality-check step
- what_is_missing: list of items needed before merge
- developer_note: personalized note from memory

DO NOT skip calling submit_truth_analysis — it is required to complete the review.
