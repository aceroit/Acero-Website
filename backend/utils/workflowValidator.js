// Workflow state transition validation utilities

const WORKFLOW_STATES = {
    DRAFT: 'draft',
    IN_REVIEW: 'in_review',
    PENDING_APPROVAL: 'pending_approval',
    PENDING_PUBLISH: 'pending_publish',
    PUBLISHED: 'published',
    CHANGES_REQUESTED: 'changes_requested',
    ARCHIVED: 'archived'
};

// Define valid state transitions and required permissions
// Each transition maps to a required permission action on the workflow resource
const STATE_TRANSITIONS = {
    [WORKFLOW_STATES.DRAFT]: {
        [WORKFLOW_STATES.IN_REVIEW]: 'update', // Anyone with update permission can submit
        [WORKFLOW_STATES.ARCHIVED]: 'delete', // Archive requires delete permission
        [WORKFLOW_STATES.PUBLISHED]: 'publish' // Publish directly from draft requires publish permission
    },
    [WORKFLOW_STATES.IN_REVIEW]: {
        [WORKFLOW_STATES.PENDING_APPROVAL]: 'review', // Review action required
        [WORKFLOW_STATES.CHANGES_REQUESTED]: 'review', // Request changes requires review permission
        [WORKFLOW_STATES.DRAFT]: 'update' // Can revert to draft with update permission
    },
    [WORKFLOW_STATES.CHANGES_REQUESTED]: {
        [WORKFLOW_STATES.IN_REVIEW]: 'update', // Resubmit requires update permission
        [WORKFLOW_STATES.DRAFT]: 'update' // Can go back to draft with update permission
    },
    [WORKFLOW_STATES.PENDING_APPROVAL]: {
        [WORKFLOW_STATES.PENDING_PUBLISH]: 'approve', // Approve action required
        [WORKFLOW_STATES.CHANGES_REQUESTED]: 'approve', // Reject requires approve permission
        [WORKFLOW_STATES.IN_REVIEW]: 'review' // Can send back to review with review permission
    },
    [WORKFLOW_STATES.PENDING_PUBLISH]: {
        [WORKFLOW_STATES.PUBLISHED]: 'publish', // Publish action required
        [WORKFLOW_STATES.CHANGES_REQUESTED]: 'approve' // Request changes requires approve permission
    },
    [WORKFLOW_STATES.PUBLISHED]: {
        [WORKFLOW_STATES.DRAFT]: 'publish', // Unpublish requires publish permission
        [WORKFLOW_STATES.ARCHIVED]: 'delete' // Archive requires delete permission
    },
    [WORKFLOW_STATES.ARCHIVED]: {
        [WORKFLOW_STATES.DRAFT]: 'delete' // Restore requires delete permission
    }
};

// Keep ROLE_HIERARCHY for backward compatibility (may be used elsewhere)
const ROLE_HIERARCHY = {
    viewer: 0,
    editor: 1,
    reviewer: 2,
    approver: 3,
    admin: 4,
    super_admin: 5
};

/**
 * Check if a state transition is valid (permission-based)
 * @param {string} currentStatus - Current workflow status
 * @param {string} newStatus - Desired new status
 * @param {string|ObjectId} userId - User ID attempting the transition
 * @param {string|ObjectId} resourceType - Resource type (e.g., 'pages', 'sections') or workflow resource ID
 * @param {Object} resourceItem - Optional: The actual resource item (page/section) to check creator status
 * @returns {Promise<Object>} { isValid: boolean, message: string }
 */
