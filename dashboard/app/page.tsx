"use client";

import { useEffect, useState } from "react";
import PRFeed from "@/components/PRFeed";
import DeveloperCards from "@/components/DeveloperCards";
import StatsBar from "@/components/StatsBar";

export default function Home() {
  const [reviews, setReviews] = useState([]);
  const [developers, setDevelopers] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [reviewsRes, devsRes] = await Promise.all([
        fetch("http://localhost:8000/api/reviews"),
        fetch("http://localhost:8000/api/developers"),
      ]);
      setReviews(await reviewsRes.json());
      setDevelopers(await devsRes.json());
    } catch {
      console.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-sm font-bold">
            DM
          </div>
          <div>
            <h1 className="text-lg font-semibold">DevMind</h1>
            <p className="text-xs text-gray-400">Git-native AI teammate · PR Truth Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm text-gray-400">Live</span>
        </div>
      </header>

      <div className="px-8 py-6 space-y-8">
        <StatsBar reviews={reviews} developers={developers} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
              PR Activity
            </h2>
            {loading ? (
              <div className="text-gray-500 text-sm">Loading reviews...</div>
            ) : (
              <PRFeed reviews={reviews} />
            )}
          </div>
          <div>
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
              Developer Insights
            </h2>
            <DeveloperCards developers={developers} />
          </div>
        </div>
      </div>
    </main>
  );
}
