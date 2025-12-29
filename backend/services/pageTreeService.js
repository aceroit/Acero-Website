const Page = require('../models/Page');

/**
 * Page Tree Service
 * Handles page hierarchy, path calculation, and tree operations
 */
class PageTreeService {
    /**
     * Calculate the next order number for a page within a parent
     * @param {String|null} parentId - Parent page ID or null for root
     * @returns {Promise<Number>}
     */
    async getNextOrder(parentId) {
        const lastPage = await Page.findOne({ parentId })
            .sort({ order: -1 })
            .select('order');
        
        return lastPage ? lastPage.order + 1 : 0;
    }

    /**
     * Calculate page path and level based on parent
     * @param {String|null} parentId - Parent page ID
     * @param {String} slug - Page slug
     * @returns {Promise<Object>} - { path, level }
     */
    async calculatePathAndLevel(parentId, slug) {
        if (!parentId) {
            return {
                path: `/${slug}`,
                level: 0
            };
        }

        const parent = await Page.findById(parentId);
        if (!parent) {
            return {
                path: `/${slug}`,
                level: 0
            };
        }

        return {
            path: `${parent.path}/${slug}`,
            level: parent.level + 1
        };
    }

    /**
     * Update paths for all descendants when a page is moved or updated
     * @param {String} pageId - Page ID
     * @param {String} newPath - New path for the page
     * @returns {Promise<void>}
     */
    async updateDescendantPaths(pageId, newPath) {
        const page = await Page.findById(pageId);
        if (!page) return;

        const oldPath = page.path;

        // Find all descendants
        const descendants = await Page.find({
            path: new RegExp(`^${oldPath}/`)
        });

        // Update each descendant's path
        const updatePromises = descendants.map(descendant => {
            const newDescendantPath = descendant.path.replace(oldPath, newPath);
            return Page.findByIdAndUpdate(descendant._id, { path: newDescendantPath });
        });

        await Promise.all(updatePromises);
    }

    /**
     * Check if moving a page would create a circular reference
     * @param {String} pageId - Page to move
     * @param {String} newParentId - Proposed new parent
     * @returns {Promise<Boolean>} - True if circular reference would occur
     */
    async wouldCreateCircularReference(pageId, newParentId) {
        if (!newParentId) return false; // Moving to root is always safe

        // Check if newParentId is a descendant of pageId
        const page = await Page.findById(pageId);
        if (!page) return false;

        let currentParent = await Page.findById(newParentId);
        
        while (currentParent) {
            if (currentParent._id.toString() === pageId.toString()) {
                return true; // Circular reference detected
            }
            
            if (!currentParent.parentId) break;
            currentParent = await Page.findById(currentParent.parentId);
        }

        return false;
    }

    /**
     * Move a page to a new parent
     * @param {String} pageId - Page to move
     * @param {String|null} newParentId - New parent ID (null for root)
     * @param {Object} updatedBy - User making the change
     * @returns {Promise<Object>} - Updated page
     */
    async movePage(pageId, newParentId, updatedBy) {
        // Prevent circular references
        const isCircular = await this.wouldCreateCircularReference(pageId, newParentId);
        if (isCircular) {
            throw new Error('Cannot move page: would create circular reference');
        }

        const page = await Page.findById(pageId);
        if (!page) {
            throw new Error('Page not found');
        }

        // Calculate new path and level
        const { path: newPath, level: newLevel } = await this.calculatePathAndLevel(
            newParentId, 
            page.slug
        );

        const oldPath = page.path;

        // Update the page
        page.parentId = newParentId;
        page.path = newPath;
        page.level = newLevel;
        page.order = await this.getNextOrder(newParentId);
        page.updatedBy = updatedBy;
        await page.save();

        // Update all descendants' paths
        await this.updateDescendantPaths(pageId, newPath);

        return page;
    }

