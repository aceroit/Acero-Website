const Area = require('../models/Area');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { canEditContent, canDeleteContent } = require('../utils/workflowStatusValidator');

/**
 * Get all areas (with filters and pagination)
 */
exports.getAllAreas = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            featured,
            region,
            country,
            search,
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        // Build query
        const query = { isActive: true };
        
        if (status) query.status = status;
        if (featured !== undefined) query.featured = featured === 'true';
        if (region) query.region = region;
        if (country) {
            // If country is provided, we need to find regions first
            const Region = require('../models/Region');
            const regions = await Region.find({ country, isActive: true }).select('_id');
            const regionIds = regions.map(r => r._id);
            query.region = { $in: regionIds };
        }
        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { code: new RegExp(search, 'i') }
            ];
        }

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        if (sortBy !== 'name') {
            sortOptions.name = 1;
        }

        const [areas, total] = await Promise.all([
            Area.find(query)
                .populate({
                    path: 'region',
                    select: 'name code',
                    populate: {
                        path: 'country',
                        select: 'name code'
                    }
                })
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Area.countDocuments(query)
        ]);

        return successResponse(res, 200, 'Areas retrieved successfully', {
            areas,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getAllAreas:', error);
        return errorResponse(res, 500, 'Failed to retrieve areas', error.message);
    }
};

/**
 * Get single area by ID
 */
exports.getAreaById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const area = await Area.findOne({ _id: id, isActive: true })
            .populate({
                path: 'region',
                select: 'name code',
                populate: {
                    path: 'country',
                    select: 'name code'
                }
            })
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');
        
        if (!area) {
            return errorResponse(res, 404, 'Area not found');
        }

        return successResponse(res, 200, 'Area retrieved successfully', { area });
    } catch (error) {
        console.error('Error in getAreaById:', error);
        return errorResponse(res, 500, 'Failed to retrieve area', error.message);
    }
};

/**
 * Create new area
 */
exports.createArea = async (req, res) => {
    try {
        const areaData = {
            ...req.body,
            code: req.body.code?.toUpperCase(),
            createdBy: req.user._id
        };

        const area = new Area(areaData);
        await area.save();

        const populatedArea = await Area.findById(area._id)
            .populate({
                path: 'region',
                select: 'name code',
                populate: {
                    path: 'country',
                    select: 'name code'
                }
            })
            .populate('createdBy', 'firstName lastName email');

        return successResponse(
            res,
            201,
            'Area created successfully',
            { area: populatedArea }
        );
    } catch (error) {
        console.error('Error in createArea:', error);
        if (error.code === 11000) {
            return errorResponse(res, 400, 'Area with this code already exists in this region');
        }
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to create area', error.message);
    }
};

/**
 * Update area
 */
exports.updateArea = async (req, res) => {
    try {
        const { id } = req.params;
        
        const area = await Area.findById(id);
        
        if (!area) {
            return errorResponse(res, 404, 'Area not found');
        }

        if (!area.isActive) {
            return errorResponse(res, 404, 'Area not found');
        }

        // Check if user can edit based on workflow status
        const editValidation = await canEditContent(req.user, area, 'areas', 'update');
        if (!editValidation.canEdit) {
            return errorResponse(res, 403, editValidation.reason || 'You do not have permission to edit this area');
        }

        // Update fields
        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined && key !== '_id' && key !== 'createdBy') {
                if (key === 'code') {
                    area[key] = req.body[key].toUpperCase();
                } else {
                    area[key] = req.body[key];
                }
            }
        });
        area.updatedBy = req.user._id;
        await area.save();

        const updatedArea = await Area.findById(area._id)
            .populate({
                path: 'region',
                select: 'name code',
                populate: {
                    path: 'country',
                    select: 'name code'
                }
            })
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        return successResponse(
            res,
            200,
            'Area updated successfully',
            { area: updatedArea }
        );
    } catch (error) {
        console.error('Error in updateArea:', error);
        if (error.code === 11000) {
            return errorResponse(res, 400, 'Area with this code already exists in this region');
        }
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to update area', error.message);
    }
};

/**
 * Delete area (soft delete)
 */
exports.deleteArea = async (req, res) => {
    try {
        const { id } = req.params;
        
        const area = await Area.findById(id);
        
        if (!area) {
            return errorResponse(res, 404, 'Area not found');
        }

        if (!area.isActive) {
            return errorResponse(res, 404, 'Area not found');
        }

        // Check if user can delete based on workflow status
        const deleteValidation = await canDeleteContent(req.user, area, 'areas');
        if (!deleteValidation.canDelete) {
            return errorResponse(res, 403, deleteValidation.reason || 'You do not have permission to delete this area');
        }

        // Soft delete
        area.isActive = false;
        area.updatedBy = req.user._id;
        await area.save();

        return successResponse(res, 200, 'Area deleted successfully');
    } catch (error) {
        console.error('Error in deleteArea:', error);
        return errorResponse(res, 500, 'Failed to delete area', error.message);
    }
};

