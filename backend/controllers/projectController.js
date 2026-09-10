const Project = require('../models/Project');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { canEditContent, canDeleteContent } = require('../utils/workflowStatusValidator');
const {
    attachActiveRevisions,
    buildEditableResource,
    getActiveRevision,
    stagePublishedUpdate
} = require('../services/contentRevisionService');

const REVISION_USER_POPULATE = 'createdBy updatedBy reviewedBy approvedBy publishedBy';
const HOME_PAGE_PROJECTS_MAX = 6;
const HOME_PAGE_LIMIT_MESSAGE = "Already 6 projects are shown on home page. Remove 'Show on home page' from one project to add this one.";

function populateProjectQuery(query) {
    return query
        .populate('buildingType', 'name')
        .populate('country', 'name code')
        .populate('region', 'name code')
        .populate('area', 'name code')
        .populate('industry', 'name slug logo')
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email');
}

function matchesProjectSearch(project, search) {
    if (!search) return true;
    const normalizedSearch = String(search).trim().toLowerCase();
    if (!normalizedSearch) return true;

    const searchableValues = [
        project.jobNumber,
        project.jobNumberSlug,
        project.typeSlug,
        project.country?.name,
        project.country?.code,
        project.region?.name,
        project.region?.code,
        project.industry?.name,
        project.industry?.slug,
        project.buildingType?.name
    ];

    return searchableValues.some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
}

function getProjectActivityTime(project) {
    const activityDate = project.activeRevision?.updatedAt || project.updatedAt || project.createdAt;
    const time = activityDate ? new Date(activityDate).getTime() : 0;
    return Number.isNaN(time) ? 0 : time;
}

function getProjectSortValue(project, sortBy) {
    switch (sortBy) {
        case 'order':
            return Number(project.order ?? 0);
        case 'createdAt': {
            const time = project.createdAt ? new Date(project.createdAt).getTime() : 0;
            return Number.isNaN(time) ? 0 : time;
        }
        case 'jobNumber':
            return project.jobNumber || '';
        case 'status':
            return project.status || '';
        case 'updatedAt':
        default:
            return getProjectActivityTime(project);
    }
}

function sortProjects(projects, sortBy, sortOrder) {
    const direction = sortOrder === 'asc' ? 1 : -1;

    return [...projects].sort((a, b) => {
        const valueA = getProjectSortValue(a, sortBy);
        const valueB = getProjectSortValue(b, sortBy);
        let comparison = 0;

        if (typeof valueA === 'number' && typeof valueB === 'number') {
            comparison = valueA - valueB;
        } else {
            comparison = String(valueA).localeCompare(String(valueB), undefined, {
                numeric: true,
                sensitivity: 'base'
            });
        }

        if (comparison !== 0) {
            return comparison * direction;
        }

        return getProjectActivityTime(b) - getProjectActivityTime(a);
    });
}

async function assertHomePageLimit(projectIdToExclude = null) {
    const homeQuery = {
        status: 'published',
        showOnHomePage: true,
        isActive: true
    };

    if (projectIdToExclude) {
        homeQuery._id = { $ne: projectIdToExclude };
    }

    const homeCount = await Project.countDocuments(homeQuery);
    if (homeCount >= HOME_PAGE_PROJECTS_MAX) {
        throw new Error(HOME_PAGE_LIMIT_MESSAGE);
    }
}

/**
 * Get all projects (with filters and pagination)
 */
exports.getAllProjects = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            buildingType,
            country,
            region,
            area,
            industry,
            search,
            sortBy = 'updatedAt',
            sortOrder = 'desc'
        } = req.query;

        const query = { isActive: true };
        if (buildingType) query.buildingType = buildingType;
        if (country) query.country = country;
        if (region) query.region = region;
        if (area) query.area = area;
        if (industry) query.industry = industry;

        const allowedSortFields = new Set(['updatedAt', 'createdAt', 'order', 'jobNumber', 'status']);
        const normalizedSortBy = allowedSortFields.has(sortBy) ? sortBy : 'updatedAt';
        const normalizedSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
        const sortOptions = { [normalizedSortBy]: normalizedSortOrder === 'asc' ? 1 : -1 };
        const allProjects = await populateProjectQuery(Project.find(query).sort(sortOptions));
        const mergedProjects = await attachActiveRevisions('project', allProjects, REVISION_USER_POPULATE);

        const filteredProjects = mergedProjects.filter((project) => {
            if (status && project.status !== status) {
                return false;
            }
            return matchesProjectSearch(project, search);
        });
        const sortedProjects = sortProjects(filteredProjects, normalizedSortBy, normalizedSortOrder);

        const currentPage = parseInt(page, 10);
        const perPage = parseInt(limit, 10);
        const skip = (currentPage - 1) * perPage;
        const paginatedProjects = sortedProjects.slice(skip, skip + perPage);

        return successResponse(res, 200, 'Projects retrieved successfully', {
            projects: paginatedProjects,
            pagination: {
                total: sortedProjects.length,
                page: currentPage,
                limit: perPage,
                totalPages: Math.ceil(sortedProjects.length / perPage)
            }
        });
    } catch (error) {
        console.error('Error in getAllProjects:', error);
        return errorResponse(res, 500, 'Failed to retrieve projects', error.message);
    }
};

