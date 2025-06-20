# Complete API Documentation - Usasya E-commerce Backend

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Authentication Endpoints](#authentication-endpoints)
- [User Management Endpoints](#user-management-endpoints)
- [Product Management Endpoints](#product-management-endpoints)
- [Category Management Endpoints](#category-management-endpoints)
- [Order Management Endpoints](#order-management-endpoints)
- [Analytics Endpoints](#analytics-endpoints)
- [File Upload](#file-upload)
- [Utility Endpoints](#utility-endpoints)

---

## Overview

**Base URL**: `http://localhost:3001/api` (Development)  
**Base URL**: `http://192.168.206.42:3001/api` (Network Access)  
**Content-Type**: `application/json`  
**Authentication**: Bearer Token (JWT)

### Server Configuration
- **Port**: 3001 (configurable via PORT env variable)
- **Database**: SQLite (usasya.db)
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **File Upload**: Max 5MB per file
- **CORS**: Configurable (default: allow all origins)

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### User Roles
- **admin**: Full access to all endpoints, user management, analytics
- **client**: Limited access to own data, product browsing, order placement

### Token Information
- **Access Token**: 24-hour expiry (configurable)
- **Refresh Token**: 7-day expiry (configurable)
- **Algorithm**: HS256

---

## Error Handling

### Standard Error Response Format
```json
{
  "error": "Error message description"
}
```

### Validation Error Response Format
```json
{
  "errors": [
    {
      "type": "field",
      "value": "invalid_value",
      "msg": "Error message",
      "path": "field_name",
      "location": "body"
    }
  ]
}
```

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (Validation errors)
- `401`: Unauthorized (Authentication required)
- `403`: Forbidden (Insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210",
  "role": "client"  // Optional, defaults to "client"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "client",
    "status": "active",
    "avatar": null,
    "created_at": "2025-06-21T10:00:00Z"
  }
}
```

### Login User
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "client",
    "status": "active",
    "avatar": null,
    "created_at": "2025-06-21T10:00:00Z"
  }
}
```

### Verify Token
**GET** `/auth/verify`  
**Authentication:** Required

**Response (200):**
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "client"
  }
}
```

---

## User Management Endpoints

### Get User Profile
**GET** `/users/profile`  
**Authentication:** Required

**Response (200):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "role": "client",
  "status": "active",
  "avatar": "http://localhost:3001/uploads/avatars/avatar.jpg",
  "created_at": "2025-06-21T10:00:00Z",
  "updated_at": "2025-06-21T10:00:00Z"
}
```

### Update User Profile
**PUT** `/users/profile`  
**Authentication:** Required

**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "9876543211"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "9876543211",
    "role": "client",
    "status": "active",
    "avatar": null,
    "created_at": "2025-06-21T10:00:00Z",
    "updated_at": "2025-06-21T11:00:00Z"
  }
}
```

### Get All Users (Admin Only)
**GET** `/users`  
**Authentication:** Required (Admin)  
**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `role` (optional): Filter by role ("admin" or "client")
- `status` (optional): Filter by status ("active" or "inactive")

**Response (200):**
```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "role": "client",
      "status": "active",
      "avatar": null,
      "created_at": "2025-06-21T10:00:00Z",
      "updated_at": "2025-06-21T10:00:00Z"
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

### Update User Status (Admin Only)
**PATCH** `/users/:id/status`  
**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "status": "inactive"  // "active" or "inactive"
}
```

**Response (200):**
```json
{
  "message": "User status updated successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "role": "client",
    "status": "inactive",
    "avatar": null,
    "created_at": "2025-06-21T10:00:00Z",
    "updated_at": "2025-06-21T11:00:00Z"
  }
}
```

---

## Product Management Endpoints

### Get All Products
**GET** `/products`  
**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 12)
- `category_id` (optional): Filter by category ID
- `search` (optional): Search in name and description
- `min_price` (optional): Minimum price filter
- `max_price` (optional): Maximum price filter
- `sort_by` (optional): Sort field ("name", "price", "created_at")
- `sort_order` (optional): Sort direction ("asc", "desc")

**Response (200):**
```json
{
  "products": [
    {
      "id": 1,
      "name": "Apple iPhone 15",
      "description": "Latest iPhone with advanced features",
      "price": 79999,
      "current_stock": 50,
      "min_stock": 5,
      "category_id": 1,
      "category_name": "Electronics",
      "status": "active",
      "images": [
        "http://localhost:3001/uploads/products/image1.jpg",
        "http://localhost:3001/uploads/products/image2.jpg"
      ],
      "created_at": "2025-06-21T10:00:00Z",
      "updated_at": "2025-06-21T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 1,
    "pages": 1
  }
}
```

### Get Single Product
**GET** `/products/:id`

**Response (200):**
```json
{
  "id": 1,
  "name": "Apple iPhone 15",
  "description": "Latest iPhone with advanced features",
  "price": 79999,
  "current_stock": 50,
  "min_stock": 5,
  "category_id": 1,
  "category_name": "Electronics",
  "status": "active",
  "images": [
    "http://localhost:3001/uploads/products/image1.jpg",
    "http://localhost:3001/uploads/products/image2.jpg"
  ],
  "created_at": "2025-06-21T10:00:00Z",
  "updated_at": "2025-06-21T10:00:00Z"
}
```

### Create Product (Admin Only)
**POST** `/products`  
**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "name": "Apple iPhone 15",
  "description": "Latest iPhone with advanced features",
  "price": 79999,
  "current_stock": 50,
  "min_stock": 5,
  "category_id": 1,
  "images": [
    "image1.jpg",
    "image2.jpg"
  ]
}
```

**Response (201):**
```json
{
  "message": "Product created successfully",
  "product": {
    "id": 1,
    "name": "Apple iPhone 15",
    "description": "Latest iPhone with advanced features",
    "price": 79999,
    "current_stock": 50,
    "min_stock": 5,
    "category_id": 1,
    "status": "active",
    "images": [
      "http://localhost:3001/uploads/products/image1.jpg",
      "http://localhost:3001/uploads/products/image2.jpg"
    ],
    "created_at": "2025-06-21T10:00:00Z",
    "updated_at": "2025-06-21T10:00:00Z"
  }
}
```

### Update Product (Admin Only)
**PUT** `/products/:id`  
**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "name": "Apple iPhone 15 Pro",
  "description": "Updated description",
  "price": 89999,
  "current_stock": 45,
  "min_stock": 5,
  "category_id": 1,
  "images": [
    "image1.jpg",
    "image2.jpg"
  ]
}
```

**Response (200):**
```json
{
  "message": "Product updated successfully",
  "product": {
    "id": 1,
    "name": "Apple iPhone 15 Pro",
    "description": "Updated description",
    "price": 89999,
    "current_stock": 45,
    "min_stock": 5,
    "category_id": 1,
    "status": "active",
    "images": [
      "http://localhost:3001/uploads/products/image1.jpg",
      "http://localhost:3001/uploads/products/image2.jpg"
    ],
    "created_at": "2025-06-21T10:00:00Z",
    "updated_at": "2025-06-21T11:00:00Z"
  }
}
```

### Update Product Status (Admin Only)
**PATCH** `/products/:id/status`  
**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "status": "inactive"  // "active" or "inactive"
}
```

**Response (200):**
```json
{
  "message": "Product status updated successfully",
  "product": {
    "id": 1,
    "name": "Apple iPhone 15",
    "status": "inactive",
    "updated_at": "2025-06-21T11:00:00Z"
  }
}
```

### Update Product Stock (Admin Only)
**PATCH** `/products/:id/stock`  
**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "current_stock": 75,
  "min_stock": 10
}
```

**Response (200):**
```json
{
  "message": "Product stock updated successfully",
  "product": {
    "id": 1,
    "name": "Apple iPhone 15",
    "current_stock": 75,
    "min_stock": 10,
    "updated_at": "2025-06-21T11:00:00Z"
  }
}
```

---

## Category Management Endpoints

### Get All Categories
**GET** `/categories`

**Response (200):**
```json
{
  "categories": [
    {
      "id": 1,
      "name": "Electronics",
      "description": "Electronic devices and gadgets",
      "status": "active",
      "product_count": 15,
      "created_at": "2025-06-21T10:00:00Z",
      "updated_at": "2025-06-21T10:00:00Z"
    }
  ]
}
```

### Get Single Category
**GET** `/categories/:id`

**Response (200):**
```json
{
  "id": 1,
  "name": "Electronics",
  "description": "Electronic devices and gadgets",
  "status": "active",
  "product_count": 15,
  "created_at": "2025-06-21T10:00:00Z",
  "updated_at": "2025-06-21T10:00:00Z"
}
```

### Create Category (Admin Only)
**POST** `/categories`  
**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "name": "Electronics",
  "description": "Electronic devices and gadgets"
}
```

