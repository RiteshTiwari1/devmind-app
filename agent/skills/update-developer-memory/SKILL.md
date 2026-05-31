---
name: update-developer-memory
description: Save key observations about the developer to git-committed memory
---

# Update Developer Memory

After every review, save 1-2 key observations about the developer to MEMORY.md.

## What to Save

Save patterns that are:
- Recurring (seen before) — increase confidence
- Significant (affects quality or security)
- Actionable (can be improved)

## Format

CRITICAL: The memory save action OVERWRITES the entire file.
You MUST load the existing content first and include it in your save.

## Exact Steps — Follow in Order

Step 1: Load existing memory
```
memory(action: load)
```
This returns the current full content of MEMORY.md.

Step 2: Build the new full file content
Take the ENTIRE content returned from Step 1.
Add your new observation line to the {developer_username} section.
If the section doesn't exist, add it at the end.

Step 3: Save the FULL combined content
```
memory(action: save, content: <ENTIRE FILE CONTENT INCLUDING OLD + NEW>, message: "memory: {developer_username}: {short observation}")
```

The content you pass MUST include ALL existing lines plus your new one.
Never pass only your new observation — that will delete all previous entries.

## Correct Format

```
# Memory

## {developer_username}

- **2026-05-30** — PR #4: {observation}
- **2026-05-30** — PR #5: {observation}
- **2026-05-30** — PR #6: {observation}
- Pattern: {recurring pattern}
- Strength: {what they do well}
```

## Rules
- Each bullet: exactly ONE dash + space: `- `
- Never write `- -` (double dash)
- Always include the `# Memory` heading at the top
- Always include ALL existing entries — do not drop any

## Examples of Good Observations

- "2026-05-28 — PR #12: Fixed reported regex case but missed dot notation edge case (2nd time)"
- "2026-05-21 — PR #9: Hardcoded API key in config (security: CRITICAL)"
- "Pattern: Tends to fix the specific reported bug but miss edge cases in the same function"
- "Strength: Excellent error handling and descriptive variable names"

## What NOT to Save

- Do not save secrets, tokens, passwords
- Do not save personal information
- Do not save trivial style observations

After writing to MEMORY.md, the memory tool will auto-commit with git.
