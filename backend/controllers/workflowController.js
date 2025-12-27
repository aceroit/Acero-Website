const Page = require('../models/Page');
const Section = require('../models/Section');
const ContentVersion = require('../models/ContentVersion');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const {
    WORKFLOW_STATES,
    canTransition,
    getNextPossibleStates,
    validateWorkflowPayload,
    hasResourcePermission,
    getActionName
} = require('../utils/workflowValidator');
const { compareVersions } = require('../utils/versionDiffer');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

// Get model based on resource type
function getModel(resource) {
    const models = {
        page: Page,
        section: Section
    };
    return models[resource];
}

// Get resource title
function getResourceTitle(resource) {
    return resource.title || resource.content?.title || 'Untitled';
}

// Submit content for review (draft → in_review)
exports.submitForReview = async (req, res) => {
    try {
        const { resource, id } = req.params;
        const { changeSummary } = req.body;

        const Model = getModel(resource);
        if (!Model) {
            return errorResponse(res, 'Invalid resource type', 400);
        }

        const item = await Model.findById(id);
        if (!item) {
            return errorResponse(res, `${resource} not found`, 404);
        }

        // Check if user has permission to edit this resource
        if (!hasResourcePermission(req.user, item, 'edit')) {
            return errorResponse(res, 'You do not have permission to submit this content', 403);
        }

        // Validate transition
        const validation = canTransition(item.status, WORKFLOW_STATES.IN_REVIEW, req.user.role);
        if (!validation.isValid) {
            return errorResponse(res, validation.message, 400);
        }

        // Update status
        const oldStatus = item.status;
        item.status = WORKFLOW_STATES.IN_REVIEW;
        item.updatedBy = req.user._id;
        await item.save();

        // Create version
        await ContentVersion.createVersion(
            resource,
            item._id,
            item.toObject(),
            req.user._id,
            WORKFLOW_STATES.IN_REVIEW,
            changeSummary || 'Submitted for review'
        );

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'update',
            resource,
            resourceId: item._id,
            changes: {
                before: { status: oldStatus },
                after: { status: item.status }
            },
            metadata: { action: 'submit_for_review' }
        });

        // Get reviewers and send notifications
        const reviewers = await User.find({
            role: { $in: ['reviewer', 'approver', 'admin', 'super_admin'] },
            isActive: true
        }).select('_id');

        await notificationService.notifyWorkflowSubmit(
            resource,
            item._id,
            getResourceTitle(item),
            req.user,
            reviewers.map(r => r._id)
        );

        return successResponse(
            res,
            { [resource]: item, message: 'Content submitted for review' },
            'Content submitted successfully'
        );
    } catch (error) {
        console.error('Submit for review error:', error);
        return errorResponse(res, 'Failed to submit content for review', 500);
    }
};

// Mark content as reviewed (in_review → pending_approval)
exports.markReviewed = async (req, res) => {
    try {
        const { resource, id } = req.params;
        const { feedback, changeSummary } = req.body;

        const Model = getModel(resource);
        if (!Model) {
            return errorResponse(res, 'Invalid resource type', 400);
        }

        const item = await Model.findById(id).populate('createdBy', 'email firstName lastName');
        if (!item) {
            return errorResponse(res, `${resource} not found`, 404);
        }

        // Validate transition
        const validation = canTransition(item.status, WORKFLOW_STATES.PENDING_APPROVAL, req.user.role);
        if (!validation.isValid) {
            return errorResponse(res, validation.message, 400);
        }

        // Update status
        const oldStatus = item.status;
        item.status = WORKFLOW_STATES.PENDING_APPROVAL;
        item.updatedBy = req.user._id;
        await item.save();

        // Create version
        await ContentVersion.createVersion(
            resource,
            item._id,
            item.toObject(),
            req.user._id,
            WORKFLOW_STATES.PENDING_APPROVAL,
            changeSummary || 'Marked as reviewed and ready for approval'
        );

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'update',
            resource,
            resourceId: item._id,
            changes: {
                before: { status: oldStatus },
                after: { status: item.status }
            },
            metadata: { action: 'mark_reviewed', feedback }
        });

        // Notify content creator
        await notificationService.notifyWorkflowReviewed(
            resource,
            item._id,
            getResourceTitle(item),
            req.user,
            item.createdBy._id
        );

        return successResponse(
            res,
            { [resource]: item, message: 'Content marked as reviewed' },
            'Content marked as reviewed successfully'
        );
    } catch (error) {
        console.error('Mark reviewed error:', error);
        return errorResponse(res, 'Failed to mark content as reviewed', 500);
    }
};