async function canTransition(currentStatus, newStatus, userId, resourceType = 'workflow', resourceItem = null) {
    const Permission = require('../models/Permission');
    const Resource = require('../models/Resource');
    const mongoose = require('mongoose');
    
    // Check if current status exists
    if (!STATE_TRANSITIONS[currentStatus]) {
        return {
            isValid: false,
            message: `Invalid current status: ${currentStatus}`
        };
    }

    // Check if transition is allowed from current status
    const allowedTransitions = STATE_TRANSITIONS[currentStatus];
    if (!allowedTransitions[newStatus]) {
        return {
            isValid: false,
            message: `Cannot transition from ${currentStatus} to ${newStatus}`
        };
    }

    // Get required permission action for this transition
    const requiredAction = allowedTransitions[newStatus];

    // Get workflow resource ID (supports slug or ObjectId)
    let workflowResourceId = null;
    if (mongoose.Types.ObjectId.isValid(resourceType) && resourceType.toString().length === 24) {
        workflowResourceId = new mongoose.Types.ObjectId(resourceType);
    } else {
        // Try to find workflow resource by slug
        const workflowResource = await Resource.findOne({ 
            $or: [
                { slug: resourceType },
                { path: resourceType }
            ]
        }).select('_id');
        
        if (!workflowResource) {
            // Fallback: try to find 'workflow' resource
            const defaultWorkflowResource = await Resource.findOne({ slug: 'workflow' }).select('_id');
            if (defaultWorkflowResource) {
                workflowResourceId = defaultWorkflowResource._id;
            } else {
                return {
                    isValid: false,
                    message: `Workflow resource not found. Please create a 'workflow' resource.`
                };
            }
        } else {
            workflowResourceId = workflowResource._id;
        }
    }

    // Check if user has the required permission on workflow resource
    let hasPermission = await Permission.hasUserPermission(userId, workflowResourceId, requiredAction);

    // Special handling for draft → in_review (submit) and changes_requested → in_review (resubmit):
    // Also check if user is creator OR has update permission on actual resource
    if (!hasPermission && requiredAction === 'update' && newStatus === WORKFLOW_STATES.IN_REVIEW && 
        (currentStatus === WORKFLOW_STATES.DRAFT || currentStatus === WORKFLOW_STATES.CHANGES_REQUESTED)) {
        // Check if user is the creator
        if (resourceItem && resourceItem.createdBy) {
            const createdById = resourceItem.createdBy._id ? resourceItem.createdBy._id.toString() : resourceItem.createdBy.toString();
            const userIdStr = userId.toString();
            if (createdById === userIdStr) {
                hasPermission = true; // Creator can always submit/resubmit their own content
            }
        }

        // If still no permission, check if user has 'update' permission on the actual resource (pages/sections)
        if (!hasPermission) {
            // Normalize resource type to plural form
            let normalizedResourceType = resourceType;
            if (resourceType === 'page') normalizedResourceType = 'pages';
            if (resourceType === 'section') normalizedResourceType = 'sections';
            
            const actualResource = await Resource.findOne({ slug: normalizedResourceType, isActive: true }).select('_id');
            if (actualResource) {
                const hasResourceUpdatePermission = await Permission.hasUserPermission(userId, actualResource._id, 'update');
                if (hasResourceUpdatePermission) {
                    hasPermission = true;
                }
            }
        }
    }

    // For review/approve/publish/delete actions, also check permissions on actual resource (pages/sections)
    // This allows users to have permissions on pages/sections resource instead of workflow resource
    if (!hasPermission && (requiredAction === 'review' || requiredAction === 'approve' || requiredAction === 'publish' || requiredAction === 'delete')) {
        // Normalize resource type to plural form
        let normalizedResourceType = resourceType;
        if (resourceType === 'page') normalizedResourceType = 'pages';
        if (resourceType === 'section') normalizedResourceType = 'sections';
        
        // Get actual resource ID (pages or sections)
        const actualResource = await Resource.findOne({ slug: normalizedResourceType, isActive: true }).select('_id');
        
        if (actualResource) {
            // Check if user has the required action permission on the actual resource
            // e.g., 'review' permission on pages resource, 'approve' permission on pages resource, or 'publish' permission on pages resource
            const hasResourcePermission = await Permission.hasUserPermission(userId, actualResource._id, requiredAction);
            if (hasResourcePermission) {
                hasPermission = true;
            }
        } else {
            // Log for debugging - resource not found
            console.warn(`[WorkflowValidator] Actual resource '${normalizedResourceType}' not found for ${requiredAction} check`);
        }
    }

    if (!hasPermission) {
        const User = require('../models/User');
        const user = await User.findById(userId).populate('role', 'slug name');
        const userRole = user?.role?.slug || user?.role || 'unknown';
        
        // Provide more helpful error message
        if (currentStatus === WORKFLOW_STATES.DRAFT && newStatus === WORKFLOW_STATES.IN_REVIEW) {
            return {
                isValid: false,
                message: `You do not have permission to submit this content for review. Your role: ${userRole}. You need either: (1) 'update' permission on workflow resource, (2) 'update' permission on ${resourceType} resource, or (3) be the creator of this content.`
            };
        }
        
        // For review/approve/publish actions, mention both workflow and actual resource
        if (requiredAction === 'review' || requiredAction === 'approve' || requiredAction === 'publish') {
            const resourceName = (resourceType === 'page' || resourceType === 'pages') ? 'pages' : 'sections';
            return {
                isValid: false,
                message: `You do not have '${requiredAction}' permission to transition from '${currentStatus}' to '${newStatus}'. Your role: ${userRole}. Required permission: '${requiredAction}' on workflow resource OR '${requiredAction}' on ${resourceName} resource. Current status: ${currentStatus}, Target status: ${newStatus}`
            };
        }
        
        return {
            isValid: false,
            message: `You do not have '${requiredAction}' permission on workflow resource to transition from '${currentStatus}' to '${newStatus}'. Your role: ${userRole}. Required permission: '${requiredAction}' on workflow resource. Current status: ${currentStatus}, Target status: ${newStatus}`
        };
    }

    return {
        isValid: true,
        message: 'Transition is valid'
    };
}

