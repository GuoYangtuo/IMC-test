'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Coins, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { getModelInfo } from '@/lib/models';
import { cn, formatDuration, formatCost, formatTokens } from '@/lib/utils';
import type { ModelResult } from '@/types';

function ResultCard({ result }: { result: ModelResult }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const modelInfo = getModelInfo(result.modelId);

  return (
    <div className="result-card bg-white">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <div>
              <h3 className="font-semibold text-gray-900">
                {modelInfo?.name || result.modelId}
              </h3>
              <p className="text-sm text-gray-500">
                {modelInfo?.providerName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                {formatDuration(result.duration)}
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t p-4 space-y-4">
          {result.success && result.imageUrl && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Generated Image
              </h4>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.imageUrl}
                alt="Generated"
                className="w-full max-w-md rounded-lg border"
              />
            </div>
          )}

          {result.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{result.error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Input Tokens</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatTokens(result.tokenUsage?.inputTokens || 0)}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Output Tokens</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatTokens(result.tokenUsage?.outputTokens || 0)}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Total Tokens</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatTokens(result.tokenUsage?.totalTokens || 0)}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-500 flex items-center gap-1">
                <Coins className="w-4 h-4" />
                Total Cost
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCost(result.cost?.totalCost || 0)}
              </p>
            </div>
          </div>

          <div className="text-xs text-gray-400">
            Generated at {new Date(result.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}

export function ResultsPanel() {
  const { results } = useStore();

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No results yet. Run a test to see results here.</p>
      </div>
    );
  }

  const totalCost = results.reduce(
    (sum, r) => sum + (r.cost?.totalCost || 0),
    0
  );
  const totalTokens = results.reduce(
    (sum, r) => sum + (r.tokenUsage?.totalTokens || 0),
    0
  );
  const avgDuration =
    results.reduce((sum, r) => sum + r.duration, 0) / results.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-center">
          <p className="text-sm text-primary-600 font-medium">Total Cost</p>
          <p className="text-2xl font-bold text-primary-700">
            {formatCost(totalCost)}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-sm text-green-600 font-medium">Total Tokens</p>
          <p className="text-2xl font-bold text-green-700">
            {formatTokens(totalTokens)}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-600 font-medium">Avg Duration</p>
          <p className="text-2xl font-bold text-blue-700">
            {formatDuration(avgDuration)}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {results.map((result) => (
          <ResultCard key={result.modelId} result={result} />
        ))}
      </div>
    </div>
  );
}
