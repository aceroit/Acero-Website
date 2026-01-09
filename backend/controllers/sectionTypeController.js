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

        return successResponse(res, 200, 'Section types retrieved successfully', { sectionTypes });
    } catch (error) {
        console.error('Error in getAllSectionTypes:', error);
        return errorResponse(res, 500, 'Failed to retrieve section types', error.message);
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

        return successResponse(res, 200, 'Active section types retrieved successfully', { sectionTypes: grouped });
    } catch (error) {
        console.error('Error in getActiveSectionTypes:', error);
        return errorResponse(res, 500, 'Failed to retrieve active section types', error.message);
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
            return errorResponse(res, 404, 'Section type not found');
        }

        return successResponse(res, 200, 'Section type retrieved successfully', { sectionType });
    } catch (error) {
        console.error('Error in getSectionTypeBySlug:', error);
        return errorResponse(res, 500, 'Failed to retrieve section type', error.message);
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
            return errorResponse(res, 400, 'Name, slug, and category are required');
        }

        // Check slug uniqueness
        const existing = await SectionType.findOne({ slug });
        if (existing) {
            return errorResponse(res, 400, 'Section type with this slug already exists');
        }

        // Validate fields array
        if (fields && !Array.isArray(fields)) {
            return errorResponse(res, 400, 'Fields must be an array');
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
            201,
            'Section type created successfully',
            { sectionType }
        );
    } catch (error) {
        console.error('Error in createSectionType:', error);
        return errorResponse(res, 500, 'Failed to create section type', error.message);
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
            return errorResponse(res, 404, 'Section type not found');
        }

        // Prevent updating system section types' core properties
        if (sectionType.isSystem) {
            // Only allow updating description, icon, and isActive for system types
            if (name || slug || fields) {
                return errorResponse(
                    res, 
                    403,
                    'Cannot modify core properties of system section types'
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
                return errorResponse(res, 400, 'Fields must be an array');
            }
            sectionType.fields = fields;
        }
        if (previewComponent) sectionType.previewComponent = previewComponent;
        if (thumbnailUrl !== undefined) sectionType.thumbnailUrl = thumbnailUrl;
        if (isActive !== undefined) sectionType.isActive = isActive;

        await sectionType.save();

        return successResponse(res, 200, 'Section type updated successfully', { sectionType });
    } catch (error) {
        console.error('Error in updateSectionType:', error);
        return errorResponse(res, 500, 'Failed to update section type', error.message);
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
            return errorResponse(res, 404, 'Section type not found');
        }

        // Prevent deleting system section types
        if (sectionType.isSystem) {
            return errorResponse(res, 403, 'Cannot delete system section types');
        }

        // Check if section type is in use
        const usageCount = await Section.countDocuments({ 
            sectionTypeSlug: slug 
        });

        if (usageCount > 0 && !force) {
            return errorResponse(
                res, 
                400,
                `Section type is used in ${usageCount} section(s). Set force=true to deactivate anyway`
            );
        }

        // Soft delete (deactivate)
        sectionType.isActive = false;
        await sectionType.save();

        return successResponse(
            res, 
            200,
            'Section type deactivated successfully',
            { usageCount }
        );
    } catch (error) {
        console.error('Error in deleteSectionType:', error);
        return errorResponse(res, 500, 'Failed to delete section type', error.message);
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
            return errorResponse(res, 404, 'Section type not found');
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

        return successResponse(res, 200, 'Section type usage retrieved successfully', {
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
        });
    } catch (error) {
        console.error('Error in getSectionTypeUsage:', error);
        return errorResponse(res, 500, 'Failed to retrieve section type usage', error.message);
    }
};

