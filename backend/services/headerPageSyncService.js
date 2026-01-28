const Page = require('../models/Page');
const HeaderConfiguration = require('../models/HeaderConfiguration');

/**
 * Transform page tree structure to navigationLinks format
 * @param {Array} pageTree - Array of page objects with children
 * @returns {Array} - Array of navigationLinks
 */
function transformPageTreeToNavLinks(pageTree) {
    if (!Array.isArray(pageTree)) {
        return [];
    }

    return pageTree
        .filter(page => page.showInMenu !== false && page.isActive !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(page => {
            const navLink = {
                label: page.title,
                href: page.path,
                order: page.order || 0,
                isFieldActive: true,
                dropdown: []
            };

            // Add children as dropdown items
            if (page.children && Array.isArray(page.children) && page.children.length > 0) {
                navLink.dropdown = page.children
                    .filter(child => child.showInMenu !== false && child.isActive !== false)
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map(child => ({
                        label: child.title,
                        href: child.path,
                        order: child.order || 0
                    }));
            }

            return navLink;
        });
}

/**
 * Get all pages with showInMenu: true, organized as a tree
 * @returns {Promise<Array>} - Page tree structure
 */
async function getMenuPageTree() {
    // Get all root pages (level 0) with showInMenu: true
    const rootPages = await Page.find({
        level: 0,
        isActive: true,
        showInMenu: true
    }).sort({ order: 1 });

    // Build tree recursively
    const buildTree = async (parentId) => {
        const pages = await Page.find({
            parentId: parentId || null,
            isActive: true,
            showInMenu: true
        }).sort({ order: 1 });

        return Promise.all(pages.map(async (page) => {
            const children = await buildTree(page._id);
            return {
                _id: page._id,
                title: page.title,
                path: page.path,
                order: page.order,
                showInMenu: page.showInMenu,
                isActive: page.isActive,
                children
            };
        }));
    };

    return Promise.all(rootPages.map(async (page) => {
        const children = await buildTree(page._id);
        return {
            _id: page._id,
            title: page.title,
            path: page.path,
            order: page.order,
            showInMenu: page.showInMenu,
            isActive: page.isActive,
            children
        };
    }));
}

/**
 * Sync page tree changes to HeaderConfiguration
 * @param {String|null} pageId - ID of the page that changed (null for reorder operations)
 * @param {String} action - Action type: 'create', 'update', 'delete', 'reorder', 'toggleMenu'
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Sync result
 */
async function syncPageTreeToHeader(pageId = null, action = 'update', options = {}) {
    try {
        // Find active HeaderConfiguration (prefer published, fallback to draft)
        let headerConfig = await HeaderConfiguration.findOne({
            isActive: true,
            status: 'published',
            featured: true
        });

        // If no published header, get the most recent draft
        if (!headerConfig) {
            headerConfig = await HeaderConfiguration.findOne({
                isActive: true
            }).sort({ updatedAt: -1 });
        }

        // If still no header config, create a default one
        if (!headerConfig) {
            // We need a user ID - use system user or first admin
            // For now, we'll skip creating if no header exists
            // This should be handled by the controller
            return {
                success: false,
                message: 'No HeaderConfiguration found. Please create one first.',
                synced: false
            };
        }

        // Get current page tree
        const pageTree = await getMenuPageTree();
        
        // Transform to navigationLinks
        const navigationLinks = transformPageTreeToNavLinks(pageTree);

        // Check if navigationLinks actually changed
        const currentNavLinks = JSON.stringify(headerConfig.navigationLinks || []);
        const newNavLinks = JSON.stringify(navigationLinks);
        const hasChanged = currentNavLinks !== newNavLinks;

        if (!hasChanged && action !== 'reorder') {
            return {
                success: true,
                message: 'No changes detected in navigation structure',
                synced: false,
                headerConfigId: headerConfig._id
            };
        }

        // If header was published and we're making changes, set to draft
        const wasPublished = headerConfig.status === 'published';
        if (wasPublished && hasChanged) {
            headerConfig.status = 'draft';
        }

        // Update navigationLinks
        headerConfig.navigationLinks = navigationLinks;
        headerConfig.lastSyncedFromPageTree = new Date();
        headerConfig.pageTreeVersion = (headerConfig.pageTreeVersion || 0) + 1;

        // Update updatedBy if provided
        if (options.updatedBy) {
            headerConfig.updatedBy = options.updatedBy;
        }

        await headerConfig.save();

        return {
            success: true,
            message: `HeaderConfiguration synced from Page Tree (${action})`,
            synced: true,
            headerConfigId: headerConfig._id,
            wasPublished,
            statusChanged: wasPublished && hasChanged
        };
    } catch (error) {
        console.error('Error syncing Page Tree to HeaderConfiguration:', error);
        return {
            success: false,
            message: error.message || 'Failed to sync Page Tree to HeaderConfiguration',
            synced: false,
            error: error
        };
    }
}

/**
 * Map navigationLinks to pages and determine what needs updating
 * @param {Array} navigationLinks - Navigation links from HeaderConfiguration
 * @param {Array} existingPages - Existing pages from database
 * @returns {Array} - Array of page update objects
 */
function transformNavLinksToPageUpdates(navigationLinks, existingPages) {
    const updates = [];
    const processedPageIds = new Set();

    // Create a map of pages by path for quick lookup
    const pagesByPath = new Map();
    existingPages.forEach(page => {
        pagesByPath.set(page.path, page);
    });

    // Process top-level navigation links
    navigationLinks.forEach((navLink, index) => {
        if (!navLink.isFieldActive) {
            return; // Skip inactive links
        }

        const page = pagesByPath.get(navLink.href);
        if (page) {
            const update = {
                pageId: page._id,
                updates: {},
                needsUpdate: false
            };

            // Check if order changed
            if (page.order !== navLink.order) {
                update.updates.order = navLink.order;
                update.needsUpdate = true;
            }

            // Check if title changed
            if (page.title !== navLink.label) {
                update.updates.title = navLink.label;
                update.needsUpdate = true;
            }

            // Check if showInMenu changed
            if (page.showInMenu !== true) {
                update.updates.showInMenu = true;
                update.needsUpdate = true;
            }

            if (update.needsUpdate) {
                updates.push(update);
                processedPageIds.add(page._id.toString());
            }
        }

        // Process dropdown items (child pages)
        if (navLink.dropdown && Array.isArray(navLink.dropdown)) {
            navLink.dropdown.forEach((dropdownItem, dropdownIndex) => {
                const childPage = pagesByPath.get(dropdownItem.href);
                if (childPage) {
                    const update = {
                        pageId: childPage._id,
                        updates: {},
                        needsUpdate: false
                    };

                    // Check if order changed
                    if (childPage.order !== dropdownItem.order) {
                        update.updates.order = dropdownItem.order;
                        update.needsUpdate = true;
                    }

                    // Check if title changed
                    if (childPage.title !== dropdownItem.label) {
                        update.updates.title = dropdownItem.label;
                        update.needsUpdate = true;
                    }

                    // Check if showInMenu changed
                    if (childPage.showInMenu !== true) {
                        update.updates.showInMenu = true;
                        update.needsUpdate = true;
                    }

                    if (update.needsUpdate) {
                        updates.push(update);
                        processedPageIds.add(childPage._id.toString());
                    }
                }
            });
        }
    });

    // Find pages that should be hidden (showInMenu: false)
    // Pages that are in database but not in navigationLinks
    existingPages.forEach(page => {
        if (page.showInMenu && !processedPageIds.has(page._id.toString())) {
            // Check if this page's path is in any navigationLink
            const isInNavLinks = navigationLinks.some(navLink => {
                if (navLink.href === page.path) return true;
                if (navLink.dropdown && navLink.dropdown.some(item => item.href === page.path)) {
                    return true;
                }
                return false;
            });

            // If page is not in navLinks but has showInMenu: true, we might want to hide it
            // But this is optional - we'll only update pages that are explicitly in navLinks
        }
    });

    return updates;
}

/**
 * Sync HeaderConfiguration changes to Page Tree
 * @param {String} headerConfigId - ID of the HeaderConfiguration
 * @param {Array} navigationLinks - Updated navigationLinks array
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Sync result
 */
async function syncHeaderToPageTree(headerConfigId, navigationLinks, options = {}) {
    try {
        // Get all active pages
        const allPages = await Page.find({ isActive: true });

        // Determine which pages need updating
        const pageUpdates = transformNavLinksToPageUpdates(navigationLinks, allPages);

        if (pageUpdates.length === 0) {
            return {
                success: true,
                message: 'No page updates needed',
                synced: false,
                pagesUpdated: 0
            };
        }

        // Update pages
        const updatePromises = pageUpdates.map(async (update) => {
            const page = await Page.findById(update.pageId);
            if (!page) {
                return { success: false, pageId: update.pageId, error: 'Page not found' };
            }

            // Only update if page is not published (or if we're explicitly updating published pages)
            // For published pages, set to draft when updating
            const wasPublished = page.status === 'published';
            
            // Update fields
            Object.keys(update.updates).forEach(key => {
                page[key] = update.updates[key];
            });

            // Set to draft if was published
            if (wasPublished) {
                page.status = 'draft';
            }

            // Update sync tracking
            page.lastSyncedToHeader = new Date();

            // Update updatedBy if provided
            if (options.updatedBy) {
                page.updatedBy = options.updatedBy;
            }

            await page.save();

            return {
                success: true,
                pageId: update.pageId,
                wasPublished,
                statusChanged: wasPublished
            };
        });

        const results = await Promise.all(updatePromises);
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        return {
            success: true,
            message: `Synced HeaderConfiguration to ${successful.length} page(s)`,
            synced: true,
            pagesUpdated: successful.length,
            pagesFailed: failed.length,
            results
        };
    } catch (error) {
        console.error('Error syncing HeaderConfiguration to Page Tree:', error);
        return {
            success: false,
            message: error.message || 'Failed to sync HeaderConfiguration to Page Tree',
            synced: false,
            error: error
        };
    }
}

/**
 * Check if a page path appears in any active header's navigation links (top-level or dropdown).
 * Used to alert users when they delete/unpublish a page that is still linked in the header.
 * @param {String} pagePath - Page path (e.g. '/who-we-are', '/products/peb')
 * @returns {Promise<Boolean>}
 */
async function isPagePathInHeader(pagePath) {
    if (!pagePath || typeof pagePath !== 'string') return false;
    const path = pagePath.startsWith('/') ? pagePath : `/${pagePath}`;
    let headerConfig = await HeaderConfiguration.findOne({
        isActive: true,
        status: 'published',
        featured: true
    });
    if (!headerConfig) {
        headerConfig = await HeaderConfiguration.findOne({ isActive: true }).sort({ updatedAt: -1 });
    }
    if (!headerConfig || !headerConfig.navigationLinks || !headerConfig.navigationLinks.length) {
        return false;
    }
    for (const nav of headerConfig.navigationLinks) {
        if (!nav.isFieldActive) continue;
        if (nav.href === path) return true;
        if (Array.isArray(nav.dropdown) && nav.dropdown.some((d) => d.href === path)) return true;
    }
    return false;
}

module.exports = {
    syncPageTreeToHeader,
    syncHeaderToPageTree,
    transformPageTreeToNavLinks,
    transformNavLinksToPageUpdates,
    getMenuPageTree,
    isPagePathInHeader
};

