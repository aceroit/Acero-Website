const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation Utilities
 * Input validation schemas using express-validator
 */

/**
 * Middleware to check validation results
 */
exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// ========== User Validators ==========

exports.validateRegister = [
    body('firstName')
        .trim()
        .notEmpty().withMessage('First name is required')
        .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
        .trim()
        .notEmpty().withMessage('Last name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('role')
        .optional()
        .isIn(['super_admin', 'admin', 'approver', 'reviewer', 'editor', 'viewer'])
        .withMessage('Invalid role'),
    exports.validate
];

exports.validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required'),
    exports.validate
];

exports.validateUpdateUser = [
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('profilePicture')
        .optional()
        .isURL().withMessage('Profile picture must be a valid URL'),
    body('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean'),
    exports.validate
];

exports.validateChangePassword = [
    body('currentPassword')
        .notEmpty().withMessage('Current password is required'),
    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('confirmPassword')
        .notEmpty().withMessage('Confirm password is required')
        .custom((value, { req }) => value === req.body.newPassword)
        .withMessage('Passwords do not match'),
    exports.validate
];

// ========== Page Validators ==========

function validateOptionalImageObject(fieldName) {
    return body(fieldName)
        .optional({ nullable: true, checkFalsy: true })
        .custom((value) => {
            if (typeof value !== 'object' || Array.isArray(value)) {
                throw new Error(`${fieldName} must be an image object`);
            }

            if (value.url !== undefined && value.url !== null && typeof value.url !== 'string') {
                throw new Error(`${fieldName}.url must be a string`);
            }

            if (value.publicId !== undefined && value.publicId !== null && typeof value.publicId !== 'string') {
                throw new Error(`${fieldName}.publicId must be a string`);
            }

            if (value.width !== undefined && value.width !== null && !Number.isFinite(Number(value.width))) {
                throw new Error(`${fieldName}.width must be a number`);
            }

            if (value.height !== undefined && value.height !== null && !Number.isFinite(Number(value.height))) {
                throw new Error(`${fieldName}.height must be a number`);
            }

            return true;
        });
}

exports.validateCreatePage = [
    body('title')
        .trim()
        .notEmpty().withMessage('Page title is required')
        .isLength({ min: 2, max: 200 }).withMessage('Title must be between 2 and 200 characters'),
    body('slug')
        .optional()
        .trim()
        .matches(/^[a-z0-9-]+$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
    body('parentId')
        .optional({ nullable: true, checkFalsy: true })
        .custom((value) => {
            if (value === '' || value === null || value === undefined) {
                return true; // Allow empty, null, or undefined
            }
            return /^[0-9a-fA-F]{24}$/.test(value); // Validate MongoDB ObjectId format
        })
        .withMessage('Invalid parent page ID'),
    body('metaTitle')
        .optional()
        .trim()
        .isLength({ max: 120 }).withMessage('Meta title must not exceed 120 characters'),
    body('metaDescription')
        .optional()
        .trim()
        .isLength({ max: 400 }).withMessage('Meta description must not exceed 400 characters'),
    validateOptionalImageObject('metaImage'),
    body('showInMenu')
        .optional()
        .isBoolean().withMessage('showInMenu must be a boolean'),
    exports.validate
];

exports.validateUpdatePage = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 }).withMessage('Title must be between 2 and 200 characters'),
    body('slug')
        .optional()
        .trim()
        .matches(/^[a-z0-9-]+$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
    body('metaTitle')
        .optional()
        .trim()
        .isLength({ max: 120 }).withMessage('Meta title must not exceed 120 characters'),
    body('metaDescription')
        .optional()
        .trim()
        .isLength({ max: 400 }).withMessage('Meta description must not exceed 400 characters'),
    validateOptionalImageObject('metaImage'),
    body('showInMenu')
        .optional()
        .isBoolean().withMessage('showInMenu must be a boolean'),
    body('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean'),
    exports.validate
];

exports.validateMovePage = [
    body('newParentId')
        .optional()
        .isMongoId().withMessage('Invalid parent page ID'),
    body('order')
        .optional()
        .isInt({ min: 0 }).withMessage('Order must be a positive integer'),
    exports.validate
];

// ========== Section Validators ==========

exports.validateCreateSection = [
    body('sectionTypeSlug')
        .trim()
        .notEmpty().withMessage('Section type is required'),
    body('content')
        .notEmpty().withMessage('Section content is required')
        .isObject().withMessage('Content must be an object'),
    body('order')
        .optional()
        .isInt({ min: 0 }).withMessage('Order must be a positive integer'),
    body('isVisible')
        .optional()
        .isBoolean().withMessage('isVisible must be a boolean'),
    exports.validate
];

exports.validateUpdateSection = [
    body('content')
        .optional()
        .isObject().withMessage('Content must be an object'),
    body('order')
        .optional()
        .isInt({ min: 0 }).withMessage('Order must be a positive integer'),
    body('isVisible')
        .optional()
        .isBoolean().withMessage('isVisible must be a boolean'),
    body('cssClasses')
        .optional()
        .trim(),
    exports.validate
];