// Request changes (in_review/pending_approval → changes_requested)
exports.requestChanges = async (req, res) => {
    try {
        const { resource, id } = req.params;
        const { feedback, changeSummary } = req.body;

        // Validate payload
        const payloadValidation = validateWorkflowPayload('request_changes', { feedback });
        if (!payloadValidation.isValid) {
            return errorResponse(res, payloadValidation.errors.join(', '), 400);
        }

        const Model = getModel(resource);
        if (!Model) {
            return errorResponse(res, 'Invalid resource type', 400);
        }

        const item = await Model.findById(id).populate('createdBy', 'email firstName lastName');
        if (!item) {
            return errorResponse(res, `${resource} not found`, 404);
        }

        // Validate transition
        const validation = canTransition(item.status, WORKFLOW_STATES.CHANGES_REQUESTED, req.user.role);
        if (!validation.isValid) {
            return errorResponse(res, validation.message, 400);
        }

        // Update status
        const oldStatus = item.status;
        item.status = WORKFLOW_STATES.CHANGES_REQUESTED;
        item.updatedBy = req.user._id;
        await item.save();

        // Create version
        const version = await ContentVersion.createVersion(
            resource,
            item._id,
            item.toObject(),
            req.user._id,
            WORKFLOW_STATES.CHANGES_REQUESTED,
            changeSummary || 'Changes requested'
        );
        
        // Store feedback in version
        version.feedback = feedback;
        await version.save();

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'update',
            resource,
            resourceId: item._id,
            changes: {
                before: { status: oldStatus },
                after: { status: item.status, feedback }
            },
            metadata: { action: 'request_changes' }
        });

        // Notify content creator
        await notificationService.notifyWorkflowChangesRequested(
            resource,
            item._id,
            getResourceTitle(item),
            req.user,
            item.createdBy._id,
            feedback
        );

        return successResponse(
            res,
            { [resource]: item, feedback, message: 'Changes requested' },
            'Changes requested successfully'
        );
    } catch (error) {
        console.error('Request changes error:', error);
        return errorResponse(res, 'Failed to request changes', 500);
    }
};

// Approve content (pending_approval → pending_publish)
exports.approveContent = async (req, res) => {
    try {
        const { resource, id } = req.params;
        const { changeSummary } = req.body;

        const Model = getModel(resource);
        if (!Model) {
            return errorResponse(res, 'Invalid resource type', 400);
        }

        const item = await Model.findById(id).populate('createdBy', 'email firstName lastName');
        if (!item) {
            return errorResponse(res, `${resource} not found`, 404);
        }

        // Validate transition
        const validation = canTransition(item.status, WORKFLOW_STATES.PENDING_PUBLISH, req.user.role);
        if (!validation.isValid) {
            return errorResponse(res, validation.message, 400);
        }

        // Update status
        const oldStatus = item.status;
        item.status = WORKFLOW_STATES.PENDING_PUBLISH;
        item.updatedBy = req.user._id;
        await item.save();

        // Create version
        await ContentVersion.createVersion(
            resource,
            item._id,
            item.toObject(),
            req.user._id,
            WORKFLOW_STATES.PENDING_PUBLISH,
            changeSummary || 'Content approved and ready for publishing'
        );

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'approve',
            resource,
            resourceId: item._id,
            changes: {
                before: { status: oldStatus },
                after: { status: item.status }
            },
            metadata: { action: 'approve_content' }
        });

        // Notify content creator
        await notificationService.notifyWorkflowApproved(
            resource,
            item._id,
            getResourceTitle(item),
            req.user,
            item.createdBy._id
        );

        return successResponse(
            res,
            { [resource]: item, message: 'Content approved' },
            'Content approved successfully'
        );
    } catch (error) {
        console.error('Approve content error:', error);
        return errorResponse(res, 'Failed to approve content', 500);
    }
};

