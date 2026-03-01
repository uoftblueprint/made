// Boxes hooks
import { useState, useEffect, useCallback } from 'react';
import { boxesApi } from '../api/boxes.api';
import type { Box, BoxDetail } from '../api/boxes.api';

interface UseBoxesResult {
  boxes: Box[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBoxes(): UseBoxesResult {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoxes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await boxesApi.getAll();
      setBoxes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch boxes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoxes();
  }, [fetchBoxes]);

  return {
    boxes,
    loading,
    error,
    refetch: fetchBoxes,
  };
}

interface UseBoxDetailResult {
  box: BoxDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBoxDetail(id: number | null): UseBoxDetailResult {
  const [box, setBox] = useState<BoxDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBox = useCallback(async () => {
    if (id === null) {
      setBox(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await boxesApi.getById(id);
      setBox(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch box');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBox();
  }, [fetchBox]);

  return {
    box,
    loading,
    error,
    refetch: fetchBox,
  };
}
