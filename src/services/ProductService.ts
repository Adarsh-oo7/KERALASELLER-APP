import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './ApiClient';
import { Platform } from 'react-native';

class ProductService {
  // ✅ FIXED: Use production URL by default, with fallback to local
  private getBaseURL = (): string => {
    // Change this to your production backend URL
    const PRODUCTION_URL = 'https://keralaseller-backend.onrender.com';
    const LOCAL_URL = 'http://192.168.1.4:8000';
    
    // Use production URL (change to LOCAL_URL for local development)
    return PRODUCTION_URL;
  };

  // ✅ ENHANCED: Get categories with better error handling
  async getCategories(): Promise<any> {
    try {
      console.log('📡 ProductService: Fetching categories...');
      const baseURL = this.getBaseURL();
      console.log('🌐 Base URL:', baseURL);
      
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = `${baseURL}/api/categories/`;
      console.log('📡 Full URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 Categories response:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Categories error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Categories loaded:', result.length || result.results?.length || 0, 'items');
      
      return { data: result.results || result };
      
    } catch (error: any) {
      console.error('❌ ProductService.getCategories failed:', error);
      if (error.message === 'Network request failed') {
        throw new Error('Cannot connect to server. Please check your internet connection and ensure the backend is running.');
      }
      throw error;
    }
  }

