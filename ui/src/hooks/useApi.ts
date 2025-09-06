import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../utils/api';
import type { CellStatsResponse, HeatmapData } from '../types/api';

export const useHeatmap = (collectorId: string, cameraId: string, windowMs: number = 3600000) => {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const heatmapData = await apiClient.getHeatmap(collectorId, cameraId, windowMs);
      setData(heatmapData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch heatmap data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [collectorId, cameraId, windowMs, refreshTrigger]);

  const refresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return { data, loading, error, refresh };
};

export const useCellStats = (collectorId: string, cameraId: string, cellId?: string) => {
  const [data, setData] = useState<CellStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const statsData = await apiClient.getCellStats(collectorId, cameraId, cellId);
        setData(statsData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch cell stats');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [collectorId, cameraId, cellId]);

  return { data, loading, error };
};

export const useSystemStatus = () => {
  const [status, setStatus] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [statusData, healthData] = await Promise.all([
          apiClient.getStatus(),
          apiClient.getHealth(),
        ]);
        setStatus(statusData);
        setHealth(healthData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch system status');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { status, health, loading, error };
};

export const useActiveObjects = (collectorId: string, cameraId: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const objectsData = await apiClient.getActiveObjects(collectorId, cameraId);
      setData(objectsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch active objects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [collectorId, cameraId, refreshTrigger]);

  const refresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return { data, loading, error, refresh };
};

export const useAutoRefresh = (callback: () => void, interval: number = 5000) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isEnabled) {
      intervalRef.current = setInterval(callback, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [callback, interval, isEnabled]);

  return { isEnabled, setIsEnabled };
};