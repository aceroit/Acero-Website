const Brochure = require('../models/Brochure');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { canEditContent, canDeleteContent } = require('../utils/workflowStatusValidator');

/**
 * Get all brochures (with filters and pagination)
 */
exports.getAllBrochures = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            featured,
            search,
            sortBy = 'order',
            sortOrder = 'asc'
        } = req.query;

        // Build query
        const query = { isActive: true };
        
        if (status) query.status = status;
        if (featured !== undefined) query.featured = featured === 'true';
        if (search) {
            query.$or = [
                { title: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') }
            ];
        }

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        // Secondary sort by title if not already sorting by it
        if (sortBy !== 'title') {
            sortOptions.title = 1;
        }

        const [brochures, total] = await Promise.all([
            Brochure.find(query)
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Brochure.countDocuments(query)
        ]);

        return successResponse(res, 200, 'Brochures retrieved successfully', {
            brochures,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getAllBrochures:', error);
        return errorResponse(res, 500, 'Failed to retrieve brochures', error.message);
    }
};

/**
 * Get single brochure by ID
 */
exports.getBrochureById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const brochure = await Brochure.findOne({ _id: id, isActive: true })
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');
        
        if (!brochure) {
            return errorResponse(res, 404, 'Brochure not found');
        }

        return successResponse(res, 200, 'Brochure retrieved successfully', { brochure });
    } catch (error) {
        console.error('Error in getBrochureById:', error);
        return errorResponse(res, 500, 'Failed to retrieve brochure', error.message);
    }
};

/**
 * Create new brochure
 */
exports.createBrochure = async (req, res) => {
    try {
        const brochureData = {
            ...req.body,
            createdBy: req.user._id
        };

        const brochure = new Brochure(brochureData);
        await brochure.save();

        const populatedBrochure = await Brochure.findById(brochure._id)
            .populate('createdBy', 'firstName lastName email');

        return successResponse(
            res,
            201,
            'Brochure created successfully',
            { brochure: populatedBrochure }
        );
    } catch (error) {
        console.error('Error in createBrochure:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to create brochure', error.message);
    }
};

/**
 * Update brochure
 */
exports.updateBrochure = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const brochure = await Brochure.findOne({ _id: id, isActive: true });
        if (!brochure) {
            return errorResponse(res, 404, 'Brochure not found');
        }

        // Check if we're only updating status (allow this even for published brochures)
        const isOnlyStatusUpdate = Object.keys(req.body).length === 1 && req.body.hasOwnProperty('status');
        
        // Validate workflow status and permissions using workflowStatusValidator
        // This checks both permission AND role hierarchy for the current status
        // Note: Use plural form 'brochures' for resource name
        const editValidation = await canEditContent(req.user, brochure, 'brochures', 'update');
        if (!editValidation.canEdit) {
            return errorResponse(res, 403, editValidation.reason || 'You do not have permission to edit this brochure');
        }
        
        // Prevent editing published content directly - must unpublish first
        // Exception: allow status-only updates (but still checked by workflow validator above)
        if (brochure.status === 'published' && !isOnlyStatusUpdate) {
            return errorResponse(res, 400, 'Cannot edit published content. Please unpublish first or use workflow actions.');
        }

        // Update brochure fields
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && key !== '_id' && key !== 'createdBy') {
                brochure[key] = updateData[key];
            }
        });

        brochure.updatedBy = req.user._id;
        await brochure.save();

        const updatedBrochure = await Brochure.findById(brochure._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        return successResponse(
            res,
            200,
            'Brochure updated successfully',
            { brochure: updatedBrochure }
        );
    } catch (error) {
        console.error('Error in updateBrochure:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to update brochure', error.message);
    }
};

/**
 * Delete brochure (soft delete)
 */
exports.deleteBrochure = async (req, res) => {
    try {
        const { id } = req.params;

        const brochure = await Brochure.findOne({ _id: id, isActive: true });
        if (!brochure) {
            return errorResponse(res, 404, 'Brochure not found');
        }

        // Validate workflow status and permissions using workflowStatusValidator
        // This checks both permission AND role hierarchy for the current status
        // Note: Use plural form 'brochures' for resource name
        const deleteValidation = await canDeleteContent(req.user, brochure, 'brochures');
        if (!deleteValidation.canDelete) {
            return errorResponse(res, 403, deleteValidation.reason || 'You do not have permission to delete this brochure');
        }

        // Soft delete
        brochure.isActive = false;
        brochure.updatedBy = req.user._id;
        await brochure.save();

        return successResponse(
            res,
            200,
            'Brochure deleted successfully',
            { brochure: { _id: brochure._id, isActive: false } }
        );
    } catch (error) {
        console.error('Error in deleteBrochure:', error);
        return errorResponse(res, 500, 'Failed to delete brochure', error.message);
    }
};