// Reject content (pending_approval → changes_requested)
exports.rejectContent = async (req, res) => {
    try {
        const { resource, id } = req.params;
        const { feedback, changeSummary } = req.body;

        // Validate payload
        const payloadValidation = validateWorkflowPayload('reject', { feedback });
        if (!payloadValidation.isValid) {
            return errorResponse(res, payloadValidation.errors.join(', '), 400);
        }

        const Model = getModel(resource);
        if (!Model) {
            return errorResponse(res, 'Invalid resource type', 400);
        }

        const item = await Model.findById(id).populate('createdBy', 'email firstName lastName');
        if (!item) {
            return errorResponse(res, `${resource} not found`, 404);
        }

        // Validate transition
        const validation = canTransition(item.status, WORKFLOW_STATES.CHANGES_REQUESTED, req.user.role);
        if (!validation.isValid) {
            return errorResponse(res, validation.message, 400);
        }

        // Update status
        const oldStatus = item.status;
        item.status = WORKFLOW_STATES.CHANGES_REQUESTED;
        item.updatedBy = req.user._id;
        await item.save();

        // Create version
        const version = await ContentVersion.createVersion(
            resource,
            item._id,
            item.toObject(),
            req.user._id,
            WORKFLOW_STATES.CHANGES_REQUESTED,
            changeSummary || 'Content rejected'
        );
        
        version.feedback = feedback;
        await version.save();

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'reject',
            resource,
            resourceId: item._id,
            changes: {
                before: { status: oldStatus },
                after: { status: item.status, feedback }
            },
            metadata: { action: 'reject_content' }
        });

        // Notify content creator
        await notificationService.notifyWorkflowRejected(
            resource,
            item._id,
            getResourceTitle(item),
            req.user,
            item.createdBy._id,
            feedback
        );

        return successResponse(
            res,
            { [resource]: item, feedback, message: 'Content rejected' },
            'Content rejected successfully'
        );
    } catch (error) {
        console.error('Reject content error:', error);
        return errorResponse(res, 'Failed to reject content', 500);
    }
};

// Publish content (pending_publish → published)
exports.publishContent = async (req, res) => {
    try {
        const { resource, id } = req.params;
        const { changeSummary } = req.body;

        const Model = getModel(resource);
        if (!Model) {
            return errorResponse(res, 'Invalid resource type', 400);
        }

        const item = await Model.findById(id).populate('createdBy updatedBy', 'email firstName lastName');
        if (!item) {
            return errorResponse(res, `${resource} not found`, 404);
        }

        // Validate transition
        const validation = canTransition(item.status, WORKFLOW_STATES.PUBLISHED, req.user.role);
        if (!validation.isValid) {
            return errorResponse(res, validation.message, 400);
        }

        // Update status
        const oldStatus = item.status;
        item.status = WORKFLOW_STATES.PUBLISHED;
        item.publishedAt = new Date();
        item.updatedBy = req.user._id;
        await item.save();

        // Create version
        const version = await ContentVersion.createVersion(
            resource,
            item._id,
            item.toObject(),
            req.user._id,
            WORKFLOW_STATES.PUBLISHED,
            changeSummary || 'Content published'
        );
        
        version.publishedBy = req.user._id;
        await version.save();

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'publish',
            resource,
            resourceId: item._id,
            changes: {
                before: { status: oldStatus },
                after: { status: item.status, publishedAt: item.publishedAt }
            },
            metadata: { action: 'publish_content' }
        });

        // Get all contributors
        const contributors = new Set();
        contributors.add(item.createdBy._id.toString());
        if (item.updatedBy) {
            contributors.add(item.updatedBy._id.toString());
        }
        
        // Get version history contributors
        const versions = await ContentVersion.find({ resource, resourceId: item._id })
            .select('createdBy reviewedBy approvedBy')
            .populate('createdBy reviewedBy approvedBy', '_id');
        
        versions.forEach(v => {
            if (v.createdBy) contributors.add(v.createdBy._id.toString());
            if (v.reviewedBy) contributors.add(v.reviewedBy._id.toString());
            if (v.approvedBy) contributors.add(v.approvedBy._id.toString());
        });

        // Notify all contributors
        await notificationService.notifyWorkflowPublished(
            resource,
            item._id,
            getResourceTitle(item),
            req.user,
            Array.from(contributors)
        );

        return successResponse(
            res,
            { [resource]: item, message: 'Content published' },
            'Content published successfully'
        );
    } catch (error) {
        console.error('Publish content error:', error);
        return errorResponse(res, 'Failed to publish content', 500);
    }
};