    /**
     * Reorder pages within the same parent
     * @param {Array} pageOrders - Array of { pageId, order }
     * @returns {Promise<void>}
     */
    async reorderPages(pageOrders) {
        const updatePromises = pageOrders.map(({ pageId, order }) => 
            Page.findByIdAndUpdate(pageId, { order })
        );
        
        await Promise.all(updatePromises);
    }

    /**
     * Duplicate a page (optionally with sections)
     * @param {String} pageId - Page to duplicate
     * @param {Object} createdBy - User creating the duplicate
     * @param {Boolean} includeSections - Whether to duplicate sections
     * @returns {Promise<Object>} - New page
     */
    async duplicatePage(pageId, createdBy, includeSections = false) {
        const originalPage = await Page.findById(pageId);
        if (!originalPage) {
            throw new Error('Page not found');
        }

        // Create duplicate page data
        const pageData = originalPage.toObject();
        delete pageData._id;
        delete pageData.createdAt;
        delete pageData.updatedAt;

        // Generate unique slug
        let newSlug = `${pageData.slug}-copy`;
        let counter = 1;
        while (await Page.findOne({ slug: newSlug })) {
            newSlug = `${pageData.slug}-copy-${counter}`;
            counter++;
        }

        pageData.slug = newSlug;
        pageData.title = `${pageData.title} (Copy)`;
        pageData.status = 'draft';
        pageData.createdBy = createdBy;
        pageData.updatedBy = null;

        // Recalculate path with new slug
        const { path, level } = await this.calculatePathAndLevel(pageData.parentId, newSlug);
        pageData.path = path;
        pageData.level = level;
        pageData.order = await this.getNextOrder(pageData.parentId);

        const newPage = new Page(pageData);
        await newPage.save();

        // If including sections, duplicate them too
        if (includeSections) {
            const Section = require('../models/Section');
            const sections = await Section.find({ pageId: originalPage._id });
            
            const sectionPromises = sections.map(async (section) => {
                const sectionData = section.toObject();
                delete sectionData._id;
                delete sectionData.createdAt;
                delete sectionData.updatedAt;
                
                sectionData.pageId = newPage._id;
                sectionData.status = 'draft';
                sectionData.createdBy = createdBy;
                sectionData.updatedBy = null;
                
                const newSection = new Section(sectionData);
                return newSection.save();
            });
            
            await Promise.all(sectionPromises);
        }

        return newPage;
    }

    /**
     * Soft delete a page and all its descendants
     * @param {String} pageId - Page to delete
     * @param {Object} updatedBy - User making the change
     * @returns {Promise<Number>} - Number of pages deleted
     */
    async softDeletePage(pageId, updatedBy) {
        const page = await Page.findById(pageId);
        if (!page) {
            throw new Error('Page not found');
        }

        // Get all descendants
        const descendants = await page.getDescendants();
        const pageIds = [pageId, ...descendants.map(d => d._id)];

        // Soft delete all
        const result = await Page.updateMany(
            { _id: { $in: pageIds } },
            { 
                isActive: false, 
                updatedBy: updatedBy,
                status: 'archived'
            }
        );

        return result.modifiedCount;
    }

    /**
     * Get full page tree with children
     * @param {String|null} parentId - Start from this parent (null for full tree)
     * @param {Boolean} includeInactive - Include inactive pages
     * @returns {Promise<Array>}
     */
    async getTree(parentId = null, includeInactive = false) {
        return await Page.getTree(parentId);
    }

    /**
     * Validate page slug is unique (excluding specific page ID)
     * @param {String} slug - Slug to check
     * @param {String|null} excludePageId - Page ID to exclude from check
     * @returns {Promise<Boolean>}
     */
    async isSlugUnique(slug, excludePageId = null) {
        const query = { slug };
        if (excludePageId) {
            query._id = { $ne: excludePageId };
        }
        
        const count = await Page.countDocuments(query);
        return count === 0;
    }
}

module.exports = new PageTreeService();

