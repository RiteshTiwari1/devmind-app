---
name: code-quality-check
description: Review code quality, error handling, and maintainability
---

# Code Quality Check

Review the diff for these quality dimensions:

## Error Handling
- Are exceptions caught and handled properly?
- Are error messages informative but not exposing internals?
- Are edge cases considered (null, empty, 0, negative values)?

## Code Clarity
- Are variable and function names descriptive?
- Is there unnecessary complexity that could be simplified?
- Are there magic numbers that should be constants?

## Maintainability
- Is there duplicated code that should be extracted?
- Are functions doing too many things?
- Is the code consistent with the surrounding style?

## Testing
- Are there new tests for the new/changed functionality?
- Do existing tests still cover the changed code?

GOOD — No immediate issues found in error handling, clarity, or maintainability for the mask implementation in `src/payment.py`.
Rate each dimension: GOOD / NEEDS IMPROVEMENT / POOR
List specific issues with file and line number.
Keep it concise — top 3 issues maximum.
