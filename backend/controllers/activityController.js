const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseFormatter');

/**
 * Get all activities with filters
 * Admin/Approver+ can see all, others see only their own
 */
exports.getAllActivities = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            action,
            resource,
            userId,
            startDate,
            endDate,
            sortBy = 'timestamp',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = {};

        // Role-based filtering
        if (!['super_admin', 'admin', 'approver'].includes(req.user.role)) {
            query.userId = req.user.id;
        } else if (userId) {
            query.userId = userId;
        }

        // Apply filters
        if (action) query.action = action;
        if (resource) query.resource = resource;

        // Date range filter
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        // Execute query
        const [activities, total] = await Promise.all([
            ActivityLog.find(query)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('userId', 'firstName lastName email role')
                .lean(),
            ActivityLog.countDocuments(query)
        ]);

        return paginatedResponse(
            res,
            activities,
            page,
            limit,
            total,
            'Activities retrieved successfully'
        );
    } catch (error) {
        console.error('Get all activities error:', error);
        return errorResponse(res, 500, 'Failed to retrieve activities', error.message);
    }
};

/**
 * Get specific user's activity history
 */
exports.getUserActivities = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        // Check permission - users can only view their own unless admin+
        if (req.user.id !== userId && !['super_admin', 'admin', 'approver'].includes(req.user.role)) {
            return errorResponse(res, 403, 'You do not have permission to view this user\'s activities');
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [activities, total] = await Promise.all([
            ActivityLog.find({ userId })
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('userId', 'firstName lastName email role')
                .lean(),
            ActivityLog.countDocuments({ userId })
        ]);

        return paginatedResponse(
            res,
            activities,
            page,
            limit,
            total,
            'User activities retrieved successfully'
        );
    } catch (error) {
        console.error('Get user activities error:', error);
        return errorResponse(res, 500, 'Failed to retrieve user activities', error.message);
    }
};

/**
 * Get activity history for a specific resource
 */
exports.getResourceHistory = async (req, res) => {
    try {
        const { resource, id } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [activities, total] = await Promise.all([
            ActivityLog.find({ resource, resourceId: id })
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('userId', 'firstName lastName email role')
                .lean(),
            ActivityLog.countDocuments({ resource, resourceId: id })
        ]);

        return paginatedResponse(
            res,
            activities,
            page,
            limit,
            total,
            'Resource history retrieved successfully'
        );
    } catch (error) {
        console.error('Get resource history error:', error);
        return errorResponse(res, 500, 'Failed to retrieve resource history', error.message);
    }
};

/**
 * Get activity statistics
 */
exports.getActivityStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build date filter
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.timestamp = {};
            if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
            if (endDate) dateFilter.timestamp.$lte = new Date(endDate);
        }

        // Get statistics
        const [
            totalActivities,
            actionStats,
            resourceStats,
            userStats,
            recentActivities
        ] = await Promise.all([
            // Total count
            ActivityLog.countDocuments(dateFilter),

            // Group by action
            ActivityLog.aggregate([
                { $match: dateFilter },
                { $group: { _id: '$action', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),

            // Group by resource
            ActivityLog.aggregate([
                { $match: dateFilter },
                { $group: { _id: '$resource', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),

            // Top users
            ActivityLog.aggregate([
                { $match: dateFilter },
                { $group: { _id: '$userId', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                {
                    $project: {
                        _id: 1,
                        count: 1,
                        user: {
                            firstName: 1,
                            lastName: 1,
                            email: 1,
                            role: 1
                        }
                    }
                }
            ]),

            // Recent activities
            ActivityLog.find(dateFilter)
                .sort({ timestamp: -1 })
                .limit(10)
                .populate('userId', 'firstName lastName email role')
                .lean()
        ]);

        const stats = {
            total: totalActivities,
            byAction: actionStats,
            byResource: resourceStats,
            topUsers: userStats,
            recentActivities
        };

        return successResponse(res, 200, 'Activity statistics retrieved successfully', stats);
    } catch (error) {
        console.error('Get activity stats error:', error);
        return errorResponse(res, 500, 'Failed to retrieve activity statistics', error.message);
    }
};

/**
 * Export activity logs to CSV or JSON
 */
exports.exportActivityLogs = async (req, res) => {
    try {
        const {
            format = 'json',
            action,
            resource,
            userId,
            startDate,
            endDate
        } = req.query;

        // Build query
        const query = {};
        if (action) query.action = action;
        if (resource) query.resource = resource;
        if (userId) query.userId = userId;

        // Date range filter
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        // Get activities
        const activities = await ActivityLog.find(query)
            .sort({ timestamp: -1 })
            .populate('userId', 'firstName lastName email role')
            .lean();

        if (format === 'csv') {
            // Convert to CSV
            const csv = convertToCSV(activities);
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=activity-logs-${Date.now()}.csv`);
            return res.send(csv);
        } else {
            // Return as JSON
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=activity-logs-${Date.now()}.json`);
            return res.json({
                success: true,
                count: activities.length,
                data: activities
            });
        }
    } catch (error) {
        console.error('Export activity logs error:', error);
        return errorResponse(res, 500, 'Failed to export activity logs', error.message);
    }
};

/**
 * Get current user's activity
 */
exports.getMyActivity = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [activities, total] = await Promise.all([
            ActivityLog.find({ userId: req.user.id })
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('userId', 'firstName lastName email role')
                .lean(),
            ActivityLog.countDocuments({ userId: req.user.id })
        ]);

        return paginatedResponse(
            res,
            activities,
            page,
            limit,
            total,
            'Your activities retrieved successfully'
        );
    } catch (error) {
        console.error('Get my activity error:', error);
        return errorResponse(res, 500, 'Failed to retrieve your activities', error.message);
    }
};

/**
 * Helper function to convert activities to CSV
 */
function convertToCSV(activities) {
    if (activities.length === 0) return '';

    // CSV headers
    const headers = ['Timestamp', 'User', 'Email', 'Role', 'Action', 'Resource', 'Resource ID', 'Status', 'IP Address'];
    
    // CSV rows
    const rows = activities.map(activity => [
        activity.timestamp,
        activity.userId ? `${activity.userId.firstName} ${activity.userId.lastName}` : 'Unknown',
        activity.userId ? activity.userId.email : 'N/A',
        activity.userId ? activity.userId.role : 'N/A',
        activity.action,
        activity.resource,
        activity.resourceId || 'N/A',
        activity.status || 'success',
        activity.ipAddress || 'N/A'
    ]);

    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
}

