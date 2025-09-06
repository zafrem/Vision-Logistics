import axios from 'axios';
import type { CellStatsResponse, HeatmapData, ObjectDetailsResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const apiClient = {
  getCellStats: async (
    collectorId: string, 
    cameraId: string, 
    cellId?: string
  ): Promise<CellStatsResponse> => {
    const params = new URLSearchParams({
      collector_id: collectorId,
      camera_id: cameraId,
    });
    
    if (cellId) {
      params.append('cell_id', cellId);
    }

    const response = await api.get(`/stats/cells?${params}`);
    return response.data;
  },

  getHeatmap: async (
    collectorId: string, 
    cameraId: string, 
    windowMs: number = 3600000
  ): Promise<HeatmapData> => {
    const params = new URLSearchParams({
      collector_id: collectorId,
      camera_id: cameraId,
      window_ms: windowMs.toString(),
    });

    const response = await api.get(`/heatmap?${params}`);
    return response.data;
  },

  getObjectDetails: async (
    collectorId: string,
    cameraId: string,
    objectId: string
  ): Promise<ObjectDetailsResponse> => {
    const response = await api.get(`/objects/${collectorId}/${cameraId}/${objectId}`);
    return response.data;
  },

  submitFeedback: async (endpoint: string, data: any): Promise<any> => {
    const response = await api.post(`/feedback/${endpoint}`, data);
    return response.data;
  },

  getHealth: async (): Promise<any> => {
    const response = await api.get('/health');
    return response.data;
  },

  getStatus: async (): Promise<any> => {
    const response = await api.get('/status');
    return response.data;
  },

  getRecentEvents: async (): Promise<any> => {
    const response = await api.get('/events/recent');
    return response.data;
  },

  getActiveObjects: async (
    collectorId: string,
    cameraId: string
  ): Promise<any> => {
    const params = new URLSearchParams({
      collector_id: collectorId,
      camera_id: cameraId,
    });

    const response = await api.get(`/objects/active?${params}`);
    return response.data;
  },
};

export default api;