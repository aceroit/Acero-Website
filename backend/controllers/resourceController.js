const Resource = require('../models/Resource');
const Permission = require('../models/Permission');
const ActivityLog = require('../models/ActivityLog');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseFormatter');

/**
 * Get all resources (with filtering and pagination)
 */
exports.getAllResources = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            category,
            isActive,
            showInMenu,
            search,
            sortBy = 'order',
            sortOrder = 'asc'
        } = req.query;

        // Build query
        const query = {};
        
        if (category) query.category = category;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (showInMenu !== undefined) query.showInMenu = showInMenu === 'true';
        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { slug: new RegExp(search, 'i') },
                { path: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') }
            ];
        }

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const [resources, total] = await Promise.all([
            Resource.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('parentId', 'name slug path')
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email'),
            Resource.countDocuments(query)
        ]);

        return paginatedResponse(
            res,
            resources,
            page,
            limit,
            total,
            'Resources retrieved successfully'
        );
    } catch (error) {
        console.error('Error in getAllResources:', error);
        return errorResponse(res, 500, 'Failed to retrieve resources', error.message);
    }
};

/**
 * Get resource by ID
 */
exports.getResourceById = async (req, res) => {
    try {
        const { id } = req.params;

        const resource = await Resource.findById(id)
            .populate('parentId', 'name slug path icon')
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        if (!resource) {
            return errorResponse(res, 404, 'Resource not found');
        }

        // Get children if any
        const children = await resource.getChildren();

        return successResponse(res, 200, 'Resource retrieved successfully', {
            resource,
            children
        });
    } catch (error) {
        console.error('Error in getResourceById:', error);
        return errorResponse(res, 500, 'Failed to retrieve resource', error.message);
    }
};

/**
 * Get resource by slug
 */
exports.getResourceBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const resource = await Resource.findOne({ slug })
            .populate('parentId', 'name slug path icon')
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        if (!resource) {
            return errorResponse(res, 404, 'Resource not found');
        }

        // Get children if any
        const children = await resource.getChildren();

        return successResponse(res, 200, 'Resource retrieved successfully', {
            resource,
            children
        });
    } catch (error) {
        console.error('Error in getResourceBySlug:', error);
        return errorResponse(res, 500, 'Failed to retrieve resource', error.message);
    }
};

/**
 * Get resource tree (hierarchical structure)
 */
exports.getResourceTree = async (req, res) => {
    try {
        const { includeInactive = false } = req.query;

        const tree = await Resource.getResourceTree(includeInactive === 'true');

        return successResponse(res, 200, 'Resource tree retrieved successfully', {
            tree
        });
    } catch (error) {
        console.error('Error in getResourceTree:', error);
        return errorResponse(res, 500, 'Failed to retrieve resource tree', error.message);
    }
};

/**
 * Get resources for menu (active, showInMenu: true, ordered)
 */
exports.getMenuResources = async (req, res) => {
    try {
        const resources = await Resource.getMenuResources();

        return successResponse(res, 200, 'Menu resources retrieved successfully', {
            resources
        });
    } catch (error) {
        console.error('Error in getMenuResources:', error);
        return errorResponse(res, 500, 'Failed to retrieve menu resources', error.message);
    }
};

/**
 * Get resources by category
 */
exports.getResourcesByCategory = async (req, res) => {
    try {
        const { includeInactive = false } = req.query;

        const grouped = await Resource.getByCategory(includeInactive === 'true');

        return successResponse(res, 200, 'Resources by category retrieved successfully', {
            resources: grouped
        });
    } catch (error) {
        console.error('Error in getResourcesByCategory:', error);
        return errorResponse(res, 500, 'Failed to retrieve resources by category', error.message);
    }
};

/**
 * Create new resource (super_admin only)
 */
exports.createResource = async (req, res) => {
    try {
        const {
            name,
            slug,
            path,
            parentId,
            icon,
            description,
            category,
            showInMenu,
            order,
            metadata
        } = req.body;

        // Validate required fields
        if (!name || !slug || !path) {
            return errorResponse(res, 400, 'Name, slug, and path are required');
        }

        // Check slug uniqueness
        const existing = await Resource.findOne({ slug });
        if (existing) {
            return errorResponse(res, 400, 'Resource with this slug already exists');
        }

        // Validate parent if provided
        if (parentId) {
            const parent = await Resource.findById(parentId);
            if (!parent) {
                return errorResponse(res, 400, 'Parent resource not found');
            }
        }

        // Create resource
        const resource = new Resource({
            name,
            slug,
            path,
            parentId: parentId || null,
            icon: icon || 'FileTextOutlined',
            description: description || '',
            category: category || 'General',
            showInMenu: showInMenu !== undefined ? showInMenu : true,
            order: order !== undefined ? order : 0,
            metadata: metadata || {},
            createdBy: req.user._id
        });

        await resource.save();

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'create',
            resource: 'resource',
            resourceId: resource._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: { resourceName: resource.name, resourceSlug: resource.slug }
        });

        return successResponse(
            res,
            201,
            'Resource created successfully',
            { resource }
        );
    } catch (error) {
        console.error('Error in createResource:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation failed', error.message);
        }
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return errorResponse(res, 400, 'Resource with this slug already exists');
        }
        
        return errorResponse(res, 500, 'Failed to create resource', error.message);
    }
};

