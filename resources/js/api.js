const API_BASE_URL = '/api';

export const API = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('auth_token');

        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

            // Handle 204 No Content
            if (response.status === 204) {
                return { success: true };
            }

            // Handle 401 Unauthorized
            if (response.status === 401 && window.location.pathname !== '/login') {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                throw {
                    status: 401,
                    message: 'Your session has expired. Please login again.',
                    errors: {},
                };
            }

            const data = await response.json();

            if (!response.ok) {
                throw {
                    status: response.status,
                    message: data.message || 'An error occurred',
                    errors: data.errors || {},
                };
            }

            return data;
        } catch (error) {
            // If error doesn't have status, it's a network error
            if (!error.status) {
                throw {
                    status: 0,
                    message: 'Network error. Please check your internet connection.',
                    errors: {},
                };
            }
            throw error;
        }
    },

    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },

    async logout() {
        return this.request('/auth/logout', {
            method: 'POST',
        });
    },

    async getEmployees(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/employees${queryString ? '?' + queryString : ''}`);
    },

    async getEmployee(id) {
        return this.request(`/employees/${id}`);
    },

    async createEmployee(data) {
        return this.request('/employees', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateEmployee(id, data) {
        return this.request(`/employees/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async deactivateEmployee(id) {
        return this.request(`/employees/${id}/deactivate`, {
            method: 'DELETE',
        });
    }
};
