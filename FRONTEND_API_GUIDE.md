# Frontend Developer API Guide - Usasya E-commerce Backend

## Quick Setup

```javascript
const API_BASE = 'http://192.168.206.42:3001/api'; // Network access
// const API_BASE = 'http://localhost:3001/api'; // Local development

// Common headers
const getHeaders = (token = null) => ({
  'Content-Type': 'application/json',
  ...(token && { 'Authorization': `Bearer ${token}` })
});

// Common fetch wrapper
const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: getHeaders(options.token),
    ...options
  });
  return response.json();
};
```

## Authentication Flow

### Register User
```javascript
const register = async (email, password) => {
  return await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
};

// Example usage
const result = await register('user@example.com', 'password123');
// Returns: { message, token, user }
```

### Login
```javascript
const login = async (email, password) => {
  return await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
};

// Example usage
const result = await login('user@example.com', 'password123');
// Returns: { message, token, user }
```

### Verify Token
```javascript
const verifyToken = async (token) => {
  return await apiCall('/auth/me', { token });
};

// Example usage
const user = await verifyToken(localStorage.getItem('token'));
// Returns: { user }
```

### Refresh Token
```javascript
const refreshToken = async (token) => {
  return await apiCall('/auth/refresh', {
    method: 'POST',
    token
  });
};
```

## Product Operations

### Get Public Products (No Auth Required)
```javascript
const getProducts = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  return await apiCall(`/products/public?${params}`);
};

// Example usage
const products = await getProducts({
  category_id: 1,
  search: 'laptop',
  min_price: 1000,
  max_price: 50000,
  page: 1,
  limit: 20,
  sort_by: 'price',
  sort_order: 'asc'
});
// Returns: { products, total, page, totalPages }
```

### Get Single Product
```javascript
const getProduct = async (productId) => {
  return await apiCall(`/products/${productId}/public`);
};

// Example usage
const product = await getProduct(1);
// Returns: product object with images array
```

### Check Product Stock
```javascript
const checkStock = async (productIds) => {
  return await apiCall('/orders/check-stock', {
    method: 'POST',
    body: JSON.stringify({ product_ids: productIds })
  });
};

// Example usage
const stockInfo = await checkStock([1, 2, 3]);
// Returns: { products: [{ product_id, available, current_stock, status, name }] }
```

## Category Operations

### Get Public Categories
```javascript
const getCategories = async () => {
  return await apiCall('/categories/public');
};

// Example usage
const categories = await getCategories();
// Returns: { categories: [{ id, name, description, product_count }] }
```

## Order Operations

### Validate Cart Before Checkout
```javascript
const validateCart = async (items) => {
  return await apiCall('/orders/validate-cart', {
    method: 'POST',
    body: JSON.stringify({ items })
  });
};

// Example usage
const cartValidation = await validateCart([
  { product_id: 1, quantity: 2 },
  { product_id: 2, quantity: 1 }
]);
// Returns: { valid, items, message }
```

### Create Guest Order
```javascript
const createGuestOrder = async (orderData) => {
  return await apiCall('/orders/guest', {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
};

// Example usage
const order = await createGuestOrder({
  customer_name: 'John Doe',
  customer_phone: '+1234567890',
  customer_email: 'john@example.com',
  shipping_address: '123 Main St, City, State 12345',
  items: [
    { product_id: 1, quantity: 2 },
    { product_id: 2, quantity: 1 }
  ],
  payment_method: 'upi', // 'upi', 'cod', 'online'
  notes: 'Handle with care'
});
// Returns: { message, order }
```

### Create Authenticated Order
```javascript
const createOrder = async (orderData, token) => {
  return await apiCall('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
    token
  });
};

// Example usage (same payload as guest order)
const order = await createOrder(orderData, userToken);
// Returns: { message, order } (with user_id set)
```

### Get User Order History
```javascript
const getOrderHistory = async (token, filters = {}) => {
  const params = new URLSearchParams(filters);
  return await apiCall(`/orders/user/history?${params}`, { token });
};

// Example usage
const orders = await getOrderHistory(userToken, {
  page: 1,
  limit: 10,
  status: 'delivered'
});
// Returns: { orders, pagination }
```

