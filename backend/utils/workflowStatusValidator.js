// Workflow status validation utilities with permission + role hierarchy logic
// Checks if users can perform CRUD operations based on permissions, role hierarchy, and workflow status

const Permission = require('../models/Permission');
const Resource = require('../models/Resource');
const User = require('../models/User');
const Page = require('../models/Page');
const mongoose = require('mongoose');
const { ROLE_HIERARCHY } = require('./workflowValidator');

// Status-based role requirements
// Defines which role hierarchy level is required to edit content in each status
const STATUS_ROLE_REQUIREMENTS = {
    draft: { minRole: 'editor', allowCreator: true },
    changes_requested: { minRole: 'editor', allowCreator: true },
    in_review: { minRole: 'reviewer', allowCreator: false },
    pending_approval: { minRole: 'approver', allowCreator: false },
    pending_publish: { minRole: 'admin', allowCreator: false },
    published: { minRole: 'admin', allowCreator: false },
    archived: { minRole: 'admin', allowCreator: false }
};

/**
 * Check if user is Admin or Super Admin
 * @param {Object} user - User object (may have role as ObjectId or populated)
 * @returns {Promise<boolean>} True if user is admin or super_admin
 */
async function isAdminOrSuperAdmin(user) {
    if (!user || !user.role) {
        return false;
    }

    // If role is populated, check slug
    if (typeof user.role === 'object' && user.role.slug) {
        return user.role.slug === 'admin' || user.role.slug === 'super_admin';
    }

    // If role is ObjectId, populate and check
    if (mongoose.Types.ObjectId.isValid(user.role)) {
        const populatedUser = await User.findById(user._id || user.id)
            .populate('role', 'slug')
            .select('role');
        
        if (populatedUser && populatedUser.role) {
            return populatedUser.role.slug === 'admin' || populatedUser.role.slug === 'super_admin';
        }
    }

    // Fallback: check if role is string
    if (typeof user.role === 'string') {
        return user.role === 'admin' || user.role === 'super_admin';
    }

    return false;
}

/**
 * Get user's role with slug and hierarchy level
 * @param {Object} user - User object
 * @returns {Promise<Object>} { slug: string, level: number } or null
 */
async function getUserRole(user) {
    if (!user || !user.role) {
        return null;
    }

    // If role is already populated with slug
    if (typeof user.role === 'object' && user.role.slug) {
        return {
            slug: user.role.slug,
            level: ROLE_HIERARCHY[user.role.slug] || 0
        };
    }

    // If role is ObjectId, populate it
    if (mongoose.Types.ObjectId.isValid(user.role)) {
        const populatedUser = await User.findById(user._id || user.id)
            .populate('role', 'slug')
            .select('role');
        
        if (populatedUser && populatedUser.role && populatedUser.role.slug) {
            return {
                slug: populatedUser.role.slug,
                level: ROLE_HIERARCHY[populatedUser.role.slug] || 0
            };
        }
    }

    // Fallback: if role is string
    if (typeof user.role === 'string') {
        return {
            slug: user.role,
            level: ROLE_HIERARCHY[user.role] || 0
        };
    }

    return null;
}

/**
 * Check if user is the creator of the content
 * @param {Object} user - User object
 * @param {Object} content - Content object (page/section) with createdBy field
 * @returns {boolean} True if user created the content
 */
function isCreator(user, content) {
    if (!user || !content || !content.createdBy) {
        return false;
    }

    const userId = user._id ? user._id.toString() : user.id ? user.id.toString() : user.toString();
    const creatorId = content.createdBy._id 
        ? content.createdBy._id.toString() 
        : content.createdBy.toString();

    return userId === creatorId;
}

/**
 * Get resource ID from resource type (slug or ObjectId)
 * @param {string|ObjectId} resourceType - Resource slug (e.g., 'pages', 'sections') or ObjectId
 * @returns {Promise<ObjectId|null>} Resource ObjectId or null
 */
async function getResourceId(resourceType) {
    // If already an ObjectId, return it
    if (mongoose.Types.ObjectId.isValid(resourceType) && resourceType.toString().length === 24) {
        return new mongoose.Types.ObjectId(resourceType);
    }

    // Try to find by slug
    const resource = await Resource.findOne({ 
        slug: resourceType,
        isActive: true
    }).select('_id');

    return resource ? resource._id : null;
}

