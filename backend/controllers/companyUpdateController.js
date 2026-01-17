const CompanyUpdate = require('../models/CompanyUpdate');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { canEditContent, canDeleteContent } = require('../utils/workflowStatusValidator');

/**
 * Get all company updates (with filters and pagination)
 */
exports.getAllCompanyUpdates = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            category,
            featured,
            eventDateFrom,
            eventDateTo,
            search,
            sortBy = 'eventDate',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = { isActive: true };
        
        if (status) query.status = status;
        if (category) query.category = category;
        if (featured !== undefined) query.featured = featured === 'true';
        if (eventDateFrom || eventDateTo) {
            query.eventDate = {};
            if (eventDateFrom) query.eventDate.$gte = new Date(eventDateFrom);
            if (eventDateTo) query.eventDate.$lte = new Date(eventDateTo);
        }
        if (search) {
            query.$or = [
                { title: new RegExp(search, 'i') },
                { heading: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') },
                { shortDescription: new RegExp(search, 'i') }
            ];
        }

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        // Secondary sort by createdAt if not already sorting by it
        if (sortBy !== 'createdAt' && sortBy !== 'eventDate') {
            sortOptions.createdAt = -1;
        }

        const [companyUpdates, total] = await Promise.all([
            CompanyUpdate.find(query)
                .populate('category', 'name slug')
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            CompanyUpdate.countDocuments(query)
        ]);

        return successResponse(res, 200, 'Company updates retrieved successfully', {
            companyUpdates,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getAllCompanyUpdates:', error);
        return errorResponse(res, 500, 'Failed to retrieve company updates', error.message);
    }
};

/**
 * Get single company update by ID
 */
exports.getCompanyUpdateById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const companyUpdate = await CompanyUpdate.findOne({ _id: id, isActive: true })
            .populate('category', 'name slug')
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');
        
        if (!companyUpdate) {
            return errorResponse(res, 404, 'Company update not found');
        }

        return successResponse(res, 200, 'Company update retrieved successfully', { companyUpdate });
    } catch (error) {
        console.error('Error in getCompanyUpdateById:', error);
        return errorResponse(res, 500, 'Failed to retrieve company update', error.message);
    }
};

/**
 * Get company update by slug
 */
exports.getCompanyUpdateBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        
        const companyUpdate = await CompanyUpdate.findBySlug(slug)
            .populate('category', 'name slug')
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');
        
        if (!companyUpdate) {
            return errorResponse(res, 404, 'Company update not found');
        }

        return successResponse(res, 200, 'Company update retrieved successfully', { companyUpdate });
    } catch (error) {
        console.error('Error in getCompanyUpdateBySlug:', error);
        return errorResponse(res, 500, 'Failed to retrieve company update', error.message);
    }
};

/**
 * Create new company update
 */
exports.createCompanyUpdate = async (req, res) => {
    try {
        const companyUpdateData = {
            ...req.body,
            createdBy: req.user._id
        };

        const companyUpdate = new CompanyUpdate(companyUpdateData);
        await companyUpdate.save();

        const populatedCompanyUpdate = await CompanyUpdate.findById(companyUpdate._id)
            .populate('category', 'name slug')
            .populate('createdBy', 'firstName lastName email');

        return successResponse(
            res,
            201,
            'Company update created successfully',
            { companyUpdate: populatedCompanyUpdate }
        );
    } catch (error) {
        console.error('Error in createCompanyUpdate:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        if (error.code === 11000) {
            return errorResponse(res, 400, 'Company update with this slug already exists');
        }
        return errorResponse(res, 500, 'Failed to create company update', error.message);
    }
};

/**
 * Update company update
 */
exports.updateCompanyUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const companyUpdate = await CompanyUpdate.findOne({ _id: id, isActive: true });
        if (!companyUpdate) {
            return errorResponse(res, 404, 'Company update not found');
        }

        // Check if we're only updating status (allow this even for published company updates)
        const isOnlyStatusUpdate = Object.keys(req.body).length === 1 && req.body.hasOwnProperty('status');
        
        // Validate workflow status and permissions using workflowStatusValidator
        // This checks both permission AND role hierarchy for the current status
        // Note: Use plural form 'company-updates' for resource name (but validator normalizes it)
        const editValidation = await canEditContent(req.user, companyUpdate, 'company-updates', 'update');
        if (!editValidation.canEdit) {
            return errorResponse(res, 403, editValidation.reason || 'You do not have permission to edit this company update');
        }
        
        // Prevent editing published content directly - must unpublish first
        // Exception: allow status-only updates (but still checked by workflow validator above)
        if (companyUpdate.status === 'published' && !isOnlyStatusUpdate) {
            return errorResponse(res, 400, 'Cannot edit published content. Please unpublish first or use workflow actions.');
        }

        // Update company update fields
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && key !== '_id' && key !== 'createdBy') {
                companyUpdate[key] = updateData[key];
            }
        });

        companyUpdate.updatedBy = req.user._id;
        await companyUpdate.save();

        const updatedCompanyUpdate = await CompanyUpdate.findById(companyUpdate._id)
            .populate('category', 'name slug')
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        return successResponse(
            res,
            200,
            'Company update updated successfully',
            { companyUpdate: updatedCompanyUpdate }
        );
    } catch (error) {
        console.error('Error in updateCompanyUpdate:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        if (error.code === 11000) {
            return errorResponse(res, 400, 'Company update with this slug already exists');
        }
        return errorResponse(res, 500, 'Failed to update company update', error.message);
    }
};

/**
 * Delete company update (soft delete)
 */
exports.deleteCompanyUpdate = async (req, res) => {
    try {
        const { id } = req.params;

        const companyUpdate = await CompanyUpdate.findOne({ _id: id, isActive: true });
        if (!companyUpdate) {
            return errorResponse(res, 404, 'Company update not found');
        }

        // Validate workflow status and permissions using workflowStatusValidator
        // This checks both permission AND role hierarchy for the current status
        // Note: Use plural form 'company-updates' for resource name (but validator normalizes it)
        const deleteValidation = await canDeleteContent(req.user, companyUpdate, 'company-updates');
        if (!deleteValidation.canDelete) {
            return errorResponse(res, 403, deleteValidation.reason || 'You do not have permission to delete this company update');
        }

        // Soft delete
        companyUpdate.isActive = false;
        companyUpdate.updatedBy = req.user._id;
        await companyUpdate.save();

        return successResponse(
            res,
            200,
            'Company update deleted successfully',
            { companyUpdate: { _id: companyUpdate._id, isActive: false } }
        );
    } catch (error) {
        console.error('Error in deleteCompanyUpdate:', error);
        return errorResponse(res, 500, 'Failed to delete company update', error.message);
    }
};