### Get Single Order
```javascript
const getOrder = async (orderId, token) => {
  return await apiCall(`/orders/${orderId}`, { token });
};

// Example usage
const order = await getOrder(1, userToken);
// Returns: order object with items
```

### Cancel Order
```javascript
const cancelOrder = async (orderId, token) => {
  return await apiCall(`/orders/${orderId}/cancel`, {
    method: 'PATCH',
    token
  });
};

// Example usage
const result = await cancelOrder(1, userToken);
// Returns: { message }
```

## User Profile Operations

### Get User Profile
```javascript
const getUserProfile = async (token) => {
  return await apiCall('/users/profile', { token });
};

// Example usage
const profile = await getUserProfile(userToken);
// Returns: user object with avatar_url
```

### Update Profile
```javascript
const updateProfile = async (profileData, avatarFile, token) => {
  const formData = new FormData();
  Object.keys(profileData).forEach(key => {
    formData.append(key, profileData[key]);
  });
  if (avatarFile) {
    formData.append('avatar', avatarFile);
  }

  const response = await fetch(`${API_BASE}/users/profile`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  return response.json();
};

// Example usage
const result = await updateProfile(
  { name: 'John Doe', phone: '+1234567890' },
  avatarFile, // File object from input
  userToken
);
// Returns: { message, user }
```

### Change Password
```javascript
const changePassword = async (userId, currentPassword, newPassword, token) => {
  return await apiCall(`/users/${userId}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
    token
  });
};

// Example usage
const result = await changePassword(userId, 'oldpass', 'newpass', userToken);
// Returns: { message }
```

## Admin Operations

### Get All Orders (Admin)
```javascript
const getAllOrders = async (token, filters = {}) => {
  const params = new URLSearchParams(filters);
  return await apiCall(`/orders?${params}`, { token });
};

// Example usage
const orders = await getAllOrders(adminToken, {
  page: 1,
  limit: 10,
  status: 'pending',
  user_id: 1
});
// Returns: { orders, pagination }
```

### Update Order Status (Admin)
```javascript
const updateOrderStatus = async (orderId, status, token) => {
  return await apiCall(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
    token
  });
};

// Example usage
const result = await updateOrderStatus(1, 'confirmed', adminToken);
// Valid statuses: pending, confirmed, processing, shipped, delivered, cancelled
// Returns: { message, order }
```

### Get Analytics (Admin)
```javascript
const getOrderStats = async (token) => {
  return await apiCall('/orders/stats/overview', { token });
};

const getDashboardStats = async (token) => {
  return await apiCall('/orders/stats/dashboard', { token });
};

const getTopProducts = async (token, limit = 10, period = 30) => {
  return await apiCall(`/orders/stats/top-products?limit=${limit}&period=${period}`, { token });
};

const getRevenueStats = async (token, period = 'daily', days = 30) => {
  return await apiCall(`/orders/stats/revenue?period=${period}&days=${days}`, { token });
};
```

### Manage Products (Admin)
```javascript
const createProduct = async (productData, imageFiles, token) => {
  const formData = new FormData();
  Object.keys(productData).forEach(key => {
    formData.append(key, productData[key]);
  });
  imageFiles.forEach(file => {
    formData.append('images', file);
  });

  const response = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  return response.json();
};

