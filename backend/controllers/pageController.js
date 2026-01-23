const Page = require('../models/Page');
const Section = require('../models/Section');
const ContentVersion = require('../models/ContentVersion');
const ActivityLog = require('../models/ActivityLog');
const pageTreeService = require('../services/pageTreeService');
const headerPageSyncService = require('../services/headerPageSyncService');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { canEditContent, canDeleteContent, canModifyTree, canModifyTreeBatch } = require('../utils/workflowStatusValidator');

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

        return successResponse(res, 200, 'Pages retrieved successfully', {
            pages,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getAllPages:', error);
        return errorResponse(res, 500, 'Failed to retrieve pages', error.message);
    }
};

/**
 * Get hierarchical page tree
 */
exports.getPageTree = async (req, res) => {
    try {
        const { includeInactive = false } = req.query;
        const tree = await pageTreeService.getTree(null, includeInactive === 'true');
        
        return successResponse(res, 200, 'Page tree retrieved successfully', { tree });
    } catch (error) {
        console.error('Error in getPageTree:', error);
        return errorResponse(res, 500, 'Failed to retrieve page tree', error.message);
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
            return errorResponse(res, 404, 'Page not found');
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

        return successResponse(res, 200, 'Page retrieved successfully', {
            page,
            breadcrumb,
            childrenCount,
            sectionsCount
        });
    } catch (error) {
        console.error('Error in getPageById:', error);
        return errorResponse(res, 500, 'Failed to retrieve page', error.message);
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
            return errorResponse(res, 400, 'Title and slug are required');
        }

        // Check slug uniqueness
        const isUnique = await pageTreeService.isSlugUnique(slug);
        if (!isUnique) {
            return errorResponse(res, 400, 'Slug already exists');
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

        // Sync to HeaderConfiguration if showInMenu is true
        if (page.showInMenu) {
            try {
                await headerPageSyncService.syncPageTreeToHeader(page._id, 'create', {
                    updatedBy: req.user._id
                });
            } catch (syncError) {
                console.error('Error syncing page to header after create:', syncError);
                // Don't fail the request if sync fails
            }
        }

        return successResponse(res, 201, 'Page created successfully', { page: populatedPage });
    } catch (error) {
        console.error('Error in createPage:', error);
        
        // Handle duplicate key error (shouldn't happen with partial index, but just in case)
        if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
            // Check if there's an active page with this slug
            const activePage = await Page.findOne({ slug: req.body.slug, isActive: true });
            if (activePage) {
                return errorResponse(res, 400, 'A page with this slug already exists');
            } else {
                // This shouldn't happen with partial index, but provide helpful message
                return errorResponse(res, 400, 'Slug already exists. Please try again or contact support if this persists.');
            }
        }
        
        return errorResponse(res, 500, 'Failed to create page', error.message);
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
            status,
            changeLog
        } = req.body;

        const page = await Page.findOne({ _id: id, isActive: true });
        if (!page) {
            return errorResponse(res, 404, 'Page not found');
        }

        // Check if we're only updating status (allow this even for published pages)
        const isOnlyStatusUpdate = Object.keys(req.body).length === 1 && req.body.hasOwnProperty('status');
        
        // Validate workflow status and permissions using workflowStatusValidator
        // This checks both permission AND role hierarchy for the current status
        // Note: canEditContent normalizes 'page' to 'pages' internally
        const editValidation = await canEditContent(req.user, page, 'pages', 'update');
        if (!editValidation.canEdit) {
            return errorResponse(res, 403, editValidation.reason || 'You do not have permission to edit this page');
        }
        
        // Prevent editing published content directly - must unpublish first
        // Exception: allow status-only updates (but still checked by workflow validator above)
        if (page.status === 'published' && !isOnlyStatusUpdate) {
            return errorResponse(res, 400, 'Cannot edit published content. Please unpublish first or use workflow actions.');
        }

        // Store old data for version comparison
        const oldData = page.toObject();

        // If slug is changing, check uniqueness
        if (slug && slug !== page.slug) {
            const isUnique = await pageTreeService.isSlugUnique(slug, id);
            if (!isUnique) {
                return errorResponse(res, 400, 'Slug already exists');
            }
            page.slug = slug;
        }

        // If parent is changing, recalculate path and level
        if (parentId !== undefined && parentId !== page.parentId?.toString()) {
            // Prevent circular references
            const isCircular = await pageTreeService.wouldCreateCircularReference(id, parentId);
            if (isCircular) {
                return errorResponse(res, 400, 'Cannot set parent: would create circular reference');
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
        
        // Handle status update
        if (status !== undefined) {
            // Validate status value
            const validStatuses = ['draft', 'in_review', 'pending_approval', 'pending_publish', 'published', 'changes_requested', 'archived'];
            if (!validStatuses.includes(status)) {
                return errorResponse(res, 400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
            }
            
            const oldStatus = page.status;
            page.status = status;
            
            // Set publishedAt timestamp when publishing
            if (status === 'published' && !page.publishedAt) {
                page.publishedAt = new Date();
            }
            
            // Clear publishedAt when unpublishing
            if (status !== 'published' && page.publishedAt) {
                page.publishedAt = null;
            }
            
            // Update associated sections when page status changes
            // If page is being published, publish ALL sections regardless of their current status
            if (status === 'published' && oldStatus !== 'published') {
                try {
                    const now = new Date();
                    // Update all sections to published status
                    // This ensures sections follow the page's publication status
                    const updateResult = await Section.updateMany(
                        { pageId: page._id },
                        { 
                            $set: {
                                status: 'published',
                                updatedBy: req.user._id,
                                updatedAt: now
                            }
                        }
                    );
                    
                    // Set publishedAt for sections that don't have it (null or missing)
                    // Use separate queries to handle null and missing fields
                    await Section.updateMany(
                        { 
                            pageId: page._id,
                            publishedAt: null
                        },
                        { 
                            $set: {
                                publishedAt: now
                            }
                        }
                    );
                    
                    await Section.updateMany(
                        { 
                            pageId: page._id,
                            publishedAt: { $exists: false }
                        },
                        { 
                            $set: {
                                publishedAt: now
                            }
                        }
                    );
                    
                    console.log(`Published ${updateResult.modifiedCount} section(s) for page ${page._id}`);
                } catch (sectionError) {
                    console.error('Error updating sections when publishing page:', sectionError);
                    // Don't fail the page update if section update fails, but log it
                }
            }
            
            // If page is being unpublished (to draft or archived), unpublish all published sections
            if (status !== 'published' && oldStatus === 'published') {
                await Section.updateMany(
                    { pageId: page._id, status: 'published' },
                    { 
                        status: 'draft',
                        publishedAt: null,
                        updatedBy: req.user._id
                    }
                );
            }
        }
        
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

        // Sync to HeaderConfiguration if showInMenu, title, path, or order changed
        const showInMenuChanged = showInMenu !== undefined && showInMenu !== oldData.showInMenu;
        const titleChanged = title && title !== oldData.title;
        const pathChanged = page.path !== oldData.path;
        
        if (showInMenuChanged || titleChanged || pathChanged) {
            try {
                const action = showInMenuChanged ? 'toggleMenu' : 'update';
                await headerPageSyncService.syncPageTreeToHeader(page._id, action, {
                    updatedBy: req.user._id
                });
            } catch (syncError) {
                console.error('Error syncing page to header after update:', syncError);
                // Don't fail the request if sync fails
            }
        }

        return successResponse(res, 200, 'Page updated successfully', { page: updatedPage });
    } catch (error) {
        console.error('Error in updatePage:', error);
        return errorResponse(res, 500, 'Failed to update page', error.message);
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
            return errorResponse(res, 404, 'Page not found');
        }

        // Validate workflow status and permissions using workflowStatusValidator
        // This checks both permission AND role hierarchy for the current status
        const deleteValidation = await canDeleteContent(req.user, page, 'page');
        if (!deleteValidation.canDelete) {
            return errorResponse(res, 403, deleteValidation.reason || 'You do not have permission to delete this page');
        }

        // Check if page has children
        const childrenCount = await Page.countDocuments({ 
            parentId: id, 
            isActive: true 
        });

        if (childrenCount > 0 && !cascade) {
            return errorResponse(
                res, 
                400,
                'Page has children. Set cascade=true to delete all descendants'
            );
        }

        const deletedCount = await pageTreeService.softDeletePage(id, req.user._id);

        // Sync to HeaderConfiguration after deletion
        try {
            await headerPageSyncService.syncPageTreeToHeader(id, 'delete', {
                updatedBy: req.user._id
            });
        } catch (syncError) {
            console.error('Error syncing page to header after delete:', syncError);
            // Don't fail the request if sync fails
        }

        return successResponse(
            res, 
            200,
            `Successfully deleted ${deletedCount} page(s)`,
            { deletedCount }
        );
    } catch (error) {
        console.error('Error in deletePage:', error);
        return errorResponse(res, 500, 'Failed to delete page', error.message);
    }
};