**Response (201):**
```json
{
  "message": "Category created successfully",
  "category": {
    "id": 1,
    "name": "Electronics",
    "description": "Electronic devices and gadgets",
    "status": "active",
    "created_at": "2025-06-21T10:00:00Z",
    "updated_at": "2025-06-21T10:00:00Z"
  }
}
```

### Update Category (Admin Only)
**PUT** `/categories/:id`  
**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "name": "Consumer Electronics",
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "message": "Category updated successfully",
  "category": {
    "id": 1,
    "name": "Consumer Electronics",
    "description": "Updated description",
    "status": "active",
    "created_at": "2025-06-21T10:00:00Z",
    "updated_at": "2025-06-21T11:00:00Z"
  }
}
```

### Update Category Status (Admin Only)
**PATCH** `/categories/:id/status`  
**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "status": "inactive"  // "active" or "inactive"
}
```

**Response (200):**
```json
{
  "message": "Category status updated successfully",
  "category": {
    "id": 1,
    "name": "Electronics",
    "status": "inactive",
    "updated_at": "2025-06-21T11:00:00Z"
  }
}
```

---

## Order Management Endpoints

### Get All Orders
**GET** `/orders`  
**Authentication:** Required (Admin sees all, Users see their own)  
**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status
- `user_id` (optional, admin only): Filter by user ID

