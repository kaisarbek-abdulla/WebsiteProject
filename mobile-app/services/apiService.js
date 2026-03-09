import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://your-server-ip:5000/api';

// Create axios instance with interceptors
const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Add token to all requests
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('currentUser');
      // Trigger logout action - handled by AuthContext
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Auth APIs
  login: (email, password) =>
    axiosInstance.post('/auth/login', { email, password }),
  
  register: (name, email, password, role) =>
    axiosInstance.post('/auth/register', { name, email, password, role, language: 'en' }),
  
  // Symptom APIs
  analyzeSymptoms: (text) =>
    axiosInstance.post('/symptoms/analyze', { text }),
  
  getSymptoms: () =>
    axiosInstance.get('/symptoms'),
  
  // Complaint APIs
  submitComplaint: (message) =>
    axiosInstance.post('/complaints', { message }),
  
  getComplaints: () =>
    axiosInstance.get('/complaints'),
  
  // Device APIs
  connectDevice: (deviceType, deviceName) =>
    axiosInstance.post('/devices/connect', { deviceType, deviceName }),
  
  getDevices: () =>
    axiosInstance.get('/devices'),
  
  disconnectDevice: (deviceId) =>
    axiosInstance.delete(`/devices/${deviceId}`),
};
