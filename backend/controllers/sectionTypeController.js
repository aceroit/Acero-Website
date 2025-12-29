const SectionType = require('../models/SectionType');
const Section = require('../models/Section');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * Get all section types (grouped by category)
 */
exports.getAllSectionTypes = async (req, res) => {
    try {
        const { includeInactive = false } = req.query;

        const sectionTypes = await SectionType.getByCategory(includeInactive === 'true');

        return successResponse(res, { sectionTypes }, 'Section types retrieved successfully');
    } catch (error) {
        console.error('Error in getAllSectionTypes:', error);
        return errorResponse(res, 'Failed to retrieve section types', 500, error.message);
    }
};

/**
 * Get only active section types (for section library)
 */
exports.getActiveSectionTypes = async (req, res) => {
    try {
        const sectionTypes = await SectionType.getActive();

        // Group by category
        const grouped = {};
        for (const sectionType of sectionTypes) {
            if (!grouped[sectionType.category]) {
                grouped[sectionType.category] = [];
            }
            grouped[sectionType.category].push(sectionType);
        }

        return successResponse(res, { sectionTypes: grouped }, 'Active section types retrieved successfully');
    } catch (error) {
        console.error('Error in getActiveSectionTypes:', error);
        return errorResponse(res, 'Failed to retrieve active section types', 500, error.message);
    }
};

/**
 * Get section type by slug
 */
exports.getSectionTypeBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const sectionType = await SectionType.findOne({ slug })
            .populate('createdBy', 'firstName lastName email');

        if (!sectionType) {
            return errorResponse(res, 'Section type not found', 404);
        }

        return successResponse(res, { sectionType }, 'Section type retrieved successfully');
    } catch (error) {
        console.error('Error in getSectionTypeBySlug:', error);
        return errorResponse(res, 'Failed to retrieve section type', 500, error.message);
    }
};

/**
 * Create new section type (super_admin only)
 */
exports.createSectionType = async (req, res) => {
    try {
        const {
            name,
            slug,
            description,
            icon,
            category,
            fields,
            previewComponent,
            thumbnailUrl
        } = req.body;

        // Validate required fields
        if (!name || !slug || !category) {
            return errorResponse(res, 'Name, slug, and category are required', 400);
        }

        // Check slug uniqueness
        const existing = await SectionType.findOne({ slug });
        if (existing) {
            return errorResponse(res, 'Section type with this slug already exists', 400);
        }

        // Validate fields array
        if (fields && !Array.isArray(fields)) {
            return errorResponse(res, 'Fields must be an array', 400);
        }

        // Create section type
        const sectionType = new SectionType({
            name,
            slug,
            description,
            icon: icon || 'default-icon',
            category,
            fields: fields || [],
            previewComponent: previewComponent || 'DefaultPreview',
            thumbnailUrl,
            isSystem: false,
            createdBy: req.user._id
        });

        await sectionType.save();

        return successResponse(
            res, 
            { sectionType }, 
            'Section type created successfully', 
            201
        );
    } catch (error) {
        console.error('Error in createSectionType:', error);
        return errorResponse(res, 'Failed to create section type', 500, error.message);
    }
};

/**
 * Update section type (super_admin only)
 */
exports.updateSectionType = async (req, res) => {
    try {
        const { slug } = req.params;
        const {
            name,
            description,
            icon,
            category,
            fields,
            previewComponent,
            thumbnailUrl,
            isActive
        } = req.body;

        const sectionType = await SectionType.findOne({ slug });
        if (!sectionType) {
            return errorResponse(res, 'Section type not found', 404);
        }

        // Prevent updating system section types' core properties
        if (sectionType.isSystem) {
            // Only allow updating description, icon, and isActive for system types
            if (name || slug || fields) {
                return errorResponse(
                    res, 
                    'Cannot modify core properties of system section types', 
                    403
                );
            }
        }

        // Update fields
        if (name) sectionType.name = name;
        if (description !== undefined) sectionType.description = description;
        if (icon) sectionType.icon = icon;
        if (category) sectionType.category = category;
        if (fields) {
            if (!Array.isArray(fields)) {
                return errorResponse(res, 'Fields must be an array', 400);
            }
            sectionType.fields = fields;
        }
        if (previewComponent) sectionType.previewComponent = previewComponent;
        if (thumbnailUrl !== undefined) sectionType.thumbnailUrl = thumbnailUrl;
        if (isActive !== undefined) sectionType.isActive = isActive;

        await sectionType.save();

        return successResponse(res, { sectionType }, 'Section type updated successfully');
    } catch (error) {
        console.error('Error in updateSectionType:', error);
        return errorResponse(res, 'Failed to update section type', 500, error.message);
    }
};

/**
 * Delete section type (super_admin only)
 * Actually just deactivates it
 */
exports.deleteSectionType = async (req, res) => {
    try {
        const { slug } = req.params;
        const { force = false } = req.query;

        const sectionType = await SectionType.findOne({ slug });
        if (!sectionType) {
            return errorResponse(res, 'Section type not found', 404);
        }

        // Prevent deleting system section types
        if (sectionType.isSystem) {
            return errorResponse(res, 'Cannot delete system section types', 403);
        }

        // Check if section type is in use
        const usageCount = await Section.countDocuments({ 
            sectionTypeSlug: slug 
        });

        if (usageCount > 0 && !force) {
            return errorResponse(
                res, 
                `Section type is used in ${usageCount} section(s). Set force=true to deactivate anyway`, 
                400
            );
        }

        // Soft delete (deactivate)
        sectionType.isActive = false;
        await sectionType.save();

        return successResponse(
            res, 
            { usageCount }, 
            'Section type deactivated successfully'
        );
    } catch (error) {
        console.error('Error in deleteSectionType:', error);
        return errorResponse(res, 'Failed to delete section type', 500, error.message);
    }
};

/**
 * Get section type usage count
 */
exports.getSectionTypeUsage = async (req, res) => {
    try {
        const { slug } = req.params;

        const sectionType = await SectionType.findOne({ slug });
        if (!sectionType) {
            return errorResponse(res, 'Section type not found', 404);
        }

        // Get usage statistics
        const [totalCount, draftCount, publishedCount] = await Promise.all([
            Section.countDocuments({ sectionTypeSlug: slug }),
            Section.countDocuments({ sectionTypeSlug: slug, status: 'draft' }),
            Section.countDocuments({ sectionTypeSlug: slug, status: 'published' })
        ]);

        // Get sample sections using this type
        const sampleSections = await Section.find({ sectionTypeSlug: slug })
            .limit(5)
            .sort({ createdAt: -1 })
            .populate('pageId', 'title slug path')
            .select('pageId content createdAt status');

        return successResponse(res, {
            sectionType: {
                name: sectionType.name,
                slug: sectionType.slug,
                isSystem: sectionType.isSystem
            },
            usage: {
                total: totalCount,
                draft: draftCount,
                published: publishedCount
            },
            sampleSections
        }, 'Section type usage retrieved successfully');
    } catch (error) {
        console.error('Error in getSectionTypeUsage:', error);
        return errorResponse(res, 'Failed to retrieve section type usage', 500, error.message);
    }
};

