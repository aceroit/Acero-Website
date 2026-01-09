const Section = require('../models/Section');
const Page = require('../models/Page');
const ContentVersion = require('../models/ContentVersion');
const ActivityLog = require('../models/ActivityLog');
const sectionValidator = require('../services/sectionValidator');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * Get all sections for a specific page
 */
exports.getPageSections = async (req, res) => {
    try {
        const { pageId } = req.params;
        const { includeHidden = false } = req.query;

        // Verify page exists
        const page = await Page.findOne({ _id: pageId, isActive: true });
        if (!page) {
            return errorResponse(res, 404, 'Page not found');
        }

        const sections = await Section.getPageSections(pageId, includeHidden === 'true');

        return successResponse(res, 200, 'Sections retrieved successfully', { sections });
    } catch (error) {
        console.error('Error in getPageSections:', error);
        return errorResponse(res, 500, 'Failed to retrieve sections', error.message);
    }
};

/**
 * Get single section by ID
 */
exports.getSectionById = async (req, res) => {
    try {
        const { id } = req.params;

        const section = await Section.findById(id)
            .populate('pageId', 'title slug path')
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        if (!section) {
            return errorResponse(res, 404, 'Section not found');
        }

        // Get section type details
        const sectionType = await sectionValidator.getFieldSchema(section.sectionTypeSlug);

        return successResponse(res, 200, 'Section retrieved successfully', { 
            section,
            fieldSchema: sectionType
        });
    } catch (error) {
        console.error('Error in getSectionById:', error);
        return errorResponse(res, 500, 'Failed to retrieve section', error.message);
    }
};

/**
 * Create new section
 */
exports.createSection = async (req, res) => {
    try {
        const { pageId } = req.params;
        const {
            sectionTypeSlug,
            content,
            order,
            isVisible,
            cssClasses,
            customStyles
        } = req.body;

        // Validate required fields
        if (!sectionTypeSlug || !content) {
            return errorResponse(res, 400, 'Section type and content are required');
        }

        // Verify page exists
        const page = await Page.findOne({ _id: pageId, isActive: true });
        if (!page) {
            return errorResponse(res, 404, 'Page not found');
        }

        // Validate section content against section type
        const validation = await sectionValidator.validateSectionContent(
            sectionTypeSlug, 
            content
        );

        if (!validation.isValid) {
            return errorResponse(
                res, 
                400,
                'Section content validation failed',
                validation.errors
            );
        }

        // Calculate order if not provided
        let sectionOrder = order;
        if (sectionOrder === undefined) {
            const lastSection = await Section.findOne({ pageId })
                .sort({ order: -1 })
                .select('order');
            sectionOrder = lastSection ? lastSection.order + 1 : 0;
        }

        // Create section
        const section = new Section({
            pageId,
            sectionTypeSlug,
            content,
            order: sectionOrder,
            isVisible: isVisible !== undefined ? isVisible : true,
            cssClasses: cssClasses || '',
            customStyles: customStyles || {},
            status: 'draft',
            createdBy: req.user._id
        });

        await section.save();

        const populatedSection = await Section.findById(section._id)
            .populate('pageId', 'title slug path')
            .populate('createdBy', 'firstName lastName email');

        return successResponse(
            res, 
            201,
            'Section created successfully',
            { section: populatedSection }
        );
    } catch (error) {
        console.error('Error in createSection:', error);
        return errorResponse(res, 500, 'Failed to create section', error.message);
    }
};

/**
 * Update section
 */
exports.updateSection = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            content,
            isVisible,
            cssClasses,
            customStyles,
            status,
            changeLog
        } = req.body;

        const section = await Section.findById(id);
        if (!section) {
            return errorResponse(res, 404, 'Section not found');
        }

        // Check if we're only updating status (allow this even for published sections)
        const isOnlyStatusUpdate = Object.keys(req.body).length === 1 && req.body.hasOwnProperty('status');
        
        // Prevent editing published content directly - must unpublish first
        // Exception: allow status-only updates
        if (section.status === 'published' && !isOnlyStatusUpdate) {
            return errorResponse(res, 400, 'Cannot edit published content. Please unpublish first or use workflow actions.');
        }

        // Store old data for version comparison
        const oldData = section.toObject();

        // If content is being updated, validate it
        if (content) {
            const validation = await sectionValidator.validateSectionContent(
                section.sectionTypeSlug, 
                content
            );

            if (!validation.isValid) {
                return errorResponse(
                    res, 
                    400,
                    'Section content validation failed',
                    validation.errors
                );
            }

            section.content = content;
            section.version += 1;
        }

        // Update other fields
        if (isVisible !== undefined) section.isVisible = isVisible;
        if (cssClasses !== undefined) section.cssClasses = cssClasses;
        if (customStyles !== undefined) section.customStyles = customStyles;
        
        // Handle status update
        if (status !== undefined) {
            // Validate status value
            const validStatuses = ['draft', 'in_review', 'pending_approval', 'pending_publish', 'published', 'changes_requested'];
            if (!validStatuses.includes(status)) {
                return errorResponse(res, 400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
            }
            
            section.status = status;
            
            // Set publishedAt timestamp when publishing
            if (status === 'published' && !section.publishedAt) {
                section.publishedAt = new Date();
            }
            
            // Clear publishedAt when unpublishing
            if (status !== 'published' && section.publishedAt) {
                section.publishedAt = null;
            }
        }

        section.updatedBy = req.user._id;

        await section.save();

        // Create content version for tracking changes
        await ContentVersion.createVersion(
            'section',
            section._id,
            section.toObject(),
            req.user._id,
            section.status,
            changeLog || 'Section updated'
        );

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'update',
            resource: 'section',
            resourceId: section._id,
            changes: {
                before: oldData,
                after: section.toObject()
            }
        });

        const updatedSection = await Section.findById(section._id)
            .populate('pageId', 'title slug path')
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        return successResponse(res, 200, 'Section updated successfully', { section: updatedSection });
    } catch (error) {
        console.error('Error in updateSection:', error);
        return errorResponse(res, 500, 'Failed to update section', error.message);
    }
};

