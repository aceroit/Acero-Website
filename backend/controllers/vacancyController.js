const Vacancy = require('../models/Vacancy');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { canEditContent, canDeleteContent } = require('../utils/workflowStatusValidator');
const notificationService = require('../services/notificationService');

/**
 * Get all vacancies (with filters and pagination)
 */
exports.getAllVacancies = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            department,
            type,
            featured,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = { isActive: true };
        
        if (status) query.status = status;
        if (department) query.department = department;
        if (type) query.type = type;
        if (featured !== undefined) query.featured = featured === 'true';
        if (search) {
            query.$or = [
                { title: new RegExp(search, 'i') },
                { department: new RegExp(search, 'i') },
                { location: new RegExp(search, 'i') }
            ];
        }

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const [vacancies, total] = await Promise.all([
            Vacancy.find(query)
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Vacancy.countDocuments(query)
        ]);

        return successResponse(res, 200, 'Vacancies retrieved successfully', {
            vacancies,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getAllVacancies:', error);
        return errorResponse(res, 500, 'Failed to retrieve vacancies', error.message);
    }
};

/**
 * Get single vacancy by ID
 */
exports.getVacancyById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const vacancy = await Vacancy.findOne({ _id: id, isActive: true })
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');
        
        if (!vacancy) {
            return errorResponse(res, 404, 'Vacancy not found');
        }

        return successResponse(res, 200, 'Vacancy retrieved successfully', { vacancy });
    } catch (error) {
        console.error('Error in getVacancyById:', error);
        return errorResponse(res, 500, 'Failed to retrieve vacancy', error.message);
    }
};

/**
 * Create new vacancy
 */
exports.createVacancy = async (req, res) => {
    try {
        const vacancyData = {
            ...req.body,
            createdBy: req.user._id
        };

        const vacancy = new Vacancy(vacancyData);
        await vacancy.save();

        const populatedVacancy = await Vacancy.findById(vacancy._id)
            .populate('createdBy', 'firstName lastName email');

        return successResponse(
            res,
            201,
            'Vacancy created successfully',
            { vacancy: populatedVacancy }
        );
    } catch (error) {
        console.error('Error in createVacancy:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to create vacancy', error.message);
    }
};

/**
 * Update vacancy
 */
exports.updateVacancy = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const vacancy = await Vacancy.findOne({ _id: id, isActive: true });
        if (!vacancy) {
            return errorResponse(res, 404, 'Vacancy not found');
        }

        // Check if we're only updating status (allow this even for published vacancies)
        const isOnlyStatusUpdate = Object.keys(req.body).length === 1 && req.body.hasOwnProperty('status');
        
        // Validate workflow status and permissions using workflowStatusValidator
        // This checks both permission AND role hierarchy for the current status
        // Note: Use plural form 'vacancies' for resource name
        const editValidation = await canEditContent(req.user, vacancy, 'vacancies', 'update');
        if (!editValidation.canEdit) {
            return errorResponse(res, 403, editValidation.reason || 'You do not have permission to edit this vacancy');
        }
        
        // Prevent editing published content directly - must unpublish first
        // Exception: allow status-only updates (but still checked by workflow validator above)
        if (vacancy.status === 'published' && !isOnlyStatusUpdate) {
            return errorResponse(res, 400, 'Cannot edit published content. Please unpublish first or use workflow actions.');
        }

        // Update vacancy fields
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && key !== '_id' && key !== 'createdBy') {
                vacancy[key] = updateData[key];
            }
        });

        vacancy.updatedBy = req.user._id;
        await vacancy.save();

        const updatedVacancy = await Vacancy.findById(vacancy._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        return successResponse(
            res,
            200,
            'Vacancy updated successfully',
            { vacancy: updatedVacancy }
        );
    } catch (error) {
        console.error('Error in updateVacancy:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to update vacancy', error.message);
    }
};

/**
 * Delete vacancy (soft delete)
 */
exports.deleteVacancy = async (req, res) => {
    try {
        const { id } = req.params;

        const vacancy = await Vacancy.findOne({ _id: id, isActive: true });
        if (!vacancy) {
            return errorResponse(res, 404, 'Vacancy not found');
        }

        // Validate workflow status and permissions using workflowStatusValidator
        // This checks both permission AND role hierarchy for the current status
        // Note: Use plural form 'vacancies' for resource name
        const deleteValidation = await canDeleteContent(req.user, vacancy, 'vacancies');
        if (!deleteValidation.canDelete) {
            return errorResponse(res, 403, deleteValidation.reason || 'You do not have permission to delete this vacancy');
        }

        // Soft delete
        vacancy.isActive = false;
        vacancy.updatedBy = req.user._id;
        await vacancy.save();

        return successResponse(
            res,
            200,
            'Vacancy deleted successfully',
            { vacancy: { _id: vacancy._id, isActive: false } }
        );
    } catch (error) {
        console.error('Error in deleteVacancy:', error);
        return errorResponse(res, 500, 'Failed to delete vacancy', error.message);
    }
};

