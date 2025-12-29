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
            return errorResponse(res, 'Page not found', 404);
        }

        const sections = await Section.getPageSections(pageId, includeHidden === 'true');

        return successResponse(res, { sections }, 'Sections retrieved successfully');
    } catch (error) {
        console.error('Error in getPageSections:', error);
        return errorResponse(res, 'Failed to retrieve sections', 500, error.message);
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
            return errorResponse(res, 'Section not found', 404);
        }

        // Get section type details
        const sectionType = await sectionValidator.getFieldSchema(section.sectionTypeSlug);

        return successResponse(res, { 
            section,
            fieldSchema: sectionType
        }, 'Section retrieved successfully');
    } catch (error) {
        console.error('Error in getSectionById:', error);
        return errorResponse(res, 'Failed to retrieve section', 500, error.message);
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
            return errorResponse(res, 'Section type and content are required', 400);
        }

        // Verify page exists
        const page = await Page.findOne({ _id: pageId, isActive: true });
        if (!page) {
            return errorResponse(res, 'Page not found', 404);
        }

        // Validate section content against section type
        const validation = await sectionValidator.validateSectionContent(
            sectionTypeSlug, 
            content
        );

        if (!validation.isValid) {
            return errorResponse(
                res, 
                'Section content validation failed', 
                400, 
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
            { section: populatedSection }, 
            'Section created successfully', 
            201
        );
    } catch (error) {
        console.error('Error in createSection:', error);
        return errorResponse(res, 'Failed to create section', 500, error.message);
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
            changeLog
        } = req.body;

        const section = await Section.findById(id);
        if (!section) {
            return errorResponse(res, 'Section not found', 404);
        }

        // Prevent editing published content directly - must unpublish first
        if (section.status === 'published') {
            return errorResponse(res, 'Cannot edit published content. Please unpublish first or use workflow actions.', 400);
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
                    'Section content validation failed', 
                    400, 
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

        return successResponse(res, { section: updatedSection }, 'Section updated successfully');
    } catch (error) {
        console.error('Error in updateSection:', error);
        return errorResponse(res, 'Failed to update section', 500, error.message);
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
            return errorResponse(res, 'Section not found', 404);
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

        return successResponse(res, null, 'Section deleted successfully');
    } catch (error) {
        console.error('Error in deleteSection:', error);
        return errorResponse(res, 'Failed to delete section', 500, error.message);
    }
};

/**
 * Reorder sections
 */
exports.reorderSections = async (req, res) => {
    try {
        const { sectionOrders } = req.body;

        if (!Array.isArray(sectionOrders) || sectionOrders.length === 0) {
            return errorResponse(res, 'sectionOrders array is required', 400);
        }

        await Section.reorderSections(null, sectionOrders);

        return successResponse(res, null, 'Sections reordered successfully');
    } catch (error) {
        console.error('Error in reorderSections:', error);
        return errorResponse(res, 'Failed to reorder sections', 500, error.message);
    }
};

/**
 * Duplicate section
 */
exports.duplicateSection = async (req, res) => {
    try {
        const { id } = req.params;
        const { targetPageId } = req.body;

        const section = await Section.findById(id);
        if (!section) {
            return errorResponse(res, 'Section not found', 404);
        }

        // If moving to different page, verify it exists
        if (targetPageId && targetPageId !== section.pageId.toString()) {
            const targetPage = await Page.findOne({ _id: targetPageId, isActive: true });
            if (!targetPage) {
                return errorResponse(res, 'Target page not found', 404);
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
            { section: populatedSection }, 
            'Section duplicated successfully', 
            201
        );
    } catch (error) {
        console.error('Error in duplicateSection:', error);
        return errorResponse(res, 'Failed to duplicate section', 500, error.message);
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
            return errorResponse(res, 'Section not found', 404);
        }

        section.isVisible = !section.isVisible;
        section.updatedBy = req.user._id;
        await section.save();

        const updatedSection = await Section.findById(section._id)
            .populate('pageId', 'title slug path')
            .populate('updatedBy', 'firstName lastName email');

        return successResponse(
            res, 
            { section: updatedSection }, 
            `Section ${section.isVisible ? 'shown' : 'hidden'} successfully`
        );
    } catch (error) {
        console.error('Error in toggleVisibility:', error);
        return errorResponse(res, 'Failed to toggle section visibility', 500, error.message);
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

        return successResponse(res, {
            sections,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        }, 'Sections retrieved successfully');
    } catch (error) {
        console.error('Error in getSectionsByType:', error);
        return errorResponse(res, 'Failed to retrieve sections', 500, error.message);
    }
};