/**
 * Check if user can edit content based on permission + role hierarchy + workflow status
 * @param {Object} user - User object
 * @param {Object} content - Content object (page/section) with status and createdBy
 * @param {string} resourceType - Resource type ('pages' or 'sections')
 * @param {string} action - Action being performed (default: 'update')
 * @returns {Promise<Object>} { canEdit: boolean, reason: string }
 */
async function canEditContent(user, content, resourceType, action = 'update') {
    try {
        // 1. Check if Admin/Super Admin → bypass all restrictions
        if (await isAdminOrSuperAdmin(user)) {
            return { 
                canEdit: true, 
                reason: 'Admin/Super Admin can edit content in any status' 
            };
        }

        // 2. Validate content status
        if (!content.status) {
            return { 
                canEdit: false, 
                reason: 'Content status is required' 
            };
        }

        const statusReq = STATUS_ROLE_REQUIREMENTS[content.status];
        if (!statusReq) {
            return { 
                canEdit: false, 
                reason: `Invalid content status: ${content.status}` 
            };
        }

        // 3. Get user's role hierarchy level
        const userRole = await getUserRole(user);
        if (!userRole) {
            return { 
                canEdit: false, 
                reason: 'User role not found' 
            };
        }

        const userRoleLevel = userRole.level;
        const requiredRoleLevel = ROLE_HIERARCHY[statusReq.minRole] || 0;

        // 4. Get resource ID for permission check
        // Normalize resource type: 'page' -> 'pages', 'section' -> 'sections'
        let normalizedResourceType = resourceType;
        if (resourceType === 'page') normalizedResourceType = 'pages';
        if (resourceType === 'section') normalizedResourceType = 'sections';
        
        const resourceId = await getResourceId(normalizedResourceType);
        if (!resourceId) {
            return { 
                canEdit: false, 
                reason: `Cannot edit content. Resource '${normalizedResourceType}' not found in system. Please ensure the resource exists and is active.` 
            };
        }

        // 5. Check if user has permission
        const userId = user._id || user.id;
        const hasPermission = await Permission.hasUserPermission(userId, resourceId, action);

        // 6. If has permission, check if role is appropriate for status
        if (hasPermission) {
            if (userRoleLevel >= requiredRoleLevel) {
                return { 
                    canEdit: true, 
                    reason: `User has '${action}' permission and role '${userRole.slug}' (level ${userRoleLevel}) is appropriate for status '${content.status}' (requires ${statusReq.minRole}+, level ${requiredRoleLevel})` 
                };
            } else {
                return { 
                    canEdit: false, 
                    reason: `User has '${action}' permission but role '${userRole.slug}' (level ${userRoleLevel}) is not appropriate for status '${content.status}'. Requires ${statusReq.minRole}+ role (level ${requiredRoleLevel})` 
                };
            }
        }

        // 7. If no permission, check if creator can edit (for draft/changes_requested)
        if (statusReq.allowCreator && isCreator(user, content)) {
            return { 
                canEdit: true, 
                reason: `Creator can edit content in '${content.status}' status` 
            };
        }

        // 8. Default: cannot edit
        return { 
            canEdit: false, 
            reason: `Cannot edit content in '${content.status}' status. Requires ${statusReq.minRole}+ role and '${action}' permission` 
        };

    } catch (error) {
        console.error('Error in canEditContent:', error);
        return { 
            canEdit: false, 
            reason: `Error checking edit permission: ${error.message}` 
        };
    }
}

/**
 * Check if user can delete content based on permission + role hierarchy + workflow status
 * @param {Object} user - User object
 * @param {Object} content - Content object (page/section) with status and createdBy
 * @param {string} resourceType - Resource type ('pages' or 'sections')
 * @returns {Promise<Object>} { canDelete: boolean, reason: string }
 */
