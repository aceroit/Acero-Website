const Page = require('../models/Page');
const Section = require('../models/Section');
const ContentVersion = require('../models/ContentVersion');
const ActivityLog = require('../models/ActivityLog');
const pageTreeService = require('../services/pageTreeService');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * Get all pages (flat list with filters and pagination)
 */
exports.getAllPages = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            level,
            showInMenu,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = { isActive: true };
        
        if (status) query.status = status;
        if (level !== undefined) query.level = parseInt(level);
        if (showInMenu !== undefined) query.showInMenu = showInMenu === 'true';
        if (search) {
            query.$or = [
                { title: new RegExp(search, 'i') },
                { slug: new RegExp(search, 'i') },
                { path: new RegExp(search, 'i') }
            ];
        }

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const [pages, total] = await Promise.all([
            Page.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email'),
            Page.countDocuments(query)
        ]);

        return successResponse(res, {
            pages,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        }, 'Pages retrieved successfully');
    } catch (error) {
        console.error('Error in getAllPages:', error);
        return errorResponse(res, 'Failed to retrieve pages', 500, error.message);
    }
};

/**
 * Get hierarchical page tree
 */
exports.getPageTree = async (req, res) => {
    try {
        const { includeInactive = false } = req.query;
        const tree = await pageTreeService.getTree(null, includeInactive === 'true');
        
        return successResponse(res, { tree }, 'Page tree retrieved successfully');
    } catch (error) {
        console.error('Error in getPageTree:', error);
        return errorResponse(res, 'Failed to retrieve page tree', 500, error.message);
    }
};

/**
 * Get single page by ID
 */
exports.getPageById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const page = await Page.findOne({ _id: id, isActive: true })
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');
        
        if (!page) {
            return errorResponse(res, 'Page not found', 404);
        }

        // Get breadcrumb trail
        const breadcrumb = await page.getBreadcrumb();
        
        // Get children count
        const childrenCount = await Page.countDocuments({ 
            parentId: page._id, 
            isActive: true 
        });

        // Get sections count
        const sectionsCount = await Section.countDocuments({ pageId: page._id });

        return successResponse(res, {
            page,
            breadcrumb,
            childrenCount,
            sectionsCount
        }, 'Page retrieved successfully');
    } catch (error) {
        console.error('Error in getPageById:', error);
        return errorResponse(res, 'Failed to retrieve page', 500, error.message);
    }
};

/**
 * Create new page
 */
exports.createPage = async (req, res) => {
    try {
        const {
            title,
            slug,
            parentId,
            metaTitle,
            metaDescription,
            metaKeywords,
            showInMenu,
            menuIcon,
            permissions
        } = req.body;

        // Validate required fields
        if (!title || !slug) {
            return errorResponse(res, 'Title and slug are required', 400);
        }

        // Check slug uniqueness
        const isUnique = await pageTreeService.isSlugUnique(slug);
        if (!isUnique) {
            return errorResponse(res, 'Slug already exists', 400);
        }

        // Calculate path, level, and order
        const { path, level } = await pageTreeService.calculatePathAndLevel(
            parentId || null, 
            slug
        );
        const order = await pageTreeService.getNextOrder(parentId || null);

        // Create page
        const page = new Page({
            title,
            slug,
            parentId: parentId || null,
            path,
            level,
            order,
            metaTitle,
            metaDescription,
            metaKeywords,
            showInMenu: showInMenu !== undefined ? showInMenu : true,
            menuIcon,
            permissions,
            createdBy: req.user._id,
            status: 'draft'
        });

        await page.save();

        const populatedPage = await Page.findById(page._id)
            .populate('createdBy', 'firstName lastName email');

        return successResponse(res, { page: populatedPage }, 'Page created successfully', 201);
    } catch (error) {
        console.error('Error in createPage:', error);
        return errorResponse(res, 'Failed to create page', 500, error.message);
    }
};

/**
 * Update page
 */