/**
 * Get the required permission action for a state transition
 * @param {string} fromStatus - Current status
 * @param {string} toStatus - Target status
 * @returns {string|null} Required permission action or null if transition not allowed
 */
function getRequiredPermissionForTransition(fromStatus, toStatus) {
    if (!STATE_TRANSITIONS[fromStatus]) {
        return null;
    }

    const allowedTransitions = STATE_TRANSITIONS[fromStatus];
    return allowedTransitions[toStatus] || null;
}

/**
 * Get the minimum required role for a state transition (deprecated - use getRequiredPermissionForTransition)
 * @deprecated Use getRequiredPermissionForTransition instead
 * @param {string} fromStatus - Current status
 * @param {string} toStatus - Target status
 * @returns {string|null} Required role or null if transition not allowed
 */
function getRequiredRoleForTransition(fromStatus, toStatus) {
    // Map permission actions to legacy role names for backward compatibility
    const permissionToRoleMap = {
        'update': 'editor',
        'review': 'reviewer',
        'approve': 'approver',
        'publish': 'admin',
        'delete': 'admin'
    };
    
    const requiredPermission = getRequiredPermissionForTransition(fromStatus, toStatus);
    return requiredPermission ? (permissionToRoleMap[requiredPermission] || null) : null;
}

/**
 * Get all possible next states for current status and user permissions
 * @param {string} currentStatus - Current workflow status
 * @param {string|ObjectId} userId - User ID
 * @param {string|ObjectId} resourceType - Resource type (e.g., 'pages', 'sections') or workflow resource ID
 * @param {Object} resourceItem - Optional: The actual resource item (page/section) to check creator status
 * @returns {Promise<Array>} Array of possible next states with required permissions
 */