async function canDeleteContent(user, content, resourceType) {
    try {
        // 1. Check if Admin/Super Admin → bypass all restrictions
        if (await isAdminOrSuperAdmin(user)) {
            return { 
                canDelete: true, 
                reason: 'Admin/Super Admin can delete content in any status' 
            };
        }

        // 2. Validate content status
        if (!content.status) {
            return { 
                canDelete: false, 
                reason: 'Content status is required' 
            };
        }

        // 3. Get resource ID for permission check
        const resourceId = await getResourceId(resourceType);
        if (!resourceId) {
            return { 
                canDelete: false, 
                reason: `Resource '${resourceType}' not found` 
            };
        }

        // 4. Check if user has delete permission
        const userId = user._id || user.id;
        const hasPermission = await Permission.hasUserPermission(userId, resourceId, 'delete');

        // 5. If has permission, allow deletion regardless of status
        if (hasPermission) {
            return { 
                canDelete: true, 
                reason: `User has 'delete' permission` 
            };
        }

        // 6. If no permission, check workflow status restrictions
        // Block deletion if content is in active workflow states
        const restrictedStatuses = ['in_review', 'pending_approval', 'pending_publish'];
        if (restrictedStatuses.includes(content.status)) {
            return { 
                canDelete: false, 
                reason: `Cannot delete content in '${content.status}' status. Content is in active workflow. Please wait for workflow completion or request changes.` 
            };
        }

        // 7. Allow deletion in draft, changes_requested, published, archived (if creator)
        if (isCreator(user, content)) {
            return { 
                canDelete: true, 
                reason: `Creator can delete content in '${content.status}' status` 
            };
        }

        // 8. Default: cannot delete
        return { 
            canDelete: false, 
            reason: `Cannot delete content. Requires 'delete' permission or be the creator` 
        };

    } catch (error) {
        console.error('Error in canDeleteContent:', error);
        return { 
            canDelete: false, 
            reason: `Error checking delete permission: ${error.message}` 
        };
    }
}

/**
 * Check if user can modify page tree (move/reorder) based on permission + role hierarchy + workflow status
 * @param {Object} user - User object
 * @param {Object} page - Page object with status
 * @param {string} resourceType - Resource type (default: 'pages')
 * @returns {Promise<Object>} { canModify: boolean, reason: string }
 */
async function canModifyTree(user, page, resourceType = 'pages') {
    try {
        // 1. Check if Admin/Super Admin → bypass all restrictions
        if (await isAdminOrSuperAdmin(user)) {
            return { 
                canModify: true, 
                reason: 'Admin/Super Admin can modify tree in any status' 
            };
        }

        // 2. Validate page status
        if (!page.status) {
            return { 
                canModify: false, 
                reason: 'Page status is required' 
            };
        }

        // 3. Get resource ID for permission check
        // Normalize resource type: 'page' -> 'pages'
        let normalizedResourceType = resourceType;
        if (resourceType === 'page') normalizedResourceType = 'pages';
        
        const resourceId = await getResourceId(normalizedResourceType);
        if (!resourceId) {
            return { 
                canModify: false, 
                reason: `Cannot modify tree. Resource '${normalizedResourceType}' not found in system. Please ensure the resource exists and is active.` 
            };
        }

        // 4. Check if user has update permission
        const userId = user._id || user.id;
        const hasPermission = await Permission.hasUserPermission(userId, resourceId, 'update');

        // 5. If has permission, check role hierarchy for status
        if (hasPermission) {
            const userRole = await getUserRole(user);
            if (!userRole) {
                return { 
                    canModify: false, 
                    reason: 'User role not found' 
                };
            }

            const statusReq = STATUS_ROLE_REQUIREMENTS[page.status];
            if (statusReq) {
                const userRoleLevel = userRole.level;
                const requiredRoleLevel = ROLE_HIERARCHY[statusReq.minRole] || 0;

                if (userRoleLevel >= requiredRoleLevel) {
                    return { 
                        canModify: true, 
                        reason: `User has 'update' permission and role is appropriate for status '${page.status}'` 
                    };
                } else {
                    return { 
                        canModify: false, 
                        reason: `User has 'update' permission but role '${userRole.slug}' is not appropriate for status '${page.status}'. Requires ${statusReq.minRole}+` 
                    };
                }
            }
        }

        // 6. If no permission, only allow modification in draft status
        if (page.status === 'draft') {
            return { 
                canModify: true, 
                reason: 'Page is in draft status' 
            };
        }

        // 7. Default: cannot modify
        return { 
            canModify: false, 
            reason: `Cannot modify page tree. Page is in '${page.status}' status. Only draft pages can be modified without permission.` 
        };

    } catch (error) {
        console.error('Error in canModifyTree:', error);
        return { 
            canModify: false, 
            reason: `Error checking tree modification permission: ${error.message}` 
        };
    }
}

