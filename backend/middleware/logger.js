const ActivityLog = require('../models/ActivityLog');

/**
 * Automatic activity logging middleware
 * Logs all CUD (Create, Update, Delete) operations
 */
exports.activityLogger = async (req, res, next) => {
    // Only log authenticated requests
    if (!req.user) {
        return next();
    }

    // Only log POST, PUT, PATCH, DELETE (CUD operations)
    const loggableMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!loggableMethods.includes(req.method)) {
        return next();
    }

    // Routes to exclude from logging
    const excludedRoutes = (process.env.LOG_EXCLUDE_ROUTES || '')
        .split(',')
        .map(route => route.trim())
        .filter(Boolean);

    // Check if current route should be excluded
    const shouldExclude = excludedRoutes.some(route => req.originalUrl.includes(route));
    if (shouldExclude) {
        return next();
    }

    // Exclude certain paths
    if (
        req.originalUrl.includes('/api/auth/refresh') ||
        req.originalUrl.includes('/api/notifications') ||
        req.originalUrl === '/' ||
        req.originalUrl.includes('/health')
    ) {
        return next();
    }

    // Capture request data before processing
    const requestBody = { ...req.body };
    
    // Remove sensitive data from logs
    if (requestBody.password) requestBody.password = '[REDACTED]';
    if (requestBody.currentPassword) requestBody.currentPassword = '[REDACTED]';
    if (requestBody.newPassword) requestBody.newPassword = '[REDACTED]';
    if (requestBody.token) requestBody.token = '[REDACTED]';

    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);

    // Override res.json to capture response
    res.json = function(data) {
        // Only log successful operations (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300) {
            // Determine action from HTTP method
            let action = 'update';
            if (req.method === 'POST') {
                action = 'create';
            } else if (req.method === 'DELETE') {
                action = 'delete';
            }

            // Extract resource from URL path
            const resource = extractResourceFromPath(req.path);
            
            // Extract resource ID from URL params or response
            const resourceId = extractResourceId(req, data);

            // Log activity asynchronously (don't wait for it)
            logActivity({
                userId: req.user.id,
                action,
                resource,
                resourceId,
                changes: {
                    before: null, // Would need to fetch existing data to populate this
                    after: requestBody
                },
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent'),
                status: 'success',
                metadata: {
                    method: req.method,
                    path: req.path,
                    statusCode: res.statusCode
                }
            }).catch(err => {
                console.error('Failed to log activity:', err);
            });
        }

        // Call original res.json
        return originalJson(data);
    };

    next();
};

/**
 * Extract resource type from URL path
 */
function extractResourceFromPath(path) {
    // Remove /api/ prefix and get the first segment
    const segments = path.replace(/^\/api\//, '').split('/');
    
    // Map plural to singular
    const resourceMap = {
        'pages': 'page',
        'sections': 'section',
        'users': 'user',
        'permissions': 'permission',
        'notifications': 'notification',
        'media': 'media',
        'workflow': 'workflow',
        'dashboard': 'dashboard',
        'activity': 'activity',
        'section-types': 'section-type',
        'public': 'public'
    };

    const firstSegment = segments[0];
    return resourceMap[firstSegment] || firstSegment;
}

/**
 * Extract resource ID from request params or response data
 */
function extractResourceId(req, responseData) {
    // Try to get from URL params
    if (req.params.id) {
        return req.params.id;
    }
    if (req.params.pageId) {
        return req.params.pageId;
    }
    if (req.params.sectionId) {
        return req.params.sectionId;
    }
    if (req.params.userId) {
        return req.params.userId;
    }

    // Try to get from response data
    if (responseData && responseData.data) {
        if (responseData.data._id) {
            return responseData.data._id;
        }
        if (responseData.data.id) {
            return responseData.data.id;
        }
    }

    return null;
}

/**
 * Async function to log activity
 */
async function logActivity(data) {
    try {
        await ActivityLog.logActivity(data);
    } catch (error) {
        console.error('Activity logging error:', error);
        // Don't throw error to prevent disrupting main operations
    }
}

/**
 * Manual activity logger for specific actions
 * Use this for actions that need custom logging
 */
exports.logManualActivity = async (userId, action, resource, resourceId, changes = null, metadata = {}) => {
    try {
        await ActivityLog.logActivity({
            userId,
            action,
            resource,
            resourceId,
            changes,
            status: 'success',
            metadata
        });
    } catch (error) {
        console.error('Manual activity logging error:', error);
    }
};

