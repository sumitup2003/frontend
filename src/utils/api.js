import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
      console.log('🔑 API Request:', config.url, 'Token:', token ? 'EXISTS' : 'MISSING');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    else {
      console.warn('⚠️ No token found in localStorage');
    }
    return config;
  },
  (error) =>{
    console.error('Request interceptor error:', error); 
    return Promise.reject(error)
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// File upload function
export const uploadFile = async (endpoint, file, fieldName = 'media') => {
  const formData = new FormData();
  formData.append(fieldName, file);
  
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}${endpoint}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${token}`
    },
    withCredentials: true
  });
  
  return response;
};

export default api;