import httpx
import os

GITHUB_API = "https://api.github.com"

def get_headers():
    return {
        "Authorization": f"token {os.getenv('GITHUB_TOKEN')}",
        "Accept": "application/vnd.github.v3+json",
    }

async def get_pr(repo: str, pr_number: int) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{GITHUB_API}/repos/{repo}/pulls/{pr_number}", headers=get_headers())
        r.raise_for_status()
        return r.json()

async def get_pr_diff(repo: str, pr_number: int) -> str:
    headers = {**get_headers(), "Accept": "application/vnd.github.v3.diff"}
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{GITHUB_API}/repos/{repo}/pulls/{pr_number}", headers=headers)
        r.raise_for_status()
        return r.text

async def get_issue(repo: str, issue_number: int) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{GITHUB_API}/repos/{repo}/issues/{issue_number}", headers=get_headers())
        r.raise_for_status()
        return r.json()

async def devmind_comment_exists(repo: str, pr_number: int) -> bool:
    """Check if DevMind already posted a comment on this PR."""
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{GITHUB_API}/repos/{repo}/issues/{pr_number}/comments",
            headers=get_headers()
        )
        if r.status_code != 200:
            return False
        comments = r.json()
        return any("DevMind Truth Report" in c.get("body", "") for c in comments)

async def post_pr_comment(repo: str, pr_number: int, body: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{GITHUB_API}/repos/{repo}/issues/{pr_number}/comments",
            headers=get_headers(),
            json={"body": body},
        )
        r.raise_for_status()
        return r.json()
