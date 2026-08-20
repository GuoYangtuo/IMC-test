'use client';

import { useEffect, useRef, useState } from 'react';
import { Clock, Coins, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { getModelInfo } from '@/lib/models';
import { formatDuration, formatCost, formatTokens } from '@/lib/utils';
import { HistoryPanel } from './HistoryPanel';
import type { ModelResult } from '@/types';

function PendingCard({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 100);
    return () => clearInterval(id);
  }, [startedAt]);

  return (
    <div className="flex items-center justify-center h-full min-h-[180px] bg-gray-50 rounded-lg border border-dashed border-gray-300">
      <div className="flex flex-col items-center gap-2 text-gray-400">
        <Loader2 className="w-7 h-7 animate-spin text-primary-400" />
        <span className="text-xs">Generating…</span>
        <span className="text-xs font-mono text-gray-400">{formatDuration(elapsed)}</span>
      </div>
    </div>
  );
}

function ResultRow({ result }: { result: ModelResult }) {
  const modelInfo = getModelInfo(result.modelId);

  return (
    <div className="flex items-start gap-4 border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Left: image */}
      <div className="flex-shrink-0 bg-gray-100 flex items-center justify-center" style={{ width: '360px', minHeight: '240px' }}>
        {result.success && result.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={result.imageUrl}
            alt="Generated"
            className="w-full h-full object-contain"
            style={{ maxHeight: '400px' }}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full min-h-[180px]">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        )}
      </div>

      {/* Right: metadata */}
      <div className="flex-1 py-3 pr-4 space-y-3 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2">
          {result.success ? (
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          )}
          <span className="text-sm font-semibold text-gray-800 truncate">
            {modelInfo?.name || result.modelId}
          </span>
          <span className="text-xs text-gray-400 flex-shrink-0">·</span>
          <span className="text-xs text-gray-400 flex-shrink-0">{modelInfo?.providerName}</span>
        </div>

        {/* Error */}
        {result.error && (
          <p className="text-xs text-red-600 font-mono leading-relaxed bg-red-50 border border-red-200 rounded px-2 py-1.5">
            {result.error}
          </p>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 rounded p-2 border border-gray-200">
            <p className="text-gray-400">Duration</p>
            <p className="font-medium text-gray-800">{formatDuration(result.duration)}</p>
          </div>
          <div className="bg-gray-50 rounded p-2 border border-gray-200">
            <p className="text-gray-400 flex items-center gap-0.5">
              <Coins className="w-3 h-3" />Cost
            </p>
            <p className="font-medium text-gray-800">{formatCost(result.cost?.totalCost ?? 0)}</p>
          </div>
          <div className="bg-gray-50 rounded p-2 border border-gray-200">
            <p className="text-gray-400">Input tokens</p>
            <p className="font-medium text-gray-800">{formatTokens(result.tokenUsage?.inputTokens ?? 0)}</p>
          </div>
          <div className="bg-gray-50 rounded p-2 border border-gray-200">
            <p className="text-gray-400">Output tokens</p>
            <p className="font-medium text-gray-800">{formatTokens(result.tokenUsage?.outputTokens ?? 0)}</p>
          </div>
        </div>

        <div className="text-[10px] text-gray-400">
          {new Date(result.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

export function ResultsPanel() {
  const { results, pendingModels, selectionOrder } = useStore();
  const [runStartedAt, setRunStartedAt] = useState<number>(0);
  const pendingStartedRef = useRef<number>(0);

  // Track when the current run started.
  useEffect(() => {
    if (pendingModels.length > 0 && pendingStartedRef.current === 0) {
      pendingStartedRef.current = Date.now();
      setRunStartedAt(Date.now());
    }
    if (pendingModels.length === 0) {
      pendingStartedRef.current = 0;
    }
  }, [pendingModels.length]);

  const orderedIds = selectionOrder.length > 0
    ? selectionOrder
    : results.map((r) => r.modelId);

  if (results.length === 0 && pendingModels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-8">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">
          Upload an image, enter a prompt,<br />select models, then run.
        </p>
      </div>
    );
  }

  const totalCost = results.reduce((s, r) => s + (r.cost?.totalCost ?? 0), 0);
  const totalTokens = results.reduce((s, r) => s + (r.tokenUsage?.totalTokens ?? 0), 0);
  const avgDuration = results.length > 0
    ? results.reduce((s, r) => s + r.duration, 0) / results.length
    : 0;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-6 px-1">
        <div className="flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500">Total cost</span>
          <span className="text-sm font-semibold text-gray-800">{formatCost(totalCost)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Tokens</span>
          <span className="text-sm font-semibold text-gray-800">{formatTokens(totalTokens)}</span>
        </div>
        {results.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">Avg time</span>
            <span className="text-sm font-semibold text-gray-800">{formatDuration(avgDuration)}</span>
          </div>
        )}
        <div className="ml-auto text-xs text-gray-400">
          {results.length}/{orderedIds.length} done
        </div>
      </div>

      {/* Result rows — always in selection order */}
      <div className="space-y-3">
        {orderedIds.map((id) => {
          const finished = results.find((r) => r.modelId === id);
          if (finished) {
            return <ResultRow key={id} result={finished} />;
          }
          // Still pending — render placeholder in selection order
          if (pendingModels.includes(id)) {
            return (
              <div key={id} className="flex items-start gap-4 border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div
                  className="flex-shrink-0 bg-gray-100 flex items-center justify-center"
                  style={{ width: '360px', minHeight: '240px' }}
                >
                  <PendingCard startedAt={runStartedAt} />
                </div>
                <div className="flex-1 py-3 pr-4 space-y-3 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-primary-500 animate-spin flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-800 truncate">
                      {getModelInfo(id)?.name || id}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs opacity-40">
                    {(['Duration', 'Cost', 'Input tokens', 'Output tokens'] as const).map((label) => (
                      <div key={label} className="bg-gray-50 rounded p-2 border border-gray-200">
                        <p className="text-gray-400">{label}</p>
                        <p className="font-medium text-gray-800">—</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