**Valid Status Values:**
- `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`

**Response (200):**
```json
{
  "orders": [
    {
      "id": 1,
      "user_id": 1,
      "customer_name": "John Doe",
      "customer_phone": "9876543210",
      "customer_email": "john@example.com",
      "total_amount": 79999,
      "status": "pending",
      "shipping_address": "123 Main St, City, State 12345",
      "payment_method": "upi",
      "upi_link": "upi://pay?pa=merchant@paytm&pn=Usasya&tn=Order%201&am=79999&cu=INR",
      "notes": "Please deliver carefully",
      "registered_user_name": "John Doe",
      "registered_user_email": "john@example.com",
      "created_at": "2025-06-21T10:00:00Z",
      "updated_at": "2025-06-21T10:00:00Z",
      "items": [
        {
          "id": 1,
          "order_id": 1,
          "product_id": 1,
          "product_name": "Apple iPhone 15",
          "quantity": 1,
          "price": 79999,
          "product_images": [
            "http://localhost:3001/uploads/products/image1.jpg"
          ],
          "created_at": "2025-06-21T10:00:00Z"
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
**GET** `/orders/:id`  
**Authentication:** Required (Owner or Admin)

**Response (200):**
```json
{
  "id": 1,
  "user_id": 1,
  "customer_name": "John Doe",
  "customer_phone": "9876543210",
  "customer_email": "john@example.com",
  "total_amount": 79999,
  "status": "pending",
  "shipping_address": "123 Main St, City, State 12345",
  "payment_method": "upi",
  "upi_link": "upi://pay?pa=merchant@paytm&pn=Usasya&tn=Order%201&am=79999&cu=INR",
  "notes": "Please deliver carefully",
  "registered_user_name": "John Doe",
  "registered_user_email": "john@example.com",
  "created_at": "2025-06-21T10:00:00Z",
  "updated_at": "2025-06-21T10:00:00Z",
  "items": [
    {
      "id": 1,
      "order_id": 1,
      "product_id": 1,
      "product_name": "Apple iPhone 15",
      "product_description": "Latest iPhone with advanced features",
      "quantity": 1,
      "price": 79999,
      "product_images": [
        "http://localhost:3001/uploads/products/image1.jpg"
      ],
      "created_at": "2025-06-21T10:00:00Z"
    }
  ]
}
```

### Create Order
**POST** `/orders`  
**Authentication:** Optional (Authenticated users get user_id set, others are guest orders)

**Request Body:**
```json
{
  "customer_name": "John Doe",
  "customer_phone": "9876543210",
  "customer_email": "john@example.com",
  "shipping_address": "123 Main St, City, State 12345",
  "items": [
    {
      "product_id": 1,
      "quantity": 1
    },
    {
      "product_id": 2,
      "quantity": 2
    }
  ],
  "payment_method": "upi",  // "upi", "cod", "online"
  "upi_link": "upi://pay?pa=john@paytm&pn=John&am=79999&cu=INR",  // Optional
  "notes": "Please deliver carefully"  // Optional
}
```

**Response (201):**
```json
{
  "message": "Order created successfully",
  "order": {
    "id": 1,
    "user_id": 1,  // null for guest orders
    "customer_name": "John Doe",
    "customer_phone": "9876543210",
    "customer_email": "john@example.com",
    "total_amount": 79999,
    "status": "pending",
    "shipping_address": "123 Main St, City, State 12345",
    "payment_method": "upi",
    "upi_link": "upi://pay?pa=merchant@paytm&pn=Usasya&tn=Order%201&am=79999&cu=INR",
    "notes": "Please deliver carefully",
    "created_at": "2025-06-21T10:00:00Z",
    "updated_at": "2025-06-21T10:00:00Z",
    "items": [
      {
        "id": 1,
        "order_id": 1,
        "product_id": 1,
        "product_name": "Apple iPhone 15",
        "quantity": 1,
        "price": 79999,
        "product_images": [
          "http://localhost:3001/uploads/products/image1.jpg"
        ],
        "created_at": "2025-06-21T10:00:00Z"
      }
    ]
  }
}
```

### Create Guest Order
**POST** `/orders/guest`  
**Authentication:** None

**Request Body:** Same as Create Order

**Response (201):** Same as Create Order (but user_id will always be null)

### Update Order Status (Admin Only)
**PATCH** `/orders/:id/status`  
**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "status": "confirmed"  // Any valid status
}
```

