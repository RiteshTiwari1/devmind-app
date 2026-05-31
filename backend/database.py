import json
import os
from datetime import datetime
from pathlib import Path

DB_FILE = Path("devmind_reviews.json")

def load_db() -> dict:
    if DB_FILE.exists():
        return json.loads(DB_FILE.read_text())
    return {"reviews": [], "developers": {}}

def save_db(data: dict):
    DB_FILE.write_text(json.dumps(data, indent=2, default=str))

def save_review(repo: str, pr_number: int, pr_author: str, pr_title: str, truth_score: "int | None", verdict: str):
    db = load_db()
    review = {
        "id": len(db["reviews"]) + 1,
        "repo": repo,
        "pr_number": pr_number,
        "pr_author": pr_author,
        "pr_title": pr_title,
        "truth_score": truth_score,
        "verdict": verdict,
        "reviewed_at": datetime.utcnow().isoformat(),
    }
    db["reviews"].insert(0, review)

    if pr_author not in db["developers"]:
        db["developers"][pr_author] = {"reviews": [], "avg_truth_score": 0}
    db["developers"][pr_author]["reviews"].append(review)

    scores = [r["truth_score"] for r in db["developers"][pr_author]["reviews"] if r["truth_score"] is not None]
    if scores:
        db["developers"][pr_author]["avg_truth_score"] = round(sum(scores) / len(scores))

    save_db(db)
    return review

def get_reviews(limit: int = 20) -> list:
    db = load_db()
    return db["reviews"][:limit]

def get_developer_stats() -> dict:
    db = load_db()
    return db["developers"]
