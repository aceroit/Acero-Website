const Industry = require('../models/Industry');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { canEditContent, canDeleteContent } = require('../utils/workflowStatusValidator');

/**
 * Get all industries (with filters and pagination)
 */
exports.getAllIndustries = async (req, res) => {
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
                { name: new RegExp(search, 'i') },
                { slug: new RegExp(search, 'i') }
            ];
        }

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        if (sortBy !== 'order' && sortBy !== 'name') {
            sortOptions.order = 1;
            sortOptions.name = 1;
        } else if (sortBy === 'order') {
            sortOptions.name = 1;
        }

        const [industries, total] = await Promise.all([
            Industry.find(query)
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Industry.countDocuments(query)
        ]);

        return successResponse(res, 200, 'Industries retrieved successfully', {
            industries,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getAllIndustries:', error);
        return errorResponse(res, 500, 'Failed to retrieve industries', error.message);
    }
};

/**
 * Get single industry by ID
 */
exports.getIndustryById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const industry = await Industry.findOne({ _id: id, isActive: true })
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');
        
        if (!industry) {
            return errorResponse(res, 404, 'Industry not found');
        }

        return successResponse(res, 200, 'Industry retrieved successfully', { industry });
    } catch (error) {
        console.error('Error in getIndustryById:', error);
        return errorResponse(res, 500, 'Failed to retrieve industry', error.message);
    }
};

/**
 * Get industry by slug
 */
exports.getIndustryBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        
        const industry = await Industry.findOne({ slug, isActive: true })
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');
        
        if (!industry) {
            return errorResponse(res, 404, 'Industry not found');
        }

        return successResponse(res, 200, 'Industry retrieved successfully', { industry });
    } catch (error) {
        console.error('Error in getIndustryBySlug:', error);
        return errorResponse(res, 500, 'Failed to retrieve industry', error.message);
    }
};

/**
 * Create new industry
 */
exports.createIndustry = async (req, res) => {
    try {
        const industryData = {
            ...req.body,
            createdBy: req.user._id
        };

        const industry = new Industry(industryData);
        await industry.save();

        const populatedIndustry = await Industry.findById(industry._id)
            .populate('createdBy', 'firstName lastName email');

        return successResponse(
            res,
            201,
            'Industry created successfully',
            { industry: populatedIndustry }
        );
    } catch (error) {
        console.error('Error in createIndustry:', error);
        if (error.code === 11000) {
            return errorResponse(res, 400, 'Industry with this name or slug already exists');
        }
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to create industry', error.message);
    }
};

/**
 * Update industry
 */
exports.updateIndustry = async (req, res) => {
    try {
        const { id } = req.params;
        
        const industry = await Industry.findById(id);
        
        if (!industry) {
            return errorResponse(res, 404, 'Industry not found');
        }

        if (!industry.isActive) {
            return errorResponse(res, 404, 'Industry not found');
        }

        // Check if user can edit based on workflow status
        const editValidation = await canEditContent(req.user, industry, 'industries', 'update');
        if (!editValidation.canEdit) {
            return errorResponse(res, 403, editValidation.reason || 'You do not have permission to edit this industry');
        }

        // Update fields
        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined && key !== '_id' && key !== 'createdBy') {
                industry[key] = req.body[key];
            }
        });
        industry.updatedBy = req.user._id;
        await industry.save();

        const updatedIndustry = await Industry.findById(industry._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        return successResponse(
            res,
            200,
            'Industry updated successfully',
            { industry: updatedIndustry }
        );
    } catch (error) {
        console.error('Error in updateIndustry:', error);
        if (error.code === 11000) {
            return errorResponse(res, 400, 'Industry with this name or slug already exists');
        }
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to update industry', error.message);
    }
};

/**
 * Delete industry (soft delete)
 */
exports.deleteIndustry = async (req, res) => {
    try {
        const { id } = req.params;
        
        const industry = await Industry.findById(id);
        
        if (!industry) {
            return errorResponse(res, 404, 'Industry not found');
        }

        if (!industry.isActive) {
            return errorResponse(res, 404, 'Industry not found');
        }

        // Check if user can delete based on workflow status
        const deleteValidation = await canDeleteContent(req.user, industry, 'industries');
        if (!deleteValidation.canDelete) {
            return errorResponse(res, 403, deleteValidation.reason || 'You do not have permission to delete this industry');
        }

        // Soft delete
        industry.isActive = false;
        industry.updatedBy = req.user._id;
        await industry.save();

        return successResponse(res, 200, 'Industry deleted successfully');
    } catch (error) {
        console.error('Error in deleteIndustry:', error);
        return errorResponse(res, 500, 'Failed to delete industry', error.message);
    }
};

