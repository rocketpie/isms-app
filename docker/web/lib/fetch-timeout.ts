//lib/fetch-timeout.ts
// Hard 15s default for all network calls
export const DEFAULT_TIMEOUT_MS = 15_000

export function createTimeoutSignal(ms = DEFAULT_TIMEOUT_MS): AbortSignal {
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), ms)
  // Clear the timer if the signal is already aborted or when consumers abort
  ac.signal.addEventListener('abort', () => clearTimeout(t), { once: true })
  return ac.signal
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  ms = DEFAULT_TIMEOUT_MS
) {
  // Respect an existing caller-provided signal, otherwise use our timeout signal
  const signal = init.signal ?? createTimeoutSignal(ms)
  return fetch(input as any, { ...init, signal })
}