/**
 * Update resource (super_admin only)
 */
exports.updateResource = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            slug,
            path,
            parentId,
            icon,
            description,
            category,
            showInMenu,
            order,
            isActive,
            metadata
        } = req.body;

        const resource = await Resource.findById(id);
        if (!resource) {
            return errorResponse(res, 404, 'Resource not found');
        }

        // Validate parent if provided and different
        if (parentId && parentId.toString() !== resource.parentId?.toString()) {
            if (parentId.toString() === resource._id.toString()) {
                return errorResponse(res, 400, 'Resource cannot be its own parent');
            }
            
            const parent = await Resource.findById(parentId);
            if (!parent) {
                return errorResponse(res, 400, 'Parent resource not found');
            }
        }

        // Update fields
        if (name !== undefined) resource.name = name;
        if (slug !== undefined) resource.slug = slug;
        if (path !== undefined) resource.path = path;
        if (parentId !== undefined) resource.parentId = parentId || null;
        if (icon !== undefined) resource.icon = icon;
        if (description !== undefined) resource.description = description;
        if (category !== undefined) resource.category = category;
        if (showInMenu !== undefined) resource.showInMenu = showInMenu;
        if (order !== undefined) resource.order = order;
        if (isActive !== undefined) resource.isActive = isActive;
        if (metadata !== undefined) resource.metadata = metadata;
        
        resource.updatedBy = req.user._id;

        await resource.save();

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'update',
            resource: 'resource',
            resourceId: resource._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: { resourceName: resource.name, resourceSlug: resource.slug }
        });

        return successResponse(res, 200, 'Resource updated successfully', { resource });
    } catch (error) {
        console.error('Error in updateResource:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation failed', error.message);
        }
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return errorResponse(res, 400, 'Resource with this slug already exists');
        }
        
        return errorResponse(res, 500, 'Failed to update resource', error.message);
    }
};

/**
 * Delete resource (super_admin only) - Soft delete
 */
exports.deleteResource = async (req, res) => {
    try {
        const { id } = req.params;
        const { force = false } = req.query;

        const resource = await Resource.findById(id);
        if (!resource) {
            return errorResponse(res, 404, 'Resource not found');
        }

        // Check if resource is used in permissions
        const permissionCount = await Permission.countDocuments({
            resource: resource._id,
            isActive: true
        });

        if (permissionCount > 0 && !force) {
            return errorResponse(
                res,
                400,
                `Resource is used in ${permissionCount} permission(s). Set force=true to deactivate anyway`
            );
        }

        // Check if resource has children
        const childrenCount = await Resource.countDocuments({
            parentId: resource._id,
            isActive: true
        });

        if (childrenCount > 0 && !force) {
            return errorResponse(
                res,
                400,
                `Resource has ${childrenCount} child resource(s). Set force=true to deactivate anyway`
            );
        }

        // Soft delete (deactivate)
        resource.isActive = false;
        resource.updatedBy = req.user._id;
        await resource.save();

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'delete',
            resource: 'resource',
            resourceId: resource._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: { resourceName: resource.name, resourceSlug: resource.slug }
        });

        return successResponse(
            res,
            200,
            'Resource deactivated successfully',
            {
                resource,
                usage: {
                    permissions: permissionCount,
                    children: childrenCount
                }
            }
        );
    } catch (error) {
        console.error('Error in deleteResource:', error);
        return errorResponse(res, 500, 'Failed to delete resource', error.message);
    }
};

/**
 * Get resource usage statistics
 */
exports.getResourceUsage = async (req, res) => {
    try {
        const { id } = req.params;

        const resource = await Resource.findById(id);
        if (!resource) {
            return errorResponse(res, 404, 'Resource not found');
        }

        // Get usage statistics
        const [permissionCount, childrenCount] = await Promise.all([
            Permission.countDocuments({ resource: resource._id, isActive: true }),
            Resource.countDocuments({ parentId: resource._id, isActive: true })
        ]);

        // Get sample permissions using this resource
        const samplePermissions = await Permission.find({ resource: resource._id, isActive: true })
            .limit(5)
            .populate('role')
            .populate('userId', 'firstName lastName email')
            .select('role userId actions isActive')
            .sort({ createdAt: -1 });

        return successResponse(res, 200, 'Resource usage retrieved successfully', {
            resource: {
                name: resource.name,
                slug: resource.slug,
                path: resource.path
            },
            usage: {
                permissions: permissionCount,
                children: childrenCount
            },
            samplePermissions
        });
    } catch (error) {
        console.error('Error in getResourceUsage:', error);
        return errorResponse(res, 500, 'Failed to retrieve resource usage', error.message);
    }
};