/**
 * Check if user can create section based on permission + role hierarchy + parent page status
 * @param {Object} user - User object
 * @param {Object} page - Parent page object with status
 * @returns {Promise<Object>} { canCreate: boolean, reason: string }
 */
async function canCreateSection(user, page) {
    try {
        // 1. Check if Admin/Super Admin → bypass all restrictions
        if (await isAdminOrSuperAdmin(user)) {
            return { 
                canCreate: true, 
                reason: 'Admin/Super Admin can create sections regardless of parent page status' 
            };
        }

        // 2. Validate page status
        if (!page.status) {
            return { 
                canCreate: false, 
                reason: 'Parent page status is required' 
            };
        }

        // 3. Get resource ID for sections
        const resourceId = await getResourceId('sections');
        if (!resourceId) {
            return { 
                canCreate: false, 
                reason: 'Resource \'sections\' not found' 
            };
        }

        // 4. Check if user has create permission for sections
        const userId = user._id || user.id;
        const hasPermission = await Permission.hasUserPermission(userId, resourceId, 'create');

        // 5. If has permission, check role hierarchy for parent page status
        if (hasPermission) {
            const userRole = await getUserRole(user);
            if (!userRole) {
                return { 
                    canCreate: false, 
                    reason: 'User role not found' 
                };
            }

            const statusReq = STATUS_ROLE_REQUIREMENTS[page.status];
            if (statusReq) {
                const userRoleLevel = userRole.level;
                const requiredRoleLevel = ROLE_HIERARCHY[statusReq.minRole] || 0;

                if (userRoleLevel >= requiredRoleLevel) {
                    return { 
                        canCreate: true, 
                        reason: `User has 'create' permission for sections and role is appropriate for parent page status '${page.status}'` 
                    };
                } else {
                    return { 
                        canCreate: false, 
                        reason: `User has 'create' permission but role '${userRole.slug}' is not appropriate for parent page status '${page.status}'. Requires ${statusReq.minRole}+` 
                    };
                }
            }
        }

        // 6. If no permission, only allow creation when parent page is draft or changes_requested
        const allowedStatuses = ['draft', 'changes_requested'];
        if (allowedStatuses.includes(page.status)) {
            // Check if user is the creator of the page
            if (isCreator(user, page)) {
                return { 
                    canCreate: true, 
                    reason: `Creator can create sections when parent page is in '${page.status}' status` 
                };
            }
        }

        // 7. Default: cannot create
        return { 
            canCreate: false, 
            reason: `Cannot create section. Parent page is in '${page.status}' status. Requires 'create' permission for sections and appropriate role, or parent page must be in 'draft'/'changes_requested' status (if creator).` 
        };

    } catch (error) {
        console.error('Error in canCreateSection:', error);
        return { 
            canCreate: false, 
            reason: `Error checking section creation permission: ${error.message}` 
        };
    }
}

/**
 * Check if all pages in a list can be modified (for reordering)
 * @param {Object} user - User object
 * @param {Array<Object>} pages - Array of page objects with status
 * @param {string} resourceType - Resource type (default: 'pages')
 * @returns {Promise<Object>} { canModify: boolean, reason: string, blockedPages: Array }
 */
async function canModifyTreeBatch(user, pages, resourceType = 'pages') {
    try {
        const blockedPages = [];

        for (const page of pages) {
            const result = await canModifyTree(user, page, resourceType);
            if (!result.canModify) {
                blockedPages.push({
                    pageId: page._id || page.id,
                    title: page.title || 'Unknown',
                    status: page.status,
                    reason: result.reason
                });
            }
        }

        if (blockedPages.length > 0) {
            return {
                canModify: false,
                reason: `${blockedPages.length} page(s) cannot be modified`,
                blockedPages
            };
        }

        return {
            canModify: true,
            reason: 'All pages can be modified',
            blockedPages: []
        };

    } catch (error) {
        console.error('Error in canModifyTreeBatch:', error);
        return {
            canModify: false,
            reason: `Error checking batch tree modification: ${error.message}`,
            blockedPages: []
        };
    }
}

module.exports = {
    canEditContent,
    canDeleteContent,
    canModifyTree,
    canCreateSection,
    canModifyTreeBatch,
    isAdminOrSuperAdmin,
    isCreator,
    getUserRole,
    STATUS_ROLE_REQUIREMENTS
};

