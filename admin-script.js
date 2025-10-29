// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.isLoggedIn = false;
        this.currentTab = 'properties';
        // Properties and contacts will be loaded from backend
        this.properties = [];
        this.contacts = [];

        this.init();
    }

    async init() {
        // Ensure login is shown and dashboard is hidden on load
        document.getElementById('login-section')?.setAttribute('style', 'display:flex');
        document.getElementById('admin-dashboard')?.classList.add('hidden');
        document.getElementById('logout-btn')?.setAttribute('style', 'display:none');

        // Force-hide any modals on load
        document.querySelectorAll('.modal').forEach(m => (m.style.display = 'none'));

        this.setupEventListeners();
        await this.checkLoginStatus();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('login-form')?.addEventListener('submit', this.handleLogin.bind(this));

        // Mark input-groups that have a toggle to ensure proper padding
        document.querySelectorAll('.input-group').forEach(group => {
            if (group.querySelector('.toggle-password')) group.classList.add('has-toggle');
        });

        // Toggle password visibility (event delegation ensures it works even if DOM updates)
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.toggle-password');
            if (!btn) return;
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (!input) return;
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            btn.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
        });

        // Change password UI
        const toggleChange = document.getElementById('toggle-change-password');
        const changeForm = document.getElementById('change-password-form');
        const cancelChange = document.getElementById('cancel-change-password');
        if (toggleChange && changeForm) {
            toggleChange.addEventListener('click', (e) => {
                e.preventDefault();
                changeForm.style.display = changeForm.style.display === 'none' ? 'block' : 'none';
            });
        }
        if (cancelChange && changeForm) {
            cancelChange.addEventListener('click', (e) => {
                e.preventDefault();
                changeForm.reset();
                changeForm.style.display = 'none';
            });
        }
        if (changeForm) {
            changeForm.addEventListener('submit', this.handleChangePassword.bind(this));
        }

        // Logout button
        document.getElementById('logout-btn')?.addEventListener('click', this.handleLogout.bind(this));

        // Tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Add property button
        document.getElementById('add-property-btn')?.addEventListener('click', () => {
            this.showPropertyForm();
        });

        // Property form
        document.getElementById('property-form')?.addEventListener('submit', this.handlePropertyForm.bind(this));

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(close => {
            close.addEventListener('click', this.closeModal);
        });

        // Cancel buttons
        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', this.closeModal);
        });

        // Modal backdrop clicks
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        });

        // Search inputs
        document.getElementById('property-search')?.addEventListener('input', this.handlePropertySearch.bind(this));
        document.getElementById('contact-search')?.addEventListener('input', this.handleContactSearch.bind(this));

        // Filter selects
        document.getElementById('property-filter')?.addEventListener('change', this.handlePropertyFilter.bind(this));
        document.getElementById('contact-status-filter')?.addEventListener('change', this.handleContactFilter.bind(this));

        // Settings form
        document.getElementById('agent-form')?.addEventListener('submit', this.handleAgentForm.bind(this));

        // Data management buttons
        document.getElementById('export-data-btn')?.addEventListener('click', this.exportData.bind(this));
        document.getElementById('backup-data-btn')?.addEventListener('click', this.backupData.bind(this));
        document.getElementById('import-data-btn')?.addEventListener('click', this.importData.bind(this));

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    async handleChangePassword(e) {
        e.preventDefault();
        const oldPassword = document.getElementById('old-password').value.trim();
        const newPassword = document.getElementById('new-password').value.trim();
        const confirmPassword = document.getElementById('confirm-password').value.trim();

        if (!oldPassword || !newPassword) {
            return this.showNotification('Please fill all fields', 'error');
        }
        if (newPassword.length < 6) {
            return this.showNotification('New password must be at least 6 characters', 'error');
        }
        if (newPassword !== confirmPassword) {
            return this.showNotification('New passwords do not match', 'error');
        }

        try {
            const response = await fetch(`${window.api.baseURL}/admin/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldPassword, newPassword })
            });

            let payload = null;
            try {
                payload = await response.json();
            } catch (_) {
                // Non-JSON response
                throw new Error('Unexpected response');
            }

            if (!response.ok || !payload || payload.success !== true) {
                throw new Error((payload && payload.error) || 'Failed to update password');
            }

            this.showNotification('Password updated successfully', 'success');
            const form = document.getElementById('change-password-form');
            form.reset();
            form.style.display = 'none';
        } catch (err) {
            this.showNotification(err.message || 'Failed to update password', 'error');
        }
    }

    async checkLoginStatus() {
        // Check if already logged in via API token
        if (window.api && window.api.isAdminLoggedIn()) {
            this.isLoggedIn = true;
            await this.loadDataFromServer();
            this.showDashboard();
        }
    }

    async handleLogin(e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            if (!window.api) {
                throw new Error('API not loaded');
            }

            const response = await window.api.adminLogin({ username, password });
            
            if (response.success) {
                this.isLoggedIn = true;
                await this.loadDataFromServer();
                this.showDashboard();
                this.showNotification('Login successful!', 'success');
            } else {
                this.showNotification('Invalid credentials!', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Login failed. Please try again.', 'error');
        }
    }

    async loadDataFromServer() {
        try {
            // Load properties
            this.properties = await window.api.getProperties() || [];
            
            // Load contacts
            this.contacts = await window.api.getContacts() || [];
            
            // Update stats
            this.updateStats();
        } catch (error) {
            console.error('Error loading data from server:', error);
            this.showNotification('Failed to load data from server', 'error');
            // Initialize as empty arrays if load fails
            this.properties = [];
            this.contacts = [];
        }
    }

    handleLogout() {
        this.isLoggedIn = false;
        if (window.api) {
            window.api.adminLogout();
        }
        this.properties = [];
        this.contacts = [];
        document.getElementById('login-section').style.display = 'flex';
        document.getElementById('admin-dashboard').classList.add('hidden');
        document.getElementById('logout-btn').style.display = 'none';
        document.getElementById('login-form').reset();
        // Immediate redirect to main website
        window.location.replace('index.html');
    }

    async showDashboard() {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('admin-dashboard').classList.remove('hidden');
        document.getElementById('logout-btn').style.display = 'flex';
        
        // Ensure data is loaded
        if (this.properties.length === 0 && this.contacts.length === 0) {
            await this.loadDataFromServer();
        }
        
        this.renderProperties();
        this.renderContacts();
        this.renderAnalytics();
        this.updateStats();
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    showPropertyForm(propertyId = null) {
        const modal = document.getElementById('property-modal');
        const form = document.getElementById('property-form');
        const title = document.getElementById('modal-title');

        if (propertyId) {
            // Edit mode
            const property = this.properties.find(p => p.id === propertyId);
            if (property) {
                title.textContent = 'Edit Property';
                form.querySelector('#property-title').value = property.title || '';
                form.querySelector('#property-type').value = property.type || '';
                form.querySelector('#property-location').value = property.location || '';
                form.querySelector('#property-price').value = property.price || '';
                form.querySelector('#property-bedrooms').value = property.bedrooms || 0;
                form.querySelector('#property-bathrooms').value = property.bathrooms || 1;
                form.querySelector('#property-sqft').value = property.sqft || '';
                form.querySelector('#property-featured').checked = property.featured || false;
                form.querySelector('#property-description').value = property.description || '';
                form.querySelector('#property-images').value = Array.isArray(property.images) ? property.images.join('\n') : (property.images || '');
                form.querySelector('#property-amenities').value = Array.isArray(property.amenities) ? property.amenities.join(', ') : (property.amenities || '');
                form.querySelector('#property-id').value = property.id;
            }
        } else {
            // Add mode
            title.textContent = 'Add New Property';
            form.reset();
            form.querySelector('#property-id').value = '';
        }

        modal.style.display = 'flex';
    }

    async handlePropertyForm(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const propertyData = {
            title: formData.get('title'),
            type: formData.get('type'),
            location: formData.get('location'),
            price: formData.get('price'),
            bedrooms: formData.get('bedrooms'),
            bathrooms: formData.get('bathrooms'),
            sqft: formData.get('sqft'),
            featured: formData.get('featured') === 'on' ? 'true' : 'false',
            description: formData.get('description'),
            images: formData.get('images'), // Keep as string with newlines
            amenities: formData.get('amenities') // Keep as comma-separated string
        };

        const propertyId = formData.get('id');

        try {
            // Debug log
            console.log('Sending property data:', propertyData);
            console.log('Images field:', propertyData.images);
            console.log('Images type:', typeof propertyData.images);
            
            // Send as JSON directly to match server expectation
            const url = propertyId 
                ? `${window.api.baseURL}/admin/properties/${propertyId}`
                : `${window.api.baseURL}/admin/properties`;
            
            const method = propertyId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.api.token}`
                },
                body: JSON.stringify(propertyData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to save property');
            }

            console.log('Server response:', result);
            console.log('Returned property images:', result.property?.images);

            if (propertyId) {
                this.showNotification('Property updated successfully!', 'success');
            } else {
                this.showNotification('Property added successfully!', 'success');
            }

            // Reload properties from server to get updated data
            await this.loadDataFromServer();
            console.log('Reloaded properties. First property images:', this.properties[0]?.images);
            this.renderProperties();
            this.updateStats();
            this.closeModal();
        } catch (error) {
            console.error('Error saving property:', error);
            this.showNotification('Failed to save property. Please try again.', 'error');
        }
    }

    renderProperties() {
        const container = document.getElementById('admin-properties');
        if (!container) return;

        if (this.properties.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-home"></i>
                    <h3>No Properties Found</h3>
                    <p>Start by adding your first property.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.properties.map(property => `
            <div class="admin-property-card">
                <div class="property-image">
                    <img src="${property.images && property.images.length > 0 ? property.images[0] : 'https://via.placeholder.com/400x300?text=No+Image'}" alt="${property.title}" loading="lazy">
                    ${property.featured ? '<div class="featured-badge">Featured</div>' : ''}
                </div>
                <div class="property-content">
                    <div class="property-header">
                        <h3>${property.title}</h3>
                        <div class="property-price">${this.formatPrice(property.price)}</div>
                    </div>
                    <div class="property-meta">
                        <span class="property-type">${property.type}</span>
                        <span class="property-location">
                            <i class="fas fa-map-marker-alt"></i>
                            ${property.location}
                        </span>
                    </div>
                    <div class="property-details">
                        ${property.bedrooms > 0 ? `<span><i class="fas fa-bed"></i> ${property.bedrooms}</span>` : ''}
                        <span><i class="fas fa-bath"></i> ${property.bathrooms}</span>
                        <span><i class="fas fa-ruler-combined"></i> ${property.sqft} sq ft</span>
                    </div>
                    <div class="property-actions">
                        <button class="btn-icon" onclick="admin.showPropertyForm(${property.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon danger" onclick="admin.deleteProperty(${property.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn-icon" onclick="admin.toggleFeatured(${property.id})" title="Toggle Featured">
                            <i class="fas fa-star ${property.featured ? 'featured' : ''}"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderContacts() {
        const container = document.getElementById('admin-contacts');
        if (!container) return;

        if (this.contacts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-envelope"></i>
                    <h3>No Contacts Found</h3>
                    <p>Contact inquiries will appear here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.contacts.map(contact => `
            <div class="admin-contact-card">
                <div class="contact-header">
                    <div class="contact-info">
                        <h3>${contact.name}</h3>
                        <p>${contact.email}</p>
                        ${contact.phone ? `<p><i class="fas fa-phone"></i> ${contact.phone}</p>` : ''}
                    </div>
                    <div class="contact-status">
                        <select onchange="admin.updateContactStatus(${contact.id}, this.value)" class="status-select ${contact.status}">
                            <option value="new" ${contact.status === 'new' ? 'selected' : ''}>New</option>
                            <option value="contacted" ${contact.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                            <option value="closed" ${contact.status === 'closed' ? 'selected' : ''}>Closed</option>
                        </select>
                    </div>
                </div>
                <div class="contact-content">
                    <div class="contact-subject">
                        <strong>Subject:</strong> ${this.getSubjectLabel(contact.subject)}
                    </div>
                    <div class="contact-message">
                        <strong>Message:</strong>
                        <p>${contact.message}</p>
                    </div>
                    <div class="contact-date">
                        <i class="fas fa-clock"></i>
                        ${this.formatDate(contact.createdAt)}
                    </div>
                </div>
                <div class="contact-actions">
                    <button class="btn-icon" onclick="admin.replyToContact(${contact.id})" title="Reply via WhatsApp">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                    <button class="btn-icon danger" onclick="admin.deleteContact(${contact.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderAnalytics() {
        const propertyTypesChart = document.getElementById('property-types-chart');
        const inquiriesChart = document.getElementById('inquiries-chart');
        const priceRangeChart = document.getElementById('price-range-chart');

        if (propertyTypesChart) {
            const types = this.properties.reduce((acc, prop) => {
                acc[prop.type] = (acc[prop.type] || 0) + 1;
                return acc;
            }, {});

            propertyTypesChart.innerHTML = Object.entries(types).map(([type, count]) => `
                <div class="chart-item">
                    <span class="chart-label">${type}</span>
                    <div class="chart-bar">
                        <div class="chart-fill" style="width: ${(count / this.properties.length) * 100}%"></div>
                    </div>
                    <span class="chart-value">${count}</span>
                </div>
            `).join('');
        }

        if (inquiriesChart) {
            inquiriesChart.innerHTML = `
                <div class="chart-item">
                    <span class="chart-label">This Month</span>
                    <div class="chart-bar">
                        <div class="chart-fill" style="width: 80%"></div>
                    </div>
                    <span class="chart-value">${this.contacts.length}</span>
                </div>
            `;
        }

        if (priceRangeChart) {
            const ranges = {
                'Under 50L': this.properties.filter(p => p.price < 5000000).length,
                '50L - 1Cr': this.properties.filter(p => p.price >= 5000000 && p.price < 10000000).length,
                'Above 1Cr': this.properties.filter(p => p.price >= 10000000).length
            };

            priceRangeChart.innerHTML = Object.entries(ranges).map(([range, count]) => `
                <div class="chart-item">
                    <span class="chart-label">${range}</span>
                    <div class="chart-bar">
                        <div class="chart-fill" style="width: ${(count / this.properties.length) * 100}%"></div>
                    </div>
                    <span class="chart-value">${count}</span>
                </div>
            `).join('');
        }
    }

    updateStats() {
        document.getElementById('total-properties').textContent = this.properties.length;
        document.getElementById('featured-count').textContent = this.properties.filter(p => p.featured).length;
        document.getElementById('total-contacts').textContent = this.contacts.length;

        const totalValue = this.properties.reduce((sum, p) => sum + p.price, 0);
        document.getElementById('total-value').textContent = this.formatPriceShort(totalValue);
    }

    async deleteProperty(propertyId) {
        if (confirm('Are you sure you want to delete this property?')) {
            try {
                await window.api.deleteProperty(propertyId);
                // Reload properties from server
                await this.loadDataFromServer();
                this.renderProperties();
                this.updateStats();
                this.showNotification('Property deleted successfully!', 'success');
            } catch (error) {
                console.error('Error deleting property:', error);
                this.showNotification('Failed to delete property. Please try again.', 'error');
            }
        }
    }

    async toggleFeatured(propertyId) {
        const property = this.properties.find(p => p.id === propertyId);
        if (property) {
            try {
                const updatedProperty = {
                    featured: !property.featured ? 'true' : 'false'
                };
                
                const response = await fetch(`${window.api.baseURL}/admin/properties/${propertyId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${window.api.token}`
                    },
                    body: JSON.stringify(updatedProperty)
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Failed to update property');
                }

                // Reload properties from server
                await this.loadDataFromServer();
                this.renderProperties();
                this.updateStats();
                this.showNotification(`Property ${updatedProperty.featured === 'true' ? 'added to' : 'removed from'} featured list!`, 'success');
            } catch (error) {
                console.error('Error toggling featured:', error);
                this.showNotification('Failed to update property. Please try again.', 'error');
            }
        }
    }

    async updateContactStatus(contactId, status) {
        try {
            await window.api.updateContactStatus(contactId, status);
            // Reload contacts from server
            await this.loadDataFromServer();
            this.renderContacts();
            this.updateStats();
            this.showNotification('Contact status updated!', 'success');
        } catch (error) {
            console.error('Error updating contact status:', error);
            this.showNotification('Failed to update contact status. Please try again.', 'error');
        }
    }

    replyToContact(contactId) {
        const contact = this.contacts.find(c => c.id === contactId);
        if (contact) {
            const message = encodeURIComponent(
                `Hi ${contact.name}, thank you for your inquiry about ${this.getSubjectLabel(contact.subject)}. I'd be happy to help you with your real estate needs.`
            );
            window.open(`https://wa.me/${contact.phone.replace(/[^\d]/g, '')}?text=${message}`, '_blank');
        }
    }

    async deleteContact(contactId) {
        if (confirm('Are you sure you want to delete this contact?')) {
            try {
                await window.api.deleteContact(contactId);
                // Reload contacts from server
                await this.loadDataFromServer();
                this.renderContacts();
                this.updateStats();
                this.showNotification('Contact deleted successfully!', 'success');
            } catch (error) {
                console.error('Error deleting contact:', error);
                this.showNotification('Failed to delete contact. Please try again.', 'error');
            }
        }
    }

    handlePropertySearch(e) {
        const query = e.target.value.toLowerCase();
        const filteredProperties = this.properties.filter(property => 
            property.title.toLowerCase().includes(query) ||
            property.location.toLowerCase().includes(query) ||
            property.type.toLowerCase().includes(query)
        );
        this.renderFilteredProperties(filteredProperties);
    }

    handlePropertyFilter(e) {
        const type = e.target.value;
        const filteredProperties = type ? 
            this.properties.filter(p => p.type === type) : 
            this.properties;
        this.renderFilteredProperties(filteredProperties);
    }

    renderFilteredProperties(properties) {
        const container = document.getElementById('admin-properties');
        if (!container) return;

        // Use the same rendering logic but with filtered properties
        const originalProperties = this.properties;
        this.properties = properties;
        this.renderProperties();
        this.properties = originalProperties;
    }

    handleContactSearch(e) {
        const query = e.target.value.toLowerCase();
        const filteredContacts = this.contacts.filter(contact => 
            contact.name.toLowerCase().includes(query) ||
            contact.email.toLowerCase().includes(query) ||
            contact.message.toLowerCase().includes(query)
        );
        this.renderFilteredContacts(filteredContacts);
    }

    handleContactFilter(e) {
        const status = e.target.value;
        const filteredContacts = status ? 
            this.contacts.filter(c => c.status === status) : 
            this.contacts;
        this.renderFilteredContacts(filteredContacts);
    }

    renderFilteredContacts(contacts) {
        const container = document.getElementById('admin-contacts');
        if (!container) return;

        const originalContacts = this.contacts;
        this.contacts = contacts;
        this.renderContacts();
        this.contacts = originalContacts;
    }

    handleAgentForm(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        // In real app, save to database
        this.showNotification('Agent information updated successfully!', 'success');
    }

    exportData() {
        const data = {
            properties: this.properties,
            contacts: this.contacts,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zameen-khojo-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showNotification('Data exported successfully!', 'success');
    }

    backupData() {
        const backup = {
            properties: this.properties,
            contacts: this.contacts,
            version: '1.0',
            backupDate: new Date().toISOString()
        };

        localStorage.setItem('zameen_khojo_backup', JSON.stringify(backup));
        this.showNotification('Data backed up locally!', 'success');
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        if (data.properties) {
                            this.properties = data.properties;
                            this.nextPropertyId = Math.max(...this.properties.map(p => p.id)) + 1;
                        }
                        if (data.contacts) {
                            this.contacts = data.contacts;
                            this.nextContactId = Math.max(...this.contacts.map(c => c.id)) + 1;
                        }

                        this.renderProperties();
                        this.renderContacts();
                        this.updateStats();
                        this.showNotification('Data imported successfully!', 'success');
                    } catch (error) {
                        this.showNotification('Invalid file format!', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };

        input.click();
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `admin-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    getSubjectLabel(subject) {
        const subjects = {
            buying: 'Buying Property',
            selling: 'Selling Property',
            renting: 'Renting Property',
            investment: 'Investment Consultation',
            general: 'General Inquiry'
        };
        return subjects[subject] || subject;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    }

    formatPriceShort(price) {
        if (price >= 10000000) { // 1 Crore or more
            const crores = price / 10000000;
            return `₹${crores.toFixed(1)} Cr`;
        } else if (price >= 100000) { // 1 Lakh or more
            const lakhs = price / 100000;
            return `₹${lakhs.toFixed(0)} L`;
        } else {
            const thousands = price / 1000;
            return `₹${thousands.toFixed(0)}K`;
        }
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Initialize admin panel
let admin;
document.addEventListener('DOMContentLoaded', () => {
    admin = new AdminPanel();
});

// Add admin-specific styles
const adminStyles = `
    .admin-property-card {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        margin-bottom: 20px;
        transition: transform 0.2s ease;
    }

    .admin-property-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .property-image {
        position: relative;
        height: 200px;
        overflow: hidden;
    }

    .property-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .featured-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        background: #FF8C00;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
    }

    .property-content {
        padding: 20px;
    }

    .property-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
    }

    .property-header h3 {
        margin: 0;
        font-size: 18px;
        color: #1C1C1C;
    }

    .property-price {
        color: #FF8C00;
        font-weight: 600;
        font-size: 16px;
    }

    .property-meta {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;
        font-size: 14px;
        color: #6C757D;
    }

    .property-type {
        background: #E9ECEF;
        padding: 2px 8px;
        border-radius: 4px;
        text-transform: capitalize;
    }

    .property-details {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
        font-size: 14px;
        color: #6C757D;
    }

    .property-details i {
        color: #FF8C00;
        margin-right: 4px;
    }

    .property-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
    }

    .btn-icon {
        background: none;
        border: 2px solid #E9ECEF;
        width: 40px;
        height: 40px;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        color: #6C757D;
    }

    .btn-icon:hover {
        border-color: #FF8C00;
        color: #FF8C00;
        background: rgba(255, 140, 0, 0.1);
    }

    .btn-icon.danger:hover {
        border-color: #DC3545;
        color: #DC3545;
        background: rgba(220, 53, 69, 0.1);
    }

    .btn-icon .fa-star.featured {
        color: #FFD700;
    }

    .admin-contact-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        margin-bottom: 20px;
    }

    .contact-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
    }

    .contact-info h3 {
        margin: 0 0 8px 0;
        color: #1C1C1C;
    }

    .contact-info p {
        margin: 4px 0;
        color: #6C757D;
        font-size: 14px;
    }

    .status-select {
        padding: 6px 12px;
        border-radius: 6px;
        border: none;
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
        cursor: pointer;
    }

    .status-select.new {
        background: #FFE8D1;
        color: #FF8C00;
    }

    .status-select.contacted {
        background: #D1ECF1;
        color: #17A2B8;
    }

    .status-select.closed {
        background: #D4EDDA;
        color: #28A745;
    }

    .contact-content {
        margin-bottom: 16px;
    }

    .contact-subject,
    .contact-message {
        margin-bottom: 12px;
    }

    .contact-subject strong,
    .contact-message strong {
        color: #1C1C1C;
    }

    .contact-message p {
        margin: 8px 0;
        padding: 12px;
        background: #F8F9FA;
        border-radius: 6px;
        color: #495057;
    }

    .contact-date {
        font-size: 12px;
        color: #ADB5BD;
    }

    .contact-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
    }

    .chart-item {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
    }

    .chart-label {
        min-width: 80px;
        font-size: 14px;
        color: #495057;
    }

    .chart-bar {
        flex: 1;
        height: 8px;
        background: #E9ECEF;
        border-radius: 4px;
        overflow: hidden;
    }

    .chart-fill {
        height: 100%;
        background: linear-gradient(135deg, #FF8C00, #FFB84D);
        transition: width 0.5s ease;
    }

    .chart-value {
        min-width: 30px;
        font-weight: 600;
        color: #FF8C00;
        text-align: right;
    }

    .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: #6C757D;
    }

    .empty-state i {
        font-size: 48px;
        color: #E9ECEF;
        margin-bottom: 16px;
    }

    .empty-state h3 {
        margin-bottom: 8px;
        color: #495057;
    }

    .admin-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        padding: 16px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    .admin-notification.success {
        background: #28A745;
    }

    .admin-notification.error {
        background: #DC3545;
    }

    .admin-notification.info {
        background: #17A2B8;
    }

    .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .notification-content button {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        margin-left: auto;
    }

    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    .form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
    }

    .form-grid .form-group:last-child {
        grid-column: 1 / -1;
    }

    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #495057;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
        width: 100%;
        padding: 12px;
        border: 2px solid #E9ECEF;
        border-radius: 6px;
        font-family: inherit;
        font-size: 14px;
        transition: border-color 0.2s ease;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: #FF8C00;
        box-shadow: 0 0 0 3px rgba(255, 140, 0, 0.1);
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        user-select: none;
    }

    .checkmark {
        position: relative;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px;
        border-bottom: 1px solid #E9ECEF;
    }

    .modal-header h2 {
        margin: 0;
        color: #1C1C1C;
    }

    .property-form {
        padding: 24px;
    }

    .form-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid #E9ECEF;
    }

    .modal-content.large {
        max-width: 900px;
        width: 90vw;
    }

    @media (max-width: 768px) {
        .form-grid {
            grid-template-columns: 1fr;
        }

        .property-header {
            flex-direction: column;
            gap: 8px;
        }

        .contact-header {
            flex-direction: column;
            gap: 12px;
        }

        .property-actions,
        .contact-actions {
            justify-content: center;
        }

        .admin-notification {
            left: 20px;
            right: 20px;
        }
    }
`;

const adminStyleSheet = document.createElement('style');
adminStyleSheet.textContent = adminStyles;
document.head.appendChild(adminStyleSheet);