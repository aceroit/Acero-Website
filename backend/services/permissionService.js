const Permission = require('../models/Permission');
const User = require('../models/User');
const Resource = require('../models/Resource');
const mongoose = require('mongoose');

/**
 * Permission Service
 * Centralized permission management and checking
 * Supports both role-based and user-specific permissions
 */

/**
 * Helper: Convert resource to ObjectId if it's a string (slug or path)
 * @param {String|ObjectId} resource - Resource slug, path, or ObjectId
 * @returns {ObjectId|null} - Resource ObjectId or null if not found
 */
const getResourceId = async (resource) => {
    // If already an ObjectId, return it
    if (mongoose.Types.ObjectId.isValid(resource) && resource.toString().length === 24) {
        return new mongoose.Types.ObjectId(resource);
    }
    
    // Try to find by slug
    const resourceDoc = await Resource.findOne({ 
        $or: [
            { slug: resource },
            { path: resource }
        ]
    }).select('_id');
    
    return resourceDoc ? resourceDoc._id : null;
};

/**
 * Check if user has permission to perform action on resource
 * Checks user-specific permissions first, then role permissions (merged)
 * @param {String} userId - User ID
 * @param {String|ObjectId} resource - Resource slug, path, or ObjectId
 * @param {String} action - Action to perform (e.g., 'create', 'read', 'update', 'delete')
 * @returns {Boolean} - True if user has permission, throws error if not
 */
exports.checkPermission = async (userId, resource, action) => {
    try {
        // Get user with role
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Super admin has all permissions
        if (user.role === 'super_admin') {
            return true;
        }

        // Get resource ID (supports slug, path, or ObjectId)
        const resourceId = await getResourceId(resource);
        if (!resourceId) {
            throw new Error(`Resource not found: ${resource}`);
        }

        // Use Permission model's hasUserPermission method (checks user + role)
        const hasPermission = await Permission.hasUserPermission(userId, resourceId, action);

        if (!hasPermission) {
            throw new Error(`Permission denied: User cannot ${action} resource ${resource}`);
        }

        return true;
    } catch (error) {
        throw error;
    }
};

/**
 * Get user-specific permission overrides only
 * @param {String} userId - User ID
 * @returns {Array} - Array of user-specific permissions
 */
exports.getUserPermissions = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Get only user-specific permission overrides
        const permissions = await Permission.getUserPermissions(userId);
        return permissions;
    } catch (error) {
        throw error;
    }
};

/**
 * Get effective permissions for a user (merged: role + user overrides)
 * User-specific permissions override role permissions for the same resource
 * @param {String} userId - User ID
 * @returns {Array} - Array of effective permissions (merged)
 */
exports.getEffectivePermissions = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Super admin has all permissions
        if (user.role === 'super_admin') {
            // Return all active permissions as if super_admin has them all
            const allResources = await Resource.find({ isActive: true });
            return allResources.map(resource => ({
                resource: {
                    _id: resource._id,
                    name: resource.name,
                    slug: resource.slug,
                    path: resource.path,
                    icon: resource.icon
                },
                actions: ['create', 'read', 'update', 'delete', 'approve', 'publish'],
                conditions: {},
                source: 'super_admin'
            }));
        }

        // Get merged permissions (role + user overrides)
        const effectivePermissions = await Permission.getEffectivePermissions(userId);
        return effectivePermissions;
    } catch (error) {
        throw error;
    }
};

/**
 * Get user's effective permissions for a specific resource
 * @param {String} userId - User ID
 * @param {String|ObjectId} resource - Resource slug, path, or ObjectId
 * @returns {Object|null} - Permission object with merged permissions
 */
exports.getResourcePermissions = async (userId, resource) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Get resource ID
        const resourceId = await getResourceId(resource);
        if (!resourceId) {
            return null;
        }

        // Super admin has all permissions
        if (user.role === 'super_admin') {
            const resourceDoc = await Resource.findById(resourceId);
            return {
                resource: resourceDoc,
                actions: ['create', 'read', 'update', 'delete', 'approve', 'publish'],
                conditions: {},
                source: 'super_admin'
            };
        }

        // Get effective permissions and find the one for this resource
        const effectivePermissions = await Permission.getEffectivePermissions(userId);
        const resourcePermission = effectivePermissions.find(
            perm => perm.resource._id.toString() === resourceId.toString()
        );

        return resourcePermission || null;
    } catch (error) {
        throw error;
    }
};

