import { useEffect, useRef, useState } from "react";
import type { LiveScoreUpdate } from "@/app/lib/sports-service/football";

interface UseLiveScoreResult {
  score: LiveScoreUpdate | null;
  loading: boolean;
  error: string | null;
}

export function useLiveScore(fixtureId: number | null): UseLiveScoreResult {
  const [score, setScore] = useState<LiveScoreUpdate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!fixtureId) return;

    let active = true;
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);
    setScore(null);

    (async () => {
      try {
        const res = await fetch(`/api/sports/scores/${fixtureId}`, {
          signal: controller.signal,
        });
        console.log("scores res",res);
        if (!res.ok || !res.body) {
          const text = await res.text().catch(() => `HTTP ${res.status}`);
          if (active) {
            let message = text;
            try {
              const parsed = JSON.parse(text);
              message = parsed.detail ?? parsed.error ?? text;
            } catch {
              // plain text error
            }
            setError(message || `Score unavailable (${res.status})`);
          }
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        if (active) setLoading(false);

        while (active) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data:")) {
              const raw = line.slice(5).trim();
              if (!raw || raw === "{}") continue;
              try {
                const parsed: LiveScoreUpdate = JSON.parse(raw);
                if (active) setScore(parsed);
              } catch {
                // skip malformed SSE frames
              }
            }
          }
        }
      } catch (err) {
        if (active && !(err instanceof DOMException && err.name === "AbortError")) {
          setError(err instanceof Error ? err.message : "Connection failed");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
      controllerRef.current = null;
    };
  }, [fixtureId]);

  return { score, loading, error };
}
