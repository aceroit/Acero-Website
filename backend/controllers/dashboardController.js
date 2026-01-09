const Page = require('../models/Page');
const Section = require('../models/Section');
const ContentVersion = require('../models/ContentVersion');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { WORKFLOW_STATES, ROLE_HIERARCHY } = require('../utils/workflowValidator');

// Get workflow metrics overview
exports.getWorkflowMetrics = async (req, res) => {
    try {
        // Get counts by status for pages
        const pageMetrics = await Page.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Get counts by status for sections
        const sectionMetrics = await Section.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Format metrics
        const formatMetrics = (metrics) => {
            const result = {};
            Object.values(WORKFLOW_STATES).forEach(status => {
                result[status] = 0;
            });
            metrics.forEach(item => {
                if (item._id) {
                    result[item._id] = item.count;
                }
            });
            return result;
        };

        const pages = formatMetrics(pageMetrics);
        const sections = formatMetrics(sectionMetrics);

        // Calculate totals
        const totalPages = Object.values(pages).reduce((sum, count) => sum + count, 0);
        const totalSections = Object.values(sections).reduce((sum, count) => sum + count, 0);

        // Get recent activity count (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentActivityCount = await ActivityLog.countDocuments({
            timestamp: { $gte: oneDayAgo }
        });

        return successResponse(
            res,
            200,
            'Workflow metrics retrieved successfully',
            {
                pages,
                sections,
                totals: {
                    pages: totalPages,
                    sections: totalSections,
                    recentActivity: recentActivityCount
                }
            }
        );
    } catch (error) {
        console.error('Get workflow metrics error:', error);
        return errorResponse(res, 500, 'Failed to retrieve workflow metrics');
    }
};

// Get user's workload summary
exports.getUserWorkloadSummary = async (req, res) => {
    try {
        const userId = req.user._id;
        const userRole = req.user.role;

        const summary = {
            myDrafts: 0,
            mySubmissions: 0,
            pendingMyReview: 0,
            pendingMyApproval: 0,
            pendingPublish: 0
        };

        // Count user's drafts
        summary.myDrafts = await Page.countDocuments({
            createdBy: userId,
            status: WORKFLOW_STATES.DRAFT,
            isActive: true
        }) + await Section.countDocuments({
            createdBy: userId,
            status: WORKFLOW_STATES.DRAFT
        });

        // Count user's submissions in any workflow state
        summary.mySubmissions = await Page.countDocuments({
            createdBy: userId,
            status: { $nin: [WORKFLOW_STATES.DRAFT, WORKFLOW_STATES.PUBLISHED, WORKFLOW_STATES.ARCHIVED] },
            isActive: true
        }) + await Section.countDocuments({
            createdBy: userId,
            status: { $nin: [WORKFLOW_STATES.DRAFT, WORKFLOW_STATES.PUBLISHED] }
        });

        // If user is reviewer or higher, show items pending their review
        const userRoleLevel = ROLE_HIERARCHY[userRole] || 0;
        if (userRoleLevel >= ROLE_HIERARCHY.reviewer) {
            summary.pendingMyReview = await Page.countDocuments({
                status: WORKFLOW_STATES.IN_REVIEW,
                isActive: true
            }) + await Section.countDocuments({
                status: WORKFLOW_STATES.IN_REVIEW
            });
        }

        // If user is approver or higher, show items pending their approval
        if (userRoleLevel >= ROLE_HIERARCHY.approver) {
            summary.pendingMyApproval = await Page.countDocuments({
                status: WORKFLOW_STATES.PENDING_APPROVAL,
                isActive: true
            }) + await Section.countDocuments({
                status: WORKFLOW_STATES.PENDING_APPROVAL
            });
        }

        // If user is admin or higher, show items pending publish
        if (userRoleLevel >= ROLE_HIERARCHY.admin) {
            summary.pendingPublish = await Page.countDocuments({
                status: WORKFLOW_STATES.PENDING_PUBLISH,
                isActive: true
            }) + await Section.countDocuments({
                status: WORKFLOW_STATES.PENDING_PUBLISH
            });
        }

        return successResponse(
            res,
            200,
            'User workload summary retrieved successfully',
            { workload: summary }
        );
    } catch (error) {
        console.error('Get user workload error:', error);
        return errorResponse(res, 500, 'Failed to retrieve user workload');
    }
};

// Get team workflow activity
exports.getTeamActivity = async (req, res) => {
    try {
        const { limit = 50 } = req.query;

        const activities = await ActivityLog.find({
            action: { $in: ['update', 'approve', 'reject', 'publish'] },
            resource: { $in: ['page', 'section'] }
        })
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .populate('userId', 'firstName lastName email role');

        return successResponse(
            res,
            200,
            'Team activity retrieved successfully',
            { activities, count: activities.length }
        );
    } catch (error) {
        console.error('Get team activity error:', error);
        return errorResponse(res, 500, 'Failed to retrieve team activity');
    }
};

