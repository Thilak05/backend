# Usasya E-commerce Backend

## 🚀 Modern E-commerce API Server

A comprehensive Node.js/Express backend for the Usasya e-commerce platform with admin panel support, guest checkout, analytics, and category-based product management.

## ✨ Features

### **Core Features**
- 🛍️ **Product Management**: Full CRUD with image upload, stock management, and categorization
- 📁 **Category System**: Hierarchical categories with product count tracking
- 👥 **User Management**: Multi-role system (admin/client) with profile management
- 🛒 **Order System**: Guest and authenticated orders with UPI payment integration
- 🔐 **JWT Authentication**: Secure token-based authentication with refresh tokens
- 📊 **Analytics Dashboard**: Comprehensive sales, revenue, and user analytics

### **Advanced Features**
- 🚀 **Guest Checkout**: Anonymous order placement without registration
- 📱 **UPI Payment Integration**: Automated UPI link generation for orders
- 🔍 **Advanced Product Filtering**: Search, sort, filter by category, price, stock
- 📈 **Real-time Analytics**: Dashboard metrics, top products, revenue trends
- 🏷️ **Category-based Browsing**: Public endpoints for category product display
- 🔒 **Role-based Access Control**: Admin/client permissions with middleware
- 📱 **Network Discovery**: Automatic local network IP detection for development

## 🚀 Quick Start

### **1. Installation**

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration
```

### **2. Environment Configuration**

Create `.env` file:

```env
# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=*

# Database
DB_PATH=./database/usasya.db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10mb

# UPI Configuration (Optional)
UPI_ID=your_upi_id@bank
UPI_MERCHANT_NAME=Usasya Store
```

### **3. Start Development Server**

```bash
# Start with auto-restart
npm run dev

# Or start normally
npm start

# For Windows batch file
./start.bat
```

The server will start on `http://localhost:3001` and display network access information.

### **4. Access API Documentation**

- **Health Check**: `GET http://localhost:3001/api/health`
- **API Docs**: `GET http://localhost:3001/api/docs`
- **Database**: Auto-created at `./database/usasya.db`

## 📁 Project Structure

```
usaya-server/
├── 📄 server.js                 # Main server entry point
├── 📄 package.json              # Dependencies and scripts
├── 📄 .env                      # Environment variables
├── 📁 database/
│   ├── 📄 init.js               # Database initialization
│   ├── 📄 init.sql              # Database schema
│   └── 📄 usasya.db             # SQLite database (auto-created)
├── 📁 routes/
│   ├── 📄 auth.js               # Authentication endpoints
│   ├── 📄 users.js              # User management
│   ├── 📄 products.js           # Product management
│   ├── 📄 categories.js         # Category management
│   └── 📄 orders.js             # Order & analytics
├── 📁 middleware/
│   └── 📄 auth.js               # Authentication middleware
├── 📁 utils/
│   ├── 📄 network.js            # Network utilities
│   └── 📄 validation.js         # Input validation
├── 📁 uploads/                  # File uploads directory
└── 📁 docs/                     # Documentation files
```

## 🔌 API Endpoints

### **Authentication**
- `POST /api/auth/register` - Register new client user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/refresh` - Refresh auth token
- `POST /api/auth/logout` - User logout

### **Users** (Admin + Self Management)
- `GET /api/users` - List all users (admin)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (admin)
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/profile` - Update own profile
- `DELETE /api/users/:id` - Delete user (admin)
- `GET /api/users/stats/overview` - User statistics (admin)

### **Categories**
- `GET /api/categories` - List all categories (admin)
- `GET /api/categories/public` - Public categories with product counts
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

