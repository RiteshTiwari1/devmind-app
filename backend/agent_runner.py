import asyncio
import os
import re
import json
import datetime
from pathlib import Path

from github_client import get_pr, get_pr_diff, get_issue, post_pr_comment, devmind_comment_exists
from database import load_db

AGENT_DIR = os.getenv("DEVMIND_AGENT_DIR", "../agent")
BACKEND_DIR = Path(__file__).parent


async def run_pr_review(repo: str, pr_number: int, pr_author: str) -> dict:
    """
    Reviews a PR using the GitAgent SDK (TypeScript) via gitagent_runner.ts.
    The runner uses a custom submit_truth_analysis tool — LLM MUST call it,
    so output is always structured JSON. No regex parsing.
    """
    # Step 1: Fetch PR data from GitHub
    try:
        pr_data = await get_pr(repo, pr_number)
        diff = await get_pr_diff(repo, pr_number)
        pr_title = pr_data.get("title", "")
        pr_body = pr_data.get("body", "") or ""
    except Exception as e:
        print(f"Failed to fetch PR #{pr_number}: {e}")
        return {"repo": repo, "pr_number": pr_number, "pr_author": pr_author,
                "truth_score": None, "success": False}

    # Step 2: Find linked issue
    issue_content = ""
    issue_number = extract_issue_number(pr_body)
    if issue_number:
        try:
            issue_data = await get_issue(repo, issue_number)
            issue_content = f"Title: {issue_data.get('title', '')}\n\n{issue_data.get('body', '')}"
        except Exception as e:
            print(f"Could not fetch issue #{issue_number}: {e}")

    # Step 3: Load developer memory
    memory = load_developer_memory(pr_author)

    # Step 4: Run GitAgent SDK via TypeScript runner
    input_data = {
        "repo": repo,
        "pr_number": pr_number,
        "pr_author": pr_author,
        "pr_title": pr_title,
        "pr_body": pr_body[:1000],
        "diff": diff[:4000],
        "issue_content": issue_content[:2000],
        "developer_memory": memory,
        "agent_dir": str(Path(AGENT_DIR).resolve()),
    }

    result = await run_gitagent_runner(input_data)

    if not result:
        print(f"PR #{pr_number}: GitAgent runner returned no result")
        return {"repo": repo, "pr_number": pr_number, "pr_author": pr_author,
                "truth_score": None, "success": False}

    truth_score = result.get("truth_score")
    print(f"PR #{pr_number}: score={truth_score}% verdict={result.get('verdict')}")

    # Step 5: Build formatted Truth Report and post to GitHub
    report = build_truth_report(result, pr_number, pr_author)
    try:
        already_posted = await devmind_comment_exists(repo, pr_number)
        if already_posted:
            print(f"PR #{pr_number}: comment already exists — skipping")
        else:
            await post_pr_comment(repo, pr_number, report)
            print(f"Posted DevMind comment on PR #{pr_number}")
    except Exception as e:
        print(f"Failed to post comment on PR #{pr_number}: {e}")

    return {
        "repo": repo,
        "pr_number": pr_number,
        "pr_author": pr_author,
        "truth_score": truth_score,
        "success": True,
    }


async def run_gitagent_runner(input_data: dict) -> "dict | None":
    """Calls the TypeScript GitAgent runner and returns structured JSON."""
    input_json = json.dumps(input_data)

    env = {
        **os.environ,
        "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY", ""),
        "GITHUB_TOKEN": os.getenv("GITHUB_TOKEN", ""),
    }

    try:
        proc = await asyncio.create_subprocess_exec(
            "npx", "tsx",
            str(BACKEND_DIR / "gitagent_runner.ts"),
            input_json,
            cwd=str(BACKEND_DIR),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)

        if stderr:
            print(f"[gitagent] {stderr.decode().strip()}")

        if proc.returncode != 0:
            print(f"GitAgent runner failed with code {proc.returncode}")
            return None

        output = stdout.decode().strip()
        if not output:
            print("GitAgent runner returned empty output")
            return None

        return json.loads(output)

    except asyncio.TimeoutError:
        print("GitAgent runner timed out after 120s")
        proc.kill()
        return None
    except Exception as e:
        print(f"GitAgent runner error: {e}")
        return None


