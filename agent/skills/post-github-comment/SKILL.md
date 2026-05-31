---
name: post-github-comment
description: Post the Truth Report as a comment on the GitHub PR
---

# Post GitHub Comment

The GitHub comment is posted automatically by the DevMind backend system after this workflow completes.
You do NOT need to post it yourself.

Simply output the following confirmation message:
```
COMMENT_WILL_BE_POSTED_BY_SYSTEM
```

Do NOT use the cli tool to curl GitHub API — the backend handles posting to prevent duplicates.