const updateProduct = async (productId, productData, imageFiles, token) => {
  const formData = new FormData();
  Object.keys(productData).forEach(key => {
    formData.append(key, productData[key]);
  });
  if (imageFiles?.length) {
    imageFiles.forEach(file => {
      formData.append('images', file);
    });
  }

  const response = await fetch(`${API_BASE}/products/${productId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  return response.json();
};

const deleteProduct = async (productId, token) => {
  return await apiCall(`/products/${productId}`, {
    method: 'DELETE',
    token
  });
};
```

### Manage Categories (Admin)
```javascript
const createCategory = async (categoryData, token) => {
  return await apiCall('/categories', {
    method: 'POST',
    body: JSON.stringify(categoryData),
    token
  });
};

const updateCategory = async (categoryId, categoryData, token) => {
  return await apiCall(`/categories/${categoryId}`, {
    method: 'PUT',
    body: JSON.stringify(categoryData),
    token
  });
};

const deleteCategory = async (categoryId, token) => {
  return await apiCall(`/categories/${categoryId}`, {
    method: 'DELETE',
    token
  });
};
```

### Manage Users (Admin)
```javascript
const getAllUsers = async (token, filters = {}) => {
  const params = new URLSearchParams(filters);
  return await apiCall(`/users?${params}`, { token });
};

const updateUserStatus = async (userId, status, token) => {
  return await apiCall(`/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
    token
  });
};

const resetUserPassword = async (userId, newPassword, token) => {
  return await apiCall(`/users/${userId}/reset-password`, {
    method: 'PATCH',
    body: JSON.stringify({ newPassword }),
    token
  });
};
```

## Error Handling

```javascript
const handleApiError = (error) => {
  if (error.errors) {
    // Validation errors
    return error.errors.map(err => err.msg).join(', ');
  }
  return error.error || 'An unexpected error occurred';
};

// Usage example
try {
  const result = await login(email, password);
  if (result.token) {
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
  }
} catch (error) {
  const errorMessage = handleApiError(error);
  console.error('Login failed:', errorMessage);
}
```

## File Upload Helper

```javascript
const uploadWithProgress = (url, formData, token, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress(percentComplete);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200 || xhr.status === 201) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(JSON.parse(xhr.responseText));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject({ error: 'Upload failed' });
    });
    
    xhr.open('POST', `${API_BASE}${url}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
};
```

## UPI Payment Integration

```javascript
const generateUPILink = (amount, orderId, merchantUPI = 'merchant@paytm') => {
  return `upi://pay?pa=${merchantUPI}&pn=Usasya&tn=Order%20${orderId}&am=${amount}&cu=INR`;
};

const openUPIApp = (upiLink) => {
  // For web applications
  window.location.href = upiLink;
  
  // For mobile apps (React Native)
  // Linking.openURL(upiLink);
};
```

## React Hook Examples

```javascript
// Custom hook for authentication
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  const login = async (email, password) => {
    try {
      const result = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      if (result.token) {
        setToken(result.token);
        setUser(result.user);
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  };
  
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };
  
  return { user, token, login, logout };
};

// Custom hook for orders
const useOrders = (token) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const fetchOrders = async (filters = {}) => {
    setLoading(true);
    try {
      const result = await getOrderHistory(token, filters);
      setOrders(result.orders);
      return result;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const createOrder = async (orderData) => {
    try {
      const result = await apiCall('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
        token
      });
      
      // Refresh orders list
      await fetchOrders();
      
      return result;
    } catch (error) {
      throw error;
    }
  };
  
  return { orders, loading, fetchOrders, createOrder };
};
```

## Best Practices

### 1. Token Management
```javascript
// Check token expiry and refresh if needed
const checkAndRefreshToken = async () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    await verifyToken(token);
    return token;
  } catch (error) {
    // Token expired, try to refresh
    try {
      const result = await refreshToken(token);
      localStorage.setItem('token', result.token);
      return result.token;
    } catch (refreshError) {
      // Refresh failed, logout user
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
  }
};
```

### 2. Image Handling
```javascript
// Optimize image display
const getOptimizedImageUrl = (imageUrl, width = 400) => {
  if (!imageUrl) return '/placeholder-image.jpg';
  return imageUrl; // Add image optimization service if needed
};

// Image lazy loading
const LazyImage = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <div className={`image-container ${className}`}>
      {!loaded && <div className="image-placeholder">Loading...</div>}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        style={{ display: loaded ? 'block' : 'none' }}
      />
    </div>
  );
};
```

### 3. Order Status Mapping
```javascript
const orderStatusConfig = {
  pending: { label: 'Pending', color: '#f39c12', icon: '⏳' },
  confirmed: { label: 'Confirmed', color: '#3498db', icon: '✅' },
  processing: { label: 'Processing', color: '#9b59b6', icon: '🔄' },
  shipped: { label: 'Shipped', color: '#2ecc71', icon: '🚚' },
  delivered: { label: 'Delivered', color: '#27ae60', icon: '📦' },
  cancelled: { label: 'Cancelled', color: '#e74c3c', icon: '❌' }
};

