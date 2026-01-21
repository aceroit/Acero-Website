const Application = require('../models/Application');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const notificationService = require('../services/notificationService');

/**
 * Get all applications (with filters and pagination)
 */
exports.getAllApplications = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            vacancyId,
            email,
            search,
            sortBy = 'submittedAt',
            sortOrder = 'desc'
        } = req.query;

        const query = { isActive: true };

        if (status) query.status = status;
        if (vacancyId) query.vacancyId = vacancyId;
        if (email) query.email = email;
        if (search) {
            query.$or = [
                { firstName: new RegExp(search, 'i') },
                { lastName: new RegExp(search, 'i') },
                { email: new RegExp(search, 'i') },
                { coverLetter: new RegExp(search, 'i') }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const [applications, total] = await Promise.all([
            Application.find(query)
                .populate('vacancyId', 'title department location type')
                .populate('reviewedBy', 'firstName lastName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Application.countDocuments(query)
        ]);

        return successResponse(res, 200, 'Applications retrieved successfully', {
            applications,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getAllApplications:', error);
        return errorResponse(res, 500, 'Failed to retrieve applications', error.message);
    }
};

/**
 * Get single application by ID
 */
exports.getApplicationById = async (req, res) => {
    try {
        const { id } = req.params;

        const application = await Application.findOne({ _id: id, isActive: true })
            .populate('vacancyId', 'title department location type')
            .populate('reviewedBy', 'firstName lastName email');

        if (!application) {
            return errorResponse(res, 404, 'Application not found');
        }

        return successResponse(res, 200, 'Application retrieved successfully', { application });
    } catch (error) {
        console.error('Error in getApplicationById:', error);
        return errorResponse(res, 500, 'Failed to retrieve application', error.message);
    }
};

/**
 * Create new application
 */
exports.createApplication = async (req, res) => {
    try {
        const applicationData = {
            ...req.body
        };

        const application = new Application(applicationData);
        await application.save();

        // Notify via email if configured (will be implemented in notificationService)
        if (notificationService.notifyApplicationSubmission) {
            notificationService.notifyApplicationSubmission(application);
        }

        return successResponse(
            res,
            201,
            'Application created successfully',
            { application }
        );
    } catch (error) {
        console.error('Error in createApplication:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to create application', error.message);
    }
};

/**
 * Update application
 */
exports.updateApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const application = await Application.findOne({ _id: id, isActive: true });
        if (!application) {
            return errorResponse(res, 404, 'Application not found');
        }

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && key !== '_id') {
                application[key] = updateData[key];
            }
        });

        await application.save();

        const updatedApplication = await Application.findById(application._id)
            .populate('vacancyId', 'title department location type')
            .populate('reviewedBy', 'firstName lastName email');

        return successResponse(
            res,
            200,
            'Application updated successfully',
            { application: updatedApplication }
        );
    } catch (error) {
        console.error('Error in updateApplication:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to update application', error.message);
    }
};

/**
 * Delete application (soft delete)
 */
exports.deleteApplication = async (req, res) => {
    try {
        const { id } = req.params;

        const application = await Application.findOne({ _id: id, isActive: true });
        if (!application) {
            return errorResponse(res, 404, 'Application not found');
        }

        application.isActive = false;
        await application.save();

        return successResponse(
            res,
            200,
            'Application deleted successfully',
            { application: { _id: application._id, isActive: false } }
        );
    } catch (error) {
        console.error('Error in deleteApplication:', error);
        return errorResponse(res, 500, 'Failed to delete application', error.message);
    }
};

/**
 * Mark application as reviewing
 */
exports.markReviewing = async (req, res) => {
    try {
        const { id } = req.params;

        const application = await Application.findOne({ _id: id, isActive: true });
        if (!application) {
            return errorResponse(res, 404, 'Application not found');
        }

        application.status = 'reviewing';
        application.reviewedBy = req.user?._id || null;
        application.reviewedAt = new Date();
        await application.save();

        const updatedApplication = await Application.findById(application._id)
            .populate('vacancyId', 'title department location type')
            .populate('reviewedBy', 'firstName lastName email');

        return successResponse(res, 200, 'Application marked as reviewing', { application: updatedApplication });
    } catch (error) {
        console.error('Error in markReviewing:', error);
        return errorResponse(res, 500, 'Failed to mark application as reviewing', error.message);
    }
};

/**
 * Shortlist application
 */
exports.shortlistApplication = async (req, res) => {
    try {
        const { id } = req.params;

        const application = await Application.findOne({ _id: id, isActive: true });
        if (!application) {
            return errorResponse(res, 404, 'Application not found');
        }

        application.status = 'shortlisted';
        application.reviewedBy = req.user?._id || application.reviewedBy || null;
        application.reviewedAt = application.reviewedAt || new Date();
        await application.save();

        const updatedApplication = await Application.findById(application._id)
            .populate('vacancyId', 'title department location type')
            .populate('reviewedBy', 'firstName lastName email');

        return successResponse(res, 200, 'Application shortlisted', { application: updatedApplication });
    } catch (error) {
        console.error('Error in shortlistApplication:', error);
        return errorResponse(res, 500, 'Failed to shortlist application', error.message);
    }
};

/**
 * Reject application
 */
exports.rejectApplication = async (req, res) => {
    try {
        const { id } = req.params;

        const application = await Application.findOne({ _id: id, isActive: true });
        if (!application) {
            return errorResponse(res, 404, 'Application not found');
        }

        application.status = 'rejected';
        application.reviewedBy = req.user?._id || application.reviewedBy || null;
        application.reviewedAt = application.reviewedAt || new Date();
        await application.save();

        const updatedApplication = await Application.findById(application._id)
            .populate('vacancyId', 'title department location type')
            .populate('reviewedBy', 'firstName lastName email');

        return successResponse(res, 200, 'Application rejected', { application: updatedApplication });
    } catch (error) {
        console.error('Error in rejectApplication:', error);
        return errorResponse(res, 500, 'Failed to reject application', error.message);
    }
};

/**
 * Archive application
 */
exports.archiveApplication = async (req, res) => {
    try {
        const { id } = req.params;

        const application = await Application.findOne({ _id: id, isActive: true });
        if (!application) {
            return errorResponse(res, 404, 'Application not found');
        }

        application.status = 'archived';
        application.reviewedBy = req.user?._id || application.reviewedBy || null;
        application.reviewedAt = application.reviewedAt || new Date();
        await application.save();

        const updatedApplication = await Application.findById(application._id)
            .populate('vacancyId', 'title department location type')
            .populate('reviewedBy', 'firstName lastName email');

        return successResponse(res, 200, 'Application archived', { application: updatedApplication });
    } catch (error) {
        console.error('Error in archiveApplication:', error);
        return errorResponse(res, 500, 'Failed to archive application', error.message);
    }
};