// ========== Section Type Validators ==========

exports.validateCreateSectionType = [
    body('name')
        .trim()
        .notEmpty().withMessage('Section type name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('slug')
        .trim()
        .notEmpty().withMessage('Slug is required')
        .matches(/^[a-z0-9-_]+$/).withMessage('Slug must contain only lowercase letters, numbers, hyphens, and underscores'),
    body('category')
        .optional()
        .trim()
        .isIn(['Headers', 'Content', 'Media', 'Forms', 'Custom'])
        .withMessage('Invalid category'),
    body('fields')
        .isArray({ min: 1 }).withMessage('At least one field is required'),
    body('fields.*.name')
        .trim()
        .notEmpty().withMessage('Field name is required'),
    body('fields.*.type')
        .isIn(['text', 'textarea', 'richtext', 'number', 'boolean', 'date', 'datetime', 'time', 'email', 'url', 'tel', 'image', 'video', 'file', 'select', 'multiselect', 'checkbox', 'radio', 'color', 'json', 'array'])
        .withMessage('Invalid field type'),
    exports.validate
];

// ========== Common Validators ==========

exports.validateId = [
    param('id')
        .isMongoId().withMessage('Invalid ID format'),
    exports.validate
];

exports.validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    exports.validate
];

exports.validateDateRange = [
    query('startDate')
        .optional()
        .isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
        .optional()
        .isISO8601().withMessage('End date must be a valid ISO 8601 date')
        .custom((value, { req }) => {
            if (req.query.startDate && value) {
                return new Date(value) >= new Date(req.query.startDate);
            }
            return true;
        }).withMessage('End date must be after start date'),
    exports.validate
];

exports.validateEmail = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    exports.validate
];

// ========== Permission Validators ==========

exports.validateUpdatePermission = [
    body('actions')
        .isArray().withMessage('Actions must be an array')
        .custom((actions) => {
            const validActions = ['create', 'read', 'update', 'delete', 'approve', 'publish'];
            return actions.every(action => validActions.includes(action));
        }).withMessage('Invalid action in array'),
    body('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean'),
    exports.validate
];

// ========== Workflow Validators ==========

exports.validateWorkflowAction = [
    body('feedback')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Feedback must not exceed 1000 characters'),
    body('changeLog')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Change log must not exceed 500 characters'),
    exports.validate
];

/**
 * Validate change summary for workflow actions
 * Requires changeSummary to be present, a non-empty string, and at least 10 characters
 * @param {Boolean} required - Whether changeSummary is required (default: true)
 * @param {Number} minLength - Minimum length (default: 10)
 * @param {Number} maxLength - Maximum length (default: 2000)
 * @returns {Array} Express-validator middleware array
 */
exports.validateChangeSummary = (required = true, minLength = 10, maxLength = 2000) => {
    if (required) {
        return [
            body('changeSummary')
                .trim()
                .notEmpty().withMessage('Change summary is required')
                .isString().withMessage('Change summary must be a string')
                .isLength({ min: minLength }).withMessage(`Change summary must be at least ${minLength} characters long`)
                .isLength({ max: maxLength }).withMessage(`Change summary must not exceed ${maxLength} characters`),
            exports.validate
        ];
    } else {
        return [
            body('changeSummary')
                .optional()
                .trim()
                .isString().withMessage('Change summary must be a string')
                .custom((value) => {
                    if (value && value.trim().length > 0 && value.trim().length < minLength) {
                        throw new Error(`Change summary must be at least ${minLength} characters long`);
                    }
                    return true;
                })
                .custom((value) => {
                    if (value && value.trim().length > maxLength) {
                        throw new Error(`Change summary must not exceed ${maxLength} characters`);
                    }
                    return true;
                }),
            exports.validate
        ];
    }
};

// ========== Media Validators ==========

exports.validateMediaUpload = [
    body('folder')
        .optional()
        .trim()
        .matches(/^[a-z0-9-_/]+$/).withMessage('Folder must contain only lowercase letters, numbers, hyphens, underscores, and slashes'),
    body('tags')
        .optional()
        .trim(),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
    body('altText')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('Alt text must not exceed 200 characters'),
    exports.validate
];

exports.validateMediaUpdate = [
    body('filename')
        .optional()
        .trim()
        .isLength({ min: 1, max: 255 }).withMessage('Filename must be between 1 and 255 characters'),
    body('tags')
        .optional()
        .trim(),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
    body('altText')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('Alt text must not exceed 200 characters'),
    body('isPublic')
        .optional()
        .isBoolean().withMessage('isPublic must be a boolean'),
    exports.validate
];

// ========== Sanitization Helpers ==========

/**
 * Sanitize HTML content
 */
exports.sanitizeHtml = (html) => {
    // Basic HTML sanitization
    // In production, use a library like DOMPurify or sanitize-html
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
};

/**
 * Validate and sanitize slug
 */
exports.sanitizeSlug = (text) => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

