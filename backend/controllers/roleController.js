const Role = require('../models/Role');
const User = require('../models/User');
const Permission = require('../models/Permission');
const ActivityLog = require('../models/ActivityLog');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseFormatter');

/**
 * Get all roles (with filtering and pagination)
 */
exports.getAllRoles = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            isActive,
            isSystem,
            search,
            sortBy = 'level',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = {};
        
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (isSystem !== undefined) query.isSystem = isSystem === 'true';
        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { slug: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') }
            ];
        }

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        // Secondary sort by name for consistent ordering
        if (sortBy !== 'name') {
            sortOptions.name = 1;
        }

        const [roles, total] = await Promise.all([
            Role.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email'),
            Role.countDocuments(query)
        ]);

        return paginatedResponse(
            res,
            roles,
            page,
            limit,
            total,
            'Roles retrieved successfully'
        );
    } catch (error) {
        console.error('Error in getAllRoles:', error);
        return errorResponse(res, 500, 'Failed to retrieve roles', error.message);
    }
};

/**
 * Get role by ID
 */
exports.getRoleById = async (req, res) => {
    try {
        const { id } = req.params;

        const role = await Role.findById(id)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        if (!role) {
            return errorResponse(res, 404, 'Role not found');
        }

        return successResponse(res, 200, 'Role retrieved successfully', {
            role
        });
    } catch (error) {
        console.error('Error in getRoleById:', error);
        return errorResponse(res, 500, 'Failed to retrieve role', error.message);
    }
};

/**
 * Get role by slug
 */
exports.getRoleBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const role = await Role.getRoleBySlug(slug);
        
        if (!role) {
            return errorResponse(res, 404, 'Role not found');
        }

        // Populate after finding
        await role.populate('createdBy', 'firstName lastName email');
        await role.populate('updatedBy', 'firstName lastName email');

        return successResponse(res, 200, 'Role retrieved successfully', {
            role
        });
    } catch (error) {
        console.error('Error in getRoleBySlug:', error);
        return errorResponse(res, 500, 'Failed to retrieve role', error.message);
    }
};

/**
 * Create new role (super_admin only)
 */
exports.createRole = async (req, res) => {
    try {
        const {
            name,
            slug,
            description,
            level,
            color,
            isActive,
            metadata
        } = req.body;

        // Validate required fields
        if (!name) {
            return errorResponse(res, 400, 'Role name is required');
        }

        // Check if role with same name or slug already exists
        const existing = await Role.findOne({
            $or: [
                { name: name.trim() },
                { slug: slug || name.toLowerCase().trim().replace(/\s+/g, '_') }
            ]
        });
        if (existing) {
            return errorResponse(res, 400, 'Role with this name or slug already exists');
        }

        // Create role
        const role = new Role({
            name: name.trim(),
            slug: slug || undefined, // Will be auto-generated if not provided
            description: description || '',
            level: level !== undefined ? parseInt(level) : 0,
            color: color || 'default',
            isActive: isActive !== undefined ? isActive : true,
            metadata: metadata || {},
            createdBy: req.user._id
        });

        await role.save();

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'create',
            resource: 'role',
            resourceId: role._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: { roleName: role.name, roleSlug: role.slug }
        });

        return successResponse(
            res,
            201,
            'Role created successfully',
            { role }
        );
    } catch (error) {
        console.error('Error in createRole:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation failed', error.message);
        }
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return errorResponse(res, 400, 'Role with this name or slug already exists');
        }
        
        return errorResponse(res, 500, 'Failed to create role', error.message);
    }
};

/**
 * Update role (super_admin only)
 */
