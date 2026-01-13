const Permission = require('../models/Permission');
const Resource = require('../models/Resource');
const mongoose = require('mongoose');

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
    
    // Try to find by slug or path
    const resourceDoc = await Resource.findOne({ 
        $or: [
            { slug: resource },
            { path: resource }
        ]
    }).select('_id');
    
    return resourceDoc ? resourceDoc._id : null;
};

// Middleware to check if user has permission for a specific action on a resource
// Checks user-specific permissions first, then role permissions (merged)
const checkPermission = (resource, action) => {
    return async (req, res, next) => {
        try {
            // Check if user exists in request (set by authenticate middleware)
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const userId = req.user._id;
            const userRole = req.user.role;

            // Super admin has access to everything
            if (userRole === 'super_admin') {
                return next();
            }

            // Get resource ID (supports slug, path, or ObjectId)
            const resourceId = await getResourceId(resource);
            if (!resourceId) {
                return res.status(404).json({
                    success: false,
                    message: `Resource not found: ${resource}`
                });
            }

            // Check user permissions (checks both user-specific and role permissions)
            const hasPermission = await Permission.hasUserPermission(userId, resourceId, action);

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. You don't have permission to ${action} ${resource}`,
                    required: { resource, action, userId: userId.toString(), role: userRole }
                });
            }

            // Get effective permission details to check conditions
            // First check user-specific permission, then role permission
            let permission = await Permission.findOne({
                userId: userId,
                resource: resourceId,
                actions: action,
                isActive: true
            });

            // If no user-specific permission, get role permission
            if (!permission) {
                permission = await Permission.findOne({
                    role: userRole,
                    resource: resourceId,
                    actions: action,
                    isActive: true
                });
            }

            // Check conditions if they exist
            if (permission && permission.conditions) {
                // Handle 'ownOnly' condition
                if (permission.conditions.ownOnly) {
                    // Resource should be attached to req by previous middleware
                    const resourceData = req.resource;
                    
                    if (resourceData) {
                        const creatorId = resourceData.createdBy || resourceData.userId;
                        
                        if (creatorId && creatorId.toString() !== userId.toString()) {
                            return res.status(403).json({
                                success: false,
                                message: 'Access denied. You can only access your own content.'
                            });
                        }
                    }
                }

                // You can add more condition checks here
                // e.g., departmentOnly, regionOnly, etc.
            }

            next();

        } catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Permission check failed',
                error: error.message
            });
        }
    };
};

// Middleware to check multiple permissions (user needs at least one)
const checkAnyPermission = (permissions) => {
    // permissions is an array of {resource, action} objects
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const userId = req.user._id;
            const userRole = req.user.role;

            // Super admin has access to everything
            if (userRole === 'super_admin') {
                return next();
            }

            // Check if user has at least one of the required permissions
            const permissionChecks = await Promise.all(
                permissions.map(async ({ resource, action }) => {
                    const resourceId = await getResourceId(resource);
                    if (!resourceId) {
                        return false;
                    }
                    return await Permission.hasUserPermission(userId, resourceId, action);
                })
            );

            const hasAnyPermission = permissionChecks.some(result => result === true);

            if (!hasAnyPermission) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You don\'t have the required permissions.',
                    required: permissions,
                    userId: userId.toString(),
                    role: userRole
                });
            }

            next();

        } catch (error) {
            console.error('Multiple permission check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Permission check failed',
                error: error.message
            });
        }
    };
};

// Middleware to check all permissions (user needs all of them)
const checkAllPermissions = (permissions) => {
    // permissions is an array of {resource, action} objects
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const userId = req.user._id;
            const userRole = req.user.role;

            // Super admin has access to everything
            if (userRole === 'super_admin') {
                return next();
            }

            // Check if user has all required permissions
            const permissionChecks = await Promise.all(
                permissions.map(async ({ resource, action }) => {
                    const resourceId = await getResourceId(resource);
                    if (!resourceId) {
                        return false;
                    }
                    return await Permission.hasUserPermission(userId, resourceId, action);
                })
            );

            const hasAllPermissions = permissionChecks.every(result => result === true);

            if (!hasAllPermissions) {
                const failedPermissions = permissions.filter((_, index) => !permissionChecks[index]);
                
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You don\'t have all the required permissions.',
                    missing: failedPermissions,
                    userId: userId.toString(),
                    role: userRole
                });
            }

            next();

        } catch (error) {
            console.error('All permissions check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Permission check failed',
                error: error.message
            });
        }
    };
};