const OrderStatus = ({ status }) => {
  const config = orderStatusConfig[status] || orderStatusConfig.pending;
  
  return (
    <span 
      className="order-status" 
      style={{ color: config.color }}
    >
      {config.icon} {config.label}
    </span>
  );
};
```

## Environment Configuration

```javascript
// config.js
const config = {
  development: {
    API_BASE: 'http://localhost:3001/api',
    UPLOADS_BASE: 'http://localhost:3001/uploads'
  },
  production: {
    API_BASE: 'https://your-domain.com/api',
    UPLOADS_BASE: 'https://your-domain.com/uploads'
  }
};

export default config[process.env.NODE_ENV || 'development'];
```

This guide provides practical examples for integrating with the Usasya E-commerce Backend API. All endpoints return JSON responses and follow RESTful conventions.

## User Profile

### Get Profile
```javascript
const getUserProfile = async (token) => {
  const response = await fetch(`${API_BASE}/users/profile`, {
    headers: getHeaders(token)
  });
  return response.json();
};
```

### Update Profile
```javascript
const updateProfile = async (token, profileData) => {
  const response = await fetch(`${API_BASE}/users/profile`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(profileData)
  });
  return response.json();
};
```

## Products

### Get All Products
```javascript
const getProducts = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const response = await fetch(`${API_BASE}/products?${queryParams}`);
  return response.json();
};

// Usage examples:
// getProducts({ page: 1, limit: 12, category_id: 1 })
// getProducts({ search: 'iPhone', min_price: 50000, max_price: 100000 })
```

### Get Single Product
```javascript
const getProduct = async (id) => {
  const response = await fetch(`${API_BASE}/products/${id}`);
  return response.json();
};
```

### Create Product (Admin)
```javascript
const createProduct = async (token, productData) => {
  const response = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(productData)
  });
  return response.json();
};
```

## Categories

### Get All Categories
```javascript
const getCategories = async () => {
  const response = await fetch(`${API_BASE}/categories`);
  return response.json();
};
```

### Create Category (Admin)
```javascript
const createCategory = async (token, categoryData) => {
  const response = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(categoryData)
  });
  return response.json();
};
```

## Orders

### Create Order
```javascript
const createOrder = async (orderData, token = null) => {
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: getHeaders(token), // Optional token for authenticated orders
    body: JSON.stringify(orderData)
  });
  return response.json();
};

// Example order data:
const orderData = {
  customer_name: "John Doe",
  customer_phone: "9876543210",
  customer_email: "john@example.com",
  shipping_address: "123 Main St, City, State 12345",
  items: [
    { product_id: 1, quantity: 2 },
    { product_id: 5, quantity: 1 }
  ],
  payment_method: "upi",
  notes: "Please deliver carefully"
};
```

### Get User Order History
```javascript
const getOrderHistory = async (token, page = 1, limit = 10) => {
  const response = await fetch(`${API_BASE}/orders/user/history?page=${page}&limit=${limit}`, {
    headers: getHeaders(token)
  });
  return response.json();
};
```

### Get All Orders (Admin)
```javascript
const getAllOrders = async (token, filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const response = await fetch(`${API_BASE}/orders?${queryParams}`, {
    headers: getHeaders(token)
  });
  return response.json();
};

// Usage: getAllOrders(token, { status: 'pending', page: 1, limit: 10 })
```

### Update Order Status (Admin)
```javascript
const updateOrderStatus = async (token, orderId, status) => {
  const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ status })
  });
  return response.json();
};

// Valid statuses: 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
```

### Cancel Order
```javascript
const cancelOrder = async (token, orderId) => {
  const response = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
    method: 'PATCH',
    headers: getHeaders(token)
  });
  return response.json();
};
```

### Validate Cart
```javascript
const validateCart = async (items) => {
  const response = await fetch(`${API_BASE}/orders/validate-cart`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ items })
  });
  return response.json();
};