// Get pending items awaiting user action
exports.getPendingItems = async (req, res) => {
    try {
        const userRole = req.user.role;
        const userRoleLevel = ROLE_HIERARCHY[userRole] || 0;

        const pendingItems = {
            pages: [],
            sections: []
        };

        // Determine what status items to show based on role
        let statusToShow = [];
        if (userRoleLevel >= ROLE_HIERARCHY.reviewer) {
            statusToShow.push(WORKFLOW_STATES.IN_REVIEW);
        }
        if (userRoleLevel >= ROLE_HIERARCHY.approver) {
            statusToShow.push(WORKFLOW_STATES.PENDING_APPROVAL);
        }
        if (userRoleLevel >= ROLE_HIERARCHY.admin) {
            statusToShow.push(WORKFLOW_STATES.PENDING_PUBLISH);
        }

        if (statusToShow.length > 0) {
            pendingItems.pages = await Page.find({
                status: { $in: statusToShow },
                isActive: true
            })
                .sort({ updatedAt: 1 }) // Oldest first (bottleneck detection)
                .limit(50)
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email');

            pendingItems.sections = await Section.find({
                status: { $in: statusToShow }
            })
                .sort({ updatedAt: 1 })
                .limit(50)
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email')
                .populate('pageId', 'title slug');
        }

        return successResponse(
            res,
            200,
            'Pending items retrieved successfully',
            {
                pending: pendingItems,
                count: {
                    pages: pendingItems.pages.length,
                    sections: pendingItems.sections.length
                }
            }
        );
    } catch (error) {
        console.error('Get pending items error:', error);
        return errorResponse(res, 500, 'Failed to retrieve pending items');
    }
};

// Get user's draft content
exports.getMyDrafts = async (req, res) => {
    try {
        const userId = req.user._id;
        const { limit = 50 } = req.query;

        const pages = await Page.find({
            createdBy: userId,
            status: WORKFLOW_STATES.DRAFT,
            isActive: true
        })
            .sort({ updatedAt: -1 })
            .limit(parseInt(limit));

        const sections = await Section.find({
            createdBy: userId,
            status: WORKFLOW_STATES.DRAFT
        })
            .sort({ updatedAt: -1 })
            .limit(parseInt(limit))
            .populate('pageId', 'title slug');

        return successResponse(
            res,
            200,
            'Draft content retrieved successfully',
            {
                drafts: { pages, sections },
                count: {
                    pages: pages.length,
                    sections: sections.length
                }
            }
        );
    } catch (error) {
        console.error('Get my drafts error:', error);
        return errorResponse(res, 500, 'Failed to retrieve drafts');
    }
};

// Get user's submissions (content in workflow)
exports.getMySubmissions = async (req, res) => {
    try {
        const userId = req.user._id;
        const { limit = 50 } = req.query;

        const pages = await Page.find({
            createdBy: userId,
            status: { $nin: [WORKFLOW_STATES.DRAFT, WORKFLOW_STATES.PUBLISHED, WORKFLOW_STATES.ARCHIVED] },
            isActive: true
        })
            .sort({ updatedAt: -1 })
            .limit(parseInt(limit));

        const sections = await Section.find({
            createdBy: userId,
            status: { $nin: [WORKFLOW_STATES.DRAFT, WORKFLOW_STATES.PUBLISHED] }
        })
            .sort({ updatedAt: -1 })
            .limit(parseInt(limit))
            .populate('pageId', 'title slug');

        return successResponse(
            res,
            200,
            'Submissions retrieved successfully',
            {
                submissions: { pages, sections },
                count: {
                    pages: pages.length,
                    sections: sections.length
                }
            }
        );
    } catch (error) {
        console.error('Get my submissions error:', error);
        return errorResponse(res, 500, 'Failed to retrieve submissions');
    }
};

// Get recently published content
exports.getRecentlyPublished = async (req, res) => {
    try {
        const { limit = 20, days = 30 } = req.query;
        const dateThreshold = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

        const pages = await Page.find({
            status: WORKFLOW_STATES.PUBLISHED,
            publishedAt: { $gte: dateThreshold },
            isActive: true
        })
            .sort({ publishedAt: -1 })
            .limit(parseInt(limit))
            .populate('createdBy', 'firstName lastName email');

        const sections = await Section.find({
            status: WORKFLOW_STATES.PUBLISHED,
            publishedAt: { $gte: dateThreshold }
        })
            .sort({ publishedAt: -1 })
            .limit(parseInt(limit))
            .populate('createdBy', 'firstName lastName email')
            .populate('pageId', 'title slug');

        return successResponse(
            res,
            200,
            'Recently published content retrieved successfully',
            {
                recentlyPublished: { pages, sections },
                count: {
                    pages: pages.length,
                    sections: sections.length
                }
            }
        );
    } catch (error) {
        console.error('Get recently published error:', error);
        return errorResponse(res, 500, 'Failed to retrieve recently published content');
    }
};

