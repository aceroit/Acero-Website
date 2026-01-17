const BuildingType = require('../models/BuildingType');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { canEditContent, canDeleteContent } = require('../utils/workflowStatusValidator');

/**
 * Get all building types (with filters and pagination)
 */
exports.getAllBuildingTypes = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            featured,
            search,
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        // Build query
        const query = { isActive: true };
        
        if (status) query.status = status;
        if (featured !== undefined) query.featured = featured === 'true';
        if (search) {
            query.name = new RegExp(search, 'i');
        }

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        if (sortBy !== 'name') {
            sortOptions.name = 1;
        }

        const [buildingTypes, total] = await Promise.all([
            BuildingType.find(query)
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            BuildingType.countDocuments(query)
        ]);

        return successResponse(res, 200, 'Building types retrieved successfully', {
            buildingTypes,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getAllBuildingTypes:', error);
        return errorResponse(res, 500, 'Failed to retrieve building types', error.message);
    }
};

/**
 * Get single building type by ID
 */
exports.getBuildingTypeById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const buildingType = await BuildingType.findOne({ _id: id, isActive: true })
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');
        
        if (!buildingType) {
            return errorResponse(res, 404, 'Building type not found');
        }

        return successResponse(res, 200, 'Building type retrieved successfully', { buildingType });
    } catch (error) {
        console.error('Error in getBuildingTypeById:', error);
        return errorResponse(res, 500, 'Failed to retrieve building type', error.message);
    }
};

/**
 * Create new building type
 */
exports.createBuildingType = async (req, res) => {
    try {
        const buildingTypeData = {
            ...req.body,
            createdBy: req.user._id
        };

        const buildingType = new BuildingType(buildingTypeData);
        await buildingType.save();

        const populatedBuildingType = await BuildingType.findById(buildingType._id)
            .populate('createdBy', 'firstName lastName email');

        return successResponse(
            res,
            201,
            'Building type created successfully',
            { buildingType: populatedBuildingType }
        );
    } catch (error) {
        console.error('Error in createBuildingType:', error);
        if (error.code === 11000) {
            return errorResponse(res, 400, 'Building type with this name already exists');
        }
        return errorResponse(res, 500, 'Failed to create building type', error.message);
    }
};

/**
 * Update building type
 */
exports.updateBuildingType = async (req, res) => {
    try {
        const { id } = req.params;
        
        const buildingType = await BuildingType.findById(id);
        
        if (!buildingType) {
            return errorResponse(res, 404, 'Building type not found');
        }

        if (!buildingType.isActive) {
            return errorResponse(res, 404, 'Building type not found');
        }

        // Check if user can edit based on workflow status
        const editValidation = await canEditContent(req.user, buildingType, 'building-types', 'update');
        if (!editValidation.canEdit) {
            return errorResponse(res, 403, editValidation.reason || 'You do not have permission to edit this building type');
        }

        // Update fields
        Object.assign(buildingType, req.body);
        buildingType.updatedBy = req.user._id;
        await buildingType.save();

        const updatedBuildingType = await BuildingType.findById(buildingType._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        return successResponse(
            res,
            200,
            'Building type updated successfully',
            { buildingType: updatedBuildingType }
        );
    } catch (error) {
        console.error('Error in updateBuildingType:', error);
        if (error.code === 11000) {
            return errorResponse(res, 400, 'Building type with this name already exists');
        }
        return errorResponse(res, 500, 'Failed to update building type', error.message);
    }
};

/**
 * Delete building type (soft delete)
 */
exports.deleteBuildingType = async (req, res) => {
    try {
        const { id } = req.params;
        
        const buildingType = await BuildingType.findById(id);
        
        if (!buildingType) {
            return errorResponse(res, 404, 'Building type not found');
        }

        if (!buildingType.isActive) {
            return errorResponse(res, 404, 'Building type not found');
        }

        // Check if user can delete based on workflow status
        const deleteValidation = await canDeleteContent(req.user, buildingType, 'building-types');
        if (!deleteValidation.canDelete) {
            return errorResponse(res, 403, deleteValidation.reason || 'You do not have permission to delete this building type');
        }

        // Soft delete
        buildingType.isActive = false;
        buildingType.updatedBy = req.user._id;
        await buildingType.save();

        return successResponse(res, 200, 'Building type deleted successfully');
    } catch (error) {
        console.error('Error in deleteBuildingType:', error);
        return errorResponse(res, 500, 'Failed to delete building type', error.message);
    }
};

