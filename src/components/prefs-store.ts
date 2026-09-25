"use client";

import { useCallback, useLayoutEffect, useSyncExternalStore } from "react";
import { DEFAULT_PREFS, applyPrefs, readPrefs, writePrefs, type Prefs } from "@/lib/prefs";

const listeners = new Set<() => void>();
let current: Prefs | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Prefs {
  if (!current) current = readPrefs();
  return current;
}

export function usePrefs(): [Prefs, (patch: Partial<Prefs>) => void] {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_PREFS);

  // 개발 모드 Strict Mode 재마운트 때 React 가 <html> 속성을 지우므로 다시 적용한다.
  useLayoutEffect(() => applyPrefs(getSnapshot()), []);

  const update = useCallback((patch: Partial<Prefs>) => {
    current = { ...getSnapshot(), ...patch };
    writePrefs(current);
    listeners.forEach((l) => l());
  }, []);

  return [prefs, update];
}
