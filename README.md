# ZameenKhojo Backend Server

A complete Node.js backend server for the ZameenKhojo Real Estate website with admin panel support.

## 🚀 Features

- **Property Management**: CRUD operations for real estate properties
- **Contact Form**: Handle customer inquiries
- **Admin Panel**: Full admin dashboard with authentication
- **File Upload**: Image upload for property listings
- **JWT Authentication**: Secure admin authentication
- **RESTful API**: Clean API endpoints for frontend integration
- **Data Persistence**: JSON-based data storage (easily upgradeable to database)

## 📁 Project Structure

```
zameenkhojo-backend/
├── server.js           # Main server file
├── config.json         # Configuration settings
├── package.json        # Node.js dependencies
├── api.js             # Frontend API integration
├── db-init.js         # Database initialization
├── data/              # Data storage (auto-created)
│   ├── properties.json
│   └── contacts.json
├── public/            # Static files (auto-created)
│   └── uploads/       # Uploaded images
├── index.html         # Main website
├── admin.html         # Admin panel
├── styles.css         # Styles
├── script.js          # Main frontend script
├── admin-script.js    # Admin panel script
└── IMG_3352.jpg       # Logo
```

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database
```bash
node db-init.js
```

### 3. Start the Server
```bash
npm start
```

### 4. Access the Application
- **Website**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin.html

## 🔐 Admin Access

- **Username**: `admin`
- **Password**: `admin123`

## 📖 API Documentation

### Public Endpoints

#### Get All Properties
```
GET /api/properties
Query Parameters:
- type: villa|apartment|commercial|house
- location: string
- minPrice: number
- maxPrice: number
- bedrooms: number
```

#### Get Single Property
```
GET /api/properties/:id
```

#### Submit Contact Form
```
POST /api/contact
Body: {
  "name": "string",
  "email": "string", 
  "phone": "string",
  "subject": "string",
  "message": "string"
}
```

### Admin Endpoints (Require Authentication)

#### Login
```
POST /api/admin/login
Body: {
  "username": "admin",
  "password": "admin123"
}
```

#### Create Property
```
POST /api/admin/properties
Content-Type: multipart/form-data
Fields: title, type, location, price, bedrooms, bathrooms, sqft, description, amenities, images[]
```

#### Update Property
```
PUT /api/admin/properties/:id
Content-Type: multipart/form-data
```

#### Delete Property
```
DELETE /api/admin/properties/:id
```

#### Get Contacts
```
GET /api/admin/contacts
```

#### Update Contact Status
```
PUT /api/admin/contacts/:id
Body: { "status": "new|contacted|resolved" }
```

#### Delete Contact
```
DELETE /api/admin/contacts/:id
```

#### Get Dashboard Stats
```
GET /api/admin/stats
```

## 🧪 Testing Guide

### 1. Test Website Frontend
1. Start server: `npm start`
2. Open: http://localhost:3000
3. Test:
   - Navigate through different sections
   - Filter properties by type/location
   - Submit contact form
   - Check responsive design

### 2. Test Admin Panel
1. Go to: http://localhost:3000/admin.html
2. Login with admin/admin123
3. Test:
   - Dashboard stats display
   - Add new property with images
   - Edit existing properties
   - Delete properties
   - View contact submissions
   - Update contact status

### 3. Test API Endpoints
Using curl or Postman:

```bash
# Get all properties
curl http://localhost:3000/api/properties

# Get filtered properties
curl "http://localhost:3000/api/properties?type=villa&location=noida"

# Submit contact form
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","phone":"1234567890","subject":"buying","message":"Test message"}'

# Admin login
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 4. Test File Upload
1. Login to admin panel
2. Try adding a property with multiple images
3. Check that images are saved in `public/uploads/`
4. Verify images display correctly on frontend

### 5. Test Data Persistence
1. Add some properties and contacts
2. Stop the server
3. Restart the server
4. Check that data is still there

## 🔧 Configuration

Edit `config.json` to customize:

```json
{
  "PORT": 3000,
  "JWT_SECRET": "your-secret-key",
  "UPLOAD_PATH": "./public/uploads",
  "MAX_FILE_SIZE": 5242880,
  "ADMIN_EMAIL": "admin@zameenkhojo.com"
}
```

## 🚀 Production Deployment

### 1. Environment Setup
- Set `NODE_ENV=production`
- Use proper JWT secret
- Configure reverse proxy (nginx)
- Set up SSL certificate

### 2. Database Migration
- Replace JSON storage with MongoDB/PostgreSQL
- Update connection strings
- Implement proper data models

### 3. Security Enhancements
- Enable helmet.js
- Add rate limiting
- Implement proper password hashing
- Add input validation

### 4. Monitoring
- Add logging (Winston)
- Set up error tracking
- Monitor performance

## 📝 Development

### Adding New Features
1. Define API endpoints in `server.js`
2. Update frontend integration in `api.js`
3. Add UI components in admin panel
4. Test thoroughly

### File Structure Notes
- `data/` - JSON files for data storage
- `public/uploads/` - Uploaded property images
- Static files served from root directory

## ⚠️ Important Notes

1. **Security**: This is a development setup. For production, implement proper security measures.
2. **Database**: Currently uses JSON files. Migrate to proper database for production.
3. **Authentication**: Admin password is hardcoded. Implement proper user management.
4. **File Upload**: Basic implementation. Add image optimization for production.
5. **Error Handling**: Basic error handling implemented. Enhance for production.

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Permission Errors
```bash
# Fix upload directory permissions
chmod 755 public/uploads
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

## 📞 Support

For issues or questions:
- Check the console logs
- Verify all dependencies are installed
- Ensure ports are available
- Check file permissions

## 🎯 Next Steps

1. Replace JSON storage with database
2. Add email notifications
3. Implement advanced search
4. Add property favorites
5. Create mobile app API
6. Add payment integration
7. Implement property comparisons
8. Add real-time chat support

---

**Happy Coding! 🚀**
