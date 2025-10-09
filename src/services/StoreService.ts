import apiClient from './ApiClient';

class StoreService {
  // ✅ GET: Store profile (working fine)
  async getProfile(): Promise<{ data: any }> {
    try {
      console.log('🔍 StoreService: Getting store profile...');
      const response = await apiClient.get('/api/store/profile/');
      console.log('✅ Store profile retrieved:', response.data);
      return response;
    } catch (error: any) {
      console.error('❌ Failed to get store profile:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  }

  // ✅ CREATE: Only for brand new profiles
  async createProfile(profileData: any): Promise<{ data: any }> {
    try {
      console.log('➕ Creating NEW store profile...');
      
      if (profileData instanceof FormData) {
        const response = await apiClient.post('/api/store/profile/', profileData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000,
        });
        return response;
      } else {
        const cleanData = this.cleanProfileData(profileData);
        console.log('📤 POST request data:', cleanData);
        const response = await apiClient.post('/api/store/profile/', cleanData);
        return response;
      }
    } catch (error: any) {
      console.error('❌ Failed to create store profile:', error);
      throw error;
    }
  }

  // ✅ UPDATE: For existing profiles  
  async updateProfile(profileData: any): Promise<{ data: any }> {
    try {
      console.log('🔄 Updating EXISTING store profile...');
      
      if (profileData instanceof FormData) {
        const response = await apiClient.patch('/api/store/profile/', profileData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000,
        });
        return response;
      } else {
        const cleanData = this.cleanProfileData(profileData);
        console.log('📤 PATCH request data:', cleanData);
        const response = await apiClient.patch('/api/store/profile/', cleanData);
        return response;
      }
    } catch (error: any) {
      console.error('❌ Failed to update store profile:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  }

  // ✅ SMART: Determine whether to create or update based on profile existence
  async createOrUpdateProfile(profileData: any): Promise<{ data: any }> {
    try {
      console.log('🔍 StoreService: Determining create vs update...');
      
      // ✅ STEP 1: Check if profile exists
      let profileExists = false;
      let hasContent = false;
      
      try {
        const existingProfile = await this.getProfile();
        const storeProfile = existingProfile.data?.store_profile;
        
        if (storeProfile) {
          profileExists = true;
          // Check if it has meaningful content (not just basic name)
          hasContent = !!(
            storeProfile.description || 
            storeProfile.whatsapp_number || 
            storeProfile.tagline ||
            storeProfile.logo_url ||
            storeProfile.banner_image_url
          );
          
          console.log(`📋 Profile exists: ${profileExists}, Has content: ${hasContent}`);
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          profileExists = false;
          console.log('📋 No profile exists - will CREATE');
        } else {
          throw error; // Re-throw other errors
        }
      }

      // ✅ STEP 2: Decide method based on existence
      if (profileExists) {
        console.log('🔄 Profile exists - using UPDATE (PATCH)');
        return await this.updateProfile(profileData);
      } else {
        console.log('➕ Profile doesn\'t exist - using CREATE (POST)');
        return await this.createProfile(profileData);
      }
      
    } catch (error: any) {
      console.error('❌ Smart create/update failed:', error);
      throw error;
    }
  }

  // ✅ CLEAN: Profile data with proper field mapping
  private cleanProfileData(data: any) {
    const cleanData: any = {};
    
    // ✅ REQUIRED FIELDS (based on your Django validation)
    if (data.name && data.name.trim()) cleanData.name = data.name.trim();
    if (data.description && data.description.trim()) cleanData.description = data.description.trim();
    if (data.whatsapp_number && data.whatsapp_number.trim()) {
      cleanData.whatsapp_number = data.whatsapp_number.replace(/\D/g, '');
    }
    
    // ✅ OPTIONAL TEXT FIELDS
    const optionalFields = [
      'tagline', 'instagram_link', 'facebook_link', 
      'delivery_time_local', 'delivery_time_national',
      'razorpay_key_id', 'razorpay_key_secret', 'upi_id',
      'gst_number', 'business_license', 'owner_name', 'business_address',
      'meta_title', 'meta_description'
    ];
    
    optionalFields.forEach(field => {
      if (data[field] && typeof data[field] === 'string' && data[field].trim()) {
        cleanData[field] = data[field].trim();
      }
    });
    
    // ✅ BOOLEAN FIELDS
    cleanData.accepts_cod = Boolean(data.accepts_cod);
    
    // ✅ PAYMENT METHOD (use exact backend values)
    if (data.payment_method) {
      // Based on your backend, valid choices are likely: NONE, RAZORPAY, UPI
      const validPaymentMethods = ['NONE', 'RAZORPAY', 'UPI', 'STRIPE'];
      if (validPaymentMethods.includes(data.payment_method)) {
        cleanData.payment_method = data.payment_method;
      } else {
        cleanData.payment_method = 'NONE'; // Default fallback
      }
    } else {
      cleanData.payment_method = 'NONE';
    }
    
    // ✅ VERIFICATION STATUS
    const validStatuses = ['pending', 'verified', 'rejected'];
    cleanData.verification_status = validStatuses.includes(data.verification_status) 
      ? data.verification_status 
      : 'pending';
    
    console.log('🧹 Final cleaned data:', cleanData);
    return cleanData;
  }

  // ✅ TEST: Connection test
  async testConnection(): Promise<{ data: any }> {
    try {
      console.log('🧪 Testing API connection...');
      const response = await this.getProfile();
      console.log('✅ API connection test successful!');
      return response;
    } catch (error: any) {
      console.error('❌ API connection test failed:', error);
      throw error;
    }
  }
}

export default new StoreService();
