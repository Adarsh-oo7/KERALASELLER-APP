import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.4:8000'  // Your local Django server
  : 'https://your-render-url.onrender.com';

class DashboardService {
  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getDashboard(): Promise<{ data: any }> {
    const headers = await this.getAuthHeaders();
    
    // Use your exact Django dashboard endpoint
    const response = await axios.get(
      `${API_BASE_URL}/user/dashboard/`,
      { headers }
    );
    
    return response;
  }
}

export default new DashboardService();
