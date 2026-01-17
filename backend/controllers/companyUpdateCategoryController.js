const CompanyUpdateCategory = require('../models/CompanyUpdateCategory');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { canEditContent, canDeleteContent } = require('../utils/workflowStatusValidator');

/**
 * Get all company update categories (with filters and pagination)
 */
exports.getAllCompanyUpdateCategories = async (req, res) => {
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
            query.$or = [
                { name: new RegExp(search, 'i') },
                { slug: new RegExp(search, 'i') }
            ];
        }

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        // Secondary sort by name if not already sorting by it
        if (sortBy !== 'name') {
            sortOptions.name = 1;
        }

        const [categories, total] = await Promise.all([
            CompanyUpdateCategory.find(query)
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            CompanyUpdateCategory.countDocuments(query)
        ]);

        return successResponse(res, 200, 'Company update categories retrieved successfully', {
            categories,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getAllCompanyUpdateCategories:', error);
        return errorResponse(res, 500, 'Failed to retrieve company update categories', error.message);
    }
};

/**
 * Get single company update category by ID
 */
exports.getCompanyUpdateCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const category = await CompanyUpdateCategory.findOne({ _id: id, isActive: true })
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');
        
        if (!category) {
            return errorResponse(res, 404, 'Company update category not found');
        }

        return successResponse(res, 200, 'Company update category retrieved successfully', { category });
    } catch (error) {
        console.error('Error in getCompanyUpdateCategoryById:', error);
        return errorResponse(res, 500, 'Failed to retrieve company update category', error.message);
    }
};

/**
 * Get company update category by slug
 */
exports.getCompanyUpdateCategoryBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        
        const category = await CompanyUpdateCategory.findBySlug(slug)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');
        
        if (!category) {
            return errorResponse(res, 404, 'Company update category not found');
        }

        return successResponse(res, 200, 'Company update category retrieved successfully', { category });
    } catch (error) {
        console.error('Error in getCompanyUpdateCategoryBySlug:', error);
        return errorResponse(res, 500, 'Failed to retrieve company update category', error.message);
    }
};

/**
 * Create new company update category
 */
exports.createCompanyUpdateCategory = async (req, res) => {
    try {
        const categoryData = {
            ...req.body,
            createdBy: req.user._id
        };

        const category = new CompanyUpdateCategory(categoryData);
        await category.save();

        const populatedCategory = await CompanyUpdateCategory.findById(category._id)
            .populate('createdBy', 'firstName lastName email');

        return successResponse(
            res,
            201,
            'Company update category created successfully',
            { category: populatedCategory }
        );
    } catch (error) {
        console.error('Error in createCompanyUpdateCategory:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        if (error.code === 11000) {
            return errorResponse(res, 400, 'Company update category with this name or slug already exists');
        }
        return errorResponse(res, 500, 'Failed to create company update category', error.message);
    }
};

/**
 * Update company update category
 */
exports.updateCompanyUpdateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const category = await CompanyUpdateCategory.findOne({ _id: id, isActive: true });
        if (!category) {
            return errorResponse(res, 404, 'Company update category not found');
        }

        // Check if we're only updating status (allow this even for published categories)
        const isOnlyStatusUpdate = Object.keys(req.body).length === 1 && req.body.hasOwnProperty('status');
        
        // Validate workflow status and permissions using workflowStatusValidator
        // This checks both permission AND role hierarchy for the current status
        // Note: Use plural form 'company-update-categories' for resource name (but validator normalizes it)
        const editValidation = await canEditContent(req.user, category, 'company-update-categories', 'update');
        if (!editValidation.canEdit) {
            return errorResponse(res, 403, editValidation.reason || 'You do not have permission to edit this company update category');
        }
        
        // Prevent editing published content directly - must unpublish first
        // Exception: allow status-only updates (but still checked by workflow validator above)
        if (category.status === 'published' && !isOnlyStatusUpdate) {
            return errorResponse(res, 400, 'Cannot edit published content. Please unpublish first or use workflow actions.');
        }

        // Update category fields
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && key !== '_id' && key !== 'createdBy') {
                category[key] = updateData[key];
            }
        });

        category.updatedBy = req.user._id;
        await category.save();

        const updatedCategory = await CompanyUpdateCategory.findById(category._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        return successResponse(
            res,
            200,
            'Company update category updated successfully',
            { category: updatedCategory }
        );
    } catch (error) {
        console.error('Error in updateCompanyUpdateCategory:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        if (error.code === 11000) {
            return errorResponse(res, 400, 'Company update category with this name or slug already exists');
        }
        return errorResponse(res, 500, 'Failed to update company update category', error.message);
    }
};

/**
 * Delete company update category (soft delete)
 */
exports.deleteCompanyUpdateCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await CompanyUpdateCategory.findOne({ _id: id, isActive: true });
        if (!category) {
            return errorResponse(res, 404, 'Company update category not found');
        }

        // Validate workflow status and permissions using workflowStatusValidator
        // This checks both permission AND role hierarchy for the current status
        // Note: Use plural form 'company-update-categories' for resource name (but validator normalizes it)
        const deleteValidation = await canDeleteContent(req.user, category, 'company-update-categories');
        if (!deleteValidation.canDelete) {
            return errorResponse(res, 403, deleteValidation.reason || 'You do not have permission to delete this company update category');
        }

        // Soft delete
        category.isActive = false;
        category.updatedBy = req.user._id;
        await category.save();

        return successResponse(
            res,
            200,
            'Company update category deleted successfully',
            { category: { _id: category._id, isActive: false } }
        );
    } catch (error) {
        console.error('Error in deleteCompanyUpdateCategory:', error);
        return errorResponse(res, 500, 'Failed to delete company update category', error.message);
    }
};

