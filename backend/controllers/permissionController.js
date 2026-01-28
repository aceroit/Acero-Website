const Permission = require('../models/Permission');
const User = require('../models/User');
const Resource = require('../models/Resource');
const Role = require('../models/Role');
const ActivityLog = require('../models/ActivityLog');
const { getUserPermissions: getUserPermissionsHelper } = require('../middleware/rbac');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const mongoose = require('mongoose');

/**
 * Helper function to resolve role (ObjectId, slug, or name) to ObjectId
 * @param {String|ObjectId} role - Role ObjectId, slug, or name
 * @returns {Promise<ObjectId|null>} - Role ObjectId or null if not found
 */
const getRoleId = async (role) => {
    // If already a valid ObjectId, return it
    if (mongoose.Types.ObjectId.isValid(role) && role.toString().length === 24) {
        return new mongoose.Types.ObjectId(role);
    }
    
    // Try to find by slug or name
    const roleDoc = await Role.findOne({
        $or: [
            { slug: role },
            { name: role }
        ]
    }).select('_id');
    
    return roleDoc ? roleDoc._id : null;
};

// Get all permissions
const getAllPermissions = async (req, res) => {
    try {
        const { role, resource, isActive, userId } = req.query;

        // Build query
        const query = {};

        if (role) {
            // Resolve role to ObjectId (supports ObjectId, slug, or name)
            const roleId = await getRoleId(role);
            if (roleId) {
                query.role = roleId;
            } else {
                return errorResponse(res, 404, `Role not found: ${role}`);
            }
        }

        if (userId) {
            query.userId = new mongoose.Types.ObjectId(userId);
        }

        // If resource is provided, resolve it to ObjectId
        if (resource) {
            let resourceId = resource;
            if (!mongoose.Types.ObjectId.isValid(resource) || resource.toString().length !== 24) {
                const resourceDoc = await Resource.findOne({ 
                    $or: [
                        { slug: resource },
                        { path: resource }
                    ]
                }).select('_id');
                if (resourceDoc) {
                    resourceId = resourceDoc._id;
                } else {
                    return errorResponse(res, 404, `Resource not found: ${resource}`);
                }
            } else {
                resourceId = new mongoose.Types.ObjectId(resource);
            }
            query.resource = resourceId;
        }

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const permissions = await Permission.find(query)
            .populate('resource', 'name slug path icon')
            .populate('role', 'name slug description level color')
            .populate('userId', 'firstName lastName email role')
            .sort({ createdAt: -1 });

        return successResponse(res, 200, 'Permissions retrieved successfully', {
            permissions
        });

    } catch (error) {
        console.error('Get all permissions error:', error);
        return errorResponse(res, 500, 'Error fetching permissions', error.message);
    }
};

// Get permissions for a specific role
const getRolePermissions = async (req, res) => {
    try {
        const { role } = req.params;

        // Resolve role to ObjectId (supports ObjectId, slug, or name)
        const roleId = await getRoleId(role);
        if (!roleId) {
            return errorResponse(res, 404, `Role not found: ${role}`);
        }

        // Get role details for response
        const roleDoc = await Role.findById(roleId).select('name slug description level color isSystem isActive');
        if (!roleDoc) {
            return errorResponse(res, 404, `Role not found: ${role}`);
        }

        // Get permissions with populated resources and role
        const permissions = await Permission.getRolePermissions(roleId);

        // Group by resource for easier consumption
        const groupedPermissions = {};
        permissions.forEach(permission => {
            const resourceKey = permission.resource?._id?.toString() || permission.resource?.slug || permission.resource;
            groupedPermissions[resourceKey] = {
                resource: permission.resource,
                actions: permission.actions,
                conditions: permission.conditions,
                _id: permission._id
            };
        });

        return successResponse(res, 200, 'Role permissions retrieved successfully', {
            role: roleDoc,
            permissions: groupedPermissions,
            raw: permissions
        });

    } catch (error) {
        console.error('Get role permissions error:', error);
        return errorResponse(res, 500, 'Error fetching role permissions', error.message);
    }
};

