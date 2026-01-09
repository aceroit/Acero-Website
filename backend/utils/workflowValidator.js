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

const ROLE_HIERARCHY = {
    viewer: 0,
    editor: 1,
    reviewer: 2,
    approver: 3,
    admin: 4,
    super_admin: 5
};

// Define valid state transitions and required roles
const STATE_TRANSITIONS = {
    [WORKFLOW_STATES.DRAFT]: {
        [WORKFLOW_STATES.IN_REVIEW]: 'editor',
        [WORKFLOW_STATES.ARCHIVED]: 'admin',
        [WORKFLOW_STATES.PUBLISHED]: 'admin' // Admins can publish directly from draft
    },
    [WORKFLOW_STATES.IN_REVIEW]: {
        [WORKFLOW_STATES.PENDING_APPROVAL]: 'reviewer',
        [WORKFLOW_STATES.CHANGES_REQUESTED]: 'reviewer',
        [WORKFLOW_STATES.DRAFT]: 'editor'
    },
    [WORKFLOW_STATES.CHANGES_REQUESTED]: {
        [WORKFLOW_STATES.IN_REVIEW]: 'editor',
        [WORKFLOW_STATES.DRAFT]: 'editor'
    },
    [WORKFLOW_STATES.PENDING_APPROVAL]: {
        [WORKFLOW_STATES.PENDING_PUBLISH]: 'approver',
        [WORKFLOW_STATES.CHANGES_REQUESTED]: 'approver',
        [WORKFLOW_STATES.IN_REVIEW]: 'reviewer'
    },
    [WORKFLOW_STATES.PENDING_PUBLISH]: {
        [WORKFLOW_STATES.PUBLISHED]: 'admin',
        [WORKFLOW_STATES.CHANGES_REQUESTED]: 'admin'
    },
    [WORKFLOW_STATES.PUBLISHED]: {
        [WORKFLOW_STATES.DRAFT]: 'admin',
        [WORKFLOW_STATES.ARCHIVED]: 'admin'
    },
    [WORKFLOW_STATES.ARCHIVED]: {
        [WORKFLOW_STATES.DRAFT]: 'admin'
    }
};

/**
 * Check if a state transition is valid
 * @param {string} currentStatus - Current workflow status
 * @param {string} newStatus - Desired new status
 * @param {string} userRole - Role of the user attempting the transition
 * @returns {Object} { isValid: boolean, message: string }
 */
function canTransition(currentStatus, newStatus, userRole) {
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

    // Check if user has required role
    const requiredRole = allowedTransitions[newStatus];
    const userRoleLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredRoleLevel = ROLE_HIERARCHY[requiredRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
        return {
            isValid: false,
            message: `Role '${userRole}' does not have permission to perform this transition. Required: '${requiredRole}' or higher.`
        };
    }

    return {
        isValid: true,
        message: 'Transition is valid'
    };
}

/**
 * Get the minimum required role for a state transition
 * @param {string} fromStatus - Current status
 * @param {string} toStatus - Target status
 * @returns {string|null} Required role or null if transition not allowed
 */
function getRequiredRoleForTransition(fromStatus, toStatus) {
    if (!STATE_TRANSITIONS[fromStatus]) {
        return null;
    }

    const allowedTransitions = STATE_TRANSITIONS[fromStatus];
    return allowedTransitions[toStatus] || null;
}

/**
 * Get all possible next states for current status and user role
 * @param {string} currentStatus - Current workflow status
 * @param {string} userRole - Role of the user
 * @returns {Array} Array of possible next states
 */
function getNextPossibleStates(currentStatus, userRole) {
    if (!STATE_TRANSITIONS[currentStatus]) {
        return [];
    }

    const allowedTransitions = STATE_TRANSITIONS[currentStatus];
    const userRoleLevel = ROLE_HIERARCHY[userRole] || 0;
    const possibleStates = [];

    for (const [nextState, requiredRole] of Object.entries(allowedTransitions)) {
        const requiredRoleLevel = ROLE_HIERARCHY[requiredRole] || 0;
        if (userRoleLevel >= requiredRoleLevel) {
            possibleStates.push({
                status: nextState,
                requiredRole
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
 * @param {Object} user - User object with role
 * @param {Object} resource - Resource (page/section) with permissions field
 * @param {string} action - Action being performed
 * @returns {boolean} True if user has permission
 */
function hasResourcePermission(user, resource, action) {
    // Super admin and admin always have access
    if (user.role === 'super_admin' || user.role === 'admin') {
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
    if (resource.permissions.restrictedUsers?.some(id => id.toString() === user._id.toString())) {
        return false;
    }

    // Check if user is explicitly allowed
    if (resource.permissions.allowedUsers?.some(id => id.toString() === user._id.toString())) {
        return true;
    }

    // Check if user's role is allowed
    if (resource.permissions.allowedRoles?.includes(user.role)) {
        return true;
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
    ROLE_HIERARCHY,
    STATE_TRANSITIONS,
    canTransition,
    getRequiredRoleForTransition,
    getNextPossibleStates,
    validateWorkflowPayload,
    hasResourcePermission,
    getActionName
};

