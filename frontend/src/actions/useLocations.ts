// Locations hooks
import { useState, useEffect, useCallback } from 'react';
import { locationsApi } from '../api/locations.api';
import type { Location, LocationDetail, CreateLocationData } from '../api/locations.api';

interface UseLocationsResult {
  locations: Location[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLocations(): UseLocationsResult {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await locationsApi.getAll();
      setLocations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return {
    locations,
    loading,
    error,
    refetch: fetchLocations,
  };
}

interface UseLocationDetailResult {
  location: LocationDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLocationDetail(id: number | null): UseLocationDetailResult {
  const [location, setLocation] = useState<LocationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async () => {
    if (id === null) {
      setLocation(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await locationsApi.getById(id);
      setLocation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch location');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return {
    location,
    loading,
    error,
    refetch: fetchLocation,
  };
}

interface UseCreateLocationResult {
  createLocation: (data: CreateLocationData) => Promise<Location>;
  creating: boolean;
  error: string | null;
}

export function useCreateLocation(): UseCreateLocationResult {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLocation = useCallback(async (data: CreateLocationData): Promise<Location> => {
    try {
      setCreating(true);
      setError(null);
      const result = await locationsApi.create(data);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create location';
      setError(message);
      throw err;
    } finally {
      setCreating(false);
    }
  }, []);

  return {
    createLocation,
    creating,
    error,
  };
}