// Unpublish content (published → draft)
exports.unpublishContent = async (req, res) => {
    try {
        const { resource, id } = req.params;
        const { changeSummary } = req.body;

        const Model = getModel(resource);
        if (!Model) {
            return errorResponse(res, 'Invalid resource type', 400);
        }

        const item = await Model.findById(id);
        if (!item) {
            return errorResponse(res, `${resource} not found`, 404);
        }

        // Validate transition
        const validation = canTransition(item.status, WORKFLOW_STATES.DRAFT, req.user.role);
        if (!validation.isValid) {
            return errorResponse(res, validation.message, 400);
        }

        // Update status
        const oldStatus = item.status;
        item.status = WORKFLOW_STATES.DRAFT;
        item.updatedBy = req.user._id;
        await item.save();

        // Create version
        await ContentVersion.createVersion(
            resource,
            item._id,
            item.toObject(),
            req.user._id,
            WORKFLOW_STATES.DRAFT,
            changeSummary || 'Content unpublished'
        );

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'update',
            resource,
            resourceId: item._id,
            changes: {
                before: { status: oldStatus },
                after: { status: item.status }
            },
            metadata: { action: 'unpublish_content' }
        });

        return successResponse(
            res,
            { [resource]: item, message: 'Content unpublished' },
            'Content unpublished successfully'
        );
    } catch (error) {
        console.error('Unpublish content error:', error);
        return errorResponse(res, 'Failed to unpublish content', 500);
    }
};

// Archive content (published → archived)
exports.archiveContent = async (req, res) => {
    try {
        const { resource, id } = req.params;
        const { changeSummary } = req.body;

        const Model = getModel(resource);
        if (!Model) {
            return errorResponse(res, 'Invalid resource type', 400);
        }

        const item = await Model.findById(id);
        if (!item) {
            return errorResponse(res, `${resource} not found`, 404);
        }

        // Validate transition
        const validation = canTransition(item.status, WORKFLOW_STATES.ARCHIVED, req.user.role);
        if (!validation.isValid) {
            return errorResponse(res, validation.message, 400);
        }

        // Update status
        const oldStatus = item.status;
        item.status = WORKFLOW_STATES.ARCHIVED;
        item.updatedBy = req.user._id;
        await item.save();

        // Create version
        await ContentVersion.createVersion(
            resource,
            item._id,
            item.toObject(),
            req.user._id,
            WORKFLOW_STATES.ARCHIVED,
            changeSummary || 'Content archived'
        );

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'update',
            resource,
            resourceId: item._id,
            changes: {
                before: { status: oldStatus },
                after: { status: item.status }
            },
            metadata: { action: 'archive_content' }
        });

        return successResponse(
            res,
            { [resource]: item, message: 'Content archived' },
            'Content archived successfully'
        );
    } catch (error) {
        console.error('Archive content error:', error);
        return errorResponse(res, 'Failed to archive content', 500);
    }
};

// Restore content (archived → draft)
exports.restoreContent = async (req, res) => {
    try {
        const { resource, id } = req.params;
        const { changeSummary } = req.body;

        const Model = getModel(resource);
        if (!Model) {
            return errorResponse(res, 'Invalid resource type', 400);
        }

        const item = await Model.findById(id);
        if (!item) {
            return errorResponse(res, `${resource} not found`, 404);
        }

        // Validate transition
        const validation = canTransition(item.status, WORKFLOW_STATES.DRAFT, req.user.role);
        if (!validation.isValid) {
            return errorResponse(res, validation.message, 400);
        }

        // Update status
        const oldStatus = item.status;
        item.status = WORKFLOW_STATES.DRAFT;
        item.updatedBy = req.user._id;
        await item.save();

        // Create version
        await ContentVersion.createVersion(
            resource,
            item._id,
            item.toObject(),
            req.user._id,
            WORKFLOW_STATES.DRAFT,
            changeSummary || 'Content restored from archive'
        );

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'update',
            resource,
            resourceId: item._id,
            changes: {
                before: { status: oldStatus },
                after: { status: item.status }
            },
            metadata: { action: 'restore_content' }
        });

        return successResponse(
            res,
            { [resource]: item, message: 'Content restored' },
            'Content restored successfully'
        );
    } catch (error) {
        console.error('Restore content error:', error);
        return errorResponse(res, 'Failed to restore content', 500);
    }
};