// Get workflow timeline (activity log filtered by workflow actions)
exports.getWorkflowTimeline = async (req, res) => {
    try {
        const { limit = 100, startDate, endDate } = req.query;

        const query = {
            action: { $in: ['update', 'approve', 'reject', 'publish'] },
            resource: { $in: ['page', 'section'] }
        };

        // Add date range if provided
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        const timeline = await ActivityLog.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .populate('userId', 'firstName lastName email role');

        return successResponse(
            res,
            200,
            'Workflow timeline retrieved successfully',
            { timeline, count: timeline.length }
        );
    } catch (error) {
        console.error('Get workflow timeline error:', error);
        return errorResponse(res, 500, 'Failed to retrieve workflow timeline');
    }
};

// Get user productivity statistics
exports.getUserProductivityStats = async (req, res) => {
    try {
        const { userId } = req.params;
        const { days = 30 } = req.query;

        const dateThreshold = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

        // Get user info
        const user = await User.findById(userId).select('firstName lastName email role');
        if (!user) {
            return errorResponse(res, 404, 'User not found');
        }

        // Count activities
        const activities = await ActivityLog.aggregate([
            {
                $match: {
                    userId: user._id,
                    timestamp: { $gte: dateThreshold }
                }
            },
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Count content created
        const pagesCreated = await Page.countDocuments({
            createdBy: userId,
            createdAt: { $gte: dateThreshold }
        });

        const sectionsCreated = await Section.countDocuments({
            createdBy: userId,
            createdAt: { $gte: dateThreshold }
        });

        // Count published content
        const pagesPublished = await Page.countDocuments({
            createdBy: userId,
            status: WORKFLOW_STATES.PUBLISHED,
            publishedAt: { $gte: dateThreshold }
        });

        const sectionsPublished = await Section.countDocuments({
            createdBy: userId,
            status: WORKFLOW_STATES.PUBLISHED,
            publishedAt: { $gte: dateThreshold }
        });

        // Format activity counts
        const activityCounts = {};
        activities.forEach(item => {
            activityCounts[item._id] = item.count;
        });

        return successResponse(
            res,
            200,
            'User productivity statistics retrieved successfully',
            {
                user,
                period: {
                    days: parseInt(days),
                    from: dateThreshold,
                    to: new Date()
                },
                statistics: {
                    created: {
                        pages: pagesCreated,
                        sections: sectionsCreated,
                        total: pagesCreated + sectionsCreated
                    },
                    published: {
                        pages: pagesPublished,
                        sections: sectionsPublished,
                        total: pagesPublished + sectionsPublished
                    },
                    activities: activityCounts
                }
            }
        );
    } catch (error) {
        console.error('Get user productivity stats error:', error);
        return errorResponse(res, 500, 'Failed to retrieve user productivity statistics');
    }
};

// Get workflow bottlenecks (content stuck in workflow)
exports.getBottlenecks = async (req, res) => {
    try {
        const { daysStuck = 7 } = req.query;
        const dateThreshold = new Date(Date.now() - parseInt(daysStuck) * 24 * 60 * 60 * 1000);

        // Find pages stuck in workflow
        const stuckPages = await Page.find({
            status: {
                $in: [
                    WORKFLOW_STATES.IN_REVIEW,
                    WORKFLOW_STATES.PENDING_APPROVAL,
                    WORKFLOW_STATES.PENDING_PUBLISH
                ]
            },
            updatedAt: { $lte: dateThreshold },
            isActive: true
        })
            .sort({ updatedAt: 1 })
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        // Find sections stuck in workflow
        const stuckSections = await Section.find({
            status: {
                $in: [
                    WORKFLOW_STATES.IN_REVIEW,
                    WORKFLOW_STATES.PENDING_APPROVAL,
                    WORKFLOW_STATES.PENDING_PUBLISH
                ]
            },
            updatedAt: { $lte: dateThreshold }
        })
            .sort({ updatedAt: 1 })
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email')
            .populate('pageId', 'title slug');

        // Calculate days stuck for each item
        const calculateDaysStuck = (item) => {
            const daysDiff = Math.floor((Date.now() - item.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
            return { ...item.toObject(), daysStuck: daysDiff };
        };

        const bottlenecks = {
            pages: stuckPages.map(calculateDaysStuck),
            sections: stuckSections.map(calculateDaysStuck)
        };

        return successResponse(
            res,
            200,
            'Workflow bottlenecks retrieved successfully',
            {
                bottlenecks,
                threshold: {
                    days: parseInt(daysStuck),
                    date: dateThreshold
                },
                count: {
                    pages: bottlenecks.pages.length,
                    sections: bottlenecks.sections.length,
                    total: bottlenecks.pages.length + bottlenecks.sections.length
                }
            }
        );
    } catch (error) {
        console.error('Get bottlenecks error:', error);
        return errorResponse(res, 500, 'Failed to retrieve workflow bottlenecks');
    }
};

module.exports = exports;

