const Section = require('../models/Section');
const Page = require('../models/Page');
const ContentVersion = require('../models/ContentVersion');
const ActivityLog = require('../models/ActivityLog');
const sectionValidator = require('../services/sectionValidator');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { canCreateSection, canEditContent, canDeleteContent, canModifyTree } = require('../utils/workflowStatusValidator');
const {
    attachActiveRevisions,
    buildEditableResource,
    getActiveRevision,
    stagePublishedUpdate
} = require('../services/contentRevisionService');

const REVISION_USER_POPULATE = 'createdBy updatedBy reviewedBy approvedBy publishedBy';

function populateSectionQuery(query) {
    return query
        .populate('pageId', 'title slug path status createdBy')
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email');
}

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

        const sections = await populateSectionQuery(
            Section.find(includeHidden === 'true' ? { pageId } : { pageId, isVisible: true }).sort({ order: 1 })
        );
        const mergedSections = await attachActiveRevisions('section', sections, REVISION_USER_POPULATE);

        return successResponse(res, 200, 'Sections retrieved successfully', { sections: mergedSections });
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

        const section = await populateSectionQuery(Section.findById(id));

        if (!section) {
            return errorResponse(res, 404, 'Section not found');
        }

        const revision = await getActiveRevision('section', section._id, REVISION_USER_POPULATE);
        const editableSection = buildEditableResource(section, revision);

        // Get section type details
        const sectionType = await sectionValidator.getFieldSchema(editableSection.sectionTypeSlug);

        return successResponse(res, 200, 'Section retrieved successfully', { 
            section: editableSection,
            activeRevision: editableSection.activeRevision,
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

        // Validate workflow status and permissions using workflowStatusValidator
        // This checks both permission AND role hierarchy for the parent page's current status
        const createValidation = await canCreateSection(req.user, page);
        if (!createValidation.canCreate) {
            return errorResponse(res, 403, createValidation.reason || 'You do not have permission to create sections on this page');
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

        const section = await Section.findById(id).populate('pageId', 'status createdBy');
        if (!section) {
            return errorResponse(res, 404, 'Section not found');
        }

        // Check if parent page exists
        if (!section.pageId) {
            return errorResponse(res, 404, 'Parent page not found');
        }

        // Check if we're only updating status (allow this even for published sections)
        const isOnlyStatusUpdate = Object.keys(req.body).length === 1 && req.body.hasOwnProperty('status');
        
        // IMPORTANT: Block ALL section updates (including visibility, content, etc.) when section is in restricted status
        // UNLESS: user is Admin/Super Admin OR user has permission + appropriate role
        // OR: this is a status-only update (workflow transition)
        const restrictedSectionStatuses = ['in_review', 'pending_approval', 'pending_publish'];
        
        if (restrictedSectionStatuses.includes(section.status) && !isOnlyStatusUpdate) {
            // Check if user can edit content in this section status
            const sectionEditValidation = await canEditContent(req.user, section, 'sections', 'update');
            if (!sectionEditValidation.canEdit) {
                return errorResponse(res, 403, `Cannot edit section. Section is in '${section.status}' status. ${sectionEditValidation.reason || 'You do not have permission to edit sections in this status.'}`);
            }
        }
        
        // IMPORTANT: If parent page is in_review, pending_approval, or pending_publish, block all section edits
        // UNLESS: user is Admin/Super Admin OR user has permission + appropriate role for parent page status
        // OR: this is a status-only update (workflow transition) - allows sections to have individual workflow
        // EXCEPTION: If parent page is in draft or changes_requested, sections can have their own workflow independently
        const parentPageStatus = section.pageId.status;
        const restrictedParentStatuses = ['in_review', 'pending_approval', 'pending_publish'];
        
        // Allow sections to have individual workflow when parent page is in draft or changes_requested
        const allowIndividualWorkflow = ['draft', 'changes_requested'].includes(parentPageStatus);
        
        if (restrictedParentStatuses.includes(parentPageStatus) && !isOnlyStatusUpdate && !allowIndividualWorkflow) {
            // Check if user can edit content in parent page status
            const parentPageEditValidation = await canEditContent(req.user, section.pageId, 'pages', 'update');
            if (!parentPageEditValidation.canEdit) {
                return errorResponse(res, 403, `Cannot edit section. Parent page is in '${parentPageStatus}' status. ${parentPageEditValidation.reason || 'You do not have permission to edit sections when parent page is in this status.'}`);
            }
        }
        
        const editValidation = await canEditContent(req.user, section, 'sections', 'update');
        if (!editValidation.canEdit) {
            return errorResponse(res, 403, editValidation.reason || 'You do not have permission to edit this section');
        }

        // Store old data for version comparison
        const oldData = section.toObject();

        // If content is being updated, validate it
        if (content !== undefined) {
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
        }

        if (section.status === 'published' && !isOnlyStatusUpdate) {
            const updateData = {};

            if (content !== undefined) {
                updateData.content = content;
                updateData.version = (section.version || 1) + 1;
            }
            if (isVisible !== undefined) updateData.isVisible = isVisible;
            if (cssClasses !== undefined) updateData.cssClasses = cssClasses;
            if (customStyles !== undefined) updateData.customStyles = customStyles;

            const revision = await stagePublishedUpdate({
                resource: 'section',
                liveDoc: section,
                updateData,
                userId: req.user._id
            });

            const populatedSection = await populateSectionQuery(Section.findById(section._id));
            const populatedRevision = await getActiveRevision('section', section._id, REVISION_USER_POPULATE);
            const editableSection = buildEditableResource(populatedSection, populatedRevision || revision);

            return successResponse(
                res,
                200,
                'Section changes staged successfully. The published website will keep showing the current live version until this revision is published.',
                {
                    section: editableSection,
                    activeRevision: editableSection.activeRevision
                }
            );
        }

        if (content !== undefined) {
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

        const updatedSection = await populateSectionQuery(Section.findById(section._id));

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

        // Validate workflow status and permissions using workflowStatusValidator
        // This checks both permission AND role hierarchy for the current status
        const deleteValidation = await canDeleteContent(req.user, section, 'section');
        if (!deleteValidation.canDelete) {
            return errorResponse(res, 403, deleteValidation.reason || 'You do not have permission to delete this section');
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

        // Fetch all sections being reordered to validate workflow status
        const sectionIds = sectionOrders.map(item => item.sectionId || item._id || item.id);
        const sectionsToReorder = await Section.find({ _id: { $in: sectionIds } })
            .populate('pageId', 'status title');

        if (sectionsToReorder.length !== sectionIds.length) {
            return errorResponse(res, 404, 'One or more sections not found');
        }

        // All sections should belong to the same page
        const pageIds = [...new Set(sectionsToReorder.map(s => {
            const pageId = s.pageId._id || s.pageId;
            return pageId ? pageId.toString() : null;
        }).filter(Boolean))];
        
        if (pageIds.length > 1) {
            return errorResponse(res, 400, 'All sections must belong to the same page');
        }

        if (pageIds.length === 0) {
            return errorResponse(res, 404, 'Parent page not found for sections');
        }

        // Fetch the parent page with all necessary fields for validation
        const parentPage = await Page.findById(pageIds[0]);
        if (!parentPage) {
            return errorResponse(res, 404, 'Parent page not found');
        }

        // Validate parent page workflow status and permissions
        const pageValidation = await canModifyTree(req.user, parentPage, 'page');
        if (!pageValidation.canModify) {
            return errorResponse(res, 403, `Cannot reorder sections: ${pageValidation.reason || 'Parent page restrictions apply'}`);
        }

        // Validate each section can be edited
        const blockedSections = [];
        for (const section of sectionsToReorder) {
            const sectionValidation = await canEditContent(req.user, section, 'sections', 'update');
            if (!sectionValidation.canEdit) {
                blockedSections.push({
                    sectionId: section._id,
                    reason: sectionValidation.reason
                });
            }
        }

        if (blockedSections.length > 0) {
            return errorResponse(
                res,
                403,
                `${blockedSections.length} section(s) cannot be reordered`,
                { blockedSections }
            );
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
 * IMPORTANT: This should go through the same permission checks as updateSection
 */
exports.toggleVisibility = async (req, res) => {
    try {
        const { id } = req.params;

        const section = await Section.findById(id).populate('pageId', 'status createdBy');
        if (!section) {
            return errorResponse(res, 404, 'Section not found');
        }

        // Check if parent page exists
        if (!section.pageId) {
            return errorResponse(res, 404, 'Parent page not found');
        }

        // IMPORTANT: Block visibility toggle when section is in restricted status
        // UNLESS: user is Admin/Super Admin OR user has permission + appropriate role
        const restrictedSectionStatuses = ['in_review', 'pending_approval', 'pending_publish'];
        
        if (restrictedSectionStatuses.includes(section.status)) {
            // Check if user can edit content in this section status
            const sectionEditValidation = await canEditContent(req.user, section, 'sections', 'update');
            if (!sectionEditValidation.canEdit) {
                return errorResponse(res, 403, `Cannot toggle section visibility. Section is in '${section.status}' status. ${sectionEditValidation.reason || 'You do not have permission to edit sections in this status.'}`);
            }
        }
        
        // IMPORTANT: If parent page is in_review, pending_approval, or pending_publish, block visibility toggle
        // UNLESS: user is Admin/Super Admin OR user has permission + appropriate role for parent page status
        // EXCEPTION: If parent page is in draft or changes_requested, sections can have their own workflow independently
        const parentPageStatus = section.pageId.status;
        const restrictedParentStatuses = ['in_review', 'pending_approval', 'pending_publish'];
        const allowIndividualWorkflow = ['draft', 'changes_requested'].includes(parentPageStatus);
        
        if (restrictedParentStatuses.includes(parentPageStatus) && !allowIndividualWorkflow) {
            // Check if user can edit content in parent page status
            const parentPageEditValidation = await canEditContent(req.user, section.pageId, 'pages', 'update');
            if (!parentPageEditValidation.canEdit) {
                return errorResponse(res, 403, `Cannot toggle section visibility. Parent page is in '${parentPageStatus}' status. ${parentPageEditValidation.reason || 'You do not have permission to edit sections when parent page is in this status.'}`);
            }
        }
        
        // Validate workflow status and permissions using workflowStatusValidator
        // This checks both permission AND role hierarchy for the current status
        const editValidation = await canEditContent(req.user, section, 'sections', 'update');
        if (!editValidation.canEdit) {
            return errorResponse(res, 403, editValidation.reason || 'You do not have permission to toggle section visibility');
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