exports.updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            slug,
            description,
            level,
            color,
            isActive,
            metadata
        } = req.body;

        const role = await Role.findById(id);
        if (!role) {
            return errorResponse(res, 404, 'Role not found');
        }

        // Prevent changing slug for system roles
        if (role.isSystem && slug && slug !== role.slug) {
            return errorResponse(res, 400, 'Cannot change slug for system roles');
        }

        // Check if new name or slug conflicts with existing role
        if (name && name.trim() !== role.name) {
            const existing = await Role.findOne({
                name: name.trim(),
                _id: { $ne: id }
            });
            if (existing) {
                return errorResponse(res, 400, 'Role with this name already exists');
            }
        }

        if (slug && slug !== role.slug && !role.isSystem) {
            const existing = await Role.findOne({
                slug: slug.toLowerCase().trim(),
                _id: { $ne: id }
            });
            if (existing) {
                return errorResponse(res, 400, 'Role with this slug already exists');
            }
        }

        // Update fields
        if (name !== undefined) role.name = name.trim();
        if (slug !== undefined && !role.isSystem) role.slug = slug.toLowerCase().trim();
        if (description !== undefined) role.description = description;
        if (level !== undefined) role.level = parseInt(level);
        if (color !== undefined) role.color = color;
        if (isActive !== undefined) role.isActive = isActive;
        if (metadata !== undefined) role.metadata = metadata;
        role.updatedBy = req.user._id;

        await role.save();

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'update',
            resource: 'role',
            resourceId: role._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: { roleName: role.name, roleSlug: role.slug }
        });

        return successResponse(
            res,
            200,
            'Role updated successfully',
            { role }
        );
    } catch (error) {
        console.error('Error in updateRole:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation failed', error.message);
        }
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return errorResponse(res, 400, 'Role with this name or slug already exists');
        }
        
        return errorResponse(res, 500, 'Failed to update role', error.message);
    }
};

/**
 * Delete role (super_admin only)
 * Soft delete (set isActive=false) or hard delete if no users/permissions reference it
 */
exports.deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { hardDelete = false } = req.query; // Optional query param for hard delete

        const role = await Role.findById(id);
        if (!role) {
            return errorResponse(res, 404, 'Role not found');
        }

        // Prevent deleting system roles
        if (role.isSystem) {
            return errorResponse(res, 400, 'Cannot delete system roles');
        }

        // Check if role is being used
        const [userCount, permissionCount] = await Promise.all([
            User.countDocuments({ role: id }),
            Permission.countDocuments({ role: id })
        ]);

        if (userCount > 0 || permissionCount > 0) {
            if (hardDelete === 'true') {
                return errorResponse(
                    res,
                    400,
                    'Cannot delete role that is in use',
                    {
                        userCount,
                        permissionCount,
                        message: `This role is assigned to ${userCount} user(s) and has ${permissionCount} permission(s). Please reassign users and remove permissions before deleting.`
                    }
                );
            } else {
                // Soft delete: set isActive to false
                role.isActive = false;
                role.updatedBy = req.user._id;
                await role.save();

                // Log activity
                await ActivityLog.logActivity({
                    userId: req.user._id,
                    action: 'update',
                    resource: 'role',
                    resourceId: role._id,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                    metadata: { action: 'soft_delete', roleName: role.name }
                });

                return successResponse(
                    res,
                    200,
                    'Role deactivated successfully (role is in use)',
                    {
                        role,
                        usage: {
                            userCount,
                            permissionCount
                        }
                    }
                );
            }
        }

        // Hard delete if not in use
        const roleName = role.name;
        const roleSlug = role.slug;

        await Role.findByIdAndDelete(id);

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'delete',
            resource: 'role',
            resourceId: id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: { roleName, roleSlug }
        });

        return successResponse(
            res,
            200,
            'Role deleted successfully',
            { deletedRole: { name: roleName, slug: roleSlug } }
        );
    } catch (error) {
        console.error('Error in deleteRole:', error);
        return errorResponse(res, 500, 'Failed to delete role', error.message);
    }
};

/**
 * Get role usage statistics
 */
exports.getRoleUsage = async (req, res) => {
    try {
        const { id } = req.params;

        const role = await Role.findById(id);
        if (!role) {
            return errorResponse(res, 404, 'Role not found');
        }

        // Count users and permissions using this role
        const [userCount, permissionCount, users, permissions] = await Promise.all([
            User.countDocuments({ role: id }),
            Permission.countDocuments({ role: id }),
            User.find({ role: id })
                .select('firstName lastName email isActive')
                .limit(10), // Limit to 10 for preview
            Permission.find({ role: id })
                .populate('resource', 'name slug')
                .select('resource actions isActive')
                .limit(10) // Limit to 10 for preview
        ]);

        return successResponse(
            res,
            200,
            'Role usage retrieved successfully',
            {
                role: {
                    _id: role._id,
                    name: role.name,
                    slug: role.slug,
                    isSystem: role.isSystem,
                    isActive: role.isActive
                },
                usage: {
                    userCount,
                    permissionCount,
                    users: users, // Preview of users
                    permissions: permissions // Preview of permissions
                }
            }
        );
    } catch (error) {
        console.error('Error in getRoleUsage:', error);
        return errorResponse(res, 500, 'Failed to retrieve role usage', error.message);
    }
};

