import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'plantasia-debug';

function readDebugFlag(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  if (params.get('debug') === '1') {
    return true;
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

let debugEnabled = readDebugFlag();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): boolean {
  return debugEnabled;
}

/** Debug mode — enabled via ?debug=1 or localStorage plantasia-debug=1. */
export function useDebugMode(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export function setDebugMode(enabled: boolean): void {
  debugEnabled = enabled;
  try {
    if (enabled) {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore storage failures
  }
  listeners.forEach((listener) => listener());
}
