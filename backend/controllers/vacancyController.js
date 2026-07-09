const Vacancy = require('../models/Vacancy');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { canEditContent, canDeleteContent } = require('../utils/workflowStatusValidator');
const {
    attachActiveRevisions,
    buildEditableResource,
    getActiveRevision,
    stagePublishedUpdate
} = require('../services/contentRevisionService');

const REVISION_USER_POPULATE = 'createdBy updatedBy reviewedBy approvedBy publishedBy';

function populateVacancyQuery(query) {
    return query
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email');
}

function matchesVacancySearch(vacancy, search) {
    if (!search) return true;
    const regex = new RegExp(search, 'i');
    return regex.test(vacancy.title || '') || regex.test(vacancy.department || '') || regex.test(vacancy.location || '');
}

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

        const query = { isActive: true };
        if (department) query.department = department;
        if (type) query.type = type;
        if (featured !== undefined) query.featured = featured === 'true';

        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        const allVacancies = await populateVacancyQuery(Vacancy.find(query).sort(sortOptions));
        const mergedVacancies = await attachActiveRevisions('vacancy', allVacancies, REVISION_USER_POPULATE);

        const filteredVacancies = mergedVacancies.filter((vacancy) => {
            if (status && vacancy.status !== status) {
                return false;
            }
            return matchesVacancySearch(vacancy, search);
        });

        const currentPage = parseInt(page, 10);
        const perPage = parseInt(limit, 10);
        const skip = (currentPage - 1) * perPage;
        const paginatedVacancies = filteredVacancies.slice(skip, skip + perPage);

        return successResponse(res, 200, 'Vacancies retrieved successfully', {
            vacancies: paginatedVacancies,
            pagination: {
                total: filteredVacancies.length,
                page: currentPage,
                limit: perPage,
                totalPages: Math.ceil(filteredVacancies.length / perPage)
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

        const vacancy = await populateVacancyQuery(Vacancy.findOne({ _id: id, isActive: true }));
        if (!vacancy) {
            return errorResponse(res, 404, 'Vacancy not found');
        }

        const revision = await getActiveRevision('vacancy', vacancy._id, REVISION_USER_POPULATE);
        const editableVacancy = buildEditableResource(vacancy, revision);

        return successResponse(res, 200, 'Vacancy retrieved successfully', {
            vacancy: editableVacancy,
            activeRevision: editableVacancy.activeRevision
        });
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

        const populatedVacancy = await populateVacancyQuery(Vacancy.findById(vacancy._id));

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

        const isOnlyStatusUpdate = Object.keys(req.body).length === 1 && Object.prototype.hasOwnProperty.call(req.body, 'status');

        if (vacancy.status === 'published' && !isOnlyStatusUpdate) {
            const revision = await stagePublishedUpdate({
                resource: 'vacancy',
                liveDoc: vacancy,
                updateData,
                userId: req.user._id
            });

            const populatedVacancy = await populateVacancyQuery(Vacancy.findById(vacancy._id));
            const populatedRevision = await getActiveRevision('vacancy', vacancy._id, REVISION_USER_POPULATE);
            const editableVacancy = buildEditableResource(populatedVacancy, populatedRevision || revision);

            return successResponse(
                res,
                200,
                'Vacancy changes staged successfully. The published website will keep showing the current live version until this revision is published.',
                {
                    vacancy: editableVacancy,
                    activeRevision: editableVacancy.activeRevision
                }
            );
        }

        const editValidation = await canEditContent(req.user, vacancy, 'vacancies', 'update');
        if (!editValidation.canEdit) {
            return errorResponse(res, 403, editValidation.reason || 'You do not have permission to edit this vacancy');
        }

        if (vacancy.status === 'published' && !isOnlyStatusUpdate) {
            return errorResponse(res, 400, 'Cannot edit published content. Please unpublish first or use workflow actions.');
        }

        Object.keys(updateData).forEach((key) => {
            if (updateData[key] !== undefined && key !== '_id' && key !== 'createdBy') {
                vacancy[key] = updateData[key];
            }
        });

        vacancy.updatedBy = req.user._id;
        await vacancy.save();

        const updatedVacancy = await populateVacancyQuery(Vacancy.findById(vacancy._id));

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

        const deleteValidation = await canDeleteContent(req.user, vacancy, 'vacancies');
        if (!deleteValidation.canDelete) {
            return errorResponse(res, 403, deleteValidation.reason || 'You do not have permission to delete this vacancy');
        }

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
