import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from webhook import verify_signature, parse_pr_event
from agent_runner import run_pr_review, ensure_memory_entry
from database import save_review, get_reviews, get_developer_stats

review_queue: asyncio.Queue = asyncio.Queue()

@asynccontextmanager
async def lifespan(app: FastAPI):
    worker = asyncio.create_task(review_worker())
    yield
    worker.cancel()

app = FastAPI(title="DevMind API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

async def review_worker():
    """Background worker that processes PR reviews from queue."""
    while True:
        pr_info = await review_queue.get()
        try:
            result = await run_pr_review(
                repo=pr_info["repo"],
                pr_number=pr_info["pr_number"],
                pr_author=pr_info["pr_author"],
            )
            verdict = get_verdict(result.get("truth_score"))
            save_review(
                repo=pr_info["repo"],
                pr_number=pr_info["pr_number"],
                pr_author=pr_info["pr_author"],
                pr_title=pr_info["pr_title"],
                truth_score=result.get("truth_score"),
                verdict=verdict,
            )
            # Rebuild MEMORY.md after save so this PR is included
            ensure_memory_entry(pr_info["pr_author"], pr_info["pr_number"], result.get("truth_score"))
        except Exception as e:
            print(f"Review failed for PR #{pr_info['pr_number']}: {e}")
        finally:
            review_queue.task_done()

def get_verdict(score: "int | None") -> str:
    if score is None:
        return "PENDING"
    if score >= 85:
        return "APPROVED"
    if score >= 50:
        return "NEEDS_WORK"
    return "INCOMPLETE"

@app.post("/webhook/github")
async def github_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("X-Hub-Signature-256", "")

    if not verify_signature(body, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = await request.json()
    event_type = request.headers.get("X-GitHub-Event", "")

    if event_type != "pull_request":
        return {"status": "ignored", "reason": f"Event type: {event_type}"}

    pr_info = parse_pr_event(payload)
    if not pr_info:
        return {"status": "ignored", "reason": "Not an open/reopen action"}

    await review_queue.put(pr_info)
    return {"status": "queued", "pr_number": pr_info["pr_number"], "repo": pr_info["repo"]}

@app.get("/api/reviews")
async def list_reviews(limit: int = 20):
    return get_reviews(limit)

@app.get("/api/developers")
async def list_developers():
    return get_developer_stats()

@app.get("/api/health")
async def health():
    return {"status": "ok", "queue_size": review_queue.qsize()}

@app.post("/api/review/trigger")
async def trigger_review(repo: str, pr_number: int, pr_author: str = "unknown", pr_title: str = "Manual trigger"):
    """Manually trigger a review — useful for testing."""
    pr_info = {"repo": repo, "pr_number": pr_number, "pr_author": pr_author, "pr_title": pr_title}
    await review_queue.put(pr_info)
    return {"status": "queued", "pr_number": pr_number}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
