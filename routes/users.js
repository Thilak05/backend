const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult, param } = require('express-validator');
const { getDb } = require('../database/init');
const { authenticateToken, requireAdmin, requireOwnershipOrAdmin } = require('../middleware/auth');
const { uploadUserAvatar, handleUploadError, deleteFile, getFileUrl } = require('../middleware/upload');
const path = require('path');

const router = express.Router();

// Validation rules
const createUserValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').trim().isLength({ min: 10 }).withMessage('Valid phone number required'),
  body('role').isIn(['admin', 'client']).withMessage('Role must be admin or client'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive')
];

const updateUserValidation = [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().trim().isLength({ min: 10 }).withMessage('Valid phone number required'),
  body('role').optional().isIn(['admin', 'client']).withMessage('Role must be admin or client'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive')
];

const updateProfileValidation = [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').optional().trim().isLength({ min: 10 }).withMessage('Valid phone number required')
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

const resetPasswordValidation = [
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

const idValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid user ID is required')
];

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    const db = getDb();

    let query = 'SELECT id, name, email, phone, role, status, avatar, created_at, updated_at FROM users';
    let params = [];

    // Build WHERE clause
    let whereConditions = [];

    if (role) {
      whereConditions.push('role = ?');
      params.push(role);
    }

    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }

    if (search) {
      whereConditions.push('(name LIKE ? OR email LIKE ? OR phone LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    // Add pagination
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    // Get users
    const users = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM users';
    let countParams = [];

    if (whereConditions.length > 0) {
      countQuery += ' WHERE ' + whereConditions.join(' AND ');
      countParams = params.slice(0, -2); // Remove limit and offset
    }

    const totalCount = await new Promise((resolve, reject) => {
      db.get(countQuery, countParams, (err, row) => {
        if (err) reject(err);
        else resolve(row.total);
      });
    });

    db.close();

    // Process users to include full avatar URLs
    const processedUsers = users.map(user => ({
      ...user,
      avatar: user.avatar ? getFileUrl(req, user.avatar, 'users') : null
    }));

    res.json({
      users: processedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single user (admin can get any, users can get their own)
router.get('/:id', authenticateToken, requireOwnershipOrAdmin('id'), idValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const db = getDb();

    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, name, email, phone, role, status, avatar, created_at, updated_at FROM users WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    db.close();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Process user data
    const processedUser = {
      ...user,
      avatar: user.avatar ? getFileUrl(req, user.avatar, 'users') : null
    };

    res.json(processedUser);

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new user (admin only)
router.post('/', authenticateToken, requireAdmin, createUserValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, role, status = 'active' } = req.body;
    const db = getDb();

    // Check if email already exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingUser) {
      db.close();
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (name, email, password, phone, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [name, email, hashedPassword, phone, role, status],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });

    // Get created user
    const newUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, name, email, phone, role, status, avatar, created_at, updated_at FROM users WHERE id = ?',
        [result.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    db.close();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        ...newUser,
        avatar: newUser.avatar ? getFileUrl(req, newUser.avatar, 'users') : null
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user (admin only for all fields, users can only update their own profile)
router.put('/:id', authenticateToken, uploadUserAvatar, handleUploadError, [...idValidation, ...updateUserValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, email, phone, role, status } = req.body;
    const isAdmin = req.user.role === 'admin';
    const isOwner = req.user.id === parseInt(id);

    // Check permissions
    if (!isAdmin && !isOwner) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(403).json({ error: 'Access denied' });
    }

    // Non-admin users can only update their own basic profile
    if (!isAdmin && (role || status)) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(403).json({ error: 'Cannot modify role or status' });
    }

    const db = getDb();

    // Check if user exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!existingUser) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      db.close();
      return res.status(404).json({ error: 'User not found' });
    }

    // Check email uniqueness if updating email
    if (email && email !== existingUser.email) {
      const emailExists = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (emailExists) {
        if (req.file) {
          deleteFile(req.file.path);
        }
        db.close();
        return res.status(409).json({ error: 'Email already exists' });
      }
    }

    // Handle avatar update
    let avatarToUpdate = existingUser.avatar;
    if (req.file) {
      // Delete old avatar if exists
      if (existingUser.avatar) {
        deleteFile(path.join(__dirname, '..', 'uploads', 'users', existingUser.avatar));
      }
      avatarToUpdate = req.file.filename;
    }

    // Prepare update fields
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }

    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }

    if (isAdmin && role !== undefined) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }

    if (isAdmin && status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (req.file) {
      updateFields.push('avatar = ?');
      updateValues.push(avatarToUpdate);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    // Update user
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues,
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Get updated user
    const updatedUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, name, email, phone, role, status, avatar, created_at, updated_at FROM users WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    db.close();

    // Process user data
    const processedUser = {
      ...updatedUser,
      avatar: updatedUser.avatar ? getFileUrl(req, updatedUser.avatar, 'users') : null
    };

    res.json({
      message: 'User updated successfully',
      user: processedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    if (req.file) {
      deleteFile(req.file.path);
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Update own profile (authenticated users)
router.patch('/profile', authenticateToken, uploadUserAvatar, handleUploadError, updateProfileValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone } = req.body;
    const userId = req.user.id;
    const db = getDb();

    // Get current user
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!existingUser) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      db.close();
      return res.status(404).json({ error: 'User not found' });
    }

    // Handle avatar update
    let avatarToUpdate = existingUser.avatar;
    if (req.file) {
      // Delete old avatar if exists
      if (existingUser.avatar) {
        deleteFile(path.join(__dirname, '..', 'uploads', 'users', existingUser.avatar));
      }
      avatarToUpdate = req.file.filename;
    }

    // Update user
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET name = ?, phone = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [
          name || existingUser.name,
          phone || existingUser.phone,
          avatarToUpdate,
          userId
        ],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Get updated user
    const updatedUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, name, email, phone, role, status, avatar, created_at, updated_at FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    db.close();

    // Process user data
    const processedUser = {
      ...updatedUser,
      avatar: updatedUser.avatar ? getFileUrl(req, updatedUser.avatar, 'users') : null
    };

    res.json({
      message: 'Profile updated successfully',
      user: processedUser
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    if (req.file) {
      deleteFile(req.file.path);
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Change password
router.patch('/:id/password', authenticateToken, requireOwnershipOrAdmin('id'), [...idValidation, ...changePasswordValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    const db = getDb();

    // Get user with password
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      db.close();
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password (skip for admin changing other user's password)
    if (req.user.role !== 'admin' || req.user.id === parseInt(id)) {
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        db.close();
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedNewPassword, id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    db.close();

    res.json({ message: 'Password updated successfully' });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset password (admin only)
router.patch('/:id/reset-password', authenticateToken, requireAdmin, [...idValidation, ...resetPasswordValidation], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { newPassword } = req.body;
    const db = getDb();

    // Check if user exists
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      db.close();
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedNewPassword, id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    db.close();

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user status (admin only)
router.patch('/:id/status', authenticateToken, requireAdmin, idValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be "active" or "inactive"' });
    }

    const db = getDb();

    // Check if user exists
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      db.close();
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deactivating themselves
    if (req.user.id === parseInt(id) && status === 'inactive') {
      db.close();
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    // Update status
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    db.close();

    res.json({ message: 'User status updated successfully' });

  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (admin only, cannot delete self)
router.delete('/:id', authenticateToken, requireAdmin, idValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const db = getDb();

    // Get user to delete associated files
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      db.close();
      return res.status(404).json({ error: 'User not found' });
    }

    // Check for existing orders
    const userOrders = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM orders WHERE user_id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    if (userOrders > 0) {
      db.close();
      return res.status(400).json({ 
        error: 'Cannot delete user with existing orders. Consider deactivating instead.' 
      });
    }

    // Delete user
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });

    db.close();

    // Delete associated avatar file
    if (user.avatar) {
      deleteFile(path.join(__dirname, '..', 'uploads', 'users', user.avatar));
    }

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user statistics (admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDb();

    // Get user statistics
    const stats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          COUNT(*) as total_users,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
          SUM(CASE WHEN role = 'client' THEN 1 ELSE 0 END) as client_count,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
          SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_count,
          SUM(CASE WHEN DATE(created_at) = DATE('now') THEN 1 ELSE 0 END) as new_today,
          SUM(CASE WHEN DATE(created_at) >= DATE('now', '-7 days') THEN 1 ELSE 0 END) as new_this_week
        FROM users
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0]);
      });
    });

    db.close();

    res.json(stats);

  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
