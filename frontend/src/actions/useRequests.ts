// Movement Requests hooks
import { useState, useEffect, useCallback } from 'react';
import { boxRequestsApi, requestsApi } from '../api/requests.api';
import type { CompleteArrivalInput, ReviewRequestInput } from '../api/requests.api';
import type { BoxMovementRequest, MovementRequest, MovementRequestStatus } from '../lib/types';

interface UseRequestsResult {
  requests: MovementRequest[];
  pendingRequests: MovementRequest[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  approve: (id: number, data?: ReviewRequestInput) => Promise<void>;
  reject: (id: number, data?: ReviewRequestInput) => Promise<void>;
  completeArrival: (id: number, data?: CompleteArrivalInput) => Promise<void>;
  verify: (id: number, data?: ReviewRequestInput) => Promise<void>;
}

export function useRequests(status?: MovementRequestStatus): UseRequestsResult {
  const [requests, setRequests] = useState<MovementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = status
        ? await requestsApi.getAll({ status })
        : await requestsApi.getAll();
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const approve = useCallback(async (id: number, data?: ReviewRequestInput) => {
    await requestsApi.approve(id, data);
    await fetchRequests();
  }, [fetchRequests]);

  const reject = useCallback(async (id: number, data?: ReviewRequestInput) => {
    await requestsApi.reject(id, data);
    await fetchRequests();
  }, [fetchRequests]);

  const completeArrival = useCallback(async (id: number, data?: CompleteArrivalInput) => {
    await requestsApi.completeArrival(id, data);
    await fetchRequests();
  }, [fetchRequests]);

  const verify = useCallback(async (id: number, data?: ReviewRequestInput) => {
    await requestsApi.verify(id, data);
    await fetchRequests();
  }, [fetchRequests]);

  const pendingRequests = requests.filter(r => r.status === 'WAITING_APPROVAL');

  return {
    requests,
    pendingRequests,
    loading,
    error,
    refetch: fetchRequests,
    approve,
    reject,
    completeArrival,
    verify,
  };
}

export function usePendingRequests(): UseRequestsResult {
  return useRequests('WAITING_APPROVAL');
}

interface UseItemRequestsResult {
  requests: MovementRequest[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  approve: (id: number, data?: ReviewRequestInput) => Promise<void>;
  reject: (id: number, data?: ReviewRequestInput) => Promise<void>;
  completeArrival: (id: number, data?: CompleteArrivalInput) => Promise<void>;
  verify: (id: number, data?: ReviewRequestInput) => Promise<void>;
}

export function useItemRequests(itemId: number | undefined): UseItemRequestsResult {
  const [requests, setRequests] = useState<MovementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!itemId) {
      setRequests([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await requestsApi.getByItemId(itemId);
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const approve = useCallback(async (id: number, data?: ReviewRequestInput) => {
    await requestsApi.approve(id, data);
    await fetchRequests();
  }, [fetchRequests]);

  const reject = useCallback(async (id: number, data?: ReviewRequestInput) => {
    await requestsApi.reject(id, data);
    await fetchRequests();
  }, [fetchRequests]);

  const completeArrival = useCallback(async (id: number, data?: CompleteArrivalInput) => {
    await requestsApi.completeArrival(id, data);
    await fetchRequests();
  }, [fetchRequests]);

  const verify = useCallback(async (id: number, data?: ReviewRequestInput) => {
    await requestsApi.verify(id, data);
    await fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    loading,
    error,
    refetch: fetchRequests,
    approve,
    reject,
    completeArrival,
    verify,
  };
}

interface UseBoxRequestsResult {
  requests: BoxMovementRequest[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  approve: (id: number, data?: ReviewRequestInput) => Promise<void>;
  reject: (id: number, data?: ReviewRequestInput) => Promise<void>;
  verify: (id: number, data?: ReviewRequestInput) => Promise<void>;
  completeArrival: (id: number, data?: CompleteArrivalInput) => Promise<void>;
}

export function useBoxRequests(status?: MovementRequestStatus): UseBoxRequestsResult {
  const [requests, setRequests] = useState<BoxMovementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = status
        ? await boxRequestsApi.getAll({ status })
        : await boxRequestsApi.getAll();
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch box requests');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const approve = useCallback(async (id: number, data?: ReviewRequestInput) => {
    await boxRequestsApi.approve(id, data);
    await fetchRequests();
  }, [fetchRequests]);

  const reject = useCallback(async (id: number, data?: ReviewRequestInput) => {
    await boxRequestsApi.reject(id, data);
    await fetchRequests();
  }, [fetchRequests]);

  const verify = useCallback(async (id: number, data?: ReviewRequestInput) => {
    await boxRequestsApi.verify(id, data);
    await fetchRequests();
  }, [fetchRequests]);

  const completeArrival = useCallback(async (id: number, data?: CompleteArrivalInput) => {
    await boxRequestsApi.completeArrival(id, data);
    await fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    loading,
    error,
    refetch: fetchRequests,
    approve,
    reject,
    verify,
    completeArrival,
  };
}
