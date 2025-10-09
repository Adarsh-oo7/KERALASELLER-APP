import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
  baseURL: 'http://192.168.1.4:8000', // Your Django server
  timeout: 15000,
  headers: {
    'Accept': 'application/json',
    // ✅ REMOVED: Don't set global Content-Type - handle per request
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      // ✅ FIXED: Use correct token key
      const token = await AsyncStorage.getItem('access_token'); // Changed from 'accessToken'
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔐 Added Bearer token');
      }
      
      // ✅ HANDLE: FormData vs JSON content types
      if (config.data instanceof FormData) {
        // ✅ CRITICAL: Don't set Content-Type for FormData - let Axios handle it
        console.log('📤 FormData request - letting axios handle Content-Type');
        console.log('📋 FormData keys:', Array.from(config.data.keys()));
        
        // ✅ Increase timeout for file uploads
        config.timeout = 60000;
      } else {
        // ✅ Set JSON Content-Type for regular requests
        config.headers['Content-Type'] = 'application/json';
        console.log('📤 JSON request');
      }
      
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
