const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware - ORDER MATTERS!
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CRITICAL: Serve static files from current directory
app.use(express.static(__dirname));

// Data storage
let properties = [];
let contacts = [];
let admin = { username: 'admin', email: 'admin@zameenkhojo.com', password: 'admin123' };

// Load/Save functions
const loadData = () => {
    try {
        if (fs.existsSync('./data/properties.json')) {
            properties = JSON.parse(fs.readFileSync('./data/properties.json', 'utf8'));
        }
        if (fs.existsSync('./data/contacts.json')) {
            contacts = JSON.parse(fs.readFileSync('./data/contacts.json', 'utf8'));
        }
        if (fs.existsSync('./data/admin.json')) {
            admin = JSON.parse(fs.readFileSync('./data/admin.json', 'utf8'));
        }
    } catch (error) {
        console.log('Starting with empty data');
    }
};

const saveData = () => {
    if (!fs.existsSync('./data')) fs.mkdirSync('./data');
    fs.writeFileSync('./data/properties.json', JSON.stringify(properties, null, 2));
    fs.writeFileSync('./data/contacts.json', JSON.stringify(contacts, null, 2));
    fs.writeFileSync('./data/admin.json', JSON.stringify(admin, null, 2));
};

loadData();

// Simple auth middleware
const checkAuth = (req, res, next) => {
    const auth = req.headers.authorization;
    if (auth === 'Bearer admin123') {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// API ROUTES (must come BEFORE static file serving for priority)

// Admin login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === admin.username && password === admin.password) {
        res.json({
            success: true,
            token: 'admin123',
            user: { username: admin.username, email: admin.email }
        });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Admin: change password (verify old password)
app.post('/api/admin/change-password', checkAuth, (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    if (oldPassword !== admin.password) {
        return res.status(400).json({ error: 'Current password is incorrect' });
    }
    if (String(newPassword).length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    admin.password = String(newPassword);
    saveData();
    res.json({ success: true, message: 'Password updated successfully' });
});

// Get all properties
app.get('/api/properties', (req, res) => {
    let filtered = [...properties];
    const { type, location, minPrice, maxPrice, bedrooms } = req.query;

    if (type && type !== 'all') filtered = filtered.filter(p => p.type === type);
    if (location) filtered = filtered.filter(p => p.location.toLowerCase().includes(location.toLowerCase()));
    if (minPrice) filtered = filtered.filter(p => p.price >= parseInt(minPrice));
    if (maxPrice) filtered = filtered.filter(p => p.price <= parseInt(maxPrice));
    if (bedrooms) filtered = filtered.filter(p => p.bedrooms >= parseInt(bedrooms));

    res.json(filtered);
});

// Get single property
app.get('/api/properties/:id', (req, res) => {
    const prop = properties.find(p => p.id === parseInt(req.params.id));
    prop ? res.json(prop) : res.status(404).json({ error: 'Not found' });
});

// Admin - Create property (simplified without file upload for now)
app.post('/api/admin/properties', checkAuth, (req, res) => {
    console.log('=== CREATE PROPERTY REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Images field type:', typeof req.body.images);
    console.log('Images field value:', req.body.images);
    
    const { title, type, location, price, bedrooms, bathrooms, sqft, description, amenities, images, featured } = req.body;
    
    // Handle images - can be string (newline-separated) or array
    let imagesArray = [];
    if (images !== undefined && images !== null) {
        if (typeof images === 'string') {
            imagesArray = images.split('\n')
                .map(img => img.trim())
                .filter(img => img && img.length > 0);
        } else if (Array.isArray(images)) {
            imagesArray = images.filter(img => img && (typeof img === 'string' ? img.trim().length > 0 : false));
        }
    }
    console.log('Processed images array:', imagesArray);
    console.log('Images array length:', imagesArray.length);
    
    const newProp = {
        id: Date.now(),
        title, type, location,
        price: parseInt(price),
        bedrooms: parseInt(bedrooms) || 0,
        bathrooms: parseInt(bathrooms),
        sqft: parseInt(sqft),
        description,
        amenities: amenities ? (typeof amenities === 'string' ? amenities.split(',').map(a => a.trim()) : amenities) : [],
        images: imagesArray,
        featured: featured === 'true' || featured === true || featured === 'on',
        dateAdded: new Date().toISOString()
    };
    
    console.log('New property object:', JSON.stringify(newProp, null, 2));
    
    properties.push(newProp);
    saveData();
    
    console.log('Property saved. Total properties:', properties.length);
    console.log('=== END CREATE PROPERTY ===\n');
    
    res.json({ success: true, property: newProp });
});

// Admin - Update property
app.put('/api/admin/properties/:id', checkAuth, (req, res) => {
    console.log('=== UPDATE PROPERTY REQUEST ===');
    console.log('Property ID:', req.params.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Images field type:', typeof req.body.images);
    console.log('Images field value:', req.body.images);
    
    const idx = properties.findIndex(p => p.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    console.log('Existing property images:', properties[idx].images);

    const { title, type, location, price, bedrooms, bathrooms, sqft, description, amenities, images, featured } = req.body;
    
    // Handle images - can be string (newline-separated) or array
    let imagesArray = properties[idx].images || []; // default to existing or empty array
    if (images !== undefined && images !== null) {
        if (typeof images === 'string') {
            // Even empty string should be processed - will result in empty array
            imagesArray = images.split('\n')
                .map(img => img.trim())
                .filter(img => img && img.length > 0);
        } else if (Array.isArray(images)) {
            imagesArray = images.filter(img => img && (typeof img === 'string' ? img.trim().length > 0 : false));
        }
    }
    console.log('Processed images array:', imagesArray);
    console.log('Images array length:', imagesArray.length);
    
    // Handle amenities
    let amenitiesArray = properties[idx].amenities; // default to existing
    if (amenities !== undefined) {
        if (typeof amenities === 'string') {
            amenitiesArray = amenities.split(',').map(a => a.trim()).filter(a => a);
        } else if (Array.isArray(amenities)) {
            amenitiesArray = amenities;
        }
    }
    
    properties[idx] = {
        ...properties[idx],
        title: title || properties[idx].title,
        type: type || properties[idx].type,
        location: location || properties[idx].location,
        price: price ? parseInt(price) : properties[idx].price,
        bedrooms: bedrooms !== undefined ? parseInt(bedrooms) : properties[idx].bedrooms,
        bathrooms: bathrooms ? parseInt(bathrooms) : properties[idx].bathrooms,
        sqft: sqft ? parseInt(sqft) : properties[idx].sqft,
        description: description || properties[idx].description,
        amenities: amenitiesArray,
        images: imagesArray,
        featured: featured !== undefined ? (featured === 'true' || featured === true || featured === 'on') : properties[idx].featured
    };
    
    console.log('Updated property object:', JSON.stringify(properties[idx], null, 2));
    
    saveData();
    
    console.log('Property updated and saved.');
    console.log('=== END UPDATE PROPERTY ===\n');
    
    res.json({ success: true, property: properties[idx] });
});

// Admin - Delete property
app.delete('/api/admin/properties/:id', checkAuth, (req, res) => {
    const idx = properties.findIndex(p => p.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    properties.splice(idx, 1);
    saveData();
    res.json({ success: true });
});

// Contact form
app.post('/api/contact', (req, res) => {
    const { name, email, phone, subject, message } = req.body;
    const newContact = {
        id: Date.now(),
        name, email, phone, subject, message,
        date: new Date().toISOString(),
        status: 'new'
    };
    contacts.push(newContact);
    saveData();
    console.log('New contact:', newContact);
    res.json({ success: true, message: 'Message sent!' });
});

// Admin - Get contacts
app.get('/api/admin/contacts', checkAuth, (req, res) => {
    res.json(contacts.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

// Admin - Update contact status
app.put('/api/admin/contacts/:id', checkAuth, (req, res) => {
    const idx = contacts.findIndex(c => c.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    contacts[idx].status = req.body.status;
    saveData();
    res.json({ success: true, contact: contacts[idx] });
});

// Admin - Delete contact
app.delete('/api/admin/contacts/:id', checkAuth, (req, res) => {
    const idx = contacts.findIndex(c => c.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    contacts.splice(idx, 1);
    saveData();
    res.json({ success: true });
});

// Dashboard stats
app.get('/api/admin/stats', checkAuth, (req, res) => {
    res.json({
        totalProperties: properties.length,
        featuredProperties: properties.filter(p => p.featured).length,
        totalContacts: contacts.length,
        newContacts: contacts.filter(c => c.status === 'new').length,
        propertiesByType: {
            villa: properties.filter(p => p.type === 'villa').length,
            apartment: properties.filter(p => p.type === 'apartment').length,
            commercial: properties.filter(p => p.type === 'commercial').length,
            house: properties.filter(p => p.type === 'house').length
        },
        recentContacts: contacts.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 ZameenKhojo Server is running!`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log(`\n✅ Test these URLs in browser:`);
    console.log(`   - http://localhost:${PORT}/`);
    console.log(`   - http://localhost:${PORT}/styles.css`);
    console.log(`   - http://localhost:${PORT}/script.js`);
    console.log(`   - http://localhost:${PORT}/IMG_3352.jpg`);
    console.log(`\n🔐 Admin: username=${admin.username}, password=${admin.password}\n`);
});

module.exports = app;