// Middleware to check workflow permissions
const checkWorkflowPermission = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userRole = req.user.role;
        const { action } = req.body; // e.g., 'submit', 'review', 'approve', 'publish'

        // Super admin can perform any workflow action
        if (userRole === 'super_admin') {
            return next();
        }

        // Define workflow permissions
        const workflowPermissions = {
            submit: ['editor', 'reviewer', 'approver', 'admin'],
            review: ['reviewer', 'approver', 'admin'],
            approve: ['approver', 'admin'],
            publish: ['admin'],
            reject: ['reviewer', 'approver', 'admin']
        };

        if (!workflowPermissions[action]) {
            return res.status(400).json({
                success: false,
                message: 'Invalid workflow action'
            });
        }

        if (!workflowPermissions[action].includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Your role (${userRole}) cannot perform ${action} action.`,
                allowedRoles: workflowPermissions[action]
            });
        }

        next();

    } catch (error) {
        console.error('Workflow permission check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Workflow permission check failed',
            error: error.message
        });
    }
};

// Helper function to get user's effective permissions (merged: role + user overrides)
const getUserPermissions = async (userId) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(userId);
        
        if (!user) {
            throw new Error('User not found');
        }

        // Super admin has all permissions
        if (user.role === 'super_admin') {
            return {
                role: 'super_admin',
                hasAllPermissions: true,
                permissions: []
            };
        }

        // Get effective permissions (merged: role + user overrides)
        const effectivePermissions = await Permission.getEffectivePermissions(userId);
        
        return {
            role: user.role,
            hasAllPermissions: false,
            permissions: effectivePermissions.map(p => ({
                resource: p.resource,
                actions: p.actions,
                conditions: p.conditions,
                source: p.source // 'role' or 'user'
            }))
        };

    } catch (error) {
        console.error('Get user permissions error:', error);
        throw error;
    }
};

// Helper function to check if user can access specific page
const canAccessPage = async (userId, pageId) => {
    try {
        const User = require('../models/User');
        const Page = require('../models/Page');
        
        const user = await User.findById(userId);
        const page = await Page.findById(pageId);
        
        if (!user || !page) {
            return false;
        }

        // Super admin can access everything
        if (user.role === 'super_admin') {
            return true;
        }

        // Check page-level permissions if they exist
        if (page.permissions) {
            // Check if user is in allowed users list (highest priority)
            if (page.permissions.allowedUsers && page.permissions.allowedUsers.length > 0) {
                if (page.permissions.allowedUsers.some(id => id.toString() === userId.toString())) {
                    return true;
                }
            }

            // Check if user is in restricted users list
            if (page.permissions.restrictedUsers && page.permissions.restrictedUsers.length > 0) {
                if (page.permissions.restrictedUsers.some(id => id.toString() === userId.toString())) {
                    return false;
                }
            }

            // Check if user's role is in allowed roles
            if (page.permissions.allowedRoles && page.permissions.allowedRoles.length > 0) {
                if (!page.permissions.allowedRoles.includes(user.role)) {
                    return false;
                }
            }
        }

        // Default to checking general permissions (using user permissions - merged)
        // Get resource ID for 'pages'
        const resourceId = await getResourceId('pages');
        if (!resourceId) {
            return false;
        }
        
        return await Permission.hasUserPermission(userId, resourceId, 'read');

    } catch (error) {
        console.error('Can access page check error:', error);
        return false;
    }
};

module.exports = {
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    checkWorkflowPermission,
    getUserPermissions,
    canAccessPage
};