/**
 * Get single project by ID
 */
exports.getProjectById = async (req, res) => {
    try {
        const { id } = req.params;

        const project = await populateProjectQuery(Project.findOne({ _id: id, isActive: true }));
        if (!project) {
            return errorResponse(res, 404, 'Project not found');
        }

        const revision = await getActiveRevision('project', project._id, REVISION_USER_POPULATE);
        const editableProject = buildEditableResource(project, revision);

        return successResponse(res, 200, 'Project retrieved successfully', {
            project: editableProject,
            activeRevision: editableProject.activeRevision
        });
    } catch (error) {
        console.error('Error in getProjectById:', error);
        return errorResponse(res, 500, 'Failed to retrieve project', error.message);
    }
};

/**
 * Get project by slug
 */
exports.getProjectBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const project = await Project.findBySlug(slug)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        if (!project) {
            return errorResponse(res, 404, 'Project not found');
        }

        return successResponse(res, 200, 'Project retrieved successfully', { project });
    } catch (error) {
        console.error('Error in getProjectBySlug:', error);
        return errorResponse(res, 500, 'Failed to retrieve project', error.message);
    }
};

/**
 * Create new project
 */
exports.createProject = async (req, res) => {
    try {
        if (req.body.showOnHomePage === true) {
            await assertHomePageLimit();
        }

        const projectData = {
            ...req.body,
            createdBy: req.user._id
        };

        const project = new Project(projectData);
        await project.save();

        const populatedProject = await populateProjectQuery(Project.findById(project._id));

        return successResponse(
            res,
            201,
            'Project created successfully',
            { project: populatedProject }
        );
    } catch (error) {
        console.error('Error in createProject:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        if (error.code === 11000) {
            return errorResponse(res, 400, 'Project with this job number slug already exists');
        }
        if (error.message === HOME_PAGE_LIMIT_MESSAGE) {
            return errorResponse(res, 400, HOME_PAGE_LIMIT_MESSAGE);
        }
        return errorResponse(res, 500, 'Failed to create project', error.message);
    }
};

/**
 * Update project
 */
exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const project = await Project.findOne({ _id: id, isActive: true });
        if (!project) {
            return errorResponse(res, 404, 'Project not found');
        }

        const isOnlyStatusUpdate = Object.keys(req.body).length === 1 && Object.prototype.hasOwnProperty.call(req.body, 'status');

        if (updateData.showOnHomePage === true && !project.showOnHomePage) {
            await assertHomePageLimit(id);
        }

        if (project.status === 'published' && !isOnlyStatusUpdate) {
            const revision = await stagePublishedUpdate({
                resource: 'project',
                liveDoc: project,
                updateData,
                userId: req.user._id
            });

            const populatedProject = await populateProjectQuery(Project.findById(project._id));
            const populatedRevision = await getActiveRevision('project', project._id, REVISION_USER_POPULATE);
            const editableProject = buildEditableResource(populatedProject, populatedRevision || revision);

            return successResponse(
                res,
                200,
                'Project changes staged successfully. The published website will keep showing the current live version until this revision is published.',
                {
                    project: editableProject,
                    activeRevision: editableProject.activeRevision
                }
            );
        }

        const editValidation = await canEditContent(req.user, project, 'projects', 'update');
        if (!editValidation.canEdit) {
            return errorResponse(res, 403, editValidation.reason || 'You do not have permission to edit this project');
        }

        if (project.status === 'published' && !isOnlyStatusUpdate) {
            return errorResponse(res, 400, 'Cannot edit published content. Please unpublish first or use workflow actions.');
        }

        Object.keys(updateData).forEach((key) => {
            if (updateData[key] !== undefined && key !== '_id' && key !== 'createdBy') {
                project[key] = updateData[key];
            }
        });

        project.updatedBy = req.user._id;
        await project.save();

        const updatedProject = await populateProjectQuery(Project.findById(project._id));

        return successResponse(
            res,
            200,
            'Project updated successfully',
            { project: updatedProject }
        );
    } catch (error) {
        console.error('Error in updateProject:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        if (error.code === 11000) {
            return errorResponse(res, 400, 'Project with this job number slug already exists');
        }
        if (error.message === HOME_PAGE_LIMIT_MESSAGE) {
            return errorResponse(res, 400, HOME_PAGE_LIMIT_MESSAGE);
        }
        return errorResponse(res, 500, 'Failed to update project', error.message);
    }
};

/**
 * Delete project (soft delete)
 */
exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;

        const project = await Project.findOne({ _id: id, isActive: true });
        if (!project) {
            return errorResponse(res, 404, 'Project not found');
        }

        const deleteValidation = await canDeleteContent(req.user, project, 'projects');
        if (!deleteValidation.canDelete) {
            return errorResponse(res, 403, deleteValidation.reason || 'You do not have permission to delete this project');
        }

        project.isActive = false;
        project.updatedBy = req.user._id;
        await project.save();

        return successResponse(
            res,
            200,
            'Project deleted successfully',
            { project: { _id: project._id, isActive: false } }
        );
    } catch (error) {
        console.error('Error in deleteProject:', error);
        return errorResponse(res, 500, 'Failed to delete project', error.message);
    }
};
