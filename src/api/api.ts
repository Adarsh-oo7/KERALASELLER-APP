import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Correct URL for Android Emulator (10.0.2.2 = localhost)
const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:8000'  // Development: Android Emulator
  : 'https://keralaseller-backend.onrender.com';  // Production

console.log('🔧 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('🔄 API Request:', `${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
    });

    // Handle 401 errors (token expired)
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('accessToken');
      // You can add navigation logic here if needed
    }

    return Promise.reject(error);
  }
);

export default api;
