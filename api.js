// API Integration for ZameenKhojo Frontend
class ZameenKhojoAPI {
    constructor() {
        // Determine API base URL
        if (typeof window !== 'undefined' && window.API_BASE_URL) {
            // Allow explicit override from the page
            this.baseURL = String(window.API_BASE_URL).replace(/\/$/, '');
        } else {
            const hostname = (typeof location !== 'undefined' && location.hostname) ? location.hostname : '';
            const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
            // In local dev use localhost, otherwise point to production API (replace with your Render URL)
            this.baseURL = isLocal
                ? 'http://localhost:3000/api'
                : 'https://YOUR-RENDER-APP.onrender.com/api';
        }
        this.token = localStorage.getItem('adminToken');
    }

    // Helper method for API calls
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Public API Methods
    async getProperties(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        return await this.request(`/properties${queryParams ? `?${queryParams}` : ''}`);
    }

    async getProperty(id) {
        return await this.request(`/properties/${id}`);
    }

    async submitContact(contactData) {
        return await this.request('/contact', {
            method: 'POST',
            body: JSON.stringify(contactData)
        });
    }

    // Admin Authentication
    async adminLogin(credentials) {
        try {
            const response = await this.request('/admin/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });

            if (response.success) {
                this.token = response.token;
                localStorage.setItem('adminToken', response.token);
                localStorage.setItem('adminUser', JSON.stringify(response.user));
            }

            return response;
        } catch (error) {
            throw error;
        }
    }

    adminLogout() {
        this.token = null;
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
    }

    async changePassword({ oldPassword, newPassword }) {
        return await this.request('/admin/change-password', {
            method: 'POST',
            body: JSON.stringify({ oldPassword, newPassword })
        });
    }

    isAdminLoggedIn() {
        return !!this.token;
    }

    // Admin Property Management
    async createProperty(propertyData) {
        const formData = new FormData();

        // Add text fields
        Object.keys(propertyData).forEach(key => {
            if (key !== 'images') {
                formData.append(key, propertyData[key]);
            }
        });

        // Add image files
        if (propertyData.images && propertyData.images.length > 0) {
            propertyData.images.forEach(image => {
                formData.append('images', image);
            });
        }

        return await fetch(`${this.baseURL}/admin/properties`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        }).then(res => res.json());
    }

    async updateProperty(id, propertyData) {
        const formData = new FormData();

        Object.keys(propertyData).forEach(key => {
            if (key !== 'images') {
                formData.append(key, propertyData[key]);
            }
        });

        if (propertyData.images && propertyData.images.length > 0) {
            propertyData.images.forEach(image => {
                formData.append('images', image);
            });
        }

        return await fetch(`${this.baseURL}/admin/properties/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        }).then(res => res.json());
    }

    async deleteProperty(id) {
        return await this.request(`/admin/properties/${id}`, {
            method: 'DELETE'
        });
    }

    // Admin Contact Management
    async getContacts() {
        return await this.request('/admin/contacts');
    }

    async updateContactStatus(id, status) {
        return await this.request(`/admin/contacts/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }

    async deleteContact(id) {
        return await this.request(`/admin/contacts/${id}`, {
            method: 'DELETE'
        });
    }

    // Admin Dashboard
    async getDashboardStats() {
        return await this.request('/admin/stats');
    }
}

// Create global API instance
window.api = new ZameenKhojoAPI();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ZameenKhojoAPI;
}