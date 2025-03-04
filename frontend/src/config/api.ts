import axios from 'axios';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  
  // Device endpoints
  DEVICES: `${API_BASE_URL}/devices`,
  DEVICE: (id: string) => `${API_BASE_URL}/devices/${id}`,
  DEVICE_READINGS: (id: string) => `${API_BASE_URL}/devices/${id}/readings`,
  DEVICE_STATS: (id: string) => `${API_BASE_URL}/devices/${id}/stats`,
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export default api; 