// Update permissions for a role
const updateRolePermissions = async (req, res) => {
    try {
        const { role } = req.params;
        const { permissions } = req.body; // Array of {resource, actions, conditions}

        if (!permissions || !Array.isArray(permissions)) {
            return errorResponse(res, 400, 'Permissions must be an array');
        }

        // Resolve role to ObjectId (supports ObjectId, slug, or name)
        const roleId = await getRoleId(role);
        if (!roleId) {
            return errorResponse(res, 404, `Role not found: ${role}`);
        }

        // Get role details for response
        const roleDoc = await Role.findById(roleId).select('name slug description level color');
        if (!roleDoc) {
            return errorResponse(res, 404, `Role not found: ${role}`);
        }

        // Get current permissions for logging
        const oldPermissions = await Permission.find({ role: roleId }).populate('resource', 'name slug');

        // Delete existing permissions for this role
        await Permission.deleteMany({ role: roleId });

        // Create new permissions
        const newPermissions = [];
        for (const perm of permissions) {
            if (!perm.resource || !perm.actions || !Array.isArray(perm.actions)) {
                continue;
            }

            // Get resource ID (supports slug, path, or ObjectId)
            let resourceId = perm.resource;
            if (!mongoose.Types.ObjectId.isValid(perm.resource) || perm.resource.toString().length !== 24) {
                const resourceDoc = await Resource.findOne({ 
                    $or: [
                        { slug: perm.resource },
                        { path: perm.resource }
                    ]
                }).select('_id');
                if (!resourceDoc) {
                    continue; // Skip invalid resources
                }
                resourceId = resourceDoc._id;
            } else {
                resourceId = new mongoose.Types.ObjectId(perm.resource);
            }

            const permission = new Permission({
                role: roleId,
                resource: resourceId,
                actions: perm.actions,
                conditions: perm.conditions || {},
                isActive: true
            });

            await permission.save();
            newPermissions.push(permission);
        }

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'update',
            resource: 'permission',
            changes: {
                before: oldPermissions.map(p => ({
                    resource: p.resource?._id || p.resource,
                    actions: p.actions
                })),
                after: newPermissions.map(p => ({
                    resource: p.resource,
                    actions: p.actions
                }))
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: { role: roleId, roleName: roleDoc.name, roleSlug: roleDoc.slug }
        });

        // Populate resources and role in response
        const populatedPermissions = await Permission.find({
            _id: { $in: newPermissions.map(p => p._id) }
        })
        .populate('resource', 'name slug path icon')
        .populate('role', 'name slug description level color');

        return successResponse(res, 200, 'Role permissions updated successfully', {
            role: roleDoc,
            permissions: populatedPermissions
        });

    } catch (error) {
        console.error('Update role permissions error:', error);
        return errorResponse(res, 500, 'Error updating role permissions', error.message);
    }
};

// Get current user's permissions (effective permissions - merged)
const getMyPermissions = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get user with populated role
        const user = await User.findById(userId).populate('role', 'name slug description level color');
        const userRoleSlug = user?.role?.slug || (typeof req.user.role === 'string' ? req.user.role : null);

        // Use the getUserPermissions helper from rbac.js (returns effective permissions)
        const permissionData = await getUserPermissionsHelper(userId);

        // Format response to match other permission endpoints
        // For super_admin, return a special flag indicating all permissions
        if (permissionData.hasAllPermissions || userRoleSlug === 'super_admin') {
            return successResponse(res, 200, 'Permissions retrieved successfully', {
                role: user?.role || { slug: 'super_admin', name: 'Super Admin' },
                hasAllPermissions: true,
                permissions: [] // Empty array indicates all permissions
            });
        }

        // For other roles, return their actual effective permissions (merged)
        return successResponse(res, 200, 'Permissions retrieved successfully', {
            role: user?.role || permissionData.role,
            hasAllPermissions: false,
            permissions: permissionData.permissions
        });

    } catch (error) {
        console.error('Get my permissions error:', error);
        return errorResponse(res, 500, 'Error fetching user permissions', error.message);
    }
};

