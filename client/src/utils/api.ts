import axios from 'axios';

// Production backend URL - hardcoded for reliability
const api = axios.create({
    baseURL: 'https://yzm315-final.onrender.com/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
