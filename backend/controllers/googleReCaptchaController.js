const GoogleReCaptcha = require('../models/GoogleReCaptcha');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { canEditContent, canDeleteContent } = require('../utils/workflowStatusValidator');

// List with filters/pagination
exports.getAllReCaptcha = async (req, res) => {
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
                { 'siteKey.value': new RegExp(search, 'i') }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const [items, total] = await Promise.all([
            GoogleReCaptcha.find(query)
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            GoogleReCaptcha.countDocuments(query)
        ]);

        return successResponse(res, 200, 'Google ReCaptcha settings retrieved successfully', {
            recaptchas: items,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getAllReCaptcha:', error);
        return errorResponse(res, 500, 'Failed to retrieve ReCaptcha settings', error.message);
    }
};

// Get by id
exports.getReCaptchaById = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await GoogleReCaptcha.findOne({ _id: id, isActive: true })
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        if (!item) {
            return errorResponse(res, 404, 'Google ReCaptcha settings not found');
        }

        return successResponse(res, 200, 'Google ReCaptcha settings retrieved successfully', { recaptcha: item });
    } catch (error) {
        console.error('Error in getReCaptchaById:', error);
        return errorResponse(res, 500, 'Failed to retrieve ReCaptcha settings', error.message);
    }
};

// Create
exports.createReCaptcha = async (req, res) => {
    try {
        const data = { ...req.body, createdBy: req.user._id };
        const item = new GoogleReCaptcha(data);
        await item.save();

        const populated = await GoogleReCaptcha.findById(item._id)
            .populate('createdBy', 'firstName lastName email');

        return successResponse(res, 201, 'Google ReCaptcha settings created successfully', { recaptcha: populated });
    } catch (error) {
        console.error('Error in createReCaptcha:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to create ReCaptcha settings', error.message);
    }
};

// Update
exports.updateReCaptcha = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const item = await GoogleReCaptcha.findOne({ _id: id, isActive: true });
        if (!item) {
            return errorResponse(res, 404, 'Google ReCaptcha settings not found');
        }

        const isOnlyStatusUpdate = Object.keys(updateData).length === 1 && Object.prototype.hasOwnProperty.call(updateData, 'status');
        const editValidation = await canEditContent(req.user, item, 'google-recaptcha', 'update');
        if (!editValidation.canEdit) {
            return errorResponse(res, 403, editValidation.reason || 'You do not have permission to edit these ReCaptcha settings');
        }

        if (item.status === 'published' && !isOnlyStatusUpdate) {
            return errorResponse(res, 400, 'Cannot edit published content. Please unpublish first or use workflow actions.');
        }

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && key !== '_id' && key !== 'createdBy') {
                item[key] = updateData[key];
            }
        });

        item.updatedBy = req.user._id;
        await item.save();

        const updated = await GoogleReCaptcha.findById(item._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        return successResponse(res, 200, 'Google ReCaptcha settings updated successfully', { recaptcha: updated });
    } catch (error) {
        console.error('Error in updateReCaptcha:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to update ReCaptcha settings', error.message);
    }
};

// Delete (soft)
exports.deleteReCaptcha = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await GoogleReCaptcha.findOne({ _id: id, isActive: true });
        if (!item) {
            return errorResponse(res, 404, 'Google ReCaptcha settings not found');
        }

        const deleteValidation = await canDeleteContent(req.user, item, 'google-recaptcha');
        if (!deleteValidation.canDelete) {
            return errorResponse(res, 403, deleteValidation.reason || 'You do not have permission to delete these ReCaptcha settings');
        }

        item.isActive = false;
        item.updatedBy = req.user._id;
        await item.save();

        return successResponse(res, 200, 'Google ReCaptcha settings deleted successfully', { recaptcha: { _id: item._id, isActive: false } });
    } catch (error) {
        console.error('Error in deleteReCaptcha:', error);
        return errorResponse(res, 500, 'Failed to delete ReCaptcha settings', error.message);
    }
};


