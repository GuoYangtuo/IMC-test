'use client';

import { useEffect, useState } from 'react';
import { History, CheckCircle, XCircle, Loader2, Coins, AlertCircle, X, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { getModelInfo } from '@/lib/models';
import { formatDuration, formatCost, formatTokens } from '@/lib/utils';

interface RunResult {
  modelId: string;
  modelName: string;
  success: boolean;
  error: string | null;
  duration: number;
  tokenUsage?: { inputTokens: number; outputTokens: number; totalTokens: number };
  cost?: { inputCostPer1K: number; outputCostPer1K: number; totalCost: number };
  timestamp: number;
}

interface RunSummary {
  id: string;
  timestamp: number;
  createdAt: string;
  prompt: string;
  negativePrompt: string | null;
  totalModels: number;
  succeeded: number;
  failed: number;
  images: string[];
  savedImages: Record<string, string>;
  results: RunResult[];
}

function ImageWithOverlay({
  src,
  alt,
  overlay,
  onOpen,
}: {
  src: string;
  alt: string;
  overlay: React.ReactNode;
  onOpen: () => void;
}) {
  return (
    <div
      className="relative group cursor-zoom-in overflow-hidden rounded-md bg-gray-100"
      onClick={onOpen}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="w-full h-auto block" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent text-white p-2 pt-6">
        {overlay}
      </div>
    </div>
  );
}

function ResultTile({
  runId,
  result,
  filename,
  onOpen,
}: {
  runId: string;
  result: RunResult;
  filename?: string;
  onOpen: (src: string, alt: string) => void;
}) {
  const modelInfo = getModelInfo(result.modelId);
  const displayName = modelInfo?.name || result.modelName || result.modelId;

  const overlay = (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        {result.success ? (
          <CheckCircle className="w-3 h-3 text-green-300 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-3 h-3 text-red-300 flex-shrink-0" />
        )}
        <span className="text-[11px] font-semibold truncate">{displayName}</span>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-gray-200/90">
        <span>{formatDuration(result.duration)}</span>
        <span className="flex items-center gap-0.5">
          <Coins className="w-2.5 h-2.5" />
          {formatCost(result.cost?.totalCost ?? 0)}
        </span>
        <span>{formatTokens(result.tokenUsage?.totalTokens ?? 0)} tok</span>
      </div>
      {result.error && (
        <p className="text-[10px] text-red-200/90 truncate" title={result.error}>
          {result.error}
        </p>
      )}
    </div>
  );

  if (!result.success || !filename) {
    return (
      <div className="relative overflow-hidden rounded-md bg-gray-50 border border-gray-200 flex flex-col items-center justify-center text-gray-400 p-3 min-h-[120px]">
        <XCircle className="w-6 h-6 text-red-300 mb-1" />
        <span className="text-[11px] font-medium text-gray-600 text-center truncate w-full">{displayName}</span>
        <p className="text-[10px] text-red-500/80 text-center mt-1 line-clamp-2" title={result.error ?? ''}>
          {result.error || 'Failed'}
        </p>
        <div className="mt-2 w-full">{overlay}</div>
      </div>
    );
  }

  const src = `/api/runs/${runId}/image?file=${encodeURIComponent(filename)}`;
  return (
    <ImageWithOverlay src={src} alt={displayName} overlay={overlay} onOpen={() => onOpen(src, displayName)} />
  );
}

function Lightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6 cursor-zoom-out"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="max-w-full max-h-[90vh] rounded shadow-2xl" />
        <p className="text-center text-white/70 text-xs mt-2">{alt}</p>
      </div>
    </div>
  );
}

export function HistoryPanel() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const historyVersion = useStore((s) => s.historyVersion);
  const bumpHistoryVersion = useStore((s) => s.bumpHistoryVersion);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this run? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/runs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      bumpHistoryVersion();
    } catch (e: any) {
      alert(`Failed to delete: ${e.message}`);
    } finally {
      setDeletingId(null);
    }
  };

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
  }, [historyVersion]);

  return (
    <section className="pt-6 mt-6 border-t border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-gray-500" />
        <h2 className="text-sm font-semibold text-gray-700">History</h2>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-gray-400 py-3">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Loading history…
        </div>
      ) : error ? (
        <div className="text-xs text-red-500 py-3">Failed to load history: {error}</div>
      ) : runs.length === 0 ? (
        <div className="text-xs text-gray-400 py-3 italic">No saved runs yet.</div>
      ) : (
        <div className="space-y-2">
          {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}
          {runs.map((run) => {
            const date = new Date(run.timestamp);
            const timeStr = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            return (
              <div key={run.id} className="relative border border-gray-200 rounded-lg bg-white overflow-hidden">
                <div className="flex items-center gap-3 px-3 py-2.5">
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
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(run.id)}
                  disabled={deletingId === run.id}
                  className="absolute top-2 right-2 p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Delete this run"
                  title="Delete this run"
                >
                  {deletingId === run.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>

                <div className="border-t border-gray-200 p-3 bg-gray-50/50 space-y-3">
                  {run.results.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No results recorded for this run.</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {run.results.map((result) => (
                        <ResultTile
                          key={result.modelId}
                          runId={run.id}
                          result={result}
                          filename={run.savedImages[result.modelId]}
                          onOpen={(src, alt) => setLightbox({ src, alt })}
                        />
                      ))}
                    </div>
                  )}
                  {run.negativePrompt && (
                    <div className="text-[11px] text-gray-500 bg-white border border-gray-200 rounded p-2">
                      <span className="font-medium text-gray-600">Negative: </span>
                      {run.negativePrompt}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}