import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './ApiClient';

class ProductService {
  private baseURL = 'http://192.168.1.4:8000';

  // ✅ ADDED: Get categories method
  async getCategories(): Promise<any> {
    try {
      console.log('📡 ProductService: Fetching categories...');
      
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${this.baseURL}/api/categories/`, {
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
      console.log('✅ Categories loaded:', result);
      
      // Handle both paginated and direct array responses
      return { data: result.results || result };
      
    } catch (error) {
      console.error('❌ ProductService.getCategories failed:', error);
      throw error;
    }
  }

  // ✅ FIXED: Use native fetch for file uploads (create)
  async createProduct(productData: FormData): Promise<any> {
    try {
      console.log('🚀 ProductService: Creating product with native fetch...');
      
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('🔐 Token available for product creation');
      console.log('📋 FormData keys:', Array.from(productData.keys()));

      const response = await fetch(`${this.baseURL}/user/store/products/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // ✅ CRITICAL: Don't set Content-Type - let fetch handle it for FormData
        },
        body: productData,
      });

      console.log('📊 Create product response:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Create product error:', errorText);
        
        // Try to parse as JSON for better error handling
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.detail || errorJson.error || `HTTP ${response.status}: ${errorText}`);
        } catch {
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }

      const result = await response.json();
      console.log('✅ Product created successfully:', result);
      
      return { data: result };
      
    } catch (error) {
      console.error('❌ ProductService.createProduct failed:', error);
      throw error;
    }
  }

  // ✅ FIXED: Use native fetch for file uploads (update)
  async updateProduct(productId: number, productData: FormData): Promise<any> {
    try {
      console.log('🚀 ProductService: Updating product with native fetch...');
      console.log('📋 Product ID:', productId);
      
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('🔐 Token available for product update');
      console.log('📋 FormData keys:', Array.from(productData.keys()));

      const response = await fetch(`${this.baseURL}/user/store/products/${productId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          // ✅ CRITICAL: Don't set Content-Type - let fetch handle it for FormData
        },
        body: productData,
      });

      console.log('📊 Update product response:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Update product error:', errorText);
        
        // Try to parse as JSON for better error handling
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.detail || errorJson.error || `HTTP ${response.status}: ${errorText}`);
        } catch {
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }

      const result = await response.json();
      console.log('✅ Product updated successfully:', result);
      
      return { data: result };
      
    } catch (error) {
      console.error('❌ ProductService.updateProduct failed:', error);
      throw error;
    }
  }

  // ✅ ALTERNATIVE: Create/Update product without images (JSON only)
  async createProductWithoutImages(productData: any): Promise<any> {
    try {
      console.log('🧪 ProductService: Creating product without images...');
      
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${this.baseURL}/user/store/products/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      console.log('📊 No images response:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ No images error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Product created without images:', result);
      
      return { data: result };
      
    } catch (error) {
      console.error('❌ ProductService.createProductWithoutImages failed:', error);
      throw error;
    }
  }

  async updateProductWithoutImages(productId: number, productData: any): Promise<any> {
    try {
      console.log('🧪 ProductService: Updating product without images...');
      console.log('📋 Product ID:', productId);
      
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${this.baseURL}/user/store/products/${productId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      console.log('📊 Update no images response:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Update no images error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Product updated without images:', result);
      
      return { data: result };
      
    } catch (error) {
      console.error('❌ ProductService.updateProductWithoutImages failed:', error);
      throw error;
    }
  }

  // ✅ KEEP: Use Axios for JSON requests (these work fine)
  async getProducts(): Promise<any> {
    try {
      console.log('📡 ProductService: Fetching products with Axios...');
      const response = await apiClient.get('/user/store/products/');
      return response;
    } catch (error) {
      console.error('❌ ProductService.getProducts failed:', error);
      throw error;
    }
  }

  async getProduct(productId: number): Promise<any> {
    try {
      console.log('📡 ProductService: Fetching product:', productId);
      const response = await apiClient.get(`/user/store/products/${productId}/`);
      return response;
    } catch (error) {
      console.error('❌ ProductService.getProduct failed:', error);
      throw error;
    }
  }

  async deleteProduct(productId: number): Promise<any> {
    try {
      console.log('🗑️ ProductService: Deleting product:', productId);
      const response = await apiClient.delete(`/user/store/products/${productId}/`);
      return response;
    } catch (error) {
      console.error('❌ ProductService.deleteProduct failed:', error);
      throw error;
    }
  }

  // ✅ FIXED: Use native fetch for subscription control
  async toggleSubscriptionControl(productId: number, isActive: boolean): Promise<any> {
    try {
      console.log('🔄 ProductService: Toggling subscription control...');
      console.log('📋 Product ID:', productId, 'Active:', isActive);
      
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${this.baseURL}/user/store/products/${productId}/toggle-subscription/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_subscription_controlled: isActive
        }),
      });

      console.log('📊 Toggle response:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Toggle error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Subscription control toggled:', result);
      
      return { data: result };
      
    } catch (error) {
      console.error('❌ ProductService.toggleSubscriptionControl failed:', error);
      throw error;
    }
  }

  // ✅ ADDED: Get stock history
  async getStockHistory(): Promise<any> {
    try {
      console.log('📡 ProductService: Fetching stock history...');
      const response = await apiClient.get('/user/store/stock-history/');
      return response;
    } catch (error) {
      console.error('❌ ProductService.getStockHistory failed:', error);
      throw error;
    }
  }

  // ✅ ADDED: Get dashboard stats
  async getDashboardStats(): Promise<any> {
    try {
      console.log('📡 ProductService: Fetching dashboard stats...');
      const response = await apiClient.get('/user/store/dashboard/');
      return response;
    } catch (error) {
      console.error('❌ ProductService.getDashboardStats failed:', error);
      throw error;
    }
  }

  // ✅ ADDED: Search products
  async searchProducts(query: string): Promise<any> {
    try {
      console.log('📡 ProductService: Searching products:', query);
      const response = await apiClient.get(`/user/store/products/?search=${encodeURIComponent(query)}`);
      return response;
    } catch (error) {
      console.error('❌ ProductService.searchProducts failed:', error);
      throw error;
    }
  }

  // ✅ ADDED: Get product by ID with detailed info
  async getProductDetails(productId: number): Promise<any> {
    try {
      console.log('📡 ProductService: Fetching product details:', productId);
      const response = await apiClient.get(`/user/store/products/${productId}/details/`);
      return response;
    } catch (error) {
      console.error('❌ ProductService.getProductDetails failed:', error);
      throw error;
    }
  }

  // ✅ ADDED: Bulk operations
  async bulkUpdateProducts(productIds: number[], updateData: any): Promise<any> {
    try {
      console.log('📡 ProductService: Bulk updating products:', productIds.length);
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
      console.log('📡 ProductService: Bulk deleting products:', productIds.length);
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
