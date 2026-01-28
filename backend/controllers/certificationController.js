const Certification = require('../models/Certification');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { canEditContent, canDeleteContent } = require('../utils/workflowStatusValidator');

/**
 * Get all certifications (with filters and pagination)
 */
exports.getAllCertifications = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            featured,
            search,
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        // Build query
        const query = { isActive: true };
        
        if (status) query.status = status;
        if (featured !== undefined) query.featured = featured === 'true';
        if (search) {
            query.name = new RegExp(search, 'i');
        }

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        // Secondary sort by name if not already sorting by it
        if (sortBy !== 'name') {
            sortOptions.name = 1;
        }

        const [certifications, total] = await Promise.all([
            Certification.find(query)
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Certification.countDocuments(query)
        ]);

        return successResponse(res, 200, 'Certifications retrieved successfully', {
            certifications,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getAllCertifications:', error);
        return errorResponse(res, 500, 'Failed to retrieve certifications', error.message);
    }
};

/**
 * Get single certification by ID
 */
exports.getCertificationById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const certification = await Certification.findOne({ _id: id, isActive: true })
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');
        
        if (!certification) {
            return errorResponse(res, 404, 'Certification not found');
        }

        return successResponse(res, 200, 'Certification retrieved successfully', { certification });
    } catch (error) {
        console.error('Error in getCertificationById:', error);
        return errorResponse(res, 500, 'Failed to retrieve certification', error.message);
    }
};

/**
 * Create new certification
 */
exports.createCertification = async (req, res) => {
    try {
        const certificationData = {
            ...req.body,
            createdBy: req.user._id
        };

        const certification = new Certification(certificationData);
        await certification.save();

        const populatedCertification = await Certification.findById(certification._id)
            .populate('createdBy', 'firstName lastName email');

        return successResponse(
            res,
            201,
            'Certification created successfully',
            { certification: populatedCertification }
        );
    } catch (error) {
        console.error('Error in createCertification:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to create certification', error.message);
    }
};

/**
 * Update certification
 */
exports.updateCertification = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const certification = await Certification.findOne({ _id: id, isActive: true });
        if (!certification) {
            return errorResponse(res, 404, 'Certification not found');
        }

        // Check if we're only updating status (allow this even for published certifications)
        const isOnlyStatusUpdate = Object.keys(req.body).length === 1 && req.body.hasOwnProperty('status');
        
        // Validate workflow status and permissions using workflowStatusValidator
        // This checks both permission AND role hierarchy for the current status
        // Note: Use plural form 'certifications' for resource name
        const editValidation = await canEditContent(req.user, certification, 'certifications', 'update');
        if (!editValidation.canEdit) {
            return errorResponse(res, 403, editValidation.reason || 'You do not have permission to edit this certification');
        }
        
        // Prevent editing published content directly - must unpublish first
        // Exception: allow status-only updates (but still checked by workflow validator above)
        if (certification.status === 'published' && !isOnlyStatusUpdate) {
            return errorResponse(res, 400, 'Cannot edit published content. Please unpublish first or use workflow actions.');
        }

        // Update certification fields
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && key !== '_id' && key !== 'createdBy') {
                certification[key] = updateData[key];
            }
        });

        certification.updatedBy = req.user._id;
        await certification.save();

        const updatedCertification = await Certification.findById(certification._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        return successResponse(
            res,
            200,
            'Certification updated successfully',
            { certification: updatedCertification }
        );
    } catch (error) {
        console.error('Error in updateCertification:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to update certification', error.message);
    }
};

/**
 * Delete certification (soft delete)
 */
exports.deleteCertification = async (req, res) => {
    try {
        const { id } = req.params;

        const certification = await Certification.findOne({ _id: id, isActive: true });
        if (!certification) {
            return errorResponse(res, 404, 'Certification not found');
        }

        // Validate workflow status and permissions using workflowStatusValidator
        // This checks both permission AND role hierarchy for the current status
        // Note: Use plural form 'certifications' for resource name
        const deleteValidation = await canDeleteContent(req.user, certification, 'certifications');
        if (!deleteValidation.canDelete) {
            return errorResponse(res, 403, deleteValidation.reason || 'You do not have permission to delete this certification');
        }

        // Soft delete
        certification.isActive = false;
        certification.updatedBy = req.user._id;
        await certification.save();

        return successResponse(
            res,
            200,
            'Certification deleted successfully',
            { certification: { _id: certification._id, isActive: false } }
        );
    } catch (error) {
        console.error('Error in deleteCertification:', error);
        return errorResponse(res, 500, 'Failed to delete certification', error.message);
    }
};

