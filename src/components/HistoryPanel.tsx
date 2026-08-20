'use client';

import { useEffect, useState } from 'react';
import { History, ChevronDown, ChevronUp, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface RunSummary {
  id: string;
  timestamp: number;
  createdAt: string;
  prompt: string;
  totalModels: number;
  succeeded: number;
  failed: number;
  images: string[];
}

export function HistoryPanel() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchRuns = async () => {
      try {
        const res = await fetch('/api/runs', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setRuns(data.runs || []);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load runs');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchRuns();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 py-3">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading history…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-xs text-red-500 py-3">Failed to load history: {error}</div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="text-xs text-gray-400 py-3 italic">No saved runs yet.</div>
    );
  }

  return (
    <div className="space-y-2">
      {runs.map((run) => {
        const isOpen = expanded === run.id;
        const date = new Date(run.timestamp);
        const timeStr = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

        return (
          <div key={run.id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : run.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
            >
              <History className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-gray-500">{timeStr}</span>
                  <span className="text-gray-300">·</span>
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    {run.succeeded}
                  </span>
                  <span className="text-gray-300">/</span>
                  <span className="flex items-center gap-1 text-red-500">
                    <XCircle className="w-3 h-3" />
                    {run.failed}
                  </span>
                  <span className="text-gray-400">of {run.totalModels}</span>
                </div>
                <p className="text-xs text-gray-600 truncate mt-0.5">{run.prompt || '(no prompt)'}</p>
              </div>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </button>

            {isOpen && (
              <div className="border-t border-gray-200 p-3 bg-gray-50/50">
                {run.images.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No images saved in this run.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {run.images.map((img) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        key={img}
                        src={`/api/runs/${run.id}/image?file=${encodeURIComponent(img)}`}
                        alt={img}
                        className="w-full h-auto rounded border border-gray-200 bg-white"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
