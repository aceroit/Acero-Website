const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
    getAllPermissions,
    getRolePermissions,
    updateRolePermissions,
    getMyPermissions,
    checkUserPermission,
    getResourcesAndActions,
    getPermissionMatrix,
    upsertPermission,
    deletePermission,
    getUserPermissions,
    updateUserPermissions,
    getUsersByRole
} = require('../controllers/permissionController');

// All routes require authentication
router.use(authenticate);

// Check if current user has a specific permission
// Any authenticated user can check their own permissions
router.post(
    '/check',
    checkUserPermission
);

// Get current user's permissions
// Any authenticated user can fetch their own permissions
router.get(
    '/me',
    getMyPermissions
);

// Get all available resources and actions
// Any authenticated user can view this
router.get(
    '/resources-actions',
    getResourcesAndActions
);

// Get permission matrix (all roles x all resources)
// Only super_admin and admin can view full matrix
router.get(
    '/matrix',
    authorize('super_admin', 'admin'),
    getPermissionMatrix
);

// Get all permissions (with optional filtering)
// Only super_admin and admin can view all permissions
router.get(
    '/',
    authorize('super_admin', 'admin'),
    getAllPermissions
);

// Get users in a specific role
// Only super_admin and admin can view users by role
router.get(
    '/role/:role/users',
    authorize('super_admin', 'admin'),
    getUsersByRole
);

// Get permissions for a specific role
// Only super_admin and admin can view role permissions
router.get(
    '/role/:role',
    authorize('super_admin', 'admin'),
    getRolePermissions
);

// Update permissions for a role (bulk update)
// Only super_admin can update permissions
router.put(
    '/role/:role',
    authorize('super_admin'),
    updateRolePermissions
);

// Get permissions for a specific user (effective permissions - merged)
// Only super_admin and admin can view user permissions
router.get(
    '/user/:userId',
    authorize('super_admin', 'admin'),
    getUserPermissions
);

// Update user-specific permission overrides
// Only super_admin can update user permissions
router.put(
    '/user/:userId',
    authorize('super_admin'),
    updateUserPermissions
);

// Create or update a single permission
// Only super_admin can modify permissions
router.post(
    '/',
    authorize('super_admin'),
    upsertPermission
);

// Delete a permission
// Only super_admin can delete permissions
router.delete(
    '/:id',
    authorize('super_admin'),
    deletePermission
);

module.exports = router;

