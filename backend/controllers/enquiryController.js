const Enquiry = require('../models/Enquiry');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const notificationService = require('../services/notificationService');

/**
 * Get all enquiries (with filters and pagination)
 */
exports.getAllEnquiries = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            purpose,
            email,
            search,
            sortBy = 'submittedAt',
            sortOrder = 'desc'
        } = req.query;

        const query = { isActive: true };

        if (status) query.status = status;
        if (purpose) query.purpose = purpose;
        if (email) query.email = email;
        if (search) {
            query.$or = [
                { fullName: new RegExp(search, 'i') },
                { email: new RegExp(search, 'i') },
                { subject: new RegExp(search, 'i') },
                { message: new RegExp(search, 'i') }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const [enquiries, total] = await Promise.all([
            Enquiry.find(query)
                .populate('readBy', 'firstName lastName email')
                .populate('repliedBy', 'firstName lastName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Enquiry.countDocuments(query)
        ]);

        return successResponse(res, 200, 'Enquiries retrieved successfully', {
            enquiries,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getAllEnquiries:', error);
        return errorResponse(res, 500, 'Failed to retrieve enquiries', error.message);
    }
};

/**
 * Get single enquiry by ID
 */
exports.getEnquiryById = async (req, res) => {
    try {
        const { id } = req.params;

        const enquiry = await Enquiry.findOne({ _id: id, isActive: true })
            .populate('readBy', 'firstName lastName email')
            .populate('repliedBy', 'firstName lastName email');

        if (!enquiry) {
            return errorResponse(res, 404, 'Enquiry not found');
        }

        return successResponse(res, 200, 'Enquiry retrieved successfully', { enquiry });
    } catch (error) {
        console.error('Error in getEnquiryById:', error);
        return errorResponse(res, 500, 'Failed to retrieve enquiry', error.message);
    }
};

/**
 * Create new enquiry
 */
exports.createEnquiry = async (req, res) => {
    try {
        const enquiryData = {
            ...req.body
        };

        const enquiry = new Enquiry(enquiryData);
        await enquiry.save();

        // Notify via email if configured (will be implemented in notificationService)
        if (notificationService.notifyEnquirySubmission) {
            notificationService.notifyEnquirySubmission(enquiry);
        }

        return successResponse(
            res,
            201,
            'Enquiry created successfully',
            { enquiry }
        );
    } catch (error) {
        console.error('Error in createEnquiry:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to create enquiry', error.message);
    }
};

/**
 * Update enquiry
 */
exports.updateEnquiry = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const enquiry = await Enquiry.findOne({ _id: id, isActive: true });
        if (!enquiry) {
            return errorResponse(res, 404, 'Enquiry not found');
        }

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && key !== '_id') {
                enquiry[key] = updateData[key];
            }
        });

        await enquiry.save();

        const updatedEnquiry = await Enquiry.findById(enquiry._id)
            .populate('readBy', 'firstName lastName email')
            .populate('repliedBy', 'firstName lastName email');

        return successResponse(
            res,
            200,
            'Enquiry updated successfully',
            { enquiry: updatedEnquiry }
        );
    } catch (error) {
        console.error('Error in updateEnquiry:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to update enquiry', error.message);
    }
};

/**
 * Delete enquiry (soft delete)
 */
exports.deleteEnquiry = async (req, res) => {
    try {
        const { id } = req.params;

        const enquiry = await Enquiry.findOne({ _id: id, isActive: true });
        if (!enquiry) {
            return errorResponse(res, 404, 'Enquiry not found');
        }

        enquiry.isActive = false;
        await enquiry.save();

        return successResponse(
            res,
            200,
            'Enquiry deleted successfully',
            { enquiry: { _id: enquiry._id, isActive: false } }
        );
    } catch (error) {
        console.error('Error in deleteEnquiry:', error);
        return errorResponse(res, 500, 'Failed to delete enquiry', error.message);
    }
};

/**
 * Mark enquiry as read
 */
exports.markRead = async (req, res) => {
    try {
        const { id } = req.params;

        const enquiry = await Enquiry.findOne({ _id: id, isActive: true });
        if (!enquiry) {
            return errorResponse(res, 404, 'Enquiry not found');
        }

        enquiry.status = 'read';
        enquiry.readBy = req.user?._id || null;
        enquiry.readAt = new Date();
        await enquiry.save();

        const updatedEnquiry = await Enquiry.findById(enquiry._id)
            .populate('readBy', 'firstName lastName email')
            .populate('repliedBy', 'firstName lastName email');

        return successResponse(res, 200, 'Enquiry marked as read', { enquiry: updatedEnquiry });
    } catch (error) {
        console.error('Error in markRead:', error);
        return errorResponse(res, 500, 'Failed to mark enquiry as read', error.message);
    }
};

/**
 * Mark enquiry as replied
 */
exports.markReplied = async (req, res) => {
    try {
        const { id } = req.params;

        const enquiry = await Enquiry.findOne({ _id: id, isActive: true });
        if (!enquiry) {
            return errorResponse(res, 404, 'Enquiry not found');
        }

        enquiry.status = 'replied';
        enquiry.repliedBy = req.user?._id || null;
        enquiry.repliedAt = new Date();
        await enquiry.save();

        const updatedEnquiry = await Enquiry.findById(enquiry._id)
            .populate('readBy', 'firstName lastName email')
            .populate('repliedBy', 'firstName lastName email');

        return successResponse(res, 200, 'Enquiry marked as replied', { enquiry: updatedEnquiry });
    } catch (error) {
        console.error('Error in markReplied:', error);
        return errorResponse(res, 500, 'Failed to mark enquiry as replied', error.message);
    }
};

/**
 * Archive enquiry
 */
exports.archiveEnquiry = async (req, res) => {
    try {
        const { id } = req.params;

        const enquiry = await Enquiry.findOne({ _id: id, isActive: true });
        if (!enquiry) {
            return errorResponse(res, 404, 'Enquiry not found');
        }

        enquiry.status = 'archived';
        enquiry.readBy = req.user?._id || enquiry.readBy;
        enquiry.readAt = enquiry.readAt || new Date();
        enquiry.repliedBy = enquiry.repliedBy || null;
        enquiry.repliedAt = enquiry.repliedAt || null;
        await enquiry.save();

        const updatedEnquiry = await Enquiry.findById(enquiry._id)
            .populate('readBy', 'firstName lastName email')
            .populate('repliedBy', 'firstName lastName email');

        return successResponse(res, 200, 'Enquiry archived', { enquiry: updatedEnquiry });
    } catch (error) {
        console.error('Error in archiveEnquiry:', error);
        return errorResponse(res, 500, 'Failed to archive enquiry', error.message);
    }
};