/**
 * Move page to new parent
 */
exports.movePage = async (req, res) => {
    try {
        const { id } = req.params;
        const { parentId } = req.body;

        // Fetch the page first to validate workflow status
        const page = await Page.findOne({ _id: id, isActive: true });
        if (!page) {
            return errorResponse(res, 404, 'Page not found');
        }

        // Validate workflow status and permissions using workflowStatusValidator
        // This checks both permission AND role hierarchy for the current status
        const treeValidation = await canModifyTree(req.user, page, 'page');
        if (!treeValidation.canModify) {
            return errorResponse(res, 403, treeValidation.reason || 'You do not have permission to move this page');
        }

        const movedPage = await pageTreeService.movePage(
            id, 
            parentId || null, 
            req.user._id
        );

        const populatedPage = await Page.findById(movedPage._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        // Sync to HeaderConfiguration after move (path changed)
        try {
            await headerPageSyncService.syncPageTreeToHeader(movedPage._id, 'update', {
                updatedBy: req.user._id
            });
        } catch (syncError) {
            console.error('Error syncing page to header after move:', syncError);
            // Don't fail the request if sync fails
        }

        return successResponse(res, 200, 'Page moved successfully', { page: populatedPage });
    } catch (error) {
        console.error('Error in movePage:', error);
        return errorResponse(res, 500, error.message || 'Failed to move page');
    }
};

/**
 * Reorder pages
 */
exports.reorderPages = async (req, res) => {
    try {
        // Accept both "pageOrders" and "pages" for backward compatibility
        const { pageOrders, pages } = req.body;
        const ordersArray = pageOrders || pages;

        if (!Array.isArray(ordersArray) || ordersArray.length === 0) {
            return errorResponse(res, 400, 'pageOrders or pages array is required');
        }

        // Map the array to the format expected by the service
        // Handle both { _id, order } and { pageId, order } formats
        const mappedOrders = ordersArray.map(item => ({
            pageId: item.pageId || item._id,
            order: item.order
        }));

        // Fetch all pages being reordered to validate workflow status
        const pageIds = mappedOrders.map(item => item.pageId);
        const pagesToReorder = await Page.find({ 
            _id: { $in: pageIds }, 
            isActive: true 
        });

        if (pagesToReorder.length !== pageIds.length) {
            return errorResponse(res, 404, 'One or more pages not found');
        }

        // Validate workflow status and permissions for all pages using workflowStatusValidator
        const batchValidation = await canModifyTreeBatch(req.user, pagesToReorder, 'page');
        if (!batchValidation.canModify) {
            return errorResponse(
                res, 
                403, 
                batchValidation.reason || 'You do not have permission to reorder one or more pages',
                { blockedPages: batchValidation.blockedPages }
            );
        }

        await pageTreeService.reorderPages(mappedOrders, req.user._id);

        // Sync to HeaderConfiguration after reorder
        try {
            await headerPageSyncService.syncPageTreeToHeader(null, 'reorder', {
                updatedBy: req.user._id
            });
        } catch (syncError) {
            console.error('Error syncing page to header after reorder:', syncError);
            // Don't fail the request if sync fails
        }

        return successResponse(res, 200, 'Pages reordered successfully', null);
    } catch (error) {
        console.error('Error in reorderPages:', error);
        return errorResponse(res, 500, 'Failed to reorder pages', error.message);
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
            201,
            'Page duplicated successfully',
            { page: populatedPage }
        );
    } catch (error) {
        console.error('Error in duplicatePage:', error);
        return errorResponse(res, 500, error.message || 'Failed to duplicate page');
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
            return errorResponse(res, 404, 'Page not found');
        }

        const children = await page.getChildren();

        return successResponse(res, 200, 'Page children retrieved successfully', { children });
    } catch (error) {
        console.error('Error in getPageChildren:', error);
        return errorResponse(res, 500, 'Failed to retrieve page children', error.message);
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
            return errorResponse(res, 404, 'Page not found');
        }

        const breadcrumb = await page.getBreadcrumb();

        return successResponse(res, 200, 'Breadcrumb retrieved successfully', { breadcrumb });
    } catch (error) {
        console.error('Error in getPageBreadcrumb:', error);
        return errorResponse(res, 500, 'Failed to retrieve breadcrumb', error.message);
    }
};

