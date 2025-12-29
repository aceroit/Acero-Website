const SectionType = require('../models/SectionType');

/**
 * Section Validator Service
 * Validates section content against SectionType field schema
 */
class SectionValidator {
    /**
     * Validate section content against its section type
     * @param {String} sectionTypeSlug - The section type slug
     * @param {Object} content - The section content to validate
     * @returns {Promise<Object>} - { isValid: boolean, errors: array, sectionType: object }
     */
    async validateSectionContent(sectionTypeSlug, content) {
        try {
            // Find the section type
            const sectionType = await SectionType.findOne({ 
                slug: sectionTypeSlug, 
                isActive: true 
            });

            if (!sectionType) {
                return {
                    isValid: false,
                    errors: [`Section type '${sectionTypeSlug}' not found or inactive`],
                    sectionType: null
                };
            }

            // Use the model's built-in validation method
            const validation = sectionType.validateContent(content);

            return {
                isValid: validation.isValid,
                errors: validation.errors,
                sectionType: sectionType
            };
        } catch (error) {
            return {
                isValid: false,
                errors: [`Validation error: ${error.message}`],
                sectionType: null
            };
        }
    }

    /**
     * Check if a section type exists and is active
     * @param {String} sectionTypeSlug - The section type slug
     * @returns {Promise<Boolean>}
     */
    async sectionTypeExists(sectionTypeSlug) {
        const count = await SectionType.countDocuments({ 
            slug: sectionTypeSlug, 
            isActive: true 
        });
        return count > 0;
    }

    /**
     * Get field schema for a section type
     * @param {String} sectionTypeSlug - The section type slug
     * @returns {Promise<Array>} - Array of field definitions
     */
    async getFieldSchema(sectionTypeSlug) {
        const sectionType = await SectionType.findOne({ 
            slug: sectionTypeSlug, 
            isActive: true 
        }).select('fields');

        return sectionType ? sectionType.fields : [];
    }

    /**
     * Sanitize content by removing fields not in schema
     * @param {String} sectionTypeSlug - The section type slug
     * @param {Object} content - The section content
     * @returns {Promise<Object>} - Sanitized content
     */
    async sanitizeContent(sectionTypeSlug, content) {
        const fields = await this.getFieldSchema(sectionTypeSlug);
        const fieldNames = fields.map(f => f.name);
        
        const sanitized = {};
        for (const key in content) {
            if (fieldNames.includes(key)) {
                sanitized[key] = content[key];
            }
        }
        
        return sanitized;
    }
}

module.exports = new SectionValidator();

