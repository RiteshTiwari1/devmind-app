---
name: truth-validation
description: The core skill — compare Promise vs Claim vs Reality to calculate Truth Score
confidence: 1
usage_count: 1
success_count: 1
failure_count: 0
negative_examples: []
---

# Truth Validation

This is the most important skill. You are comparing three layers:

- **PROMISE** = GitHub Issue (what was asked for)
- **CLAIM** = PR description (what developer says they did)
- **REALITY** = Actual code diff (what was really done)

## Step 1: Extract Requirements From the Issue

Read the Issue body carefully. Extract every specific requirement as a numbered list.
Be precise — "Fix email validation for special chars" becomes:
1. Handle + sign in email addresses
2. Handle . sign in email addresses
3. Handle - sign in email addresses
4. No regression for standard email formats

## Step 2: Score Each Requirement Against the Code Diff

For each requirement, examine the actual code changes and assign:
- **FULLY_MET** = 100 points — code completely and correctly addresses this
- **PARTIALLY_MET** = 50 points — code addresses some but not all aspects
- **NOT_MET** = 0 points — code does not address this at all

Provide specific evidence: "Regex on line 34 now includes + but not . or -"

## Step 3: Calculate Truth Score

```
Truth Score = sum of all requirement scores / (number of requirements × 100) × 100
```

Example:
- Req 1: FULLY_MET = 100
- Req 2: NOT_MET = 0
- Req 3: NOT_MET = 0
- Req 4: FULLY_MET = 100

Truth Score = (100 + 0 + 0 + 100) / (4 × 100) × 100 = 50%

### Requirements Coverage

1. Remove card number from all log statements - ✅ FULLY MET
2. If logging is needed, only log last 4 digits (masked: ****1234) - ✅ FULLY MET
3. Audit all other log statements for sensitive data - ✅ FULLY MET
4. Add a comment explaining PCI requirements near payment processing - ✅ FULLY MET

Truth Score: 100%
Verdict: APPROVED

Clearly state what requirements are unmet and what specific changes would fix them.

## Output
Return a structured object with:
- requirements: list of {requirement, status, evidence, score}
- truth_score: number (0-100)
- missing: list of unmet requirements
- verdict: APPROVED (>=85%) / NEEDS_WORK (50-84%) / INCOMPLETE (<50%)