/**
 * Delete section
 */
exports.deleteSection = async (req, res) => {
    try {
        const { id } = req.params;

        const section = await Section.findById(id);
        if (!section) {
            return errorResponse(res, 404, 'Section not found');
        }

        const pageId = section.pageId;
        const deletedOrder = section.order;

        // Delete the section
        await Section.findByIdAndDelete(id);

        // Reorder remaining sections to fill the gap
        await Section.updateMany(
            { pageId, order: { $gt: deletedOrder } },
            { $inc: { order: -1 } }
        );

        return successResponse(res, 200, 'Section deleted successfully', null);
    } catch (error) {
        console.error('Error in deleteSection:', error);
        return errorResponse(res, 500, 'Failed to delete section', error.message);
    }
};

/**
 * Reorder sections
 */
exports.reorderSections = async (req, res) => {
    try {
        const { sectionOrders } = req.body;

        if (!Array.isArray(sectionOrders) || sectionOrders.length === 0) {
            return errorResponse(res, 400, 'sectionOrders array is required');
        }

        await Section.reorderSections(null, sectionOrders);

        return successResponse(res, 200, 'Sections reordered successfully', null);
    } catch (error) {
        console.error('Error in reorderSections:', error);
        return errorResponse(res, 500, 'Failed to reorder sections', error.message);
    }
};

/**
 * Duplicate section
 */
exports.duplicateSection = async (req, res) => {
    try {
        const { id } = req.params;
        const { targetPageId } = req.body || {};

        const section = await Section.findById(id);
        if (!section) {
            return errorResponse(res, 404, 'Section not found');
        }

        // If moving to different page, verify it exists
        if (targetPageId && targetPageId !== section.pageId.toString()) {
            const targetPage = await Page.findOne({ _id: targetPageId, isActive: true });
            if (!targetPage) {
                return errorResponse(res, 404, 'Target page not found');
            }
        }

        const newSection = await section.duplicate(targetPageId || null);
        newSection.createdBy = req.user._id;
        await newSection.save();

        const populatedSection = await Section.findById(newSection._id)
            .populate('pageId', 'title slug path')
            .populate('createdBy', 'firstName lastName email');

        return successResponse(
            res, 
            201,
            'Section duplicated successfully',
            { section: populatedSection }
        );
    } catch (error) {
        console.error('Error in duplicateSection:', error);
        return errorResponse(res, 500, 'Failed to duplicate section', error.message);
    }
};

/**
 * Toggle section visibility
 */
exports.toggleVisibility = async (req, res) => {
    try {
        const { id } = req.params;

        const section = await Section.findById(id);
        if (!section) {
            return errorResponse(res, 404, 'Section not found');
        }

        section.isVisible = !section.isVisible;
        section.updatedBy = req.user._id;
        await section.save();

        const updatedSection = await Section.findById(section._id)
            .populate('pageId', 'title slug path')
            .populate('updatedBy', 'firstName lastName email');

        return successResponse(
            res, 
            200,
            `Section ${section.isVisible ? 'shown' : 'hidden'} successfully`,
            { section: updatedSection }
        );
    } catch (error) {
        console.error('Error in toggleVisibility:', error);
        return errorResponse(res, 500, 'Failed to toggle section visibility', error.message);
    }
};

/**
 * Get sections by section type
 */
exports.getSectionsByType = async (req, res) => {
    try {
        const { slug } = req.params;
        const { page = 1, limit = 20, status } = req.query;

        // Build query
        const query = { sectionTypeSlug: slug };
        if (status) query.status = status;

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [sections, total] = await Promise.all([
            Section.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('pageId', 'title slug path')
                .populate('createdBy', 'firstName lastName email'),
            Section.countDocuments(query)
        ]);

        return successResponse(res, 200, 'Sections retrieved successfully', {
            sections,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getSectionsByType:', error);
        return errorResponse(res, 500, 'Failed to retrieve sections', error.message);
    }
};

