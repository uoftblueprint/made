import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Reads/writes a single query parameter, keeping it in sync with the URL.
 * Returns [value, setter] like useState.
 */
export function useQueryState(
  key: string,
  defaultValue: string = ''
): [string, (v: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(key) ?? defaultValue;

  const setValue = useCallback(
    (next: string) => {
      setSearchParams((prev) => {
        const updated = new URLSearchParams(prev);
        if (next === defaultValue || next === '') {
          updated.delete(key);
        } else {
          updated.set(key, next);
        }
        return updated;
      }, { replace: true });
    },
    [key, defaultValue, setSearchParams]
  );

  return [value, setValue];
}

/**
 * Same as useQueryState but for numeric values (returns number | null).
 */
export function useQueryStateNumber(
  key: string,
  defaultValue: number | null = null
): [number | null, (v: number | null) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(key);
  const value = raw !== null ? Number(raw) : defaultValue;

  const setValue = useCallback(
    (next: number | null) => {
      setSearchParams((prev) => {
        const updated = new URLSearchParams(prev);
        if (next === null || next === defaultValue) {
          updated.delete(key);
        } else {
          updated.set(key, String(next));
        }
        return updated;
      }, { replace: true });
    },
    [key, defaultValue, setSearchParams]
  );

  return [value, setValue];
}
