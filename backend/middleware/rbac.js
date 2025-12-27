const Permission = require('../models/Permission');

// Middleware to check if user has permission for a specific action on a resource
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

            const userRole = req.user.role;

            // Super admin has access to everything
            if (userRole === 'super_admin') {
                return next();
            }

            // Check if permission exists for this role, resource, and action
            const hasPermission = await Permission.hasPermission(userRole, resource, action);

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. You don't have permission to ${action} ${resource}`,
                    required: { resource, action, role: userRole }
                });
            }

            // Get permission details to check conditions
            const permission = await Permission.findOne({
                role: userRole,
                resource,
                actions: action,
                isActive: true
            });

            // Check conditions if they exist
            if (permission && permission.conditions) {
                // Handle 'ownOnly' condition
                if (permission.conditions.ownOnly) {
                    // Resource should be attached to req by previous middleware
                    const resourceData = req.resource;
                    
                    if (resourceData) {
                        const creatorId = resourceData.createdBy || resourceData.userId;
                        
                        if (creatorId && creatorId.toString() !== req.user._id.toString()) {
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

            const userRole = req.user.role;

            // Super admin has access to everything
            if (userRole === 'super_admin') {
                return next();
            }

            // Check if user has at least one of the required permissions
            const permissionChecks = await Promise.all(
                permissions.map(({ resource, action }) => 
                    Permission.hasPermission(userRole, resource, action)
                )
            );

            const hasAnyPermission = permissionChecks.some(result => result === true);

            if (!hasAnyPermission) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You don\'t have the required permissions.',
                    required: permissions,
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

            const userRole = req.user.role;

            // Super admin has access to everything
            if (userRole === 'super_admin') {
                return next();
            }

            // Check if user has all required permissions
            const permissionChecks = await Promise.all(
                permissions.map(({ resource, action }) => 
                    Permission.hasPermission(userRole, resource, action)
                )
            );

            const hasAllPermissions = permissionChecks.every(result => result === true);

            if (!hasAllPermissions) {
                const failedPermissions = permissions.filter((_, index) => !permissionChecks[index]);
                
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You don\'t have all the required permissions.',
                    missing: failedPermissions,
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

// Helper function to get user's all permissions (not middleware)
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

        const permissions = await Permission.getRolePermissions(user.role);
        
        return {
            role: user.role,
            hasAllPermissions: false,
            permissions: permissions.map(p => ({
                resource: p.resource,
                actions: p.actions,
                conditions: p.conditions
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

        // Default to checking general permissions
        return await Permission.hasPermission(user.role, 'pages', 'read');

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