  // ✅ FIXED: Enhanced create product with better network error handling
  async createProductWithoutImages(productData: any): Promise<any> {
    try {
      console.log('🚀 ProductService: Creating product without images...');
      const baseURL = this.getBaseURL();
      console.log('🌐 Base URL:', baseURL);
      
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = `${baseURL}/user/store/products/`;
      console.log('📡 Full URL:', url);
      console.log('📋 Request body:', JSON.stringify(productData, null, 2));

      // ✅ Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(productData),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log('📊 Response status:', response.status);
        console.log('📊 Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Server error response:', errorText);
          
          // Try to parse as JSON for better error messages
          try {
            const errorJson = JSON.parse(errorText);
            const errorMessage = errorJson.detail || errorJson.error || errorJson.message || errorText;
            throw new Error(`Server error (${response.status}): ${errorMessage}`);
          } catch (parseError) {
            throw new Error(`Server error (${response.status}): ${errorText}`);
          }
        }

        const result = await response.json();
        console.log('✅ Product created successfully:', result);
        
        return { data: result };
        
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout - server took too long to respond');
        }
        throw fetchError;
      }
      
    } catch (error: any) {
      console.error('❌ ProductService.createProductWithoutImages failed:', error);
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      
      // ✅ Better error messages for common issues
      if (error.message === 'Network request failed') {
        throw new Error(`Cannot connect to server.\n\nPossible causes:\n• Backend server is not running\n• Wrong API URL: ${this.getBaseURL()}\n• Network connection issue\n\nPlease check and try again.`);
      }
      
      throw error;
    }
  }

  // ✅ FIXED: Enhanced update product
  async updateProductWithoutImages(productId: number, productData: any): Promise<any> {
    try {
      console.log('🚀 ProductService: Updating product without images...');
      console.log('📋 Product ID:', productId);
      const baseURL = this.getBaseURL();
      console.log('🌐 Base URL:', baseURL);
      
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = `${baseURL}/user/store/products/${productId}/`;
      console.log('📡 Full URL:', url);
      console.log('📋 Request body:', JSON.stringify(productData, null, 2));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(productData),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log('📊 Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Server error response:', errorText);
          
          try {
            const errorJson = JSON.parse(errorText);
            const errorMessage = errorJson.detail || errorJson.error || errorJson.message || errorText;
            throw new Error(`Server error (${response.status}): ${errorMessage}`);
          } catch (parseError) {
            throw new Error(`Server error (${response.status}): ${errorText}`);
          }
        }

        const result = await response.json();
        console.log('✅ Product updated successfully:', result);
        
        return { data: result };
        
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout - server took too long to respond');
        }
        throw fetchError;
      }
      
    } catch (error: any) {
      console.error('❌ ProductService.updateProductWithoutImages failed:', error);
      
      if (error.message === 'Network request failed') {
        throw new Error(`Cannot connect to server.\n\nPossible causes:\n• Backend server is not running\n• Wrong API URL: ${this.getBaseURL()}\n• Network connection issue\n\nPlease check and try again.`);
      }
      
      throw error;
    }
  }

  // ✅ Keep all other methods as they were
  async createProduct(productData: FormData): Promise<any> {
    try {
      console.log('🚀 ProductService: Creating product with FormData...');
      const baseURL = this.getBaseURL();
      
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${baseURL}/user/store/products/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: productData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return { data: result };
      
    } catch (error) {
      console.error('❌ ProductService.createProduct failed:', error);
      throw error;
    }
  }

  async updateProduct(productId: number, productData: FormData): Promise<any> {
    try {
      const baseURL = this.getBaseURL();
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${baseURL}/user/store/products/${productId}/`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: productData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return { data: result };
    } catch (error) {
      console.error('❌ ProductService.updateProduct failed:', error);
      throw error;
    }
  }

  async getProducts(): Promise<any> {
    try {
      const response = await apiClient.get('/user/store/products/');
      return response;
    } catch (error) {
      console.error('❌ ProductService.getProducts failed:', error);
      throw error;
    }
  }

  async getProduct(productId: number): Promise<any> {
    try {
      const response = await apiClient.get(`/user/store/products/${productId}/`);
      return response;
    } catch (error) {
      console.error('❌ ProductService.getProduct failed:', error);
      throw error;
    }
  }

  async deleteProduct(productId: number): Promise<any> {
    try {
      const response = await apiClient.delete(`/user/store/products/${productId}/`);
      return response;
    } catch (error) {
      console.error('❌ ProductService.deleteProduct failed:', error);
      throw error;
    }
  }

  async toggleSubscriptionControl(productId: number, isActive: boolean): Promise<any> {
    try {
      const baseURL = this.getBaseURL();
      const token = await AsyncStorage.getItem('access_token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${baseURL}/user/store/products/${productId}/toggle-subscription/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_subscription_controlled: isActive }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return { data: result };
    } catch (error) {
      console.error('❌ ProductService.toggleSubscriptionControl failed:', error);
      throw error;
    }
  }

  async getStockHistory(): Promise<any> {
    try {
      const response = await apiClient.get('/user/store/stock-history/');
      return response;
    } catch (error) {
      console.error('❌ ProductService.getStockHistory failed:', error);
      throw error;
    }
  }

  async getDashboardStats(): Promise<any> {
    try {
      const response = await apiClient.get('/user/store/dashboard/');
      return response;
    } catch (error) {
      console.error('❌ ProductService.getDashboardStats failed:', error);
      throw error;
    }
  }

  async searchProducts(query: string): Promise<any> {
    try {
      const response = await apiClient.get(`/user/store/products/?search=${encodeURIComponent(query)}`);
      return response;
    } catch (error) {
      console.error('❌ ProductService.searchProducts failed:', error);
      throw error;
    }
  }

  async getProductDetails(productId: number): Promise<any> {
    try {
      const response = await apiClient.get(`/user/store/products/${productId}/details/`);
      return response;
    } catch (error) {
      console.error('❌ ProductService.getProductDetails failed:', error);
      throw error;
    }
  }

  async bulkUpdateProducts(productIds: number[], updateData: any): Promise<any> {
    try {
      const response = await apiClient.post('/user/store/products/bulk-update/', {
        product_ids: productIds,
        update_data: updateData
      });
      return response;
    } catch (error) {
      console.error('❌ ProductService.bulkUpdateProducts failed:', error);
      throw error;
    }
  }

  async bulkDeleteProducts(productIds: number[]): Promise<any> {
    try {
      const response = await apiClient.post('/user/store/products/bulk-delete/', {
        product_ids: productIds
      });
      return response;
    } catch (error) {
      console.error('❌ ProductService.bulkDeleteProducts failed:', error);
      throw error;
    }
  }
}

export default new ProductService();
