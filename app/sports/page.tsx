"use client";

import { useEffect, useState } from "react";
import { useLiveScore } from "@/app/hooks/useLiveScore";
import type { Fixture } from "@/app/lib/sports-service/football";

export default function SportsPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/sports/matches")
      .then((r) => r.json())
      .then((data: Fixture[]) => {
        console.log("fixtures data:", data);
        setFixtures(data);
        if (data.length > 0) setSelectedId(data[0].FixtureId);
      })
      .catch(console.error);
  }, []);

  const { score, loading, error } = useLiveScore(selectedId);

  const home = score?.scoreSoccer?.Participant1?.Total?.Goals ?? "–";
  const away = score?.scoreSoccer?.Participant2?.Total?.Goals ?? "–";
  const selected = fixtures.find((f) => f.FixtureId === selectedId);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">World Cup Live Scores</h1>

      {/* Fixture picker */}
      <div className="flex flex-wrap gap-2">
        {fixtures.map((f) => (
          <button
            key={f.FixtureId}
            onClick={() => setSelectedId(f.FixtureId)}
            className={`px-3 py-1 rounded text-sm border ${
              selectedId === f.FixtureId
                ? "bg-white text-black"
                : "border-white/20 hover:border-white/60"
            }`}
          >
            {f.Participant1} vs {f.Participant2}
          </button>
        ))}
      </div>

      {/* Live score */}
      {selectedId && (
        <div className="text-center space-y-2">
          <p className="text-sm text-white/50">{selected?.Competition}</p>
          <div className="text-5xl font-mono font-bold">
            {loading ? "..." : `${home} – ${away}`}
          </div>
          <p className="text-sm text-white/50">{score?.gameState ?? ""}</p>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      )}

      {fixtures.length === 0 && (
        <p className="text-white/50">No fixtures found — check your API token or competition ID.</p>
      )}
    </div>
  );
}
