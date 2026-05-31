"use client";

interface Review {
  truth_score: number | null;
  verdict: string;
}

interface StatsBarProps {
  reviews: Review[];
  developers: Record<string, { avg_truth_score: number; reviews: Review[] }>;
}

export default function StatsBar({ reviews, developers }: StatsBarProps) {
  const totalReviews = reviews.length;
  const approved = reviews.filter((r) => r.verdict === "APPROVED").length;
  const needsWork = reviews.filter((r) => r.verdict === "NEEDS_WORK").length;
  const incomplete = reviews.filter((r) => r.verdict === "INCOMPLETE").length;
  const scores = reviews.filter((r) => r.truth_score !== null).map((r) => r.truth_score as number);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  const stats = [
    { label: "Total Reviews", value: totalReviews, color: "text-white" },
    { label: "Avg Truth Score", value: avgScore !== null ? `${avgScore}%` : "—", color: "text-violet-400" },
    { label: "Approved", value: approved, color: "text-green-400" },
    { label: "Needs Work", value: needsWork, color: "text-yellow-400" },
    { label: "Incomplete", value: incomplete, color: "text-red-400" },
    { label: "Developers", value: Object.keys(developers).length, color: "text-blue-400" },
  ];

  return (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">{s.label}</p>
          <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}
