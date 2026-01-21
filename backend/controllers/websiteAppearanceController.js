const WebsiteAppearance = require('../models/WebsiteAppearance');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { canEditContent, canDeleteContent } = require('../utils/workflowStatusValidator');

/**
 * Get all website appearance configs (with filters and pagination)
 */
exports.getAllAppearances = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const query = { isActive: true };
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { title: new RegExp(search, 'i') },
                { 'typography.fontFamily.primary.value': new RegExp(search, 'i') }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const [appearances, total] = await Promise.all([
            WebsiteAppearance.find(query)
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            WebsiteAppearance.countDocuments(query)
        ]);

        return successResponse(res, 200, 'Website appearances retrieved successfully', {
            appearances,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getAllAppearances:', error);
        return errorResponse(res, 500, 'Failed to retrieve website appearances', error.message);
    }
};

/**
 * Get single appearance config by ID
 */
exports.getAppearanceById = async (req, res) => {
    try {
        const { id } = req.params;

        const appearance = await WebsiteAppearance.findOne({ _id: id, isActive: true })
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        if (!appearance) {
            return errorResponse(res, 404, 'Website appearance not found');
        }

        return successResponse(res, 200, 'Website appearance retrieved successfully', { appearance });
    } catch (error) {
        console.error('Error in getAppearanceById:', error);
        return errorResponse(res, 500, 'Failed to retrieve website appearance', error.message);
    }
};

/**
 * Create appearance config
 */
exports.createAppearance = async (req, res) => {
    try {
        const data = {
            ...req.body,
            createdBy: req.user._id
        };

        const appearance = new WebsiteAppearance(data);
        await appearance.save();

        const populated = await WebsiteAppearance.findById(appearance._id)
            .populate('createdBy', 'firstName lastName email');

        return successResponse(res, 201, 'Website appearance created successfully', { appearance: populated });
    } catch (error) {
        console.error('Error in createAppearance:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to create website appearance', error.message);
    }
};

/**
 * Update appearance config
 */
exports.updateAppearance = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const appearance = await WebsiteAppearance.findOne({ _id: id, isActive: true });
        if (!appearance) {
            return errorResponse(res, 404, 'Website appearance not found');
        }

        const isOnlyStatusUpdate = Object.keys(updateData).length === 1 && Object.prototype.hasOwnProperty.call(updateData, 'status');

        const editValidation = await canEditContent(req.user, appearance, 'website-appearance', 'update');
        if (!editValidation.canEdit) {
            return errorResponse(res, 403, editValidation.reason || 'You do not have permission to edit this website appearance');
        }

        if (appearance.status === 'published' && !isOnlyStatusUpdate) {
            return errorResponse(res, 400, 'Cannot edit published content. Please unpublish first or use workflow actions.');
        }

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && key !== '_id' && key !== 'createdBy') {
                appearance[key] = updateData[key];
            }
        });

        appearance.updatedBy = req.user._id;
        await appearance.save();

        const updated = await WebsiteAppearance.findById(appearance._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        return successResponse(res, 200, 'Website appearance updated successfully', { appearance: updated });
    } catch (error) {
        console.error('Error in updateAppearance:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to update website appearance', error.message);
    }
};

/**
 * Delete appearance config (soft delete)
 */
exports.deleteAppearance = async (req, res) => {
    try {
        const { id } = req.params;

        const appearance = await WebsiteAppearance.findOne({ _id: id, isActive: true });
        if (!appearance) {
            return errorResponse(res, 404, 'Website appearance not found');
        }

        const deleteValidation = await canDeleteContent(req.user, appearance, 'website-appearance');
        if (!deleteValidation.canDelete) {
            return errorResponse(res, 403, deleteValidation.reason || 'You do not have permission to delete this website appearance');
        }

        appearance.isActive = false;
        appearance.updatedBy = req.user._id;
        await appearance.save();

        return successResponse(res, 200, 'Website appearance deleted successfully', { appearance: { _id: appearance._id, isActive: false } });
    } catch (error) {
        console.error('Error in deleteAppearance:', error);
        return errorResponse(res, 500, 'Failed to delete website appearance', error.message);
    }
};


