# Usasya Backend API Documentation

## Overview
This is the complete API documentation for the Usasya e-commerce backend. The backend supports both registered user and guest order functionality, with comprehensive admin controls.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require JWT authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 🔐 Authentication Endpoints

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "admin@usasya.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "System Admin",
    "email": "admin@usasya.com",
    "role": "admin",
    "status": "active"
  }
}
```

### Register
```http
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

---

## 👥 User Management

### Get All Users (Admin Only)
```http
GET /users
Authorization: Bearer <admin_token>
```

### Create User (Admin Only)
```http
POST /users
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "role": "client",
  "status": "active"
}
```

### Update User
```http
PUT /users/:id
Authorization: Bearer <token>
```

### Delete User (Admin Only)
```http
DELETE /users/:id
Authorization: Bearer <admin_token>
```

---

## 📂 Category Management

### Get All Categories
```http
GET /categories
```

**Response:**
```json
{
  "categories": [
    {
      "id": 1,
      "name": "Electronics",
      "description": "Electronic items",
      "is_active": 1,
      "product_count": 5
    }
  ]
}
```

### Create Category (Admin Only)
```http
POST /categories
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "name": "Clothing",
  "description": "Fashion and clothing items"
}
```

### Update Category (Admin Only)
```http
PUT /categories/:id
Authorization: Bearer <admin_token>
```

### Delete Category (Admin Only)
```http
DELETE /categories/:id
Authorization: Bearer <admin_token>
```

---

## 🛍️ Product Management

### Get All Products
```http
GET /products?page=1&limit=10&category_id=1&status=active
```

**Response:**
```json
{
  "products": [
    {
      "id": 1,
      "name": "Smartphone",
      "description": "Latest smartphone",
      "price": 599.99,
      "category_id": 1,
      "category_name": "Electronics",
      "current_stock": 50,
      "minimum_stock_alert": 5,
      "unit": "piece",
      "supplier": "Tech Corp",
      "status": "active",
      "images": ["image1.jpg", "image2.jpg"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### Create Product (Admin Only)
```http
POST /products
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Form Data:**
```
name: Smartphone
description: Latest smartphone
price: 599.99
category_id: 1
current_stock: 50
minimum_stock_alert: 5
unit: piece
supplier: Tech Corp
status: active
images: [file1, file2] // Image files
```

### Update Product (Admin Only)
```http
PUT /products/:id
Authorization: Bearer <admin_token>
```

### Delete Product (Admin Only)
```http
DELETE /products/:id
Authorization: Bearer <admin_token>
```

---

## 🛒 Order Management

### Get All Orders
```http
GET /orders?page=1&limit=10&status=pending
Authorization: Bearer <token>
```