// Check if current user has a specific permission (checks merged permissions)
const checkUserPermission = async (req, res) => {
    try {
        const { resource, action } = req.body;

        if (!resource || !action) {
            return errorResponse(res, 400, 'Resource and action are required');
        }

        const userId = req.user._id;
        // Get user with populated role
        const user = await User.findById(userId).populate('role', 'slug name');
        const userRoleSlug = user?.role?.slug || (typeof req.user.role === 'string' ? req.user.role : null);

        // Super admin always has permission
        if (userRoleSlug === 'super_admin') {
            return successResponse(res, 200, 'Permission check successful', {
                hasPermission: true,
                reason: 'Super admin has all permissions'
            });
        }

        // Get resource ID (supports slug, path, or ObjectId)
        let resourceId = resource;
        if (!mongoose.Types.ObjectId.isValid(resource) || resource.toString().length !== 24) {
            const resourceDoc = await Resource.findOne({ 
                $or: [
                    { slug: resource },
                    { path: resource }
                ]
            }).select('_id');
            if (!resourceDoc) {
                return errorResponse(res, 404, `Resource not found: ${resource}`);
            }
            resourceId = resourceDoc._id;
        } else {
            resourceId = new mongoose.Types.ObjectId(resource);
        }

        // Check user permissions (merged: user-specific + role)
        const hasPermission = await Permission.hasUserPermission(userId, resourceId, action);

        return successResponse(res, 200, 'Permission check successful', {
            hasPermission,
            userId: userId.toString(),
            role: userRoleSlug || user?.role?._id?.toString(),
            resource: resourceId,
            action
        });

    } catch (error) {
        console.error('Check user permission error:', error);
        return errorResponse(res, 500, 'Error checking permission', error.message);
    }
};

// Get all available resources and actions (dynamically from Resource model)
const getResourcesAndActions = async (req, res) => {
    try {
        // Get all active resources from Resource model
        const resources = await Resource.find({ isActive: true })
            .select('name slug path icon category')
            .sort({ order: 1, name: 1 });

        // Format resources for response
        const resourcesList = resources.map(resource => ({
            _id: resource._id,
            name: resource.name,
            slug: resource.slug,
            path: resource.path,
            icon: resource.icon,
            category: resource.category
        }));

        const actions = ['create', 'read', 'update', 'delete', 'review', 'approve', 'publish'];

        return successResponse(res, 200, 'Resources and actions retrieved successfully', {
            resources: resourcesList,
            actions
        });

    } catch (error) {
        console.error('Get resources and actions error:', error);
        return errorResponse(res, 500, 'Error fetching resources and actions', error.message);
    }
};

// Get permission matrix (all roles x all resources)
const getPermissionMatrix = async (req, res) => {
    try {
        // Get all active roles dynamically from Role model
        const roles = await Role.find({ isActive: true })
            .select('name slug description level color isSystem')
            .sort({ level: -1, name: 1 });
        
        // Get all role-based permissions (exclude user-specific)
        const allPermissions = await Permission.find({ 
            isActive: true,
            role: { $exists: true },
            userId: { $exists: false }
        })
        .populate('resource', 'name slug path icon')
        .populate('role', 'name slug _id');
        
        // Get all active resources
        const allResources = await Resource.find({ isActive: true })
            .select('name slug path icon category')
            .sort({ order: 1, name: 1 });

        // Build matrix keyed by role slug
        const matrix = {};

        roles.forEach(role => {
            const roleKey = role.slug || role._id.toString();
            matrix[roleKey] = {};
            allResources.forEach(resource => {
                const permission = allPermissions.find(
                    p => p.role && 
                    (p.role._id?.toString() === role._id.toString() || 
                     p.role.toString() === role._id.toString()) &&
                    p.resource && 
                    (p.resource._id?.toString() === resource._id.toString() || 
                     p.resource.toString() === resource._id.toString())
                );
                matrix[roleKey][resource._id.toString()] = permission ? {
                    resource: permission.resource,
                    actions: permission.actions,
                    conditions: permission.conditions
                } : {
                    resource: {
                        _id: resource._id,
                        name: resource.name,
                        slug: resource.slug,
                        path: resource.path,
                        icon: resource.icon
                    },
                    actions: [],
                    conditions: {}
                };
            });
        });

        return successResponse(res, 200, 'Permission matrix retrieved successfully', {
            matrix,
            roles: roles.map(r => ({ _id: r._id, name: r.name, slug: r.slug, description: r.description, level: r.level, color: r.color, isSystem: r.isSystem })),
            resources: allResources
        });

    } catch (error) {
        console.error('Get permission matrix error:', error);
        return errorResponse(res, 500, 'Error fetching permission matrix', error.message);
    }
};

