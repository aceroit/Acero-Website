const GoogleMaps = require('../models/GoogleMaps');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { canEditContent, canDeleteContent } = require('../utils/workflowStatusValidator');

// List with filters/pagination
exports.getAllMaps = async (req, res) => {
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
                { 'apiKey.value': new RegExp(search, 'i') }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const [items, total] = await Promise.all([
            GoogleMaps.find(query)
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            GoogleMaps.countDocuments(query)
        ]);

        return successResponse(res, 200, 'Google Maps settings retrieved successfully', {
            maps: items,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getAllMaps:', error);
        return errorResponse(res, 500, 'Failed to retrieve Google Maps settings', error.message);
    }
};

// Get by id
exports.getMapById = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await GoogleMaps.findOne({ _id: id, isActive: true })
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        if (!item) {
            return errorResponse(res, 404, 'Google Maps settings not found');
        }

        return successResponse(res, 200, 'Google Maps settings retrieved successfully', { map: item });
    } catch (error) {
        console.error('Error in getMapById:', error);
        return errorResponse(res, 500, 'Failed to retrieve Google Maps settings', error.message);
    }
};

// Create
exports.createMap = async (req, res) => {
    try {
        const data = { ...req.body, createdBy: req.user._id };
        const item = new GoogleMaps(data);
        await item.save();

        const populated = await GoogleMaps.findById(item._id)
            .populate('createdBy', 'firstName lastName email');

        return successResponse(res, 201, 'Google Maps settings created successfully', { map: populated });
    } catch (error) {
        console.error('Error in createMap:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to create Google Maps settings', error.message);
    }
};

// Update
exports.updateMap = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const item = await GoogleMaps.findOne({ _id: id, isActive: true });
        if (!item) {
            return errorResponse(res, 404, 'Google Maps settings not found');
        }

        const isOnlyStatusUpdate = Object.keys(updateData).length === 1 && Object.prototype.hasOwnProperty.call(updateData, 'status');
        const editValidation = await canEditContent(req.user, item, 'google-maps', 'update');
        if (!editValidation.canEdit) {
            return errorResponse(res, 403, editValidation.reason || 'You do not have permission to edit these Google Maps settings');
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

        const updated = await GoogleMaps.findById(item._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        return successResponse(res, 200, 'Google Maps settings updated successfully', { map: updated });
    } catch (error) {
        console.error('Error in updateMap:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to update Google Maps settings', error.message);
    }
};

// Delete (soft)
exports.deleteMap = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await GoogleMaps.findOne({ _id: id, isActive: true });
        if (!item) {
            return errorResponse(res, 404, 'Google Maps settings not found');
        }

        const deleteValidation = await canDeleteContent(req.user, item, 'google-maps');
        if (!deleteValidation.canDelete) {
            return errorResponse(res, 403, deleteValidation.reason || 'You do not have permission to delete these Google Maps settings');
        }

        item.isActive = false;
        item.updatedBy = req.user._id;
        await item.save();

        return successResponse(res, 200, 'Google Maps settings deleted successfully', { map: { _id: item._id, isActive: false } });
    } catch (error) {
        console.error('Error in deleteMap:', error);
        return errorResponse(res, 500, 'Failed to delete Google Maps settings', error.message);
    }
};