async function getNextPossibleStates(currentStatus, userId, resourceType = 'workflow', resourceItem = null) {
    const Permission = require('../models/Permission');
    const Resource = require('../models/Resource');
    const mongoose = require('mongoose');
    
    if (!STATE_TRANSITIONS[currentStatus]) {
        return [];
    }

    // Get workflow resource ID
    let workflowResourceId = null;
    if (mongoose.Types.ObjectId.isValid(resourceType) && resourceType.toString().length === 24) {
        workflowResourceId = new mongoose.Types.ObjectId(resourceType);
    } else {
        const workflowResource = await Resource.findOne({ 
            $or: [
                { slug: resourceType },
                { path: resourceType }
            ]
        }).select('_id');
        
        if (!workflowResource) {
            const defaultWorkflowResource = await Resource.findOne({ slug: 'workflow' }).select('_id');
            if (defaultWorkflowResource) {
                workflowResourceId = defaultWorkflowResource._id;
            } else {
                return [];
            }
        } else {
            workflowResourceId = workflowResource._id;
        }
    }

    // Get actual resource ID (pages or sections) for permission checking
    let actualResourceId = null;
    if (resourceType === 'page' || resourceType === 'pages') {
        const pagesResource = await Resource.findOne({ slug: 'pages' }).select('_id');
        if (pagesResource) {
            actualResourceId = pagesResource._id;
        }
    } else if (resourceType === 'section' || resourceType === 'sections') {
        const sectionsResource = await Resource.findOne({ slug: 'sections' }).select('_id');
        if (sectionsResource) {
            actualResourceId = sectionsResource._id;
        }
    }

    // Check if user is the creator of the resource
    const isCreator = resourceItem && resourceItem.createdBy && 
        (resourceItem.createdBy.toString() === userId.toString() || 
         (resourceItem.createdBy._id && resourceItem.createdBy._id.toString() === userId.toString()));

    const allowedTransitions = STATE_TRANSITIONS[currentStatus];
    const possibleStates = [];

    // Check each possible transition
    for (const [nextState, requiredAction] of Object.entries(allowedTransitions)) {
        let hasPermission = false;

        // Check workflow resource permission
        const hasWorkflowPermission = await Permission.hasUserPermission(userId, workflowResourceId, requiredAction);
        
        // For draft → in_review (submit), also check:
        // 1. If user is creator (can submit their own draft)
        // 2. If user has 'update' permission on the actual resource (pages/sections)
        if (currentStatus === WORKFLOW_STATES.DRAFT && nextState === WORKFLOW_STATES.IN_REVIEW && requiredAction === 'update') {
            // Creator can always submit their own draft
            if (isCreator) {
                hasPermission = true;
            } else if (actualResourceId) {
                // Check if user has 'update' permission on pages/sections resource
                const hasResourceUpdatePermission = await Permission.hasUserPermission(userId, actualResourceId, 'update');
                hasPermission = hasResourceUpdatePermission;
            } else {
                // Fallback to workflow permission
                hasPermission = hasWorkflowPermission;
            }
        } else {
            // For other transitions (review, approve, publish, delete, etc.), check BOTH:
            // 1. Workflow resource permission (review/approve/publish/delete on workflow resource)
            // 2. OR actual resource permission (review/approve/publish/delete on pages/sections resource)
            // This allows users to have permission on either resource
            if (hasWorkflowPermission) {
                hasPermission = true;
            } else if (actualResourceId) {
                // Check if user has the required action permission on the actual resource
                // e.g., 'review' permission on pages resource, 'approve' permission on pages resource,
                // 'publish' permission on pages resource, or 'delete' permission on pages resource
                const hasResourcePermission = await Permission.hasUserPermission(userId, actualResourceId, requiredAction);
                hasPermission = hasResourcePermission;
            } else {
                hasPermission = false;
            }
        }

        if (hasPermission) {
            possibleStates.push({
                status: nextState,
                requiredPermission: requiredAction
            });
        }
    }

    return possibleStates;
}

/**
 * Validate workflow action payload
 * @param {string} action - Action being performed (submit, review, approve, etc.)
 * @param {Object} payload - Request payload
 * @returns {Object} { isValid: boolean, errors: Array }
 */