### **Products**
- `GET /api/products` - List products with filtering/sorting (admin)
- `GET /api/products/public` - Public product listing
- `GET /api/products/public/by-category` - Products grouped by category
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product with image upload (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### **Orders & Analytics**
- `GET /api/orders` - List orders with filtering (admin)
- `GET /api/orders/my` - User's own orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order (guest or authenticated)
- `PUT /api/orders/:id` - Update order status
- `DELETE /api/orders/:id` - Delete order (admin)

### **Analytics (Admin Only)**
- `GET /api/orders/analytics/dashboard` - Dashboard overview
- `GET /api/orders/analytics/top-products` - Best selling products
- `GET /api/orders/analytics/revenue` - Revenue trends
- `GET /api/orders/analytics/products` - Product performance
- `GET /api/orders/analytics/users` - User statistics

### **System**
- `GET /api/health` - Health check
- `GET /api/docs` - API documentation

## 🔐 Authentication & Authorization

### **JWT Token System**
- **Access Token**: 24-hour expiry for API access
- **Refresh Token**: 7-day expiry for token renewal
- **Auto-refresh**: Frontend can automatically refresh expired tokens

### **User Roles**
- **Admin**: Full system access, user management, analytics
- **Client**: Profile management, order placement, order history

### **Permission Levels**
1. **Public**: Categories, products (read-only)
2. **Authenticated**: Profile, orders, order history
3. **Admin**: User management, product/category CRUD, analytics

## 🌐 Deployment

### **Development**
```bash
npm run dev        # Development with nodemon
npm start          # Production start
./start.bat        # Windows batch file
```

### **Production Deployment**

#### **Quick Deploy (Local/VPS)**
```bash
# 1. Install dependencies
npm install --production

# 2. Set environment to production
export NODE_ENV=production

# 3. Start with PM2
npm install -g pm2
pm2 start server.js --name "usasya-api"
pm2 startup
pm2 save
```

#### **Cloud Deployment**
See detailed guides:
- 📖 **[Cloud Deployment Guide](./CLOUD_DEPLOYMENT_GUIDE.md)** - Complete cloud setup
- 📖 **[Production API Documentation](./PRODUCTION_API_DOCUMENTATION.md)** - Full API reference

## 📚 Documentation

### **Complete Documentation**
1. **[API Documentation for Frontend](./API_DOCUMENTATION_FRONTEND.md)**
   - Complete endpoint reference
   - Frontend integration examples
   - Error handling patterns
   - Best practices

2. **[Cloud Deployment Guide](./CLOUD_DEPLOYMENT_GUIDE.md)**
   - Step-by-step cloud setup
   - Domain configuration
   - SSL certificate setup
   - Production security

3. **[Production API Documentation](./PRODUCTION_API_DOCUMENTATION.md)**
   - Full API reference
   - Analytics endpoints
   - Authentication flows
   - Error codes

### **Key Features Documentation**
- **Guest Checkout**: Anonymous order placement
- **UPI Integration**: Automated payment link generation
- **Category System**: Hierarchical product organization
- **Analytics**: Real-time business metrics
- **Security**: JWT, rate limiting, input validation

## 💻 Development

### **Scripts**
```json
{
  "start": "node server.js",
  "dev": "nodemon server.js",
  "test": "jest",
  "setup": "node database/init.js"
}
```

### **Development Features**
- **Auto Database Setup**: Creates schema on first run
- **Network Discovery**: Shows all network access URLs
- **Hot Reload**: Nodemon for development
- **Error Logging**: Comprehensive error tracking
- **CORS**: Configurable cross-origin access

### **Environment Variables**
- `NODE_ENV`: development/production
- `PORT`: Server port (default: 3001)
- `DB_PATH`: SQLite database path
- `JWT_SECRET`: JWT signing secret
- `CORS_ORIGIN`: Allowed origins for CORS

## 🆘 Support

### **Getting Help**
- 📖 Read the [API Documentation](./API_DOCUMENTATION_FRONTEND.md)
- 🚀 Check the [Deployment Guide](./CLOUD_DEPLOYMENT_GUIDE.md)
- 🐛 Open an issue for bugs
- 💡 Request features via issues

### **Common Issues**
- **Port in use**: Change PORT in .env
- **Database locked**: Restart server
- **Upload fails**: Check upload directory permissions
- **JWT errors**: Verify JWT_SECRET is set

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for modern e-commerce**
