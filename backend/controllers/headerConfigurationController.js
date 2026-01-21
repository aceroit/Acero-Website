const HeaderConfiguration = require('../models/HeaderConfiguration');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { canEditContent, canDeleteContent } = require('../utils/workflowStatusValidator');

/**
 * Get all header configurations (with filters and pagination)
 */
exports.getAllHeaders = async (req, res) => {
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
                { 'brandName.text': new RegExp(search, 'i') }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const [headers, total] = await Promise.all([
            HeaderConfiguration.find(query)
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            HeaderConfiguration.countDocuments(query)
        ]);

        return successResponse(res, 200, 'Header configurations retrieved successfully', {
            headers,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getAllHeaders:', error);
        return errorResponse(res, 500, 'Failed to retrieve header configurations', error.message);
    }
};

/**
 * Get single header configuration by ID
 */
exports.getHeaderById = async (req, res) => {
    try {
        const { id } = req.params;

        const header = await HeaderConfiguration.findOne({ _id: id, isActive: true })
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        if (!header) {
            return errorResponse(res, 404, 'Header configuration not found');
        }

        return successResponse(res, 200, 'Header configuration retrieved successfully', { header });
    } catch (error) {
        console.error('Error in getHeaderById:', error);
        return errorResponse(res, 500, 'Failed to retrieve header configuration', error.message);
    }
};

/**
 * Create new header configuration
 */
exports.createHeader = async (req, res) => {
    try {
        const data = {
            ...req.body,
            createdBy: req.user._id
        };

        const header = new HeaderConfiguration(data);
        await header.save();

        const populated = await HeaderConfiguration.findById(header._id)
            .populate('createdBy', 'firstName lastName email');

        return successResponse(res, 201, 'Header configuration created successfully', { header: populated });
    } catch (error) {
        console.error('Error in createHeader:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to create header configuration', error.message);
    }
};

/**
 * Update header configuration
 */
exports.updateHeader = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const header = await HeaderConfiguration.findOne({ _id: id, isActive: true });
        if (!header) {
            return errorResponse(res, 404, 'Header configuration not found');
        }

        const isOnlyStatusUpdate = Object.keys(updateData).length === 1 && Object.prototype.hasOwnProperty.call(updateData, 'status');

        const editValidation = await canEditContent(req.user, header, 'header-configurations', 'update');
        if (!editValidation.canEdit) {
            return errorResponse(res, 403, editValidation.reason || 'You do not have permission to edit this header configuration');
        }

        if (header.status === 'published' && !isOnlyStatusUpdate) {
            return errorResponse(res, 400, 'Cannot edit published content. Please unpublish first or use workflow actions.');
        }

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && key !== '_id' && key !== 'createdBy') {
                header[key] = updateData[key];
            }
        });

        header.updatedBy = req.user._id;
        await header.save();

        const updated = await HeaderConfiguration.findById(header._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        return successResponse(res, 200, 'Header configuration updated successfully', { header: updated });
    } catch (error) {
        console.error('Error in updateHeader:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to update header configuration', error.message);
    }
};

/**
 * Delete header configuration (soft delete)
 */
exports.deleteHeader = async (req, res) => {
    try {
        const { id } = req.params;

        const header = await HeaderConfiguration.findOne({ _id: id, isActive: true });
        if (!header) {
            return errorResponse(res, 404, 'Header configuration not found');
        }

        const deleteValidation = await canDeleteContent(req.user, header, 'header-configurations');
        if (!deleteValidation.canDelete) {
            return errorResponse(res, 403, deleteValidation.reason || 'You do not have permission to delete this header configuration');
        }

        header.isActive = false;
        header.updatedBy = req.user._id;
        await header.save();

        return successResponse(res, 200, 'Header configuration deleted successfully', { header: { _id: header._id, isActive: false } });
    } catch (error) {
        console.error('Error in deleteHeader:', error);
        return errorResponse(res, 500, 'Failed to delete header configuration', error.message);
    }
};


