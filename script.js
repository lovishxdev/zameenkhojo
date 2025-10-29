// Real Estate Website - Main JavaScript
class ZameenKhojoApp {
    constructor() {
        // Agent data
        this.agent = {
            name: "Rohan Nagar",
            title: "Real Estate Expert", 
            phone: "+91 9871668467",
            whatsappNumber: "919871668467",
            email: "infozameenkhojo@gmail.com",
            bio: "With over 3 years of experience, I specialize in residential properties and commercial investments across NCR region.",
            photo: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face",
            address: "H109, 4th Street, Gamma 2, Greater Noida 201308"
        };

        // Services data
        this.services = [
            {
                id: 1,
                title: "Residential Sales",
                description: "Find your perfect home with our comprehensive residential property services. From luxury villas to modern apartments.",
                icon: "🏠",
                features: ["Home Buying", "Market Analysis", "Property Staging"]
            },
            {
                id: 2,
                title: "Industrial Sales", 
                description: "Connect businesses with ideal industrial spaces. Warehouses, factories, and development land solutions.",
                icon: "🏭",
                features: ["Warehouse Sales", "Factory Spaces", "Land Development"]
            },
            {
                id: 3,
                title: "Commercial Real Estate",
                description: "Premium commercial spaces for your business growth. Offices, retail spaces, and commercial complexes.",
                icon: "🏢",
                features: ["Office Spaces", "Retail Properties", "Investment Analysis"]
            },
            {
                id: 4,
                title: "Rental Management",
                description: "Comprehensive rental and leasing solutions for residential and commercial properties with verified tenants.",
                icon: "🗝️", 
                features: ["Tenant Screening", "Lease Management", "Property Maintenance"]
            },
            {
                id: 5,
                title: "Consulting Services",
                description: "Expert real estate consulting for smart investment decisions and market insights with professional guidance.",
                icon: "📊",
                features: ["Investment Strategy", "Market Research", "Legal Guidance"]
            }
        ];

        // Properties will be loaded from server
        this.properties = [];
        this.isLoadingProperties = false;

        // Current filters and state
        this.currentFilters = {
            type: 'all',
            location: '',
            price: '',
            bedrooms: ''
        };

        this.filteredProperties = [];

        // Initialize app
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.setupWhatsApp();
        this.renderServices();

        // Show loading state
        this.showLoadingState();
        
        // Load properties from backend before rendering property-dependent UI
        await this.loadPropertiesFromServer();
        this.filteredProperties = [...this.properties];
        this.renderProperties();
        this.setupLocationFilter();

        this.updateAgentInfo();
        this.setupScrollEffects();
        this.setupFormHandlers();
        
        // Initialize counters after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.initializeCounters();
        }, 100);
    }

    async loadPropertiesFromServer() {
        this.isLoadingProperties = true;
        try {
            const response = await fetch('/api/properties');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();

            if (Array.isArray(data)) {
                // Always use server data, even if empty array
                this.properties = data.map((p) => {
                    // Handle images - convert to array and filter out empty values
                    let imagesArray = [];
                    if (p.images) {
                        if (Array.isArray(p.images)) {
                            imagesArray = p.images.filter(img => img && img.trim());
                        } else if (typeof p.images === 'string') {
                            // Split by newline if it's a string
                            imagesArray = p.images.split('\n').map(img => img.trim()).filter(img => img);
                        }
                    }
                    
                    return {
                        id: p.id,
                        title: p.title,
                        type: p.type,
                        location: p.location,
                        price: typeof p.price === 'string' ? parseInt(p.price) : p.price,
                        bedrooms: p.bedrooms ?? 0,
                        bathrooms: p.bathrooms ?? 0,
                        sqft: p.sqft ?? 0,
                        description: p.description || '',
                        amenities: Array.isArray(p.amenities) ? p.amenities : (typeof p.amenities === 'string' ? p.amenities.split(',').map(a => a.trim()).filter(Boolean) : []),
                        images: imagesArray,
                        featured: !!p.featured
                    };
                });
            } else {
                // Invalid response format
                this.properties = [];
            }
        } catch (e) {
            console.error('Failed to load properties from backend:', e);
            this.properties = []; // Empty array on error - show empty state
        } finally {
            this.isLoadingProperties = false;
        }
    }

    showLoadingState() {
        const container = document.getElementById('properties-grid');
        if (!container) return;
        
        container.innerHTML = `
            <div class="loading-state" style="grid-column: 1 / -1; text-align: center; padding: 80px 20px;">
                <div class="loading-spinner" style="width: 60px; height: 60px; border: 4px solid #f3f3f3; border-top: 4px solid #FF8C00; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <h3 style="font-size: 20px; color: #333; margin-bottom: 8px; font-weight: 600;">Loading Properties</h3>
                <p style="font-size: 14px; color: #666;">Please wait while we fetch the latest properties...</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    }
    // ADD THESE TWO FUNCTIONS HERE:
    initializeCounters() {
        const counters = [
            { selector: '.counter-families', target: 500, suffix: '+' },
            { selector: '.counter-experience', target: 3, suffix: '+' },
            { selector: '.counter-properties', target: 200, suffix: '+' }
        ];

        // Collect all elements first
        const elementsToAnimate = [];
        counters.forEach(counter => {
            const element = document.querySelector(counter.selector);
            if (element) {
                // Set initial value to 0
                element.textContent = '0' + counter.suffix;
                elementsToAnimate.push({ element, ...counter });
                
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting && !element.hasAttribute('data-animated')) {
                            element.setAttribute('data-animated', 'true');
                            
                            // Start all counters simultaneously
                            elementsToAnimate.forEach(({ element: el, target, suffix }) => {
                                if (!el.hasAttribute('data-animated')) {
                                    el.setAttribute('data-animated', 'true');
                                }
                                this.animateCounter(el, target, suffix);
                            });
                            
                            // Unobserve all elements after starting animation
                            elementsToAnimate.forEach(({ element: el }) => {
                                observer.unobserve(el);
                            });
                        }
                    });
                }, { 
                    threshold: 0.3, // Trigger when 30% visible
                    rootMargin: '0px 0px -50px 0px' // Start animation slightly before element is fully visible
                });
                observer.observe(element);
            }
        });
    }


    animateCounter(element, target, suffix = '') {
        let startTime = performance.now();
        const duration = 2000; // 2 seconds for all counters
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1); // Clamp to 1
            
            // Use linear progression for consistent speed throughout
            const currentValue = Math.floor(progress * target);
            
            element.textContent = currentValue + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    // Easing function for smooth animation
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Mobile menu toggle
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');

        const navBackdrop = document.querySelector('.nav-backdrop');
        
        hamburger?.addEventListener('click', () => {
            const isActive = hamburger.classList.contains('active');
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            // Toggle backdrop
            if (navBackdrop) {
                if (isActive) {
                    navBackdrop.classList.remove('active');
                } else {
                    navBackdrop.classList.add('active');
                }
            }
        });
        
        // Close menu when clicking backdrop
        navBackdrop?.addEventListener('click', () => {
            hamburger?.classList.remove('active');
            navMenu?.classList.remove('active');
            navBackdrop.classList.remove('active');
        });

        // Close mobile menu when clicking on links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger?.classList.remove('active');
                navMenu?.classList.remove('active');
                navBackdrop?.classList.remove('active');
            });
        });

        // Close mobile menu when clicking the close button
        navMenu?.addEventListener('click', (e) => {
            if (e.target.tagName === 'DIV' && e.target.textContent === '✕') {
                hamburger?.classList.remove('active');
                navMenu?.classList.remove('active');
                navBackdrop?.classList.remove('active');
            }
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (navMenu?.classList.contains('active') && 
                !navMenu.contains(e.target) && 
                !hamburger?.contains(e.target) &&
                !navBackdrop?.contains(e.target)) {
                hamburger?.classList.remove('active');
                navMenu?.classList.remove('active');
                navBackdrop?.classList.remove('active');
            }
        });

        // Close mobile menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu?.classList.contains('active')) {
                hamburger?.classList.remove('active');
                navMenu?.classList.remove('active');
                navBackdrop?.classList.remove('active');
            }
        });

        // Property filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilters.type = e.target.dataset.filter;
                this.applyFilters();
            });
        });

        // Filter selects
        document.getElementById('location-filter')?.addEventListener('change', (e) => {
            this.currentFilters.location = e.target.value;
            this.applyFilters();
        });

        document.getElementById('price-filter')?.addEventListener('change', (e) => {
            this.currentFilters.price = e.target.value;
            this.applyFilters();
        });

        document.getElementById('bedrooms-filter')?.addEventListener('change', (e) => {
            this.currentFilters.bedrooms = e.target.value;
            this.applyFilters();
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closePropertyModal();
            }
        });
    }

    // Navigation Setup
    setupNavigation() {
        const navbar = document.querySelector('.navbar');

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);

                if (targetSection) {
                    targetSection.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });

                    // Update active nav link
                    this.updateActiveNavLink(link);
                }
            });
        });

        // Navbar scroll effect
        let lastScrollY = window.scrollY;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar?.classList.add('scrolled');
            } else {
                navbar?.classList.remove('scrolled');
            }

            // Update active nav link based on scroll position
            this.updateActiveNavOnScroll();
            lastScrollY = window.scrollY;
        }, { passive: true });
    }

    updateActiveNavLink(activeLink) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        activeLink?.classList.add('active');
    }

    updateActiveNavOnScroll() {
        const sections = ['home', 'properties', 'services', 'about', 'location', 'contact'];
        const scrollPosition = window.scrollY + 100;

        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            const navLink = document.querySelector(`a[href="#${sectionId}"]`);

            if (section && navLink) {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;

                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    this.updateActiveNavLink(navLink);
                }
            }
        });
    }

    // WhatsApp Setup
    setupWhatsApp() {
        const whatsappBtn = document.getElementById('whatsapp-btn');

        if (whatsappBtn) {
            whatsappBtn.addEventListener('click', () => {
                const message = encodeURIComponent(
                    `Hi ${this.agent.name}, I'm interested in your real estate services. Could you please provide me with more information?`
                );
                const whatsappUrl = `https://wa.me/${this.agent.whatsappNumber}?text=${message}`;
                window.open(whatsappUrl, '_blank');
            });
        }
    }

    // Render Services
    renderServices() {
        const container = document.getElementById('services-grid');
        if (!container) return;

        container.innerHTML = this.services.map(service => `
            <div class="service-card" data-aos="fade-up">
                <div class="service-icon">${service.icon}</div>
                <h3 class="service-title">${service.title}</h3>
                <p class="service-description">${service.description}</p>
                <div class="service-features">
                    ${service.features.map(feature => `
                        <span class="service-feature">${feature}</span>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    // Render Properties
    renderProperties() {
        const container = document.getElementById('properties-grid');
        if (!container) return;

        // Show empty state if no properties available
        if (!this.filteredProperties || this.filteredProperties.length === 0) {
            container.innerHTML = `
                <div class="empty-properties-state" style="grid-column: 1 / -1; text-align: center; padding: 80px 20px;">
                    <div class="empty-state-icon" style="font-size: 64px; color: #ddd; margin-bottom: 20px;">
                        <i class="fas fa-home"></i>
                    </div>
                    <h3 style="font-size: 24px; color: #333; margin-bottom: 12px; font-weight: 600;">No Properties Listed</h3>
                    <p style="font-size: 16px; color: #666; max-width: 500px; margin: 0 auto;">
                        We don't have any properties available at the moment. Please check back later or contact us for more information.
                    </p>
                    <a href="#contact" class="btn btn-primary" style="margin-top: 24px; display: inline-block;">
                        <i class="fas fa-phone"></i> Contact Us
                    </a>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredProperties.map(property => {
            const images = Array.isArray(property.images) ? property.images : [];
            const firstImage = images.length > 0 && images[0] ? images[0] : 'https://via.placeholder.com/400x300?text=No+Image';
            
            return `
            <div class="property-card" onclick="app.showPropertyModal(${property.id})" data-aos="fade-up">
                <img src="${firstImage}" alt="${property.title}" class="property-image" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
                <div class="property-info">
                    <div class="property-price">${this.formatPrice(property.price)}</div>
                    <h3 class="property-title">${property.title}</h3>
                    <p class="property-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${property.location}
                    </p>
                    <div class="property-details">
                        ${property.bedrooms > 0 ? `<span><i class="fas fa-bed"></i> ${property.bedrooms} Beds</span>` : ''}
                        <span><i class="fas fa-bath"></i> ${property.bathrooms} Baths</span>
                        <span><i class="fas fa-ruler-combined"></i> ${property.sqft} sq ft</span>
                    </div>
                    <div class="property-amenities">
                        ${Array.isArray(property.amenities) && property.amenities.length > 0 ? property.amenities.slice(0, 3).map(amenity => `
                            <span class="amenity">${amenity}</span>
                        `).join('') : ''}
                        ${Array.isArray(property.amenities) && property.amenities.length > 3 ? `<span class="amenity">+${property.amenities.length - 3} more</span>` : ''}
                    </div>
                </div>
            </div>

        `;
        }).join('');
        
    }
    

    // Apply Filters
    applyFilters() {
        this.filteredProperties = this.properties.filter(property => {
            // Type filter
            if (this.currentFilters.type !== 'all' && property.type !== this.currentFilters.type) {
                return false;
            }

            // Location filter
            if (this.currentFilters.location && !property.location.toLowerCase().includes(this.currentFilters.location.toLowerCase())) {
                return false;
            }

            // Price filter
            if (this.currentFilters.price) {
                const [min, max] = this.currentFilters.price.split('-').map(p => parseInt(p) || 0);
                if (max && (property.price < min || property.price > max)) return false;
                if (!max && property.price < min) return false;
            }

            // Bedrooms filter
            if (this.currentFilters.bedrooms && property.bedrooms < parseInt(this.currentFilters.bedrooms)) {
                return false;
            }

            return true;
        });

        this.renderProperties();
    }

    // Setup Location Filter
    setupLocationFilter() {
        const locationFilter = document.getElementById('location-filter');
        if (!locationFilter) return;

        const locations = [...new Set(this.properties.map(p => p.location))];

        locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            locationFilter.appendChild(option);
        });
    }

    // Show Property Modal
    showPropertyModal(propertyId) {
        const property = this.properties.find(p => p.id === propertyId);
        if (!property) return;

        // Remove existing modal if any
        const existingOverlay = document.getElementById('property-modal-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        const images = Array.isArray(property.images) ? property.images.filter(img => !!img) : [];
        const mainImageSrc = images[0] || 'https://via.placeholder.com/800x600?text=No+Image';

        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.id = 'property-modal-overlay';
        overlay.className = 'property-modal-overlay';

        // Create modal card
        const modalCard = document.createElement('div');
        modalCard.className = 'property-modal-card';

        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'property-modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => this.closePropertyModal();

        // Create modal body
        const modalBody = document.createElement('div');
        modalBody.className = 'property-modal-body';
        modalBody.innerHTML = `
            <div class="property-modal-content">
                <div class="property-gallery">
                    <div class="main-image">
                        <img src="${mainImageSrc}" alt="${property.title}" id="main-property-image" onerror="this.src='https://via.placeholder.com/800x600?text=No+Image'">
                    </div>
                    ${images.length > 1 ? `
                        <div class="thumbnail-images">
                            ${images.map((img, index) => `
                                <img src="${img}" alt="${property.title} ${index + 1}" 
                                     class="thumbnail ${index === 0 ? 'active' : ''}"
                                     onclick="app.switchPropertyImage('${img}', this)"
                                     onerror="this.style.display='none'">
                            `).join('')}
                        </div>
                    ` : ''}
                </div>

                <div class="property-details-content">
                    <div class="property-header">
                        <div class="property-price-large">${this.formatPrice(property.price)}</div>
                        <h2 class="property-title-large">${property.title}</h2>
                        <p class="property-location-large">
                            <i class="fas fa-map-marker-alt"></i>
                            ${property.location}
                        </p>
                    </div>

                    <div class="property-specs">
                        ${property.bedrooms > 0 ? `<div class="spec"><i class="fas fa-bed"></i><span>${property.bedrooms} Bedrooms</span></div>` : ''}
                        <div class="spec"><i class="fas fa-bath"></i><span>${property.bathrooms} Bathrooms</span></div>
                        <div class="spec"><i class="fas fa-ruler-combined"></i><span>${property.sqft} sq ft</span></div>
                        <div class="spec"><i class="fas fa-home"></i><span>${property.type}</span></div>
                    </div>

                    <div class="property-description-section">
                        <h3>Description</h3>
                        <p>${property.description}</p>
                    </div>

                    ${Array.isArray(property.amenities) && property.amenities.length > 0 ? `
                    <div class="property-amenities-section">
                        <h3>Amenities</h3>
                        <div class="amenities-list">
                            ${property.amenities.map(amenity => `
                                <div class="amenity-item">
                                    <i class="fas fa-check"></i>
                                    <span>${amenity}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <div class="property-actions">
                        <button class="btn btn-primary" onclick="app.contactAboutProperty(${property.id})">
                            <i class="fab fa-whatsapp"></i>
                            Contact Agent
                        </button>
                        <button class="btn btn-outline" onclick="app.scheduleViewing(${property.id})">
                            <i class="fas fa-calendar"></i>
                            Schedule Viewing
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Assemble modal
        modalCard.appendChild(closeBtn);
        modalCard.appendChild(modalBody);
        overlay.appendChild(modalCard);

        // Add to body
        document.body.appendChild(overlay);

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closePropertyModal();
            }
        });

        // Show modal with animation
        setTimeout(() => {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }, 10);
    }

    // Close Property Modal
    closePropertyModal() {
        const overlay = document.getElementById('property-modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }
    }

    // Switch Property Image
    switchPropertyImage(imageSrc, thumbnail) {
        const mainImage = document.getElementById('main-property-image');
        const thumbnails = document.querySelectorAll('.thumbnail');

        mainImage.src = imageSrc;
        thumbnails.forEach(thumb => thumb.classList.remove('active'));
        thumbnail.classList.add('active');
    }

    // Contact About Property
    contactAboutProperty(propertyId) {
        const property = this.properties.find(p => p.id === propertyId);
        if (!property) return;

        const message = encodeURIComponent(
            `Hi ${this.agent.name}, I'm interested in "${property.title}" listed at ${this.formatPrice(property.price)}. Could you please provide more details and schedule a viewing?`
        );
        const whatsappUrl = `https://wa.me/${this.agent.whatsappNumber}?text=${message}`;

        window.open(whatsappUrl, '_blank');
        this.closePropertyModal();
    }

    // Schedule Viewing
    scheduleViewing(propertyId) {
        const property = this.properties.find(p => p.id === propertyId);
        if (!property) return;

        const message = encodeURIComponent(
            `Hi ${this.agent.name}, I would like to schedule a viewing for "${property.title}" in ${property.location}. When would be a convenient time?`
        );
        const whatsappUrl = `https://wa.me/${this.agent.whatsappNumber}?text=${message}`;

        window.open(whatsappUrl, '_blank');
        this.closePropertyModal();
    }

    // Update Agent Info
    updateAgentInfo() {
        // Safely update agent info, checking if elements exist first
        const agentName = document.getElementById('agent-name');
        if (agentName) agentName.textContent = this.agent.name;
        
        const agentTitle = document.getElementById('agent-title');
        if (agentTitle) agentTitle.textContent = this.agent.title;
        
        const agentBio = document.getElementById('agent-bio');
        if (agentBio) agentBio.textContent = this.agent.bio;
        
        const agentPhone = document.getElementById('agent-phone');
        if (agentPhone) agentPhone.textContent = this.agent.phone;
        
        const agentEmail = document.getElementById('agent-email');
        if (agentEmail) agentEmail.textContent = this.agent.email;
        
        // const agentPhoto = document.getElementById('agent-photo');
        // if (agentPhoto) agentPhoto.src = this.agent.photo;
    }

    // Setup Scroll Effects
    setupScrollEffects() {
        // Intersection Observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe elements with fade-up animation
        document.querySelectorAll('[data-aos="fade-up"]').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    // Setup Form Handlers
    setupFormHandlers() {
        const contactForm = document.getElementById('contact-form');

        contactForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleContactForm(e);
        });
    }

    // Handle Contact Form
    handleContactForm(e) {
        const formData = new FormData(e.target);
        const contactData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };

        // Show success message
        this.showNotification('Thank you for your message! We will get back to you soon.', 'success');

        // Reset form
        e.target.reset();

        // In real application, send to backend
        console.log('Contact form submitted:', contactData);

        // Optional: Send WhatsApp message
        const message = encodeURIComponent(
            `New Contact Form Submission:\n\nName: ${contactData.name}\nEmail: ${contactData.email}\nPhone: ${contactData.phone}\nSubject: ${contactData.subject}\nMessage: ${contactData.message}`
        );
        // You can optionally open WhatsApp with the form data
    }

    // Show Notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);

        // Remove on click
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    // Format Price
    formatPrice(price) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ZameenKhojoApp();
});

