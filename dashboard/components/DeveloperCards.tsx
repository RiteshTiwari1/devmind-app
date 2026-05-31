"use client";

interface DeveloperReview {
  truth_score: number | null;
  pr_number: number;
  reviewed_at: string;
}

interface Developer {
  avg_truth_score: number;
  reviews: DeveloperReview[];
}

interface DeveloperCardsProps {
  developers: Record<string, Developer>;
}

function TrendIndicator({ reviews }: { reviews: DeveloperReview[] }) {
  const scores = reviews
    .filter((r) => r.truth_score !== null)
    .slice(-4)
    .map((r) => r.truth_score as number);

  if (scores.length < 2) return null;

  const first = scores[0];
  const last = scores[scores.length - 1];
  const diff = last - first;

  if (diff > 5) return <span className="text-xs text-green-400">↑ Improving</span>;
  if (diff < -5) return <span className="text-xs text-red-400">↓ Declining</span>;
  return <span className="text-xs text-gray-500">→ Stable</span>;
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 85 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <svg width="52" height="52" className="rotate-[-90deg]">
      <circle cx="26" cy="26" r={r} fill="none" stroke="#1f2937" strokeWidth="4" />
      <circle
        cx="26" cy="26" r={r} fill="none"
        stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
      <text
        x="26" y="26"
        textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize="10" fontWeight="bold"
        className="rotate-90"
        transform="rotate(90 26 26)"
      >
        {score}%
      </text>
    </svg>
  );
}

export default function DeveloperCards({ developers }: DeveloperCardsProps) {
  const entries = Object.entries(developers);

  if (entries.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
        <p className="text-gray-500 text-sm">No developers yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map(([username, data]) => (
        <div key={username} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-800 flex items-center justify-center text-xs font-bold uppercase">
              {username[0]}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">@{username}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{data.reviews.length} PRs reviewed</span>
                <TrendIndicator reviews={data.reviews} />
              </div>
            </div>
            <ScoreRing score={data.avg_truth_score} />
          </div>

          {/* Mini score history */}
          <div className="mt-3 flex gap-1">
            {data.reviews.slice(-8).map((r, i) => {
              const score = r.truth_score ?? 0;
              const h = Math.max(4, Math.round((score / 100) * 28));
              const color = score >= 85 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500";
              return (
                <div key={i} className="flex-1 flex items-end" title={`PR #${r.pr_number}: ${score}%`}>
                  <div className={`w-full rounded-sm ${color} opacity-80`} style={{ height: `${h}px` }} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
