const Project = require('../models/Project');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { canEditContent, canDeleteContent } = require('../utils/workflowStatusValidator');

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
            sortBy = 'order',
            sortOrder = 'asc'
        } = req.query;

        // Build query
        const query = { isActive: true };
        
        if (status) query.status = status;
        if (buildingType) query.buildingType = buildingType;
        if (country) query.country = country;
        if (region) query.region = region;
        if (area) query.area = area;
        if (industry) query.industry = industry;
        if (search) {
            query.$or = [
                { jobNumber: new RegExp(search, 'i') },
                { jobNumberSlug: new RegExp(search, 'i') }
            ];
        }

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const [projects, total] = await Promise.all([
            Project.find(query)
                .populate('buildingType', 'name')
                .populate('country', 'name code')
                .populate('region', 'name code')
                .populate('area', 'name code')
                .populate('industry', 'name slug logo')
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Project.countDocuments(query)
        ]);

        return successResponse(res, 200, 'Projects retrieved successfully', {
            projects,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
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
        
        const project = await Project.findOne({ _id: id, isActive: true })
            .populate('buildingType', 'name')
            .populate('country', 'name code')
            .populate('region', 'name code')
            .populate('area', 'name code')
            .populate('industry', 'name slug logo')
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');
        
        if (!project) {
            return errorResponse(res, 404, 'Project not found');
        }

        return successResponse(res, 200, 'Project retrieved successfully', { project });
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

const HOME_PAGE_PROJECTS_MAX = 6;
const HOME_PAGE_LIMIT_MESSAGE = "Already 6 projects are shown on home page. Remove 'Show on home page' from one project to add this one.";

/**
 * Create new project
 */
exports.createProject = async (req, res) => {
    try {
        if (req.body.showOnHomePage === true) {
            const homeCount = await Project.countDocuments({
                status: 'published',
                showOnHomePage: true,
                isActive: true
            });
            if (homeCount >= HOME_PAGE_PROJECTS_MAX) {
                return errorResponse(res, 400, HOME_PAGE_LIMIT_MESSAGE);
            }
        }

        const projectData = {
            ...req.body,
            createdBy: req.user._id
        };

        const project = new Project(projectData);
        await project.save();

        const populatedProject = await Project.findById(project._id)
            .populate('buildingType', 'name')
            .populate('country', 'name code')
            .populate('region', 'name code')
            .populate('area', 'name code')
            .populate('industry', 'name slug logo')
            .populate('createdBy', 'firstName lastName email');

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

        // Check if we're only updating status (allow this even for published projects)
        const isOnlyStatusUpdate = Object.keys(req.body).length === 1 && req.body.hasOwnProperty('status');
        
        // Validate workflow status and permissions using workflowStatusValidator
        // This checks both permission AND role hierarchy for the current status
        // Note: Use plural form 'projects' for resource name
        const editValidation = await canEditContent(req.user, project, 'projects', 'update');
        if (!editValidation.canEdit) {
            return errorResponse(res, 403, editValidation.reason || 'You do not have permission to edit this project');
        }

        if (updateData.showOnHomePage === true) {
            const homeQuery = {
                status: 'published',
                showOnHomePage: true,
                isActive: true,
                _id: { $ne: id }
            };
            const homeCount = await Project.countDocuments(homeQuery);
            if (homeCount >= HOME_PAGE_PROJECTS_MAX) {
                return errorResponse(res, 400, HOME_PAGE_LIMIT_MESSAGE);
            }
        }
        
        // Prevent editing published content directly - must unpublish first
        // Exception: allow status-only updates (but still checked by workflow validator above)
        if (project.status === 'published' && !isOnlyStatusUpdate) {
            return errorResponse(res, 400, 'Cannot edit published content. Please unpublish first or use workflow actions.');
        }

        // Update project fields
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && key !== '_id' && key !== 'createdBy') {
                project[key] = updateData[key];
            }
        });

        project.updatedBy = req.user._id;
        await project.save();

        const updatedProject = await Project.findById(project._id)
            .populate('buildingType', 'name')
            .populate('country', 'name code')
            .populate('region', 'name code')
            .populate('area', 'name code')
            .populate('industry', 'name slug logo')
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

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

        // Validate workflow status and permissions using workflowStatusValidator
        // This checks both permission AND role hierarchy for the current status
        // Note: Use plural form 'projects' for resource name
        const deleteValidation = await canDeleteContent(req.user, project, 'projects');
        if (!deleteValidation.canDelete) {
            return errorResponse(res, 403, deleteValidation.reason || 'You do not have permission to delete this project');
        }

        // Soft delete
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