**Response (200):**
```json
{
  "message": "Order status updated successfully",
  "order": {
    "id": 1,
    "customer_name": "John Doe",
    "status": "confirmed",
    "total_amount": 79999,
    "registered_user_name": "John Doe",
    "registered_user_email": "john@example.com",
    "created_at": "2025-06-21T10:00:00Z",
    "updated_at": "2025-06-21T11:00:00Z"
  }
}
```

### Process Order (Admin Only)
**PATCH** `/orders/:id/process`  
**Authentication:** Required (Admin)

**Description:** Changes order status from "pending" to "processing"

**Response (200):**
```json
{
  "message": "Order processed successfully",
  "order": {
    "id": 1,
    "customer_name": "John Doe",
    "status": "processing",
    "total_amount": 79999,
    "registered_user_name": "John Doe",
    "registered_user_email": "john@example.com",
    "created_at": "2025-06-21T10:00:00Z",
    "updated_at": "2025-06-21T11:00:00Z"
  }
}
```

### Cancel Order
**PATCH** `/orders/:id/cancel`  
**Authentication:** Required (Owner or Admin)

**Description:** Cancels order and restores product stock

**Response (200):**
```json
{
  "message": "Order cancelled successfully"
}
```

### Get User Order History
**GET** `/orders/user/history`  
**Authentication:** Required  
**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status

