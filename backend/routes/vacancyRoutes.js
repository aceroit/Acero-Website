const express = require('express');
const router = express.Router();
const vacancyController = require('../controllers/vacancyController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { validateId } = require('../utils/validators');

// All routes require authentication
router.use(authenticate);

// GET /api/vacancies - list
router.get(
    '/',
    checkPermission('vacancies', 'read'),
    vacancyController.getAllVacancies
);

// GET /api/vacancies/:id - get by id
router.get(
    '/:id',
    checkPermission('vacancies', 'read'),
    validateId,
    vacancyController.getVacancyById
);

// POST /api/vacancies - create
router.post(
    '/',
    checkPermission('vacancies', 'create'),
    vacancyController.createVacancy
);

// PUT /api/vacancies/:id - update
router.put(
    '/:id',
    checkPermission('vacancies', 'update'),
    validateId,
    vacancyController.updateVacancy
);

// DELETE /api/vacancies/:id - soft delete
router.delete(
    '/:id',
    checkPermission('vacancies', 'delete'),
    validateId,
    vacancyController.deleteVacancy
);

module.exports = router;


