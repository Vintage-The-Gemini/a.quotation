import api from './api';

/**
 * @typedef {Object} LoginResponse
 * @property {Object} user - The user object
 * @property {string} token - JWT token
 */

/**
 * Authentication service for handling auth-related API calls
 */
const authService = {
    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<LoginResponse>} Login response with user and token
     */
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },

    /**
     * Register new user
     * @param {Object} userData - User registration data
     * @returns {Promise<LoginResponse>} Registration response with user and token
     */
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    /**
     * Get current user info
     * @returns {Promise<Object>} Current user data
     */
    getCurrentUser: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    }
};

export default authService;