exports.updatePage = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            slug,
            parentId,
            metaTitle,
            metaDescription,
            metaKeywords,
            showInMenu,
            menuIcon,
            permissions,
            changeLog
        } = req.body;

        const page = await Page.findOne({ _id: id, isActive: true });
        if (!page) {
            return errorResponse(res, 'Page not found', 404);
        }

        // Prevent editing published content directly - must unpublish first
        if (page.status === 'published') {
            return errorResponse(res, 'Cannot edit published content. Please unpublish first or use workflow actions.', 400);
        }

        // Store old data for version comparison
        const oldData = page.toObject();

        // If slug is changing, check uniqueness
        if (slug && slug !== page.slug) {
            const isUnique = await pageTreeService.isSlugUnique(slug, id);
            if (!isUnique) {
                return errorResponse(res, 'Slug already exists', 400);
            }
            page.slug = slug;
        }

        // If parent is changing, recalculate path and level
        if (parentId !== undefined && parentId !== page.parentId?.toString()) {
            // Prevent circular references
            const isCircular = await pageTreeService.wouldCreateCircularReference(id, parentId);
            if (isCircular) {
                return errorResponse(res, 'Cannot set parent: would create circular reference', 400);
            }

            const oldPath = page.path;
            const { path: newPath, level: newLevel } = await pageTreeService.calculatePathAndLevel(
                parentId || null, 
                page.slug
            );
            
            page.parentId = parentId || null;
            page.path = newPath;
            page.level = newLevel;
            
            // Update descendants
            await pageTreeService.updateDescendantPaths(id, newPath);
        }

        // Update other fields
        if (title) page.title = title;
        if (metaTitle !== undefined) page.metaTitle = metaTitle;
        if (metaDescription !== undefined) page.metaDescription = metaDescription;
        if (metaKeywords !== undefined) page.metaKeywords = metaKeywords;
        if (showInMenu !== undefined) page.showInMenu = showInMenu;
        if (menuIcon !== undefined) page.menuIcon = menuIcon;
        if (permissions) page.permissions = permissions;
        
        page.updatedBy = req.user._id;

        await page.save();

        // Create content version for tracking changes
        await ContentVersion.createVersion(
            'page',
            page._id,
            page.toObject(),
            req.user._id,
            page.status,
            changeLog || 'Page updated'
        );

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'update',
            resource: 'page',
            resourceId: page._id,
            changes: {
                before: oldData,
                after: page.toObject()
            }
        });

        const updatedPage = await Page.findById(page._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        return successResponse(res, { page: updatedPage }, 'Page updated successfully');
    } catch (error) {
        console.error('Error in updatePage:', error);
        return errorResponse(res, 'Failed to update page', 500, error.message);
    }
};

/**
 * Delete page (soft delete)
 */
exports.deletePage = async (req, res) => {
    try {
        const { id } = req.params;
        const { cascade = true } = req.query;

        const page = await Page.findOne({ _id: id, isActive: true });
        if (!page) {
            return errorResponse(res, 'Page not found', 404);
        }

        // Check if page has children
        const childrenCount = await Page.countDocuments({ 
            parentId: id, 
            isActive: true 
        });

        if (childrenCount > 0 && !cascade) {
            return errorResponse(
                res, 
                'Page has children. Set cascade=true to delete all descendants', 
                400
            );
        }

        const deletedCount = await pageTreeService.softDeletePage(id, req.user._id);

        return successResponse(
            res, 
            { deletedCount }, 
            `Successfully deleted ${deletedCount} page(s)`
        );
    } catch (error) {
        console.error('Error in deletePage:', error);
        return errorResponse(res, 'Failed to delete page', 500, error.message);
    }
};

/**
 * Move page to new parent
 */
exports.movePage = async (req, res) => {
    try {
        const { id } = req.params;
        const { parentId } = req.body;

        const movedPage = await pageTreeService.movePage(
            id, 
            parentId || null, 
            req.user._id
        );

        const populatedPage = await Page.findById(movedPage._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        return successResponse(res, { page: populatedPage }, 'Page moved successfully');
    } catch (error) {
        console.error('Error in movePage:', error);
        return errorResponse(res, error.message || 'Failed to move page', 500);
    }
};

/**
 * Reorder pages
 */
exports.reorderPages = async (req, res) => {
    try {
        const { pageOrders } = req.body;

        if (!Array.isArray(pageOrders) || pageOrders.length === 0) {
            return errorResponse(res, 'pageOrders array is required', 400);
        }

        await pageTreeService.reorderPages(pageOrders);

        return successResponse(res, null, 'Pages reordered successfully');
    } catch (error) {
        console.error('Error in reorderPages:', error);
        return errorResponse(res, 'Failed to reorder pages', 500, error.message);
    }
};

/**
 * Duplicate page
 */
exports.duplicatePage = async (req, res) => {
    try {
        const { id } = req.params;
        const { includeSections = false } = req.body;

        const newPage = await pageTreeService.duplicatePage(
            id, 
            req.user._id, 
            includeSections
        );

        const populatedPage = await Page.findById(newPage._id)
            .populate('createdBy', 'firstName lastName email');

        return successResponse(
            res, 
            { page: populatedPage }, 
            'Page duplicated successfully', 
            201
        );
    } catch (error) {
        console.error('Error in duplicatePage:', error);
        return errorResponse(res, error.message || 'Failed to duplicate page', 500);
    }
};

/**
 * Get direct children of a page
 */
exports.getPageChildren = async (req, res) => {
    try {
        const { id } = req.params;

        const page = await Page.findOne({ _id: id, isActive: true });
        if (!page) {
            return errorResponse(res, 'Page not found', 404);
        }

        const children = await page.getChildren();

        return successResponse(res, { children }, 'Page children retrieved successfully');
    } catch (error) {
        console.error('Error in getPageChildren:', error);
        return errorResponse(res, 'Failed to retrieve page children', 500, error.message);
    }
};

/**
 * Get breadcrumb trail for a page
 */
exports.getPageBreadcrumb = async (req, res) => {
    try {
        const { id } = req.params;

        const page = await Page.findOne({ _id: id, isActive: true });
        if (!page) {
            return errorResponse(res, 'Page not found', 404);
        }

        const breadcrumb = await page.getBreadcrumb();

        return successResponse(res, { breadcrumb }, 'Breadcrumb retrieved successfully');
    } catch (error) {
        console.error('Error in getPageBreadcrumb:', error);
        return errorResponse(res, 'Failed to retrieve breadcrumb', 500, error.message);
    }
};