// Example items:
const items = [
  { product_id: 1, quantity: 2 },
  { product_id: 5, quantity: 1 }
];
```

### Check Stock
```javascript
const checkStock = async (productIds) => {
  const response = await fetch(`${API_BASE}/orders/check-stock`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ product_ids: productIds })
  });
  return response.json();
};

// Usage: checkStock([1, 2, 3, 4, 5])
```

## File Upload

### Upload Product Images (Admin)
```javascript
const uploadProductImages = async (token, files) => {
  const formData = new FormData();
  files.forEach(file => formData.append('images', file));
  
  const response = await fetch(`${API_BASE}/upload/products`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  return response.json();
};
```

### Upload Avatar
```javascript
const uploadAvatar = async (token, file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  const response = await fetch(`${API_BASE}/upload/avatar`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  return response.json();
};
```

## Admin Dashboard Stats

### Get Order Statistics
```javascript
const getOrderStats = async (token) => {
  const response = await fetch(`${API_BASE}/orders/stats/overview`, {
    headers: getHeaders(token)
  });
  return response.json();
};
```

### Get Dashboard Analytics
```javascript
const getDashboardAnalytics = async (token) => {
  const response = await fetch(`${API_BASE}/orders/stats/dashboard`, {
    headers: getHeaders(token)
  });
  return response.json();
};
```

### Get Top Products
```javascript
const getTopProducts = async (token, period = 30, limit = 10) => {
  const response = await fetch(`${API_BASE}/orders/stats/top-products?period=${period}&limit=${limit}`, {
    headers: getHeaders(token)
  });
  return response.json();
};
```

## Error Handling

```javascript
const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json();
    if (errorData.errors) {
      // Validation errors
      const errorMessages = errorData.errors.map(err => err.msg).join(', ');
      throw new Error(errorMessages);
    } else {
      // General error
      throw new Error(errorData.error || 'An error occurred');
    }
  }
  return response.json();
};

// Usage example:
const safeApiCall = async () => {
  try {
    const response = await fetch(`${API_BASE}/products`);
    const data = await handleApiResponse(response);
    return data;
  } catch (error) {
    console.error('API Error:', error.message);
    throw error;
  }
};
```

## React Context Example

```javascript
// AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      verifyToken(token)
        .then(data => {
          if (data.valid) {
            setUser(data.user);
          } else {
            logout();
          }
        })
        .catch(() => logout());
    }
  }, [token]);

  const login = async (email, password) => {
    const data = await loginApi(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

## Common Response Patterns

### Success Response
```javascript
{
  message: "Operation successful",
  data: { /* relevant data */ }
}
```

### Error Response
```javascript
{
  error: "Error message"
}
```

### Validation Error Response
```javascript
{
  errors: [
    {
      type: "field",
      value: "invalid_value",
      msg: "Error message",
      path: "field_name",
      location: "body"
    }
  ]
}
```

### Paginated Response
```javascript
{
  items: [ /* array of items */ ],
  pagination: {
    page: 1,
    limit: 10,
    total: 100,
    pages: 10
  }
}
```

## Status Codes Reference

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (login required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **500**: Internal Server Error

## Important Notes

1. **Authentication**: Most endpoints require a valid JWT token
2. **Admin Access**: Admin-only endpoints require users with `role: "admin"`
3. **File Uploads**: Use `FormData` for file uploads, don't set `Content-Type` header
4. **UPI Links**: Must start with `upi://pay?` and include required parameters
5. **Guest Orders**: Orders can be placed without authentication (user_id will be null)
6. **Stock Management**: Product stock is automatically updated when orders are placed/cancelled
7. **Error Handling**: Always check response status and handle errors appropriately

## Environment Setup

Make sure your backend is running on:
- **Local**: `http://localhost:3001`
- **Network**: `http://192.168.206.42:3001`

Update the `API_BASE` constant according to your environment.