**Response (200):**
```json
{
  "orders": [
    {
      "id": 1,
      "user_id": 1,
      "customer_name": "John Doe",
      "customer_phone": "9876543210",
      "customer_email": "john@example.com",
      "total_amount": 79999,
      "status": "delivered",
      "shipping_address": "123 Main St, City, State 12345",
      "payment_method": "upi",
      "upi_link": "upi://pay?pa=merchant@paytm&pn=Usasya&tn=Order%201&am=79999&cu=INR",
      "notes": "Please deliver carefully",
      "created_at": "2025-06-21T10:00:00Z",
      "updated_at": "2025-06-21T11:00:00Z",
      "items": [
        {
          "id": 1,
          "order_id": 1,
          "product_id": 1,
          "product_name": "Apple iPhone 15",
          "quantity": 1,
          "price": 79999,
          "product_images": [
            "http://localhost:3001/uploads/products/image1.jpg"
          ],
          "created_at": "2025-06-21T10:00:00Z"
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

### Validate Cart Items
**POST** `/orders/validate-cart`  
**Authentication:** None

**Request Body:**
```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 2,
      "quantity": 1
    }
  ]
}
```

**Response (200):**
```json
{
  "valid": true,
  "items": [
    {
      "product_id": 1,
      "requested_quantity": 2,
      "available": true,
      "message": "Available",
      "current_stock": 50,
      "product_name": "Apple iPhone 15",
      "price": 79999
    },
    {
      "product_id": 2,
      "requested_quantity": 1,
      "available": false,
      "message": "Insufficient stock. Available: 0, Requested: 1",
      "current_stock": 0,
      "product_name": "Samsung Galaxy S24"
    }
  ],
  "message": "Some items are not available"
}
```

### Check Stock for Multiple Products
**POST** `/orders/check-stock`  
**Authentication:** None

**Request Body:**
```json
{
  "product_ids": [1, 2, 3]
}
```

**Response (200):**
```json
{
  "products": [
    {
      "product_id": 1,
      "available": true,
      "current_stock": 50,
      "status": "active",
      "name": "Apple iPhone 15"
    },
    {
      "product_id": 2,
      "available": false,
      "current_stock": 0,
      "status": "active",
      "name": "Samsung Galaxy S24"
    },
    {
      "product_id": 3,
      "available": false,
      "current_stock": 10,
      "status": "inactive",
      "name": "OnePlus 12"
    }
  ]
}
```

### Get Order Statistics (Admin Only)
**GET** `/orders/stats/overview`  
**Authentication:** Required (Admin)

**Response (200):**
```json
{
  "total_orders": 150,
  "pending_orders": 25,
  "processing_orders": 30,
  "shipped_orders": 40,
  "delivered_orders": 45,
  "cancelled_orders": 10,
  "orders_today": 5,
  "orders_this_week": 20,
  "total_revenue": 2500000,
  "average_order_value": 16666.67
}
```

### Get Dashboard Analytics (Admin Only)
**GET** `/orders/stats/dashboard`  
**Authentication:** Required (Admin)

**Response (200):**
```json
{
  "overview": {
    "total_revenue": 2500000,
    "revenue_change": 15.5,
    "total_orders": 150,
    "orders_change": 12.3,
    "total_customers": 75,
    "customers_change": 8.7,
    "average_order_value": 16666.67,
    "aov_change": 0
  },
  "recent_orders": [
    {
      "id": 150,
      "order_number": "ORD150",
      "customer_name": "John Doe",
      "amount": 79999,
      "status": "pending",
      "created_at": "2025-06-21T10:00:00Z"
    }
  ]
}
```

### Get Top Products Analytics (Admin Only)
**GET** `/orders/stats/top-products`  
**Authentication:** Required (Admin)  
**Query Parameters:**
- `limit` (optional): Number of products (default: 10)
- `period` (optional): Period in days (default: 30)

**Response (200):**
```json
{
  "products": [
    {
      "id": 1,
      "product_name": "Apple iPhone 15",
      "price": 79999,
      "units_sold": 25,
      "total_revenue": 1999975,
      "growth_percentage": 15.5,
      "order_count": 25
    }
  ],
  "period_days": 30
}
```

### Get Revenue Analytics (Admin Only)
**GET** `/orders/stats/revenue`  
**Authentication:** Required (Admin)  
**Query Parameters:**
- `period` (optional): "daily", "weekly", "monthly" (default: "daily")
- `days` (optional): Number of days (default: 30)

**Response (200):**
```json
{
  "period": "daily",
  "days": 30,
  "data": [
    {
      "period": "2025-06-21",
      "revenue": 159998,
      "orders": 2,
      "avg_order_value": 79999
    },
    {
      "period": "2025-06-20",
      "revenue": 239997,
      "orders": 3,
      "avg_order_value": 79999
    }
  ]
}
```

---

## File Upload

### Upload Product Images (Admin Only)
**POST** `/upload/products`  
**Authentication:** Required (Admin)  
**Content-Type:** `multipart/form-data`

**Request Body:**
- `images`: File(s) (JPEG, JPG, PNG, WebP, max 5MB each, max 5 files)

**Response (200):**
```json
{
  "message": "Files uploaded successfully",
  "files": [
    {
      "filename": "image-1640995200000-123456789.jpg",
      "url": "http://localhost:3001/uploads/products/image-1640995200000-123456789.jpg",
      "size": 1048576
    }
  ]
}
```

### Upload Avatar (User)
**POST** `/upload/avatar`  
**Authentication:** Required  
**Content-Type:** `multipart/form-data`

**Request Body:**
- `avatar`: File (JPEG, JPG, PNG, WebP, max 2MB)

**Response (200):**
```json
{
  "message": "Avatar uploaded successfully",
  "avatar": {
    "filename": "avatar-1640995200000-123456789.jpg",
    "url": "http://localhost:3001/uploads/avatars/avatar-1640995200000-123456789.jpg",
    "size": 512000
  }
}
```

---

## Additional Notes

### UPI Link Validation
UPI links must follow this format:
- Start with `upi://pay?`
- Must contain required parameter: `pa` (payee address)
- Example: `upi://pay?pa=merchant@paytm&pn=Merchant&am=1000&cu=INR`

### Phone Number Validation
Phone numbers must be valid mobile numbers (10 digits for Indian numbers).

### Image Upload Specifications
- **Product Images**: JPEG, JPG, PNG, WebP formats, max 5MB each, max 5 files
- **Avatars**: JPEG, JPG, PNG, WebP formats, max 2MB each, single file
- **Storage**: Files are stored in `/uploads/` directory with timestamped filenames

### Pagination
Most list endpoints support pagination with `page` and `limit` query parameters.

### Status Enums

**User Status:**
- `active`: User can login and perform actions
- `inactive`: User account is disabled

**Product Status:**
- `active`: Product is available for purchase
- `inactive`: Product is hidden from customers

**Category Status:**
- `active`: Category is visible
- `inactive`: Category is hidden

**Order Status:**
- `pending`: Order placed, waiting for confirmation
- `confirmed`: Order confirmed by admin
- `processing`: Order is being prepared
- `shipped`: Order has been shipped
- `delivered`: Order delivered to customer
- `cancelled`: Order cancelled

### Environment Variables Required
```env
JWT_SECRET=your_secret_key
PORT=3001
DB_PATH=./database/usasya.db
UPLOAD_PATH=./uploads
```

This completes the comprehensive API documentation for the entire backend system.