**Response (Admin gets all orders, Users get their own):**
```json
{
  "orders": [
    {
      "id": 1,
      "user_id": null,
      "customer_name": "John Guest",
      "customer_phone": "+1234567890",
      "customer_email": "john@example.com",
      "total_amount": 1199.98,
      "status": "pending",
      "shipping_address": "123 Main St, City, State 12345",
      "payment_method": "upi",
      "upi_link": "upi://pay?pa=merchant@paytm&pn=Usasya&tn=Order%201&am=1199.98&cu=INR",
      "notes": "Please deliver after 6 PM",
      "created_at": "2025-06-18T10:30:00Z",
      "items": [
        {
          "id": 1,
          "product_id": 1,
          "product_name": "Smartphone",
          "quantity": 2,
          "price": 599.99,
          "product_images": ["image1.jpg"]
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### Get Single Order
```http
GET /orders/:id
Authorization: Bearer <token>
```

### Create Order (Authenticated Users)
```http
POST /orders
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "customer_name": "John Doe",
  "customer_phone": "+1234567890",
  "customer_email": "john@example.com",
  "shipping_address": "123 Main Street, City, State, PIN 123456",
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ],
  "payment_method": "upi",
  "notes": "Please deliver after 6 PM"
}
```

### 🌟 Create Guest Order (No Authentication Required)
```http
POST /orders/guest
```

**Request Body:**
```json
{
  "customer_name": "John Guest",
  "customer_phone": "+1234567890",
  "customer_email": "john@example.com",
  "shipping_address": "123 Main Street, City, State, PIN 123456",
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ],
  "payment_method": "upi",
  "notes": "Please deliver after 6 PM"
}
```

**Response:**
```json
{
  "message": "Guest order created successfully",
  "order": {
    "id": 1,
    "user_id": null,
    "customer_name": "John Guest",
    "customer_phone": "+1234567890",
    "customer_email": "john@example.com",
    "total_amount": 1199.98,
    "status": "pending",
    "shipping_address": "123 Main Street, City, State, PIN 123456",
    "payment_method": "upi",
    "upi_link": "upi://pay?pa=merchant@paytm&pn=Usasya&tn=Order%201&am=1199.98&cu=INR",
    "notes": "Please deliver after 6 PM",
    "created_at": "2025-06-18T10:30:00Z",
    "items": [
      {
        "product_id": 1,
        "quantity": 2,
        "price": 599.99,
        "product_name": "Smartphone",
        "product_images": ["image1.jpg"]
      }
    ]
  }
}
```

### Update Order Status (Admin Only)
```http
PATCH /orders/:id/status
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "status": "processing"
}
```

**Available Status Values:**
- `pending` - Initial order state
- `confirmed` - Order confirmed by admin
- `processing` - Order is being processed
- `shipped` - Order has been shipped
- `delivered` - Order delivered successfully
- `cancelled` - Order cancelled

### Process Order (Admin Only)
```http
PATCH /orders/:id/process
Authorization: Bearer <admin_token>
```

**What this does:**
- Changes status from "pending" to "processing"
- Updates the order timestamp
- Returns updated order details

### Cancel Order
```http
PATCH /orders/:id/cancel
Authorization: Bearer <token>
```

**Rules:**
- Users can cancel their own orders if status is "pending"
- Admins can cancel any order unless it's already "delivered"

### Get User Order History
```http
GET /orders/user/history?page=1&limit=10&status=delivered
Authorization: Bearer <token>
```

### Get Order Statistics (Admin Only)
```http
GET /orders/stats/overview
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "total_orders": 150,
  "pending_orders": 25,
  "processing_orders": 10,
  "shipped_orders": 5,
  "delivered_orders": 100,
  "cancelled_orders": 10,
  "orders_today": 5,
  "orders_this_week": 35,
  "total_revenue": 50000.00,
  "average_order_value": 333.33
}
```

---

## 📊 Analytics Endpoints for Admin Dashboard

Your backend now provides comprehensive analytics endpoints that match the admin dashboard shown in your screenshot:

### Dashboard Overview
```http
GET /api/orders/stats/dashboard
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "overview": {
    "total_revenue": 45678.90,
    "revenue_change": 12.5,
    "total_orders": 1234,
    "orders_change": 8.2,
    "total_customers": 567,
    "customers_change": -2.1,
    "average_order_value": 37.02,
    "aov_change": 4.3
  },
  "recent_orders": [
    {
      "id": 1,
      "order_number": "ORD001",
      "customer_name": "John Doe",
      "amount": 299.99,
      "status": "completed",
      "created_at": "2025-06-18T10:30:00Z"
    }
  ]
}
```

### Top Products Analytics
```http
GET /api/orders/stats/top-products?limit=10&period=30
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "products": [
    {
      "id": 1,
      "product_name": "Premium Widget",
      "units_sold": 234,
      "total_revenue": 23400.00,
      "growth_percentage": 12.5,
      "order_count": 156
    }
  ],
  "period_days": 30
}
```

### Revenue Analytics
```http
GET /api/orders/stats/revenue?period=daily&days=30
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "period": "daily",
  "days": 30,
  "data": [
    {
      "period": "2025-06-18",
      "revenue": 1250.00,
      "orders": 15,
      "avg_order_value": 83.33
    }
  ]
}
```

### Product Analytics
```http
GET /api/products/stats/overview
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "overview": {
    "total_products": 150,
    "active_products": 140,
    "inactive_products": 10,
    "low_stock_products": 12,
    "out_of_stock_products": 3,
    "average_price": 45.50,
    "total_inventory_value": 68250.00
  },
  "category_distribution": [
    {
      "category_name": "Electronics",
      "product_count": 45,
      "total_stock": 1200
    }
  ]
}
```

### User Analytics
```http
GET /api/users/stats/overview
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "total_users": 567,
  "admin_count": 3,
  "client_count": 564,
  "active_count": 540,
  "inactive_count": 27,
  "new_today": 5,
  "new_this_week": 35
}
```

---

## 🎯 Frontend Integration

### What the Backend Provides (✅ Ready):

1. **Dashboard Overview Data** - All key metrics with growth percentages
2. **Recent Orders** - Latest orders with customer names and status
3. **Top Products** - Best-selling products with growth metrics
4. **Revenue Analytics** - Daily/weekly/monthly revenue trends
5. **Product Analytics** - Inventory and category insights
6. **User Analytics** - Customer growth and status metrics

### What Frontend Developers Need to Do:

1. **Create Dashboard Components** - Charts, cards, tables
2. **Implement Data Visualization** - Charts for revenue trends, product performance
3. **Build Analytics UI** - Match the design shown in your screenshot
4. **Handle Real-time Updates** - Refresh data periodically
5. **Add Filtering/Date Range** - Allow admins to filter by date ranges

### Sample Frontend Integration:

```javascript
// Dashboard data fetching
const fetchDashboardData = async () => {
  const [overview, topProducts, revenue] = await Promise.all([
    fetch('/api/orders/stats/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
    fetch('/api/orders/stats/top-products?limit=5', { headers: { Authorization: `Bearer ${token}` } }),
    fetch('/api/orders/stats/revenue?period=daily&days=7', { headers: { Authorization: `Bearer ${token}` } })
  ]);
  
  return {
    overview: await overview.json(),
    topProducts: await topProducts.json(),
    revenue: await revenue.json()
  };
};
```

### Charts and Visualization:

The frontend team should implement:
- **Revenue trend charts** (line/bar charts)
- **Top products charts** (bar/pie charts)
- **Order status distribution** (donut charts)
- **Growth percentage indicators** (with up/down arrows)
- **Real-time metrics cards**

---

## 🚀 Backend Analytics - Complete!

Your backend now provides **all the data needed** for a comprehensive admin dashboard like the one in your screenshot. The analytics endpoints are:

✅ **Production Ready**  
✅ **Comprehensive Data**  
✅ **Growth Calculations**  
✅ **Real-time Metrics**  
✅ **Properly Secured** (Admin-only access)

The frontend developers can now focus on creating beautiful visualizations and UI components using this rich analytics data!

---

## 🔧 Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

**Error Response Format:**
```json
{
  "error": "Error message here",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

---

## 🏃‍♂️ Quick Start

### 1. Start the Server
```bash
npm start
```

### 2. Test Guest Order
```bash
curl -X POST http://localhost:3000/api/orders/guest \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test Customer",
    "customer_phone": "+1234567890",
    "customer_email": "test@example.com", 
    "shipping_address": "123 Test Street, Test City, TC 12345",
    "items": [{"product_id": 1, "quantity": 1}],
    "payment_method": "upi"
  }'
```

### 3. Login as Admin
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@usasya.com",
    "password": "admin123"
  }'
```

### 4. View All Orders (Admin)
```bash
curl -X GET http://localhost:3000/api/orders \
  -H "Authorization: Bearer <admin_token>"
```

---

## 📱 Frontend Integration Tips

### Guest Checkout Flow
1. No authentication required for guest orders
2. Use `/orders/guest` endpoint
3. Handle UPI payment link in response
4. Show order confirmation with order ID

### Registered User Flow  
1. Authenticate user first
2. Use `/orders` endpoint 
3. User can view order history at `/orders/user/history`

### Admin Panel
1. Login with admin credentials
2. Use admin-only endpoints for order management
3. Process orders through status updates
4. View analytics with `/orders/stats/overview`

---

## 🔒 Security Features

- **Password Encryption**: bcrypt with 12 salt rounds
- **JWT Authentication**: Secure token-based auth
- **Role-based Access**: Admin vs Client permissions
- **Status Validation**: Users must be "active" to login
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Parameterized queries
- **Stock Management**: Prevents overselling

---

This backend is production-ready and supports both guest and registered user orders with comprehensive admin controls.

---

## 🛍️ Enhanced Product Browsing & Category Sorting

Your backend now provides comprehensive product browsing capabilities for both client and admin interfaces:

### Get Categories (Public - No Authentication)
```http
GET /api/categories/public
```

**Response:**
```json
{
  "categories": [
    {
      "id": 1,
      "name": "Electronics",
      "description": "Electronic items",
      "product_count": 25
    },
    {
      "id": 2,
      "name": "Clothing",
      "description": "Fashion items",
      "product_count": 15
    }
  ]
}
```

### Get Products (Public - No Authentication)
```http
GET /api/products/public?category_id=1&sort_by=price&sort_order=ASC&min_price=10&max_price=100&search=phone&limit=20&offset=0
```

**Query Parameters:**
- `category_id` - Filter by category
- `sort_by` - Sort field: `name`, `price`, `created_at`, `category_name`
- `sort_order` - Sort direction: `ASC` or `DESC`
- `min_price` - Minimum price filter
- `max_price` - Maximum price filter
- `search` - Search in name, description, category
- `limit` - Items per page (default: 20)
- `offset` - Pagination offset

**Response:**
```json
{
  "products": [
    {
      "id": 1,
      "name": "Smartphone",
      "description": "Latest smartphone",
      "price": 599.99,
      "images": ["image1.jpg", "image2.jpg"],
      "current_stock": 50,
      "unit": "piece",
      "category_name": "Electronics",
      "category_id": 1
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "has_more": true
  },
  "filters": {
    "category_id": 1,
    "search": "phone",
    "sort_by": "price",
    "sort_order": "ASC",
    "min_price": 10,
    "max_price": 100
  }
}
```

### Get Products by Category (Public)
```http
GET /api/products/public/by-category?limit_per_category=10
```

**Response:**
```json
{
  "categories": [
    {
      "id": 1,
      "name": "Electronics",
      "description": "Electronic items",
      "products": [
        {
          "id": 1,
          "name": "Smartphone",
          "price": 599.99,
          "images": ["image1.jpg"]
        }
      ]
    },
    {
      "id": 2,
      "name": "Clothing",
      "description": "Fashion items", 
      "products": [
        {
          "id": 5,
          "name": "T-Shirt",
          "price": 29.99,
          "images": ["shirt1.jpg"]
        }
      ]
    }
  ]
}
```

### Get Products (Admin - Enhanced Sorting)
```http
GET /api/products?category_id=1&status=active&sort_by=category_name&sort_order=ASC&search=phone&limit=50&offset=0
Authorization: Bearer <admin_token>
```

**Additional Admin Sort Fields:**
- `current_stock` - Sort by inventory levels
- `status` - Sort by product status

---

## 🎯 Frontend Implementation Guide

### Client-Side Product Browsing:

**1. Category Navigation:**
```javascript
// Fetch categories for navigation menu
const categories = await fetch('/api/categories/public');

// Display products by category
const categoryProducts = await fetch('/api/products/public/by-category');
```

**2. Product Listing with Filters:**
```javascript
// Advanced product filtering
const params = new URLSearchParams({
  category_id: selectedCategory,
  sort_by: 'price',
  sort_order: 'ASC',
  min_price: minPrice,
  max_price: maxPrice,
  search: searchTerm,
  limit: 20,
  offset: page * 20
});

const products = await fetch(`/api/products/public?${params}`);
```

**3. Category-Based Product Display:**
```javascript
// Show products organized by categories (like homepage)
const categorizedProducts = await fetch('/api/products/public/by-category?limit_per_category=8');

// Render each category section with its products
categorizedProducts.categories.forEach(category => {
  renderCategorySection(category.name, category.products);
});
```

### Admin Product Management:

**1. Product Listing with Advanced Sorting:**
```javascript
// Admin product table with sorting
const params = new URLSearchParams({
  sort_by: 'category_name', // Sort by category for admin view
  sort_order: 'ASC',
  status: 'all', // Show all products (active/inactive)
  limit: 50
});

const products = await fetch(`/api/products?${params}`, {
  headers: { Authorization: `Bearer ${adminToken}` }
});
```

**2. Category-Based Product Management:**
```javascript
// Filter admin products by category
const categoryFilter = {
  category_id: selectedCategoryId,
  sort_by: 'name',
  sort_order: 'ASC'
};
```

### Frontend Sorting Options:

**Client Side:**
- ✅ **By Category** - Group products by categories
- ✅ **By Price** - Low to high, high to low
- ✅ **By Name** - Alphabetical sorting
- ✅ **By Date** - Newest first, oldest first
- ✅ **Price Range** - Filter by min/max price
- ✅ **Search** - Search across name, description, category

**Admin Side:**
- ✅ **All client options** plus:
- ✅ **By Stock Level** - Inventory-based sorting
- ✅ **By Status** - Active/inactive products
- ✅ **Category Management** - Sort by category name
- ✅ **Advanced Filters** - Status, stock alerts, etc.

---

## 🚀 Implementation Summary

### ✅ Backend Provides (Ready to Use):

1. **Public Product APIs** - No authentication required for client browsing
2. **Category-Based Organization** - Products grouped by categories
3. **Advanced Sorting** - Multiple sort fields and directions
4. **Price Filtering** - Min/max price ranges
5. **Search Functionality** - Across products and categories
6. **Pagination Support** - Efficient loading of large product lists
7. **Admin Enhancement** - Additional sorting for inventory management

### 🎨 Frontend Developer Tasks:

1. **Create Category Navigation** - Category menu/sidebar
2. **Build Product Grids** - Product card layouts
3. **Implement Sorting UI** - Dropdown menus, filters
4. **Add Search Interface** - Search bars with live results
5. **Create Category Pages** - Dedicated category product pages
6. **Build Admin Tables** - Sortable product management tables

**Your backend fully supports sophisticated product browsing and category-based organization for both client and admin interfaces!**
