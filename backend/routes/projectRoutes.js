const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateId } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/projects - Get all projects (with filters and pagination)
 */
router.get('/',
    checkPermission('projects', 'read'),
    projectController.getAllProjects
);

/**
 * POST /api/projects - Create new project
 */
router.post('/',
    checkPermission('projects', 'create'),
    projectController.createProject
);

/**
 * GET /api/projects/slug/:slug - Get project by slug
 */
router.get('/slug/:slug',
    checkPermission('projects', 'read'),
    projectController.getProjectBySlug
);

/**
 * GET /api/projects/:id - Get project by ID
 */
router.get('/:id',
    checkPermission('projects', 'read'),
    validateId,
    projectController.getProjectById
);

/**
 * PUT /api/projects/:id - Update project
 */
router.put('/:id',
    checkPermission('projects', 'update'),
    validateId,
    projectController.updateProject
);

/**
 * DELETE /api/projects/:id - Delete project (soft delete)
 */
router.delete('/:id',
    checkPermission('projects', 'delete'),
    validateId,
    projectController.deleteProject
);

module.exports = router;

