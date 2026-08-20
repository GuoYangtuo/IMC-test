/**
 * Shared configuration for model service calls.
 *
 * Single source of truth for cross-cutting settings (timeouts, retry policy,
 * polling intervals, etc.) so we don't have magic numbers scattered across
 * individual service files.
 */

export const REQUEST_TIMEOUT_MS = 10 * 60 * 1000; // 600,000ms = 10 minutes
