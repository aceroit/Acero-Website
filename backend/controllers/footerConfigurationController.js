const FooterConfiguration = require('../models/FooterConfiguration');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { canEditContent, canDeleteContent } = require('../utils/workflowStatusValidator');

/**
 * Get all footer configurations (with filters and pagination)
 */
exports.getAllFooters = async (req, res) => {
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
                { 'brandInfo.description': new RegExp(search, 'i') }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const [footers, total] = await Promise.all([
            FooterConfiguration.find(query)
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            FooterConfiguration.countDocuments(query)
        ]);

        return successResponse(res, 200, 'Footer configurations retrieved successfully', {
            footers,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getAllFooters:', error);
        return errorResponse(res, 500, 'Failed to retrieve footer configurations', error.message);
    }
};

/**
 * Get single footer configuration by ID
 */
exports.getFooterById = async (req, res) => {
    try {
        const { id } = req.params;

        const footer = await FooterConfiguration.findOne({ _id: id, isActive: true })
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        if (!footer) {
            return errorResponse(res, 404, 'Footer configuration not found');
        }

        return successResponse(res, 200, 'Footer configuration retrieved successfully', { footer });
    } catch (error) {
        console.error('Error in getFooterById:', error);
        return errorResponse(res, 500, 'Failed to retrieve footer configuration', error.message);
    }
};

/**
 * Create new footer configuration
 */
exports.createFooter = async (req, res) => {
    try {
        const data = {
            ...req.body,
            createdBy: req.user._id
        };

        const footer = new FooterConfiguration(data);
        await footer.save();

        const populated = await FooterConfiguration.findById(footer._id)
            .populate('createdBy', 'firstName lastName email');

        return successResponse(res, 201, 'Footer configuration created successfully', { footer: populated });
    } catch (error) {
        console.error('Error in createFooter:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to create footer configuration', error.message);
    }
};

/**
 * Update footer configuration
 */
exports.updateFooter = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const footer = await FooterConfiguration.findOne({ _id: id, isActive: true });
        if (!footer) {
            return errorResponse(res, 404, 'Footer configuration not found');
        }

        const isOnlyStatusUpdate = Object.keys(updateData).length === 1 && Object.prototype.hasOwnProperty.call(updateData, 'status');

        const editValidation = await canEditContent(req.user, footer, 'footer-configurations', 'update');
        if (!editValidation.canEdit) {
            return errorResponse(res, 403, editValidation.reason || 'You do not have permission to edit this footer configuration');
        }

        if (footer.status === 'published' && !isOnlyStatusUpdate) {
            return errorResponse(res, 400, 'Cannot edit published content. Please unpublish first or use workflow actions.');
        }

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && key !== '_id' && key !== 'createdBy') {
                footer[key] = updateData[key];
            }
        });

        footer.updatedBy = req.user._id;
        await footer.save();

        const updated = await FooterConfiguration.findById(footer._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        return successResponse(res, 200, 'Footer configuration updated successfully', { footer: updated });
    } catch (error) {
        console.error('Error in updateFooter:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to update footer configuration', error.message);
    }
};

/**
 * Delete footer configuration (soft delete)
 */
exports.deleteFooter = async (req, res) => {
    try {
        const { id } = req.params;

        const footer = await FooterConfiguration.findOne({ _id: id, isActive: true });
        if (!footer) {
            return errorResponse(res, 404, 'Footer configuration not found');
        }

        const deleteValidation = await canDeleteContent(req.user, footer, 'footer-configurations');
        if (!deleteValidation.canDelete) {
            return errorResponse(res, 403, deleteValidation.reason || 'You do not have permission to delete this footer configuration');
        }

        footer.isActive = false;
        footer.updatedBy = req.user._id;
        await footer.save();

        return successResponse(res, 200, 'Footer configuration deleted successfully', { footer: { _id: footer._id, isActive: false } });
    } catch (error) {
        console.error('Error in deleteFooter:', error);
        return errorResponse(res, 500, 'Failed to delete footer configuration', error.message);
    }
};


