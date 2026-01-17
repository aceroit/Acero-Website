const Region = require('../models/Region');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { canEditContent, canDeleteContent } = require('../utils/workflowStatusValidator');

/**
 * Get all regions (with filters and pagination)
 */
exports.getAllRegions = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            featured,
            country,
            search,
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        // Build query
        const query = { isActive: true };
        
        if (status) query.status = status;
        if (featured !== undefined) query.featured = featured === 'true';
        if (country) query.country = country;
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

        const [regions, total] = await Promise.all([
            Region.find(query)
                .populate('country', 'name code')
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Region.countDocuments(query)
        ]);

        return successResponse(res, 200, 'Regions retrieved successfully', {
            regions,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getAllRegions:', error);
        return errorResponse(res, 500, 'Failed to retrieve regions', error.message);
    }
};

/**
 * Get single region by ID
 */
exports.getRegionById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const region = await Region.findOne({ _id: id, isActive: true })
            .populate('country', 'name code')
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');
        
        if (!region) {
            return errorResponse(res, 404, 'Region not found');
        }

        return successResponse(res, 200, 'Region retrieved successfully', { region });
    } catch (error) {
        console.error('Error in getRegionById:', error);
        return errorResponse(res, 500, 'Failed to retrieve region', error.message);
    }
};

/**
 * Create new region
 */
exports.createRegion = async (req, res) => {
    try {
        const regionData = {
            ...req.body,
            code: req.body.code?.toUpperCase(),
            createdBy: req.user._id
        };

        const region = new Region(regionData);
        await region.save();

        const populatedRegion = await Region.findById(region._id)
            .populate('country', 'name code')
            .populate('createdBy', 'firstName lastName email');

        return successResponse(
            res,
            201,
            'Region created successfully',
            { region: populatedRegion }
        );
    } catch (error) {
        console.error('Error in createRegion:', error);
        if (error.code === 11000) {
            return errorResponse(res, 400, 'Region with this code already exists in this country');
        }
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to create region', error.message);
    }
};

/**
 * Update region
 */
exports.updateRegion = async (req, res) => {
    try {
        const { id } = req.params;
        
        const region = await Region.findById(id);
        
        if (!region) {
            return errorResponse(res, 404, 'Region not found');
        }

        if (!region.isActive) {
            return errorResponse(res, 404, 'Region not found');
        }

        // Check if user can edit based on workflow status
        const editValidation = await canEditContent(req.user, region, 'regions', 'update');
        if (!editValidation.canEdit) {
            return errorResponse(res, 403, editValidation.reason || 'You do not have permission to edit this region');
        }

        // Update fields
        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined && key !== '_id' && key !== 'createdBy') {
                if (key === 'code') {
                    region[key] = req.body[key].toUpperCase();
                } else {
                    region[key] = req.body[key];
                }
            }
        });
        region.updatedBy = req.user._id;
        await region.save();

        const updatedRegion = await Region.findById(region._id)
            .populate('country', 'name code')
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        return successResponse(
            res,
            200,
            'Region updated successfully',
            { region: updatedRegion }
        );
    } catch (error) {
        console.error('Error in updateRegion:', error);
        if (error.code === 11000) {
            return errorResponse(res, 400, 'Region with this code already exists in this country');
        }
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to update region', error.message);
    }
};

/**
 * Delete region (soft delete)
 */
exports.deleteRegion = async (req, res) => {
    try {
        const { id } = req.params;
        
        const region = await Region.findById(id);
        
        if (!region) {
            return errorResponse(res, 404, 'Region not found');
        }

        if (!region.isActive) {
            return errorResponse(res, 404, 'Region not found');
        }

        // Check if user can delete based on workflow status
        const deleteValidation = await canDeleteContent(req.user, region, 'regions');
        if (!deleteValidation.canDelete) {
            return errorResponse(res, 403, deleteValidation.reason || 'You do not have permission to delete this region');
        }

        // Soft delete
        region.isActive = false;
        region.updatedBy = req.user._id;
        await region.save();

        return successResponse(res, 200, 'Region deleted successfully');
    } catch (error) {
        console.error('Error in deleteRegion:', error);
        return errorResponse(res, 500, 'Failed to delete region', error.message);
    }
};

