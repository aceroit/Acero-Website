const Permission = require('../models/Permission');
const User = require('../models/User');

/**
 * Permission Service
 * Centralized permission management and checking
 */

/**
 * Check if user has permission to perform action on resource
 * @param {String} userId - User ID
 * @param {String} resource - Resource/module name (e.g., 'pages', 'sections')
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

        // Find permission for user's role
        const permission = await Permission.findOne({
            role: user.role,
            module: resource,
            isActive: true
        });

        if (!permission) {
            throw new Error(`No permission found for ${user.role} on ${resource}`);
        }

        // Check if action is allowed
        if (!permission.actions.includes(action)) {
            throw new Error(`Permission denied: ${user.role} cannot ${action} ${resource}`);
        }

        return true;
    } catch (error) {
        throw error;
    }
};

/**
 * Get all permissions for a user
 * @param {String} userId - User ID
 * @returns {Array} - Array of permissions
 */
exports.getUserPermissions = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Super admin has all permissions
        if (user.role === 'super_admin') {
            return await Permission.find({ isActive: true });
        }

        // Get permissions for user's role
        const permissions = await Permission.find({
            role: user.role,
            isActive: true
        });

        return permissions;
    } catch (error) {
        throw error;
    }
};

/**
 * Get user's permissions for a specific resource
 * @param {String} userId - User ID
 * @param {String} resource - Resource/module name
 * @returns {Object} - Permission object
 */
exports.getResourcePermissions = async (userId, resource) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Super admin has all permissions
        if (user.role === 'super_admin') {
            return {
                role: 'super_admin',
                module: resource,
                actions: ['create', 'read', 'update', 'delete', 'approve', 'publish'],
                isActive: true
            };
        }

        // Get permission for user's role and resource
        const permission = await Permission.findOne({
            role: user.role,
            module: resource,
            isActive: true
        });

        return permission;
    } catch (error) {
        throw error;
    }
};

/**
 * Check if user can approve content
 * @param {String} userId - User ID
 * @param {String} resource - Resource/module name
 * @returns {Boolean} - True if user can approve
 */
exports.canApprove = async (userId, resource) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Only approver, admin, and super_admin can approve
        if (!['approver', 'admin', 'super_admin'].includes(user.role)) {
            return false;
        }

        // Check if user has approve permission for this resource
        const permission = await Permission.findOne({
            role: user.role,
            module: resource,
            actions: 'approve',
            isActive: true
        });

        return !!permission;
    } catch (error) {
        throw error;
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
 * @returns {Array} - Array of permissions
 */
exports.getAllRolePermissions = async (role) => {
    try {
        const permissions = await Permission.find({
            role,
            isActive: true
        });

        return permissions;
    } catch (error) {
        throw error;
    }
};

/**
 * Grant permission to a role
 * @param {String} role - Role name
 * @param {String} resource - Resource/module name
 * @param {Array} actions - Array of actions to grant
 * @returns {Object} - Updated permission
 */
exports.grantPermission = async (role, resource, actions) => {
    try {
        // Find existing permission
        let permission = await Permission.findOne({
            role,
            module: resource
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
                module: resource,
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
 * @param {String} resource - Resource/module name
 * @param {Array} actions - Array of actions to revoke
 * @returns {Object} - Updated permission
 */
exports.revokePermission = async (role, resource, actions) => {
    try {
        // Find existing permission
        const permission = await Permission.findOne({
            role,
            module: resource
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
 * @param {String} resource - Resource/module name
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
 * @param {String} resource - Resource/module name
 * @returns {Boolean} - True if user can publish
 */
exports.canPublish = async (userId, resource) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Only admin and super_admin can publish
        if (!['admin', 'super_admin'].includes(user.role)) {
            return false;
        }

        // Check if user has publish permission for this resource
        const permission = await Permission.findOne({
            role: user.role,
            module: resource,
            actions: 'publish',
            isActive: true
        });

        return !!permission;
    } catch (error) {
        throw error;
    }
};