// Add notification styles dynamically
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 16px;
        margin-bottom: 10px;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    }

    .notification-success {
        border-left: 4px solid #28a745;
    }

    .notification-error {
        border-left: 4px solid #dc3545;
    }

    .notification-info {
        border-left: 4px solid #17a2b8;
    }

    .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
    }

    .notification-message {
        color: #333;
        font-weight: 500;
    }

    .notification-close {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .notification-close:hover {
        color: #333;
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

    /* Property Modal Styles */
    .property-modal-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
        padding: 24px;
    }

    .property-gallery {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .main-image img {
        width: 100%;
        height: 300px;
        object-fit: cover;
        border-radius: 12px;
    }

    .thumbnail-images {
        display: flex;
        gap: 8px;
        overflow-x: auto;
    }

    .thumbnail {
        width: 80px;
        height: 60px;
        object-fit: cover;
        border-radius: 6px;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.3s ease;
        border: 2px solid transparent;
    }

    .thumbnail.active,
    .thumbnail:hover {
        opacity: 1;
        border-color: #FF8C00;
    }

    .property-details-content {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .property-price-large {
        font-size: 28px;
        font-weight: bold;
        color: #FF8C00;
    }

    .property-title-large {
        font-size: 24px;
        color: #1C1C1C;
        margin: 8px 0;
    }

    .property-location-large {
        color: #6C757D;
        font-size: 16px;
    }

    .property-specs {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        padding: 16px;
        background: #F8F9FA;
        border-radius: 8px;
    }

    .spec {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #495057;
    }

    .spec i {
        color: #FF8C00;
        width: 20px;
    }

    .property-description-section h3,
    .property-amenities-section h3 {
        color: #1C1C1C;
        margin-bottom: 12px;
        font-size: 18px;
    }

    .amenities-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
    }

    .amenity-item {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #495057;
        font-size: 14px;
    }

    .amenity-item i {
        color: #28A745;
        font-size: 12px;
    }

    .property-actions {
        display: flex;
        gap: 16px;
    }

    @media (max-width: 768px) {
        .property-modal-content {
            grid-template-columns: 1fr;
            gap: 16px;
            padding: 16px;
        }

        .property-specs {
            grid-template-columns: 1fr;
        }

        .amenities-list {
            grid-template-columns: 1fr;
        }

        .property-actions {
            flex-direction: column;
        }

        .notification {
            left: 20px;
            right: 20px;
            max-width: none;
        }
    }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Card Rotation Animation
class FloatingCardRotator {
    constructor() {
        this.cards = [
            {
                img: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop',
                title: 'Luxury Villa',
                price: '₹85 Lakhs'
            },
            {
                img: 'https://images.unsplash.com/photo-1588067444250-50f27842c0b2?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1974',
                title: 'Green Land',
                price: '₹45 Lakhs'
            },
            {
                img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop',
                title: 'Commercial Space',
                price: '₹1.2 Crores'
            }
        ];
        
        this.currentIndex = 0;
        this.cardElements = null;
    }

    init() {
        this.cardElements = document.querySelectorAll('.floating-card');
        if (this.cardElements.length === 3) {
            this.startRotation();
        }
    }

    startRotation() {
        // Rotate every 6 seconds
        setInterval(() => {
            this.rotateCards();
        }, 6000);
        
        // Initial rotation
        setTimeout(() => this.rotateCards(), 2000);
    }

    rotateCards() {
        this.currentIndex = (this.currentIndex + 1) % this.cards.length;
        
        this.cardElements.forEach((card, index) => {
            const cardData = this.cards[(this.currentIndex + index) % this.cards.length];
            const img = card.querySelector('img');
            const title = card.querySelector('h4');
            const price = card.querySelector('p');
            
            if (img && title && price) {
                // Create overlay for smooth transition
                card.style.filter = 'blur(3px)';
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    // Update content while invisible
                    img.src = cardData.img;
                    img.alt = cardData.title;
                    title.textContent = cardData.title;
                    price.textContent = cardData.price;
                    
                    // Fade in smoothly from below
                    card.style.filter = 'blur(0px)';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 1200);
            }
        });
    }
}

// Initialize card rotation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const cardRotator = new FloatingCardRotator();
    cardRotator.init();
});