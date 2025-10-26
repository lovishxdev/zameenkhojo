const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('./config.json');

const app = express();
const PORT = config.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Data storage (In production, use a proper database)
let properties = [];
let contacts = [];
let admin = {
    username: 'admin',
    password: '$2b$10$123456789', // Replace with hashed password
    email: 'admin@zameenkhojo.com'
};

// Load existing data
const loadData = () => {
    try {
        if (fs.existsSync('./data/properties.json')) {
            properties = JSON.parse(fs.readFileSync('./data/properties.json', 'utf8'));
        }
        if (fs.existsSync('./data/contacts.json')) {
            contacts = JSON.parse(fs.readFileSync('./data/contacts.json', 'utf8'));
        }
    } catch (error) {
        console.log('No existing data found, starting fresh');
    }
};

// Save data
const saveData = () => {
    if (!fs.existsSync('./data')) {
        fs.mkdirSync('./data');
    }
    fs.writeFileSync('./data/properties.json', JSON.stringify(properties, null, 2));
    fs.writeFileSync('./data/contacts.json', JSON.stringify(contacts, null, 2));
};

// File upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = './public/uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, config.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Initialize data
loadData();

// ROUTES

// Serve main website
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// API Routes

// Authentication
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (username !== admin.username) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // For demo purposes, use simple password check
        // In production, use bcrypt.compare()
        if (password !== 'admin123') {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { username: admin.username },
            config.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token: token,
            user: { username: admin.username, email: admin.email }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Properties API
app.get('/api/properties', (req, res) => {
    const { type, location, minPrice, maxPrice, bedrooms } = req.query;

    let filteredProperties = [...properties];

    if (type && type !== 'all') {
        filteredProperties = filteredProperties.filter(p => p.type === type);
    }

    if (location) {
        filteredProperties = filteredProperties.filter(p => 
            p.location.toLowerCase().includes(location.toLowerCase())
        );
    }

    if (minPrice) {
        filteredProperties = filteredProperties.filter(p => p.price >= parseInt(minPrice));
    }

    if (maxPrice) {
        filteredProperties = filteredProperties.filter(p => p.price <= parseInt(maxPrice));
    }

    if (bedrooms) {
        filteredProperties = filteredProperties.filter(p => p.bedrooms >= parseInt(bedrooms));
    }

    res.json(filteredProperties);
});

app.get('/api/properties/:id', (req, res) => {
    const property = properties.find(p => p.id === parseInt(req.params.id));
    if (!property) {
        return res.status(404).json({ error: 'Property not found' });
    }
    res.json(property);
});

// Admin - Create Property
app.post('/api/admin/properties', authenticateToken, upload.array('images', 5), (req, res) => {
    try {
        const {
            title,
            type,
            location,
            price,
            bedrooms,
            bathrooms,
            sqft,
            description,
            amenities
        } = req.body;

        const newProperty = {
            id: Date.now(),
            title,
            type,
            location,
            price: parseInt(price),
            bedrooms: parseInt(bedrooms) || 0,
            bathrooms: parseInt(bathrooms),
            sqft: parseInt(sqft),
            description,
            amenities: amenities ? amenities.split(',').map(a => a.trim()) : [],
            images: req.files ? req.files.map(file => `/uploads/${file.filename}`) : [],
            featured: false,
            dateAdded: new Date().toISOString()
        };

        properties.push(newProperty);
        saveData();

        res.json({ success: true, property: newProperty });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create property' });
    }
});

// Admin - Update Property
app.put('/api/admin/properties/:id', authenticateToken, upload.array('images', 5), (req, res) => {
    try {
        const propertyId = parseInt(req.params.id);
        const propertyIndex = properties.findIndex(p => p.id === propertyId);

        if (propertyIndex === -1) {
            return res.status(404).json({ error: 'Property not found' });
        }

        const {
            title,
            type,
            location,
            price,
            bedrooms,
            bathrooms,
            sqft,
            description,
            amenities,
            featured
        } = req.body;

        const updatedProperty = {
            ...properties[propertyIndex],
            title: title || properties[propertyIndex].title,
            type: type || properties[propertyIndex].type,
            location: location || properties[propertyIndex].location,
            price: price ? parseInt(price) : properties[propertyIndex].price,
            bedrooms: bedrooms ? parseInt(bedrooms) : properties[propertyIndex].bedrooms,
            bathrooms: bathrooms ? parseInt(bathrooms) : properties[propertyIndex].bathrooms,
            sqft: sqft ? parseInt(sqft) : properties[propertyIndex].sqft,
            description: description || properties[propertyIndex].description,
            amenities: amenities ? amenities.split(',').map(a => a.trim()) : properties[propertyIndex].amenities,
            featured: featured === 'true',
            images: req.files && req.files.length > 0 
                ? req.files.map(file => `/uploads/${file.filename}`)
                : properties[propertyIndex].images
        };

        properties[propertyIndex] = updatedProperty;
        saveData();

        res.json({ success: true, property: updatedProperty });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update property' });
    }
});

// Admin - Delete Property
app.delete('/api/admin/properties/:id', authenticateToken, (req, res) => {
    try {
        const propertyId = parseInt(req.params.id);
        const propertyIndex = properties.findIndex(p => p.id === propertyId);

        if (propertyIndex === -1) {
            return res.status(404).json({ error: 'Property not found' });
        }

        // Delete associated images
        const property = properties[propertyIndex];
        if (property.images && property.images.length > 0) {
            property.images.forEach(imagePath => {
                const fullPath = path.join(__dirname, 'public', imagePath);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            });
        }

        properties.splice(propertyIndex, 1);
        saveData();

        res.json({ success: true, message: 'Property deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete property' });
    }
});

// Contact Form
app.post('/api/contact', (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        const newContact = {
            id: Date.now(),
            name,
            email,
            phone,
            subject,
            message,
            date: new Date().toISOString(),
            status: 'new'
        };

        contacts.push(newContact);
        saveData();

        // In production, send email notification here
        console.log('New contact form submission:', newContact);

        res.json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Admin - Get Contacts
app.get('/api/admin/contacts', authenticateToken, (req, res) => {
    const sortedContacts = contacts.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(sortedContacts);
});

// Admin - Update Contact Status
app.put('/api/admin/contacts/:id', authenticateToken, (req, res) => {
    try {
        const contactId = parseInt(req.params.id);
        const contactIndex = contacts.findIndex(c => c.id === contactId);

        if (contactIndex === -1) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        const { status } = req.body;
        contacts[contactIndex].status = status;
        saveData();

        res.json({ success: true, contact: contacts[contactIndex] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update contact' });
    }
});

// Admin - Delete Contact
app.delete('/api/admin/contacts/:id', authenticateToken, (req, res) => {
    try {
        const contactId = parseInt(req.params.id);
        const contactIndex = contacts.findIndex(c => c.id === contactId);

        if (contactIndex === -1) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        contacts.splice(contactIndex, 1);
        saveData();

        res.json({ success: true, message: 'Contact deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete contact' });
    }
});

// Admin Dashboard Stats
app.get('/api/admin/stats', authenticateToken, (req, res) => {
    const stats = {
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
        recentContacts: contacts
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5)
    };

    res.json(stats);
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large' });
        }
    }
    res.status(500).json({ error: error.message });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 ZameenKhojo Server running on http://localhost:${PORT}`);
    console.log('📁 Static files served from public directory');
    console.log('🔐 Admin login: username=admin, password=admin123');
});

module.exports = app;
