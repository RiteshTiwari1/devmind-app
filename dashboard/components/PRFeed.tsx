"use client";

interface Review {
  id: number;
  repo: string;
  pr_number: number;
  pr_title: string;
  pr_author: string;
  truth_score: number | null;
  verdict: string;
  reviewed_at: string;
}

interface PRFeedProps {
  reviews: Review[];
}

function TruthBadge({ score, verdict }: { score: number | null; verdict: string }) {
  if (score === null) return <span className="text-xs text-gray-500 px-2 py-1 rounded-full bg-gray-800">Pending</span>;

  const color =
    verdict === "APPROVED" ? "bg-green-900 text-green-300 border-green-700" :
    verdict === "NEEDS_WORK" ? "bg-yellow-900 text-yellow-300 border-yellow-700" :
    "bg-red-900 text-red-300 border-red-700";

  return (
    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${color}`}>
      {score}% · {verdict.replace("_", " ")}
    </span>
  );
}

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return null;
  const color = score >= 85 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="w-full bg-gray-800 rounded-full h-1 mt-2">
      <div className={`h-1 rounded-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
    </div>
  );
}

export default function PRFeed({ reviews }: PRFeedProps) {
  if (reviews.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
        <p className="text-gray-500 text-sm">No reviews yet.</p>
        <p className="text-gray-600 text-xs mt-1">Open a PR on a monitored repo to see DevMind in action.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <div key={`${review.repo}-${review.pr_number}-${review.reviewed_at}`} className="bg-gray-900 rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-500 font-mono">{review.repo}</span>
                <span className="text-xs text-gray-600">·</span>
                <span className="text-xs text-violet-400 font-mono">#{review.pr_number}</span>
              </div>
              <p className="text-sm font-medium text-white truncate">{review.pr_title}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-400">by <span className="text-gray-300">@{review.pr_author}</span></span>
                <span className="text-xs text-gray-600">{new Date(review.reviewed_at).toLocaleString()}</span>
              </div>
              <ScoreBar score={review.truth_score} />
            </div>
            <TruthBadge score={review.truth_score} verdict={review.verdict} />
          </div>
        </div>
      ))}
    </div>
  );
}