function validateWorkflowPayload(action, payload) {
    const errors = [];

    switch (action) {
        case 'submit':
        case 'review':
        case 'approve':
        case 'publish':
        case 'unpublish':
        case 'archive':
        case 'restore':
            // These actions typically don't require additional fields
            break;

        case 'request_changes':
        case 'reject':
            // These actions should include feedback
            if (!payload.feedback || payload.feedback.trim() === '') {
                errors.push('Feedback is required when requesting changes or rejecting content');
            }
            break;

        default:
            errors.push(`Unknown workflow action: ${action}`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Check if user has permission to perform action on resource
 * @param {Object} user - User object with role (can be ObjectId or populated Role object)
 * @param {Object} resource - Resource (page/section) with permissions field
 * @param {string} action - Action being performed
 * @returns {boolean} True if user has permission
 */
function hasResourcePermission(user, resource, action) {
    // Get user's role ID (handles both ObjectId and populated Role object)
    let userRoleId = null;
    let userRoleSlug = null;
    
    if (user.role) {
        if (typeof user.role === 'object' && user.role._id) {
            // Role is populated
            userRoleId = user.role._id.toString();
            userRoleSlug = user.role.slug;
        } else if (typeof user.role === 'object' && user.role.toString) {
            // Role is ObjectId
            userRoleId = user.role.toString();
        } else {
            // Fallback for string role (during migration)
            userRoleSlug = user.role;
        }
    }
    
    // Super admin always has access (check by slug if available, or by role name during migration)
    if (userRoleSlug === 'super_admin' || (typeof user.role === 'string' && user.role === 'super_admin')) {
        return true;
    }
    
    // Admin always has access (check by slug if available, or by role name during migration)
    if (userRoleSlug === 'admin' || (typeof user.role === 'string' && user.role === 'admin')) {
        return true;
    }

    // If resource has no specific permissions, use role-based access
    if (!resource.permissions || 
        (!resource.permissions.allowedRoles?.length && 
         !resource.permissions.allowedUsers?.length &&
         !resource.permissions.restrictedUsers?.length)) {
        return true;
    }

    // Check if user is explicitly restricted
    if (resource.permissions.restrictedUsers?.some(id => {
        const restrictedId = id._id ? id._id.toString() : id.toString();
        return restrictedId === user._id.toString();
    })) {
        return false;
    }

    // Check if user is explicitly allowed
    if (resource.permissions.allowedUsers?.some(id => {
        const allowedId = id._id ? id._id.toString() : id.toString();
        return allowedId === user._id.toString();
    })) {
        return true;
    }

    // Check if user's role is allowed (compare ObjectIds)
    if (userRoleId && resource.permissions.allowedRoles?.length) {
        const isAllowed = resource.permissions.allowedRoles.some(allowedRole => {
            const allowedRoleId = allowedRole._id ? allowedRole._id.toString() : allowedRole.toString();
            return allowedRoleId === userRoleId;
        });
        if (isAllowed) {
            return true;
        }
    }
    
    // Fallback: Check by slug if role is populated and allowedRoles are populated
    if (userRoleSlug && resource.permissions.allowedRoles?.length) {
        const isAllowed = resource.permissions.allowedRoles.some(allowedRole => {
            // If allowedRole is populated, check slug
            if (allowedRole.slug) {
                return allowedRole.slug === userRoleSlug;
            }
            return false;
        });
        if (isAllowed) {
            return true;
        }
    }

    // Default deny if permissions are set but user doesn't match
    return false;
}

/**
 * Get workflow action name from status transition
 * @param {string} fromStatus - Current status
 * @param {string} toStatus - Target status
 * @returns {string} Action name
 */
function getActionName(fromStatus, toStatus) {
    const actionMap = {
        [`${WORKFLOW_STATES.DRAFT}_${WORKFLOW_STATES.IN_REVIEW}`]: 'submit',
        [`${WORKFLOW_STATES.IN_REVIEW}_${WORKFLOW_STATES.PENDING_APPROVAL}`]: 'review',
        [`${WORKFLOW_STATES.IN_REVIEW}_${WORKFLOW_STATES.CHANGES_REQUESTED}`]: 'request_changes',
        [`${WORKFLOW_STATES.CHANGES_REQUESTED}_${WORKFLOW_STATES.IN_REVIEW}`]: 'resubmit',
        [`${WORKFLOW_STATES.PENDING_APPROVAL}_${WORKFLOW_STATES.PENDING_PUBLISH}`]: 'approve',
        [`${WORKFLOW_STATES.PENDING_APPROVAL}_${WORKFLOW_STATES.CHANGES_REQUESTED}`]: 'reject',
        [`${WORKFLOW_STATES.PENDING_PUBLISH}_${WORKFLOW_STATES.PUBLISHED}`]: 'publish',
        [`${WORKFLOW_STATES.PUBLISHED}_${WORKFLOW_STATES.DRAFT}`]: 'unpublish',
        [`${WORKFLOW_STATES.PUBLISHED}_${WORKFLOW_STATES.ARCHIVED}`]: 'archive',
        [`${WORKFLOW_STATES.ARCHIVED}_${WORKFLOW_STATES.DRAFT}`]: 'restore'
    };

    return actionMap[`${fromStatus}_${toStatus}`] || 'update';
}

module.exports = {
    WORKFLOW_STATES,
    ROLE_HIERARCHY, // Kept for backward compatibility
    STATE_TRANSITIONS,
    canTransition,
    getRequiredPermissionForTransition,
    getRequiredRoleForTransition, // Deprecated but kept for backward compatibility
    getNextPossibleStates,
    validateWorkflowPayload,
    hasResourcePermission,
    getActionName
};