// Create or update a single permission
const upsertPermission = async (req, res) => {
    try {
        const { role, resource, actions, conditions } = req.body;

        if (!role || !resource || !actions) {
            return errorResponse(res, 400, 'Role, resource, and actions are required');
        }

        // Resolve role to ObjectId (supports ObjectId, slug, or name)
        const roleId = await getRoleId(role);
        if (!roleId) {
            return errorResponse(res, 404, `Role not found: ${role}`);
        }

        // Get resource ID (supports slug, path, or ObjectId)
        let resourceId = resource;
        if (!mongoose.Types.ObjectId.isValid(resource) || resource.toString().length !== 24) {
            const resourceDoc = await Resource.findOne({ 
                $or: [
                    { slug: resource },
                    { path: resource }
                ]
            }).select('_id');
            if (!resourceDoc) {
                return errorResponse(res, 404, `Resource not found: ${resource}`);
            }
            resourceId = resourceDoc._id;
        } else {
            resourceId = new mongoose.Types.ObjectId(resource);
        }

        // Check if permission exists
        let permission = await Permission.findOne({ role: roleId, resource: resourceId });

        const action = permission ? 'update' : 'create';
        const oldData = permission ? {
            actions: permission.actions,
            conditions: permission.conditions
        } : null;

        if (permission) {
            // Update existing
            permission.actions = actions;
            permission.conditions = conditions || {};
            permission.isActive = true;
            await permission.save();
        } else {
            // Create new
            permission = new Permission({
                role: roleId,
                resource: resourceId,
                actions,
                conditions: conditions || {},
                isActive: true
            });
            await permission.save();
        }

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action,
            resource: 'permission',
            resourceId: permission._id,
            changes: {
                before: oldData,
                after: {
                    actions: permission.actions,
                    conditions: permission.conditions
                }
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: { role: roleId, resource: resourceId }
        });

        // Populate resource and role in response
        await permission.populate('resource', 'name slug path icon');
        await permission.populate('role', 'name slug description level color');

        return successResponse(res, 200, `Permission ${action}d successfully`, {
            permission
        });

    } catch (error) {
        console.error('Upsert permission error:', error);
        return errorResponse(res, 500, 'Error upserting permission', error.message);
    }
};

// Delete a permission
const deletePermission = async (req, res) => {
    try {
        const { id } = req.params;

        const permission = await Permission.findById(id);

        if (!permission) {
            return res.status(404).json({
                success: false,
                message: 'Permission not found'
            });
        }

        await Permission.findByIdAndDelete(id);

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'delete',
            resource: 'permission',
            resourceId: id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: {
                role: permission.role,
                resource: permission.resource
            }
        });

        res.status(200).json({
            success: true,
            message: 'Permission deleted successfully'
        });

    } catch (error) {
        console.error('Delete permission error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting permission',
            error: error.message
        });
    }
};

// Get permissions for a specific user (effective permissions - merged)
const getUserPermissions = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate user exists and populate role
        const user = await User.findById(userId)
            .select('role firstName lastName email')
            .populate('role', 'name slug description level color');
        if (!user) {
            return errorResponse(res, 404, 'User not found');
        }

        // Get user-specific permissions only (not merged with role)
        // This is what we want to show/edit in the UI
        const userPermissions = await Permission.getUserPermissions(userId);

        // Format permissions as object keyed by resource slug (for frontend compatibility)
        const groupedPermissions = {};
        userPermissions.forEach(permission => {
            // Skip if resource is null/deleted
            if (!permission.resource || !permission.resource.slug) {
                return;
            }
            const resourceKey = permission.resource.slug;
            groupedPermissions[resourceKey] = {
                resource: permission.resource,
                actions: permission.actions,
                conditions: permission.conditions,
                _id: permission._id
            };
        });

        return successResponse(res, 200, 'User permissions retrieved successfully', {
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            },
            permissions: groupedPermissions
        });

    } catch (error) {
        console.error('Get user permissions error:', error);
        return errorResponse(res, 500, 'Error fetching user permissions', error.message);
    }
};

