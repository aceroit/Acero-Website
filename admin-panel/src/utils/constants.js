// Role constants
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  APPROVER: 'approver',
  REVIEWER: 'reviewer',
  EDITOR: 'editor',
  VIEWER: 'viewer'
};

// Resource constants
export const RESOURCES = {
  USERS: 'users',
  PERMISSIONS: 'permissions',
  PAGES: 'pages',
  SECTIONS: 'sections',
  SECTION_TYPES: 'section_types',
  ACTIVITY_LOGS: 'activity_logs',
  MEDIA: 'media',
  NOTIFICATIONS: 'notifications',
  WORKFLOW: 'workflow'
};

// Action constants
export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  PUBLISH: 'publish'
};

// Role display names
export const ROLE_DISPLAY_NAMES = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.APPROVER]: 'Approver',
  [ROLES.REVIEWER]: 'Reviewer',
  [ROLES.EDITOR]: 'Editor',
  [ROLES.VIEWER]: 'Viewer'
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  PERMISSIONS: 'permissions'
};

