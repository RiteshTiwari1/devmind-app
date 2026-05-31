# DevMind — The PR Truth Engine

DevMind is a git-native AI PR reviewer. It compares three layers of every pull request:

| Layer | Source | What it reveals |
|-------|--------|-----------------|
| **Promise** | GitHub Issue | What was asked for |
| **Claim** | PR Description | What the developer says they did |
| **Reality** | Code Diff | What actually changed |

The gap becomes a **Truth Score (0–100%)**.

---

## Setup

```bash
# Backend
cd backend
cp .env.example .env   # add OPENAI_API_KEY and GITHUB_TOKEN
pip install -r requirements.txt
npm install
python3 main.py        # runs on :8000

# Dashboard
cd dashboard
npm install
npm run dev -- -p 4000  # runs on :4000
```

Trigger a review manually:
```bash
curl -X POST "http://localhost:8000/api/review/trigger?repo=owner/repo&pr_number=1&pr_author=username&pr_title=Fix+something"
```

---

## Stack

| Layer | Technology |
|---|---|
| AI Framework | GitAgent SDK |
| LLM | OpenAI GPT-4o |
| Backend | FastAPI (Python) |
| Frontend | Next.js + Tailwind |
| GitHub | REST API + Webhooks |