// Get content version history
exports.getContentVersions = async (req, res) => {
    try {
        const { resource, id } = req.params;
        const { limit = 50 } = req.query;

        const versions = await ContentVersion.getHistory(resource, id, parseInt(limit));

        return successResponse(
            res,
            { versions, count: versions.length },
            'Version history retrieved successfully'
        );
    } catch (error) {
        console.error('Get versions error:', error);
        return errorResponse(res, 'Failed to retrieve version history', 500);
    }
};

// Compare two versions
exports.compareVersions = async (req, res) => {
    try {
        const { resource, id } = req.params;
        const { version1, version2 } = req.query;

        if (!version1 || !version2) {
            return errorResponse(res, 'Both version1 and version2 query parameters are required', 400);
        }

        const [v1, v2] = await Promise.all([
            ContentVersion.findOne({ resource, resourceId: id, version: parseInt(version1) }),
            ContentVersion.findOne({ resource, resourceId: id, version: parseInt(version2) })
        ]);

        if (!v1 || !v2) {
            return errorResponse(res, 'One or both versions not found', 404);
        }

        const comparison = compareVersions(v1, v2);

        return successResponse(
            res,
            { comparison },
            'Version comparison completed successfully'
        );
    } catch (error) {
        console.error('Compare versions error:', error);
        return errorResponse(res, 'Failed to compare versions', 500);
    }
};

// Restore a previous version
exports.restoreVersion = async (req, res) => {
    try {
        const { resource, id, version } = req.params;
        const { changeSummary } = req.body;

        const Model = getModel(resource);
        if (!Model) {
            return errorResponse(res, 'Invalid resource type', 400);
        }

        // Get the version to restore
        const versionToRestore = await ContentVersion.findOne({
            resource,
            resourceId: id,
            version: parseInt(version)
        });

        if (!versionToRestore) {
            return errorResponse(res, 'Version not found', 404);
        }

        // Get current item
        const item = await Model.findById(id);
        if (!item) {
            return errorResponse(res, `${resource} not found`, 404);
        }

        // Check permission
        if (!hasResourcePermission(req.user, item, 'edit')) {
            return errorResponse(res, 'You do not have permission to restore this version', 403);
        }

        // Restore version data to current item (but keep as draft)
        const restoredData = versionToRestore.data;
        Object.keys(restoredData).forEach(key => {
            if (key !== '_id' && key !== 'status' && key !== 'updatedBy' && key !== 'createdBy') {
                item[key] = restoredData[key];
            }
        });

        item.status = WORKFLOW_STATES.DRAFT;
        item.updatedBy = req.user._id;
        await item.save();

        // Create new version
        await ContentVersion.createVersion(
            resource,
            item._id,
            item.toObject(),
            req.user._id,
            WORKFLOW_STATES.DRAFT,
            changeSummary || `Restored from version ${version}`
        );

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'update',
            resource,
            resourceId: item._id,
            metadata: { action: 'restore_version', restoredVersion: version }
        });

        return successResponse(
            res,
            { [resource]: item, restoredVersion: version, message: 'Version restored' },
            'Version restored successfully'
        );
    } catch (error) {
        console.error('Restore version error:', error);
        return errorResponse(res, 'Failed to restore version', 500);
    }
};

// Get available workflow actions for current user
exports.getAvailableActions = async (req, res) => {
    try {
        const { resource, id } = req.params;

        const Model = getModel(resource);
        if (!Model) {
            return errorResponse(res, 'Invalid resource type', 400);
        }

        const item = await Model.findById(id);
        if (!item) {
            return errorResponse(res, `${resource} not found`, 404);
        }

        const possibleStates = getNextPossibleStates(item.status, req.user.role);

        return successResponse(
            res,
            { currentStatus: item.status, availableActions: possibleStates },
            'Available actions retrieved successfully'
        );
    } catch (error) {
        console.error('Get available actions error:', error);
        return errorResponse(res, 'Failed to get available actions', 500);
    }
};

