const Permission = require('../models/Permission');
const ActivityLog = require('../models/ActivityLog');

// Get all permissions
const getAllPermissions = async (req, res) => {
    try {
        const { role, resource, isActive } = req.query;

        // Build query
        const query = {};

        if (role) {
            query.role = role;
        }

        if (resource) {
            query.resource = resource;
        }

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const permissions = await Permission.find(query).sort({ role: 1, resource: 1 });

        res.status(200).json({
            success: true,
            data: {
                permissions
            }
        });

    } catch (error) {
        console.error('Get all permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching permissions',
            error: error.message
        });
    }
};

// Get permissions for a specific role
const getRolePermissions = async (req, res) => {
    try {
        const { role } = req.params;

        const validRoles = ['super_admin', 'admin', 'approver', 'reviewer', 'editor', 'viewer'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role',
                validRoles
            });
        }

        const permissions = await Permission.find({ role, isActive: true }).sort({ resource: 1 });

        // Group by resource for easier consumption
        const groupedPermissions = {};
        permissions.forEach(permission => {
            groupedPermissions[permission.resource] = {
                actions: permission.actions,
                conditions: permission.conditions,
                _id: permission._id
            };
        });

        res.status(200).json({
            success: true,
            data: {
                role,
                permissions: groupedPermissions,
                raw: permissions
            }
        });

    } catch (error) {
        console.error('Get role permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching role permissions',
            error: error.message
        });
    }
};

// Update permissions for a role
const updateRolePermissions = async (req, res) => {
    try {
        const { role } = req.params;
        const { permissions } = req.body; // Array of {resource, actions, conditions}

        if (!permissions || !Array.isArray(permissions)) {
            return res.status(400).json({
                success: false,
                message: 'Permissions must be an array'
            });
        }

        const validRoles = ['super_admin', 'admin', 'approver', 'reviewer', 'editor', 'viewer'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role',
                validRoles
            });
        }

        // Get current permissions for logging
        const oldPermissions = await Permission.find({ role });

        // Delete existing permissions for this role
        await Permission.deleteMany({ role });

        // Create new permissions
        const newPermissions = [];
        for (const perm of permissions) {
            if (!perm.resource || !perm.actions) {
                continue;
            }

            const permission = new Permission({
                role,
                resource: perm.resource,
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
                    resource: p.resource,
                    actions: p.actions
                })),
                after: newPermissions.map(p => ({
                    resource: p.resource,
                    actions: p.actions
                }))
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: { role }
        });

        res.status(200).json({
            success: true,
            message: 'Role permissions updated successfully',
            data: {
                role,
                permissions: newPermissions
            }
        });

    } catch (error) {
        console.error('Update role permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating role permissions',
            error: error.message
        });
    }
};

// Check if current user has a specific permission
const checkUserPermission = async (req, res) => {
    try {
        const { resource, action } = req.body;

        if (!resource || !action) {
            return res.status(400).json({
                success: false,
                message: 'Resource and action are required'
            });
        }

        const userRole = req.user.role;

        // Super admin always has permission
        if (userRole === 'super_admin') {
            return res.status(200).json({
                success: true,
                data: {
                    hasPermission: true,
                    reason: 'Super admin has all permissions'
                }
            });
        }

        const hasPermission = await Permission.hasPermission(userRole, resource, action);

        res.status(200).json({
            success: true,
            data: {
                hasPermission,
                role: userRole,
                resource,
                action
            }
        });

    } catch (error) {
        console.error('Check user permission error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking permission',
            error: error.message
        });
    }
};

// Get all available resources and actions
const getResourcesAndActions = async (req, res) => {
    try {
        const resources = [
            'users',
            'permissions',
            'pages',
            'sections',
            'section_types',
            'products',
            'projects',
            'media',
            'activity_logs'
        ];

        const actions = ['create', 'read', 'update', 'delete', 'approve', 'publish'];

        res.status(200).json({
            success: true,
            data: {
                resources,
                actions
            }
        });

    } catch (error) {
        console.error('Get resources and actions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching resources and actions',
            error: error.message
        });
    }
};

// Get permission matrix (all roles x all resources)
const getPermissionMatrix = async (req, res) => {
    try {
        const allPermissions = await Permission.find({ isActive: true });

        const roles = ['super_admin', 'admin', 'approver', 'reviewer', 'editor', 'viewer'];
        const resources = [...new Set(allPermissions.map(p => p.resource))];

        // Build matrix
        const matrix = {};

        roles.forEach(role => {
            matrix[role] = {};
            resources.forEach(resource => {
                const permission = allPermissions.find(
                    p => p.role === role && p.resource === resource
                );
                matrix[role][resource] = permission ? {
                    actions: permission.actions,
                    conditions: permission.conditions
                } : {
                    actions: [],
                    conditions: {}
                };
            });
        });

        res.status(200).json({
            success: true,
            data: {
                matrix,
                roles,
                resources
            }
        });

    } catch (error) {
        console.error('Get permission matrix error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching permission matrix',
            error: error.message
        });
    }
};

// Create or update a single permission
const upsertPermission = async (req, res) => {
    try {
        const { role, resource, actions, conditions } = req.body;

        if (!role || !resource || !actions) {
            return res.status(400).json({
                success: false,
                message: 'Role, resource, and actions are required'
            });
        }

        const validRoles = ['super_admin', 'admin', 'approver', 'reviewer', 'editor', 'viewer'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role',
                validRoles
            });
        }

        // Check if permission exists
        let permission = await Permission.findOne({ role, resource });

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
                role,
                resource,
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
            metadata: { role, resource }
        });

        res.status(200).json({
            success: true,
            message: `Permission ${action}d successfully`,
            data: {
                permission
            }
        });

    } catch (error) {
        console.error('Upsert permission error:', error);
        res.status(500).json({
            success: false,
            message: 'Error upserting permission',
            error: error.message
        });
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

module.exports = {
    getAllPermissions,
    getRolePermissions,
    updateRolePermissions,
    checkUserPermission,
    getResourcesAndActions,
    getPermissionMatrix,
    upsertPermission,
    deletePermission
};

