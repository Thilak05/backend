# Usasya E-commerce API - Frontend Developer Guide

## 🎯 Complete API Reference for Frontend Integration

This documentation provides everything frontend developers need to integrate with the Usasya e-commerce backend API.

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [API Endpoints](#api-endpoints)
5. [Frontend Integration Examples](#frontend-integration-examples)
6. [Best Practices](#best-practices)
7. [Rate Limiting](#rate-limiting)
8. [CORS Configuration](#cors-configuration)

---

## 🚀 Getting Started

### **Base URLs**
```
Development: http://localhost:3001/api
Production:  https://yourdomain.com/api
```

### **Content Type**
All requests should use `Content-Type: application/json` except for file uploads which use `multipart/form-data`.

### **Response Format**
All responses are in JSON format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "pagination": { ... }  // For paginated endpoints
}
```

### **Error Response Format**
```json
{
  "success": false,
  "error": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ],
  "code": 400
}
```

---

## 🔐 Authentication

### **1. Register New User**
```http
POST /auth/register
Content-Type: application/json
```

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "client",
    "status": "active"
  }
}
```

### **2. Login**
```http
POST /auth/login
Content-Type: application/json
```

**Request:**
```json
{
  "email": "admin@usasya.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "System Admin",
    "email": "admin@usasya.com",
    "role": "admin",
    "status": "active"
  }
}
```

### **3. Using Authentication Token**
Include the JWT token in the Authorization header for protected endpoints:

```javascript
const token = localStorage.getItem('authToken');

fetch('/api/orders', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

---

## 🛠️ Error Handling

### **HTTP Status Codes**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### **Error Response Examples**

#### **Validation Error (400):**
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters"
    }
  ]
}
```

#### **Authentication Error (401):**
```json
{
  "success": false,
  "error": "Access token is required"
}
```

#### **Permission Error (403):**
```json
{
  "success": false,
  "error": "Admin access required"
}
```

---

## 📱 API Endpoints

### **🏪 Categories (Public)**

#### **Get All Categories**
```http
GET /categories/public
```

**Response:**
```json
{
  "success": true,
  "categories": [
    {
      "id": 1,
      "name": "Electronics",
      "description": "Electronic items",
      "product_count": 25
    }
  ]
}
```

**Frontend Usage:**
```javascript
// Fetch categories for navigation menu
const fetchCategories = async () => {
  try {
    const response = await fetch('/api/categories/public');
    const data = await response.json();
    return data.categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
};
```

---

### **🛍️ Products (Public)**

#### **Get Products with Filtering**
```http
GET /products/public?category_id=1&sort_by=price&sort_order=ASC&min_price=10&max_price=100&search=phone&limit=20&offset=0
```

**Query Parameters:**
- `category_id` - Filter by category ID
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
  "success": true,
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
      "category_id": 1,
      "created_at": "2025-06-18T10:30:00Z"
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
    "sort_order": "ASC"
  }
}
```

**Frontend Usage:**
```javascript
// Product listing with filters
const fetchProducts = async (filters = {}) => {
  const params = new URLSearchParams({
    category_id: filters.categoryId || '',
    sort_by: filters.sortBy || 'created_at',
    sort_order: filters.sortOrder || 'DESC',
    search: filters.search || '',
    limit: filters.limit || 20,
    offset: filters.offset || 0,
    min_price: filters.minPrice || '',
    max_price: filters.maxPrice || ''
  });

  // Remove empty parameters
  for (const [key, value] of [...params]) {
    if (!value) params.delete(key);
  }

  try {
    const response = await fetch(`/api/products/public?${params}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
  }
};

// Usage example
const products = await fetchProducts({
  categoryId: 1,
  sortBy: 'price',
  sortOrder: 'ASC',
  limit: 12
});
```

#### **Get Products by Category (Grouped)**
```http
GET /products/public/by-category?limit_per_category=10
```

**Response:**
```json
{
  "success": true,
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
    }
  ]
}
```

**Frontend Usage:**
```javascript
// For homepage category sections
const fetchCategorizedProducts = async (limitPerCategory = 8) => {
  try {
    const response = await fetch(`/api/products/public/by-category?limit_per_category=${limitPerCategory}`);
    const data = await response.json();
    return data.categories;
  } catch (error) {
    console.error('Error fetching categorized products:', error);
  }
};
```

---

### **🛒 Orders**

#### **Create Guest Order (No Authentication)**
```http
POST /orders/guest
Content-Type: application/json
```

**Request:**
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
    },
    {
      "product_id": 5,
      "quantity": 1
    }
  ],
  "payment_method": "upi",
  "notes": "Please call before delivery"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Guest order created successfully",
  "order": {
    "id": 1,
    "order_number": "GST001",
    "customer_name": "John Guest",
    "customer_phone": "+1234567890",
    "total_amount": 1199.98,
    "status": "pending",
    "payment_method": "upi",
    "upi_link": "upi://pay?pa=merchant@paytm&pn=Usasya&tn=Order%201&am=1199.98&cu=INR",
    "created_at": "2025-06-18T10:30:00Z",
    "items": [
      {
        "product_id": 1,
        "product_name": "Smartphone",
        "quantity": 2,
        "price": 599.99
      }
    ]
  }
}
```

**Frontend Usage:**
```javascript
// Guest checkout process
const createGuestOrder = async (orderData) => {
  try {
    const response = await fetch('/api/orders/guest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    const data = await response.json();
    
    if (data.success) {
      // Show order confirmation with UPI link
      return data.order;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Usage example
const orderData = {
  customer_name: 'John Doe',
  customer_phone: '+1234567890',
  customer_email: 'john@example.com',
  shipping_address: '123 Main St, City, State 12345',
  items: [
    { product_id: 1, quantity: 2 },
    { product_id: 3, quantity: 1 }
  ],
  payment_method: 'upi',
  notes: 'Urgent delivery needed'
};

const order = await createGuestOrder(orderData);
console.log('Order created:', order);
```

#### **Create Authenticated User Order**
```http
POST /orders
Authorization: Bearer <token>
Content-Type: application/json
```

Same request format as guest order, but automatically links to authenticated user.

#### **Get User Order History**
```http
GET /orders/user/history?page=1&limit=10&status=delivered
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "id": 1,
      "order_number": "ORD001",
      "total_amount": 299.99,
      "status": "delivered",
      "created_at": "2025-06-18T10:30:00Z",
      "items": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

**Frontend Usage:**
```javascript
// Get user's order history
const fetchUserOrders = async (page = 1, status = '') => {
  const token = localStorage.getItem('authToken');
  
  const params = new URLSearchParams({
    page: page,
    limit: 10
  });
  
  if (status) params.append('status', status);

  try {
    const response = await fetch(`/api/orders/user/history?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user orders:', error);
  }
};
```

---

### **👤 User Management**

#### **Get User Profile**
```http
GET /users/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "role": "client",
    "status": "active",
    "avatar": "avatar.jpg",
    "created_at": "2025-06-18T10:30:00Z"
  }
}
```

#### **Update User Profile**
```http
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "name": "John Smith",
  "phone": "+1234567891"
}
```

**Frontend Usage:**
```javascript
// Update user profile
const updateProfile = async (profileData) => {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
  }
};
```

---

### **📊 Analytics (Admin Only)**

#### **Dashboard Overview**
```http
GET /orders/stats/dashboard
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "overview": {
    "total_revenue": 45678.90,
    "revenue_change": 12.5,
    "total_orders": 1234,
    "orders_change": 8.2,
    "total_customers": 567,
    "customers_change": -2.1,
    "average_order_value": 37.02
  },
  "recent_orders": [
    {
      "id": 1,
      "order_number": "ORD001",
      "customer_name": "John Doe",
      "amount": 299.99,
      "status": "completed"
    }
  ]
}
```

#### **Top Products**
```http
GET /orders/stats/top-products?limit=10&period=30
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": 1,
      "product_name": "Premium Widget",
      "units_sold": 234,
      "total_revenue": 23400.00,
      "growth_percentage": 12.5
    }
  ],
  "period_days": 30
}
```

---

## 💻 Frontend Integration Examples

### **React Hooks for API Integration**

#### **1. Authentication Hook**
```javascript
import { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('authToken', data.token);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
  };

  const register = async (userData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('authToken', data.token);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const value = {
    user,
    token,
    login,
    logout,
    register,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

#### **2. Products Hook**
```javascript
import { useState, useEffect } from 'react';

export const useProducts = (filters = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchProducts = async (newFilters = {}) => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      category_id: newFilters.categoryId || filters.categoryId || '',
      sort_by: newFilters.sortBy || filters.sortBy || 'created_at',
      sort_order: newFilters.sortOrder || filters.sortOrder || 'DESC',
      search: newFilters.search || filters.search || '',
      limit: newFilters.limit || filters.limit || 20,
      offset: newFilters.offset || filters.offset || 0,
      min_price: newFilters.minPrice || filters.minPrice || '',
      max_price: newFilters.maxPrice || filters.maxPrice || ''
    });

    // Remove empty parameters
    for (const [key, value] of [...params]) {
      if (!value) params.delete(key);
    }

    try {
      const response = await fetch(`/api/products/public?${params}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
        setPagination(data.pagination);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    pagination,
    refetch: fetchProducts
  };
};
```

#### **3. Cart Management Hook**
```javascript
import { useState, useEffect } from 'react';

