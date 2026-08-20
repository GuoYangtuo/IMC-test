'use client';

import { useEffect, useState } from 'react';

interface RunResult {
  modelId: string;
  modelName: string;
  success: boolean;
  error: string | null;
  duration: number;
  tokenUsage: { inputTokens: number; outputTokens: number; totalTokens: number };
  cost: { inputCostPer1K: number; outputCostPer1K: number; totalCost: number };
  timestamp: number;
}

interface Run {
  id: string;
  timestamp: number;
  prompt: string;
  negativePrompt: string | null;
  totalModels: number;
  succeeded: number;
  failed: number;
  images: string[];
  savedImages: Record<string, string>;
  results: RunResult[];
}

const ALL_MODELS = [
  'gpt-image-2.0',
  'qwen-image-3.0-pro',
  'seedream-5.0-pro',
  'seedream-5.0-lite',
  'doubao-seedream-4-5-251128',
  'nano-banana-2',
];

function localTime(ts: number) {
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

export default function HistoryPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(ALL_MODELS));

  useEffect(() => {
    fetch('/api/runs', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { setRuns(d.runs || []); setLoading(false); })
      .catch((e: Error) => { setErr(e.message); setLoading(false); });
  }, []);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const visible = ALL_MODELS.filter((m) => selected.has(m));

  if (loading) return <div style={{ padding: 12, color: '#666', fontSize: 12 }}>Loading…</div>;
  if (err) return <div style={{ padding: 12, color: 'red', fontSize: 12 }}>Error: {err}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif', fontSize: 11 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
        <span style={{ fontWeight: 600, color: '#111' }}>Image History</span>
        <span style={{ color: '#6b7280' }}>{runs.length} runs</span>

        {/* Dropdown */}
        <div style={{ position: 'relative', marginLeft: 4 }}>
          <button
            onClick={() => setOpen((o) => !o)}
            style={{
              border: '1px solid #d1d5db',
              borderRadius: 4,
              background: '#fff',
              color: '#374151',
              fontSize: 11,
              padding: '2px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Columns ({visible.length})
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {open && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                onClick={() => setOpen(false)}
              />
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 2,
                background: '#fff', border: '1px solid #d1d5db', borderRadius: 6,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 20, minWidth: 200, padding: '4px 0',
              }}>
                {ALL_MODELS.map((m) => (
                  <label key={m} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 10px', cursor: 'pointer', fontSize: 11, color: '#374151',
                  }}>
                    <input
                      type="checkbox"
                      checked={selected.has(m)}
                      onChange={() => toggle(m)}
                      style={{ cursor: 'pointer' }}
                    />
                    {m}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {hovered && (
          <span style={{ color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>
            {hovered}
          </span>
        )}
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: 0 }}>
        <table
          cellSpacing={0}
          cellPadding={0}
          style={{
            borderCollapse: 'collapse',
            width: '100%',
            tableLayout: 'fixed',
            minWidth: 800,
          }}
        >
          <colgroup>
            <col style={{ width: 130 }} />
            {visible.map((m) => (
              <col key={m} />
            ))}
          </colgroup>
          <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: '4px 8px', textAlign: 'left', fontWeight: 600, color: '#374151', borderRight: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db', position: 'sticky', left: 0, background: '#f3f4f6', zIndex: 3 }}>
                Run / Prompt
              </th>
              {visible.map((m) => (
                <th key={m} style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 600, color: '#374151', borderBottom: '1px solid #d1d5db' }}>
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 && (
              <tr><td colSpan={visible.length + 1} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>No runs yet.</td></tr>
            )}
            {runs.map((run) => (
              <tr key={run.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                {/* Run label column */}
                <td style={{ padding: '6px 8px', borderRight: '1px solid #e5e7eb', position: 'sticky', left: 0, background: '#fafafa', zIndex: 1, verticalAlign: 'top' }}>
                  <div style={{ color: '#6b7280', fontSize: 10 }}>{localTime(run.timestamp)}</div>
                  <div style={{ color: '#374151', marginTop: 2, lineHeight: 1.3, maxWidth: 120, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
                    {run.prompt}
                  </div>
                </td>

                {/* One cell per selected model */}
                {visible.map((modelId) => {
                  const result = run.results.find((r) => r.modelId === modelId);
                  const filename = run.savedImages[modelId];

                  return (
                    <td
                      key={modelId}
                      style={{ padding: 0, verticalAlign: 'middle', textAlign: 'center', background: '#fff' }}
                    >
                      {!result || !result.success ? (
                        <div
                          style={{ color: '#dc2626', fontSize: 12, padding: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}
                          title={result?.error ?? ''}
                        >
                          ✗
                        </div>
                      ) : filename ? (
                        <img
                          src={`/api/runs/${run.id}/image?file=${encodeURIComponent(filename)}`}
                          alt={modelId}
                          onMouseEnter={() => setHovered(run.prompt)}
                          onMouseLeave={() => setHovered(null)}
                          style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: 320,
                            objectFit: 'contain',
                            display: 'block',
                            margin: '0 auto',
                            cursor: 'zoom-in',
                          }}
                        />
                      ) : (
                        <div style={{ color: '#9ca3af', fontSize: 11, padding: '24px 0', minHeight: 80 }}>—</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}