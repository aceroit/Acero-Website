/**
 * Application constants
 */

module.exports = {
    // User roles
    ROLES: {
        SUPER_ADMIN: 'super_admin',
        ADMIN: 'admin',
        APPROVER: 'approver',
        REVIEWER: 'reviewer',
        EDITOR: 'editor',
        VIEWER: 'viewer'
    },

    // Permission actions
    ACTIONS: {
        CREATE: 'create',
        READ: 'read',
        UPDATE: 'update',
        DELETE: 'delete',
        APPROVE: 'approve',
        PUBLISH: 'publish'
    },

    // Resources
    RESOURCES: {
        USERS: 'users',
        PERMISSIONS: 'permissions',
        PAGES: 'pages',
        SECTIONS: 'sections',
        SECTION_TYPES: 'section_types',
        PRODUCTS: 'products',
        PROJECTS: 'projects',
        MEDIA: 'media',
        ACTIVITY_LOGS: 'activity_logs'
    },

    // Content status
    STATUS: {
        DRAFT: 'draft',
        IN_REVIEW: 'in_review',
        PENDING_APPROVAL: 'pending_approval',
        PENDING_PUBLISH: 'pending_publish',
        PUBLISHED: 'published',
        CHANGES_REQUESTED: 'changes_requested',
        ARCHIVED: 'archived'
    },

    // Activity log actions
    ACTIVITY_ACTIONS: {
        CREATE: 'create',
        READ: 'read',
        UPDATE: 'update',
        DELETE: 'delete',
        APPROVE: 'approve',
        REJECT: 'reject',
        PUBLISH: 'publish',
        LOGIN: 'login',
        LOGOUT: 'logout'
    }
};

