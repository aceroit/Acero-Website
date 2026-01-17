const Customer = require('../models/Customer');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { canEditContent, canDeleteContent } = require('../utils/workflowStatusValidator');

/**
 * Get all customers (with filters and pagination)
 */
exports.getAllCustomers = async (req, res) => {
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
            query.name = new RegExp(search, 'i');
        }

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        // Secondary sort by name
        if (sortBy !== 'name') {
            sortOptions.name = 1;
        }

        const [customers, total] = await Promise.all([
            Customer.find(query)
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Customer.countDocuments(query)
        ]);

        return successResponse(res, 200, 'Customers retrieved successfully', {
            customers,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getAllCustomers:', error);
        return errorResponse(res, 500, 'Failed to retrieve customers', error.message);
    }
};

/**
 * Get single customer by ID
 */
exports.getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const customer = await Customer.findOne({ _id: id, isActive: true })
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');
        
        if (!customer) {
            return errorResponse(res, 404, 'Customer not found');
        }

        return successResponse(res, 200, 'Customer retrieved successfully', { customer });
    } catch (error) {
        console.error('Error in getCustomerById:', error);
        return errorResponse(res, 500, 'Failed to retrieve customer', error.message);
    }
};

/**
 * Create new customer
 */
exports.createCustomer = async (req, res) => {
    try {
        const customerData = {
            ...req.body,
            createdBy: req.user._id
        };

        const customer = new Customer(customerData);
        await customer.save();

        const populatedCustomer = await Customer.findById(customer._id)
            .populate('createdBy', 'firstName lastName email');

        return successResponse(
            res,
            201,
            'Customer created successfully',
            { customer: populatedCustomer }
        );
    } catch (error) {
        console.error('Error in createCustomer:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to create customer', error.message);
    }
};

/**
 * Update customer
 */
exports.updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const customer = await Customer.findOne({ _id: id, isActive: true });
        if (!customer) {
            return errorResponse(res, 404, 'Customer not found');
        }

        // Check if we're only updating status (allow this even for published customers)
        const isOnlyStatusUpdate = Object.keys(req.body).length === 1 && req.body.hasOwnProperty('status');
        
        // Validate workflow status and permissions using workflowStatusValidator
        // This checks both permission AND role hierarchy for the current status
        // Note: Use plural form 'customers' for resource name
        const editValidation = await canEditContent(req.user, customer, 'customers', 'update');
        if (!editValidation.canEdit) {
            return errorResponse(res, 403, editValidation.reason || 'You do not have permission to edit this customer');
        }
        
        // Prevent editing published content directly - must unpublish first
        // Exception: allow status-only updates (but still checked by workflow validator above)
        if (customer.status === 'published' && !isOnlyStatusUpdate) {
            return errorResponse(res, 400, 'Cannot edit published content. Please unpublish first or use workflow actions.');
        }

        // Update customer fields
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && key !== '_id' && key !== 'createdBy') {
                customer[key] = updateData[key];
            }
        });

        customer.updatedBy = req.user._id;
        await customer.save();

        const updatedCustomer = await Customer.findById(customer._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        return successResponse(
            res,
            200,
            'Customer updated successfully',
            { customer: updatedCustomer }
        );
    } catch (error) {
        console.error('Error in updateCustomer:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to update customer', error.message);
    }
};

/**
 * Delete customer (soft delete)
 */
exports.deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await Customer.findOne({ _id: id, isActive: true });
        if (!customer) {
            return errorResponse(res, 404, 'Customer not found');
        }

        // Validate workflow status and permissions using workflowStatusValidator
        // This checks both permission AND role hierarchy for the current status
        // Note: Use plural form 'customers' for resource name
        const deleteValidation = await canDeleteContent(req.user, customer, 'customers');
        if (!deleteValidation.canDelete) {
            return errorResponse(res, 403, deleteValidation.reason || 'You do not have permission to delete this customer');
        }

        // Soft delete
        customer.isActive = false;
        customer.updatedBy = req.user._id;
        await customer.save();

        return successResponse(
            res,
            200,
            'Customer deleted successfully',
            { customer: { _id: customer._id, isActive: false } }
        );
    } catch (error) {
        console.error('Error in deleteCustomer:', error);
        return errorResponse(res, 500, 'Failed to delete customer', error.message);
    }
};

