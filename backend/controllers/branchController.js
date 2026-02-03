const Branch = require('../models/Branch');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { canEditContent, canDeleteContent } = require('../utils/workflowStatusValidator');

/**
 * Get all branches (with filters and pagination)
 */
exports.getAllBranches = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            country,
            state,
            city,
            isHeadOffice,
            search,
            sortBy = 'order',
            sortOrder = 'asc'
        } = req.query;

        // Build query
        const query = { isActive: true };
        
        if (status) query.status = status;
        if (country) query.country = country;
        if (state) query.state = state;
        if (city) query.city = city;
        if (isHeadOffice !== undefined) query.isHeadOffice = isHeadOffice === 'true';
        if (search) {
            query.$or = [
                { branchName: new RegExp(search, 'i') },
                { city: new RegExp(search, 'i') },
                { state: new RegExp(search, 'i') }
            ];
        }

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        // Secondary sort: order then isHeadOffice then branchName for consistent listing
        if (sortBy !== 'order') sortOptions.order = 1;
        if (sortBy !== 'isHeadOffice') sortOptions.isHeadOffice = -1;
        if (sortBy !== 'branchName') sortOptions.branchName = 1;

        const [branches, total] = await Promise.all([
            Branch.find(query)
                .populate('country', 'name code')
                .populate('manager', 'firstName lastName email')
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Branch.countDocuments(query)
        ]);

        return successResponse(res, 200, 'Branches retrieved successfully', {
            branches,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getAllBranches:', error);
        return errorResponse(res, 500, 'Failed to retrieve branches', error.message);
    }
};

/**
 * Get single branch by ID
 */
exports.getBranchById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const branch = await Branch.findOne({ _id: id, isActive: true })
            .populate('country', 'name code')
            .populate('manager', 'firstName lastName email')
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');
        
        if (!branch) {
            return errorResponse(res, 404, 'Branch not found');
        }

        return successResponse(res, 200, 'Branch retrieved successfully', { branch });
    } catch (error) {
        console.error('Error in getBranchById:', error);
        return errorResponse(res, 500, 'Failed to retrieve branch', error.message);
    }
};

/**
 * Create new branch
 */
exports.createBranch = async (req, res) => {
    try {
        const branchData = {
            ...req.body,
            createdBy: req.user._id
        };
        // Set order to end of list if not provided
        if (branchData.order === undefined) {
            const lastBranch = await Branch.findOne({ isActive: true }).sort({ order: -1 }).select('order');
            branchData.order = lastBranch ? lastBranch.order + 1 : 0;
        }

        const branch = new Branch(branchData);
        await branch.save();

        const populatedBranch = await Branch.findById(branch._id)
            .populate('country', 'name code')
            .populate('manager', 'firstName lastName email')
            .populate('createdBy', 'firstName lastName email');

        return successResponse(
            res,
            201,
            'Branch created successfully',
            { branch: populatedBranch }
        );
    } catch (error) {
        console.error('Error in createBranch:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to create branch', error.message);
    }
};

/**
 * Update branch
 */
exports.updateBranch = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const branch = await Branch.findOne({ _id: id, isActive: true });
        if (!branch) {
            return errorResponse(res, 404, 'Branch not found');
        }

        // Check if we're only updating status (allow this even for published branches)
        const isOnlyStatusUpdate = Object.keys(req.body).length === 1 && req.body.hasOwnProperty('status');
        
        // Validate workflow status and permissions using workflowStatusValidator
        // This checks both permission AND role hierarchy for the current status
        // Note: Use plural form 'branches' for resource name
        const editValidation = await canEditContent(req.user, branch, 'branches', 'update');
        if (!editValidation.canEdit) {
            return errorResponse(res, 403, editValidation.reason || 'You do not have permission to edit this branch');
        }
        
        // Prevent editing published content directly - must unpublish first
        // Exception: allow status-only updates (but still checked by workflow validator above)
        if (branch.status === 'published' && !isOnlyStatusUpdate) {
            return errorResponse(res, 400, 'Cannot edit published content. Please unpublish first or use workflow actions.');
        }

        // Update branch fields
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && key !== '_id' && key !== 'createdBy') {
                branch[key] = updateData[key];
            }
        });

        branch.updatedBy = req.user._id;
        await branch.save();

        const updatedBranch = await Branch.findById(branch._id)
            .populate('country', 'name code')
            .populate('manager', 'firstName lastName email')
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        return successResponse(
            res,
            200,
            'Branch updated successfully',
            { branch: updatedBranch }
        );
    } catch (error) {
        console.error('Error in updateBranch:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to update branch', error.message);
    }
};

/**
 * Delete branch (soft delete)
 */
exports.deleteBranch = async (req, res) => {
    try {
        const { id } = req.params;

        const branch = await Branch.findOne({ _id: id, isActive: true });
        if (!branch) {
            return errorResponse(res, 404, 'Branch not found');
        }

        // Validate workflow status and permissions using workflowStatusValidator
        // This checks both permission AND role hierarchy for the current status
        // Note: Use plural form 'branches' for resource name
        const deleteValidation = await canDeleteContent(req.user, branch, 'branches');
        if (!deleteValidation.canDelete) {
            return errorResponse(res, 403, deleteValidation.reason || 'You do not have permission to delete this branch');
        }

        // Soft delete
        branch.isActive = false;
        branch.updatedBy = req.user._id;
        await branch.save();

        return successResponse(
            res,
            200,
            'Branch deleted successfully',
            { branch: { _id: branch._id, isActive: false } }
        );
    } catch (error) {
        console.error('Error in deleteBranch:', error);
        return errorResponse(res, 500, 'Failed to delete branch', error.message);
    }
};

/**
 * Reorder branches (bulk update order values)
 * Body: { branchOrders: [{ branchId, order }, ...] }
 */
exports.reorderBranches = async (req, res) => {
    try {
        const { branchOrders } = req.body;

        if (!Array.isArray(branchOrders) || branchOrders.length === 0) {
            return errorResponse(res, 400, 'branchOrders array is required');
        }

        const ids = branchOrders.map(item => item.branchId || item._id || item.id);
        const branches = await Branch.find({ _id: { $in: ids }, isActive: true });

        if (branches.length !== ids.length) {
            return errorResponse(res, 404, 'One or more branches not found');
        }

        const { canEditContent } = require('../utils/workflowStatusValidator');
        for (const branch of branches) {
            const validation = await canEditContent(req.user, branch, 'branches', 'update');
            if (!validation.canEdit) {
                return errorResponse(res, 403, validation.reason || 'You do not have permission to reorder one or more branches');
            }
        }

        const mappedOrders = branchOrders.map(item => ({
            branchId: item.branchId || item._id || item.id,
            order: Number(item.order) >= 0 ? Number(item.order) : 0
        }));

        await Branch.reorderBranches(mappedOrders);

        return successResponse(res, 200, 'Branches reordered successfully', null);
    } catch (error) {
        console.error('Error in reorderBranches:', error);
        return errorResponse(res, 500, 'Failed to reorder branches', error.message);
    }
};

