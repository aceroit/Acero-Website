const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateId } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/customers - Get all customers (with filters and pagination)
 */
router.get('/',
    checkPermission('customers', 'read'),
    customerController.getAllCustomers
);

/**
 * POST /api/customers - Create new customer
 */
router.post('/',
    checkPermission('customers', 'create'),
    customerController.createCustomer
);

/**
 * GET /api/customers/:id - Get customer by ID
 */
router.get('/:id',
    checkPermission('customers', 'read'),
    validateId,
    customerController.getCustomerById
);

/**
 * PUT /api/customers/:id - Update customer
 */
router.put('/:id',
    checkPermission('customers', 'update'),
    validateId,
    customerController.updateCustomer
);

/**
 * DELETE /api/customers/:id - Delete customer (soft delete)
 */
router.delete('/:id',
    checkPermission('customers', 'delete'),
    validateId,
    customerController.deleteCustomer
);

module.exports = router;