export const useCart = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const cartItems = JSON.parse(savedCart);
      setItems(cartItems);
      calculateTotal(cartItems);
    }
  }, []);

  useEffect(() => {
    // Save cart to localStorage whenever items change
    localStorage.setItem('cart', JSON.stringify(items));
    calculateTotal(items);
  }, [items]);

  const calculateTotal = (cartItems) => {
    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    setTotal(totalAmount);
  };

  const addItem = (product, quantity = 1) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevItems, { ...product, quantity }];
      }
    });
  };

  const removeItem = (productId) => {
    setItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setTotal(0);
  };

  const getCartForOrder = () => {
    return items.map(item => ({
      product_id: item.id,
      quantity: item.quantity
    }));
  };

  return {
    items,
    total,
    itemCount: items.length,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getCartForOrder
  };
};
```

#### **4. Order Creation Hook**
```javascript
import { useState } from 'react';
import { useAuth } from './useAuth';

export const useOrders = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token, isAuthenticated } = useAuth();

  const createOrder = async (orderData) => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = isAuthenticated ? '/api/orders' : '/api/orders/guest';
      const headers = {
        'Content-Type': 'application/json'
      };

      if (isAuthenticated && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (data.success) {
        return { success: true, order: data.order };
      } else {
        setError(data.error);
        return { success: false, error: data.error };
      }
    } catch (err) {
      setError('Failed to create order');
      return { success: false, error: 'Failed to create order' };
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOrders = async (page = 1, status = '') => {
    if (!isAuthenticated || !token) {
      throw new Error('Authentication required');
    }

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: page.toString(),
      limit: '10'
    });

    if (status) params.append('status', status);

    try {
      const response = await fetch(`/api/orders/user/history?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        return data;
      } else {
        setError(data.error);
        return null;
      }
    } catch (err) {
      setError('Failed to fetch orders');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createOrder,
    fetchUserOrders
  };
};
```

### **React Components Examples**

#### **1. Product Listing Component**
```jsx
import React, { useState, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';

const ProductListing = ({ categoryId }) => {
  const [filters, setFilters] = useState({
    categoryId,
    sortBy: 'created_at',
    sortOrder: 'DESC',
    limit: 12,
    offset: 0
  });

  const { products, loading, error, pagination, refetch } = useProducts(filters);

  const handleSortChange = (sortBy, sortOrder) => {
    const newFilters = { ...filters, sortBy, sortOrder, offset: 0 };
    setFilters(newFilters);
    refetch(newFilters);
  };

  const handleLoadMore = () => {
    const newFilters = { ...filters, offset: filters.offset + filters.limit };
    setFilters(newFilters);
    refetch(newFilters);
  };

  if (loading && products.length === 0) {
    return <div className="loading">Loading products...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="product-listing">
      <div className="filters">
        <select onChange={(e) => {
          const [sortBy, sortOrder] = e.target.value.split(':');
          handleSortChange(sortBy, sortOrder);
        }}>
          <option value="created_at:DESC">Newest First</option>
          <option value="price:ASC">Price: Low to High</option>
          <option value="price:DESC">Price: High to Low</option>
          <option value="name:ASC">Name: A to Z</option>
        </select>
      </div>

      <div className="products-grid">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {pagination?.has_more && (
        <button onClick={handleLoadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
};

const ProductCard = ({ product }) => {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem(product, 1);
  };

  return (
    <div className="product-card">
      <img 
        src={product.images[0] ? `/uploads/${product.images[0]}` : '/placeholder.jpg'} 
        alt={product.name}
      />
      <h3>{product.name}</h3>
      <p className="description">{product.description}</p>
      <div className="price">${product.price}</div>
      <div className="category">{product.category_name}</div>
      <button 
        onClick={handleAddToCart}
        disabled={product.current_stock <= 0}
      >
        {product.current_stock > 0 ? 'Add to Cart' : 'Out of Stock'}
      </button>
    </div>
  );
};
```

#### **2. Checkout Component**
```jsx
import React, { useState } from 'react';
import { useCart } from '../hooks/useCart';
import { useOrders } from '../hooks/useOrders';
import { useAuth } from '../hooks/useAuth';

const Checkout = () => {
  const { items, total, clearCart, getCartForOrder } = useCart();
  const { createOrder, loading } = useOrders();
  const { isAuthenticated, user } = useAuth();
  
  const [formData, setFormData] = useState({
    customer_name: isAuthenticated ? user?.name || '' : '',
    customer_phone: isAuthenticated ? user?.phone || '' : '',
    customer_email: isAuthenticated ? user?.email || '' : '',
    shipping_address: '',
    payment_method: 'upi',
    notes: ''
  });

  const [orderResult, setOrderResult] = useState(null);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const orderData = {
      ...formData,
      items: getCartForOrder()
    };

    const result = await createOrder(orderData);

    if (result.success) {
      setOrderResult(result.order);
      clearCart();
    }
  };

  if (orderResult) {
    return (
      <div className="order-success">
        <h2>Order Created Successfully!</h2>
        <div className="order-details">
          <p><strong>Order Number:</strong> {orderResult.order_number}</p>
          <p><strong>Total Amount:</strong> ${orderResult.total_amount}</p>
          <p><strong>Status:</strong> {orderResult.status}</p>
          
          {orderResult.upi_link && (
            <div className="payment-section">
              <h3>Payment</h3>
              <p>Click the link below to pay via UPI:</p>
              <a href={orderResult.upi_link} className="upi-payment-btn">
                Pay ${orderResult.total_amount} via UPI
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="checkout">
      <h2>Checkout</h2>
      
      <div className="order-summary">
        <h3>Order Summary</h3>
        {items.map(item => (
          <div key={item.id} className="order-item">
            <span>{item.name}</span>
            <span>Qty: {item.quantity}</span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="total">
          <strong>Total: ${total.toFixed(2)}</strong>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="checkout-form">
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            name="customer_name"
            value={formData.customer_name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Phone *</label>
          <input
            type="tel"
            name="customer_phone"
            value={formData.customer_phone}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="customer_email"
            value={formData.customer_email}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label>Shipping Address *</label>
          <textarea
            name="shipping_address"
            value={formData.shipping_address}
            onChange={handleInputChange}
            required
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>Payment Method</label>
          <select
            name="payment_method"
            value={formData.payment_method}
            onChange={handleInputChange}
          >
            <option value="upi">UPI</option>
            <option value="cod">Cash on Delivery</option>
            <option value="online">Online Payment</option>
          </select>
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows="2"
          />
        </div>

        <button type="submit" disabled={loading || items.length === 0}>
          {loading ? 'Creating Order...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
};
```

---

## 🚦 Best Practices

### **1. Error Handling**
```javascript
// Always handle API errors gracefully
const apiCall = async () => {
  try {
    const response = await fetch('/api/endpoint');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    // Show user-friendly error message
    throw error;
  }
};
```

### **2. Token Management**
```javascript
// Auto-refresh token before expiration
const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  if (token) {
    // Check if token is about to expire
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    if (tokenPayload.exp - currentTime < 300) { // 5 minutes
      // Refresh token or redirect to login
      window.location.href = '/login';
      return;
    }
    
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  
  const response = await fetch(url, options);
  
  if (response.status === 401) {
    // Token invalid, redirect to login
    localStorage.removeItem('authToken');
    window.location.href = '/login';
    return;
  }
  
  return response;
};
```

### **3. Loading States**
```javascript
// Consistent loading state management
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const performAction = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const result = await apiCall();
    // Handle success
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### **4. Pagination**
```javascript
// Efficient pagination handling
const [products, setProducts] = useState([]);
const [hasMore, setHasMore] = useState(true);
const [offset, setOffset] = useState(0);

const loadMoreProducts = async () => {
  const response = await fetch(`/api/products/public?limit=20&offset=${offset}`);
  const data = await response.json();
  
  setProducts(prev => [...prev, ...data.products]);
  setHasMore(data.pagination.has_more);
  setOffset(prev => prev + 20);
};
```

---

## 🚧 Rate Limiting

The API implements rate limiting to prevent abuse:

- **General endpoints**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **File upload endpoints**: 10 requests per hour per IP

### **Handling Rate Limits**
```javascript
const handleRateLimit = async (response) => {
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    
    // Show user message
    alert(`Rate limit exceeded. Please try again in ${retryAfter} seconds.`);
    
    // Optionally implement retry logic
    if (retryAfter) {
      setTimeout(() => {
        // Retry the request
      }, parseInt(retryAfter) * 1000);
    }
  }
};
```

---

## 🌐 CORS Configuration

The API is configured to accept requests from:
- `http://localhost:3000` (development)
- `https://yourdomain.com` (production)
- `https://www.yourdomain.com` (production)
- `https://admin.yourdomain.com` (admin panel)

### **Frontend Configuration**

#### **Development (React)**
```javascript
// In package.json
{
  "proxy": "http://localhost:3001"
}

// Or use full URLs
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://yourdomain.com/api'
  : 'http://localhost:3001/api';
```

#### **Production Build**
```javascript
// Environment-based API URLs
const config = {
  development: {
    API_BASE_URL: 'http://localhost:3001/api'
  },
  production: {
    API_BASE_URL: 'https://yourdomain.com/api'
  }
};

export const API_BASE_URL = config[process.env.NODE_ENV].API_BASE_URL;
```

---

## 🔧 Environment Variables

### **Frontend Environment Variables**
```bash
# .env.development
REACT_APP_API_BASE_URL=http://localhost:3001/api
REACT_APP_UPLOAD_BASE_URL=http://localhost:3001/uploads

# .env.production
REACT_APP_API_BASE_URL=https://yourdomain.com/api
REACT_APP_UPLOAD_BASE_URL=https://yourdomain.com/uploads
```

### **Usage in Code**
```javascript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const UPLOAD_BASE_URL = process.env.REACT_APP_UPLOAD_BASE_URL;

// Image URLs
const getImageUrl = (imagePath) => {
  return imagePath ? `${UPLOAD_BASE_URL}/${imagePath}` : '/placeholder.jpg';
};
```

---

## 📚 Quick Reference

### **Common Endpoints**
```
# Public (No Auth Required)
GET /categories/public
GET /products/public
GET /products/public/by-category
POST /orders/guest

# Authenticated Required
POST /auth/login
POST /auth/register
GET /users/profile
PUT /users/profile
POST /orders
GET /orders/user/history

# Admin Only
GET /orders/stats/dashboard
GET /orders/stats/top-products
GET /products/stats/overview
GET /users/stats/overview
```

### **Status Codes**
```
200 - Success
201 - Created
400 - Bad Request
401 - Unauthorized
403 - Forbidden
404 - Not Found
429 - Rate Limited
500 - Server Error
```

### **Order Status Flow**
```
pending → confirmed → processing → shipped → delivered
              ↓
           cancelled
```

---

## 🎯 Production Checklist

### **Before Going Live:**
- [ ] Update API base URLs to production
- [ ] Configure CORS for production domains
- [ ] Implement proper error boundaries
- [ ] Add loading states for all async operations
- [ ] Test authentication flows
- [ ] Test guest order creation
- [ ] Test file upload functionality
- [ ] Implement proper form validation
- [ ] Add rate limiting handling
- [ ] Test responsive design
- [ ] Optimize image loading
- [ ] Configure environment variables
- [ ] Test offline capabilities (optional)

---

## 🚀 Getting Started

1. **Set up your development environment**
2. **Configure API base URL**
3. **Implement authentication**
4. **Build product listing**
5. **Create shopping cart**
6. **Implement checkout flow**
7. **Add user profile management**
8. **Test thoroughly**
9. **Deploy to production**

Your Usasya e-commerce API is comprehensive and ready for frontend integration! 🎉