// Update user-specific permission overrides
const updateUserPermissions = async (req, res) => {
    try {
        const { userId } = req.params;
        const { permissions } = req.body; // Array of {resource, actions, conditions}

        if (!permissions || !Array.isArray(permissions)) {
            return errorResponse(res, 400, 'Permissions must be an array');
        }

        // Validate user exists and populate role
        const user = await User.findById(userId)
            .select('role')
            .populate('role', 'slug name');
        if (!user) {
            return errorResponse(res, 404, 'User not found');
        }

        // Prevent modifying super_admin permissions (check by slug)
        const userRoleSlug = user.role?.slug || (typeof user.role === 'string' ? user.role : null);
        if (userRoleSlug === 'super_admin') {
            return errorResponse(res, 403, 'Cannot modify super admin permissions');
        }

        // Get current user-specific permissions for logging
        const oldPermissions = await Permission.getUserPermissions(userId);

        // Delete existing user-specific permissions
        await Permission.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });

        // Create new user-specific permissions
        const newPermissions = [];
        for (const perm of permissions) {
            if (!perm.resource || !perm.actions || !Array.isArray(perm.actions)) {
                continue;
            }

            // Get resource ID (supports slug, path, or ObjectId)
            let resourceId = perm.resource;
            if (!mongoose.Types.ObjectId.isValid(perm.resource) || perm.resource.toString().length !== 24) {
                const resourceDoc = await Resource.findOne({ 
                    $or: [
                        { slug: perm.resource },
                        { path: perm.resource }
                    ]
                }).select('_id');
                if (!resourceDoc) {
                    continue; // Skip invalid resources
                }
                resourceId = resourceDoc._id;
            } else {
                resourceId = new mongoose.Types.ObjectId(perm.resource);
            }

            const permission = new Permission({
                userId: new mongoose.Types.ObjectId(userId),
                resource: resourceId,
                actions: perm.actions,
                conditions: perm.conditions || {},
                isActive: true
            });

            await permission.save();
            newPermissions.push(permission);
        }

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'update',
            resource: 'user_permission',
            resourceId: userId,
            changes: {
                before: oldPermissions.map(p => ({
                    resource: p.resource?._id || p.resource,
                    actions: p.actions
                })),
                after: newPermissions.map(p => ({
                    resource: p.resource,
                    actions: p.actions
                }))
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: { targetUserId: userId }
        });

        // Populate resources in response
        const populatedPermissions = await Permission.find({
            _id: { $in: newPermissions.map(p => p._id) }
        }).populate('resource', 'name slug path icon');

        return successResponse(res, 200, 'User permissions updated successfully', {
            user: {
                _id: user._id,
                role: user.role
            },
            permissions: populatedPermissions
        });

    } catch (error) {
        console.error('Update user permissions error:', error);
        return errorResponse(res, 500, 'Error updating user permissions', error.message);
    }
};

// Get all users in a specific role
const getUsersByRole = async (req, res) => {
    try {
        const { role } = req.params;

        // Resolve role to ObjectId (supports ObjectId, slug, or name)
        const roleId = await getRoleId(role);
        if (!roleId) {
            return errorResponse(res, 404, `Role not found: ${role}`);
        }

        // Get role details for response
        const roleDoc = await Role.findById(roleId).select('name slug description level color isSystem isActive');
        if (!roleDoc) {
            return errorResponse(res, 404, `Role not found: ${role}`);
        }

        const users = await User.find({ role: roleId, isActive: true })
            .select('-password')
            .sort({ firstName: 1, lastName: 1 })
            .populate('role', 'name slug description level color')
            .populate('createdBy', 'firstName lastName email');

        return successResponse(res, 200, 'Users retrieved successfully', {
            role: roleDoc,
            users,
            count: users.length
        });

    } catch (error) {
        console.error('Get users by role error:', error);
        return errorResponse(res, 500, 'Error fetching users by role', error.message);
    }
};

module.exports = {
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
};