/**
 * Check if user can approve content
 * @param {String} userId - User ID
 * @param {String|ObjectId} resource - Resource slug, path, or ObjectId
 * @returns {Boolean} - True if user can approve
 */
exports.canApprove = async (userId, resource) => {
    try {
        return await exports.checkPermission(userId, resource, 'approve');
    } catch (error) {
        return false;
    }
};

/**
 * Check if user has specific role(s)
 * @param {String} userId - User ID
 * @param {Array|String} roles - Single role or array of roles
 * @returns {Boolean} - True if user has one of the roles
 */
exports.hasRole = async (userId, roles) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        return allowedRoles.includes(user.role);
    } catch (error) {
        throw error;
    }
};

/**
 * Get all permissions for a specific role
 * @param {String} role - Role name
 * @returns {Array} - Array of permissions with populated resources
 */
exports.getAllRolePermissions = async (role) => {
    try {
        const permissions = await Permission.getRolePermissions(role);
        return permissions;
    } catch (error) {
        throw error;
    }
};

/**
 * Grant permission to a role
 * @param {String} role - Role name
 * @param {String|ObjectId} resource - Resource slug, path, or ObjectId
 * @param {Array} actions - Array of actions to grant
 * @returns {Object} - Updated permission
 */
exports.grantPermission = async (role, resource, actions) => {
    try {
        // Get resource ID
        const resourceId = await getResourceId(resource);
        if (!resourceId) {
            throw new Error(`Resource not found: ${resource}`);
        }

        // Find existing permission
        let permission = await Permission.findOne({
            role,
            resource: resourceId
        });

        if (permission) {
            // Add new actions to existing permission
            const updatedActions = [...new Set([...permission.actions, ...actions])];
            permission.actions = updatedActions;
            permission.isActive = true;
            await permission.save();
        } else {
            // Create new permission
            permission = await Permission.create({
                role,
                resource: resourceId,
                actions,
                isActive: true
            });
        }

        return permission;
    } catch (error) {
        throw error;
    }
};

/**
 * Revoke permission from a role
 * @param {String} role - Role name
 * @param {String|ObjectId} resource - Resource slug, path, or ObjectId
 * @param {Array} actions - Array of actions to revoke
 * @returns {Object} - Updated permission
 */
exports.revokePermission = async (role, resource, actions) => {
    try {
        // Get resource ID
        const resourceId = await getResourceId(resource);
        if (!resourceId) {
            throw new Error(`Resource not found: ${resource}`);
        }

        // Find existing permission
        const permission = await Permission.findOne({
            role,
            resource: resourceId
        });

        if (!permission) {
            throw new Error('Permission not found');
        }

        // Remove actions from permission
        permission.actions = permission.actions.filter(
            action => !actions.includes(action)
        );

        // If no actions left, deactivate permission
        if (permission.actions.length === 0) {
            permission.isActive = false;
        }

        await permission.save();
        return permission;
    } catch (error) {
        throw error;
    }
};

/**
 * Check if user can perform action (boolean return, no error)
 * @param {String} userId - User ID
 * @param {String|ObjectId} resource - Resource slug, path, or ObjectId
 * @param {String} action - Action to perform
 * @returns {Boolean} - True if user has permission, false otherwise
 */
exports.hasPermission = async (userId, resource, action) => {
    try {
        await exports.checkPermission(userId, resource, action);
        return true;
    } catch (error) {
        return false;
    }
};

/**
 * Get user role
 * @param {String} userId - User ID
 * @returns {String} - User role
 */
exports.getUserRole = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user.role;
    } catch (error) {
        throw error;
    }
};

/**
 * Check if user can publish content
 * @param {String} userId - User ID
 * @param {String|ObjectId} resource - Resource slug, path, or ObjectId
 * @returns {Boolean} - True if user can publish
 */
exports.canPublish = async (userId, resource) => {
    try {
        return await exports.checkPermission(userId, resource, 'publish');
    } catch (error) {
        return false;
    }
};