def build_truth_report(result: dict, pr_number: int, pr_author: str) -> str:
    """Builds a clean formatted GitHub comment from structured JSON data."""
    score = result.get("truth_score", 0)
    verdict = result.get("verdict", "INCOMPLETE")
    date = datetime.date.today().isoformat()
    verdict_emoji = {"APPROVED": "✅", "NEEDS_WORK": "⚠️", "INCOMPLETE": "❌"}.get(verdict, "❌")

    reqs = result.get("requirements", [])
    req_rows = ""
    for r in reqs:
        status = r.get("status", "NOT_MET")
        icon = {
            "FULLY_MET": "✅ FULLY MET",
            "PARTIALLY_MET": "⚠️ PARTIAL",
            "NOT_MET": "❌ NOT MET"
        }.get(status, "❌")
        req_rows += f"| {r.get('req', '')} | {icon} | {r.get('evidence', '')} |\n"

    missing = result.get("what_is_missing", [])
    missing_list = "\n".join(f"{i+1}. {item}" for i, item in enumerate(missing)) if missing else "None"

    return f"""## 🤖 DevMind Truth Report

> **PR #{pr_number}** · reviewed by DevMind · {date}

---

### 📊 Truth Score: {score}% — {verdict} {verdict_emoji}

| Layer | Content |
|-------|---------|
| 📋 **Promise** (Issue) | {result.get('promise_summary', 'N/A')} |
| 📝 **Claim** (PR Description) | {result.get('claim_summary', 'N/A')} |
| 💻 **Reality** (Code Changes) | {result.get('reality_summary', 'N/A')} |

---

### ✅ Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
{req_rows}
---

### 🔴 Security Findings
{result.get('security_findings', 'No security issues detected.')}

### 🟡 Code Quality
{result.get('quality_findings', 'No major quality issues.')}

### 📋 What's Needed Before Merge
{missing_list}

### 🧠 Developer Note
{result.get('developer_note', f'Review complete for @{pr_author}.')}

---
*DevMind · Git-native AI teammate · Powered by GitAgent*"""


def extract_issue_number(pr_body: str) -> "int | None":
    match = re.search(r"(?:fixes|closes|resolves)\s+#(\d+)", pr_body, re.IGNORECASE)
    if match:
        return int(match.group(1))
    match = re.search(r"#(\d+)", pr_body)
    if match:
        return int(match.group(1))
    return None


def load_developer_memory(author: str) -> str:
    memory_path = Path(AGENT_DIR) / "memory" / "MEMORY.md"
    try:
        content = memory_path.read_text()
        section = f"## {author}"
        if section in content:
            start = content.index(section)
            end = content.find("\n## ", start + 1)
            return content[start:end if end != -1 else len(content)].strip()
    except Exception:
        pass
    return ""


def ensure_memory_entry(author: str, pr_number: int, truth_score: "int | None"):
    """Rebuild MEMORY.md from all reviews — called after save_review in main.py."""
    memory_path = Path(AGENT_DIR) / "memory" / "MEMORY.md"
    try:
        db = load_db()
        by_dev = {}
        for review in sorted(db["reviews"], key=lambda x: x["pr_number"]):
            dev = review["pr_author"]
            if dev not in by_dev:
                by_dev[dev] = []
            by_dev[dev].append(review)

        lines = ["# Memory\n"]
        for dev, reviews in by_dev.items():
            lines.append(f"\n## {dev}\n\n")
            for r in reviews:
                date = r["reviewed_at"][:10]
                score = f"{r['truth_score']}%" if r["truth_score"] is not None else "N/A"
                verdict = r["verdict"]
                title = r.get("pr_title", f"PR #{r['pr_number']}")
                lines.append(f"- **{date}** — PR #{r['pr_number']}: {title} → {score} {verdict}\n")

        memory_path.parent.mkdir(parents=True, exist_ok=True)
        memory_path.write_text("".join(lines))
        print(f"Memory rebuilt: {sum(len(v) for v in by_dev.values())} entries")
    except Exception as e:
        print(f"Memory rebuild failed: {e}")
