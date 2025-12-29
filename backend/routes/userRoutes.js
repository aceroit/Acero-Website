const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    changeUserRole,
    getUserStats
} = require('../controllers/userController');

// All routes require authentication
router.use(authenticate);

// Get user statistics
// Only admin and super_admin can view stats
router.get(
    '/stats',
    authorize('super_admin', 'admin'),
    getUserStats
);

// Get all users
// Requires 'read' permission on 'users' resource
router.get(
    '/',
    checkPermission('users', 'read'),
    getAllUsers
);

// Get single user by ID
// Requires 'read' permission on 'users' resource
router.get(
    '/:id',
    checkPermission('users', 'read'),
    getUserById
);

// Create new user
// Requires 'create' permission on 'users' resource
router.post(
    '/',
    checkPermission('users', 'create'),
    createUser
);

// Update user
// Requires 'update' permission on 'users' resource
router.put(
    '/:id',
    checkPermission('users', 'update'),
    updateUser
);

// Delete user (soft delete - deactivate)
// Requires 'delete' permission on 'users' resource
router.delete(
    '/:id',
    checkPermission('users', 'delete'),
    deleteUser
);

// Change user role
// Only super_admin can change roles
router.put(
    '/:id/role',
    authorize('super_admin'),
    changeUserRole
);

module.exports = router;

