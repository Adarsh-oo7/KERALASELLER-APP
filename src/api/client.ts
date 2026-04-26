import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL as BASE_URL } from '../config/api';

// Single axios client — uses BASE_URL which auto-switches dev/prod
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Attach auth token to every request
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }
    if (__DEV__) {
      console.log(`🔄 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses + 401 auto-logout
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`✅ ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    if (__DEV__) {
      console.error('❌ API Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
      });
    }
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
