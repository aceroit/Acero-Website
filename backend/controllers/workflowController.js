const Page = require('../models/Page');
const Section = require('../models/Section');
const Project = require('../models/Project');
const Branch = require('../models/Branch');
const Customer = require('../models/Customer');
const Certification = require('../models/Certification');
const CompanyUpdate = require('../models/CompanyUpdate');
const CompanyUpdateCategory = require('../models/CompanyUpdateCategory');
const Brochure = require('../models/Brochure');
const HeaderConfiguration = require('../models/HeaderConfiguration');
const FooterConfiguration = require('../models/FooterConfiguration');
const WebsiteAppearance = require('../models/WebsiteAppearance');
const SMTPSettings = require('../models/SMTPSettings');
const GoogleReCaptcha = require('../models/GoogleReCaptcha');
const GoogleMaps = require('../models/GoogleMaps');
const ContentVersion = require('../models/ContentVersion');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const Role = require('../models/Role');
const notificationService = require('../services/notificationService');
const headerPageSyncService = require('../services/headerPageSyncService');
const {
    buildEditableResource,
    resolveWorkflowSubject,
    applyRevisionToLive,
    getWorkflowItem,
    getActiveRevision,
    extractDraftData,
    buildRevisionMetadata,
    supportsRevisions
} = require('../services/contentRevisionService');
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
        section: Section,
        project: Project,
        branch: Branch,
        customer: Customer,
        certification: Certification,
        'company-update': CompanyUpdate,
        'company-update-category': CompanyUpdateCategory,
        brochure: Brochure,
        'building-type': require('../models/BuildingType'),
        industry: require('../models/Industry'),
        country: require('../models/Country'),
        region: require('../models/Region'),
        area: require('../models/Area'),
        'header-configuration': HeaderConfiguration,
        'footer-configuration': FooterConfiguration,
        'website-appearance': WebsiteAppearance,
        'smtp-settings': SMTPSettings,
        'google-recaptcha': GoogleReCaptcha,
        'google-maps': GoogleMaps,
        vacancy: require('../models/Vacancy')
    };
    return models[resource];
}

// Get resource title
function getResourceTitle(resource) {
    // For pages, company updates, brochures, and vacancies, use title
    if (resource.title) {
        return resource.title;
    }
    
    // Configuration modules fallback titles
    if (resource.navigationLinks) {
        return 'Header Configuration';
    }
    if (resource.brandInfo || resource.quickLinks) {
        return 'Footer Configuration';
    }
    if (resource.colorPalette) {
        return 'Website Appearance';
    }
    if (resource.host || resource.port || resource.username) {
        return 'SMTP Settings';
    }
    if (resource.siteKey || resource.secretKey) {
        return 'Google ReCaptcha';
    }
    if (resource.apiKey) {
        return 'Google Maps';
    }

    // For projects, use jobNumber
    if (resource.jobNumber) {
        return resource.jobNumber;
    }
    
    // For branches, use branchName
    if (resource.branchName) {
        return resource.branchName;
    }
    
    // For customers, certifications, company update categories, building types, industries, countries, regions, and areas, use name
    if (resource.name) {
        return resource.name;
    }
    
    // For sections, try to get title from content or use section type
    if (resource.content) {
        if (resource.content.title) {
            return resource.content.title;
        }
        if (resource.content.heading) {
            return resource.content.heading;
        }
        if (resource.content.text && resource.content.text.length > 0) {
            // Use first 50 chars of text as title
            return resource.content.text.substring(0, 50) + (resource.content.text.length > 50 ? '...' : '');
        }
    }
    // If section, try to use sectionTypeSlug as fallback
    if (resource.sectionTypeSlug) {
        return `${resource.sectionTypeSlug.replace(/_/g, ' ')} section`;
    }
    return 'Untitled';
}

const PROJECT_HOME_PAGE_LIMIT = 6;
const PROJECT_HOME_PAGE_LIMIT_MESSAGE = "Already 6 projects are shown on home page. Remove 'Show on home page' from one project to add this one.";

function getWorkflowVersionResourceId(subject) {
    return subject.targetType === 'revision' ? subject.liveItem._id : subject.item._id;
}

function getWorkflowSnapshot(subject) {
    if (subject.targetType === 'revision') {
        return subject.revision.draftData;
    }
    return typeof subject.item.toObject === 'function' ? subject.item.toObject() : subject.item;
}

function getWorkflowCreatorId(subject) {
    const createdBy = subject.targetType === 'revision' ? subject.liveItem.createdBy : subject.item.createdBy;
    return createdBy && createdBy._id ? createdBy._id : createdBy;
}

function getWorkflowResponseResource(subject) {
    if (subject.targetType === 'revision') {
        return buildEditableResource(subject.liveItem, subject.revision);
    }
    return subject.item;
}

async function updateWorkflowSubjectStatus(subject, nextStatus, userId, extraFields = {}) {
    const target = subject.targetType === 'revision' ? subject.revision : subject.item;
    const oldStatus = target.status;

    target.status = nextStatus;
    target.updatedBy = userId;
    Object.assign(target, extraFields);
    await target.save();

    if (subject.targetType === 'revision') {
        subject.item = getWorkflowItem(subject.liveItem, subject.revision);
    } else {
        subject.item = target;
    }

    return oldStatus;
}

async function assertProjectPublishLimit(liveProject, revision) {
    if (!liveProject || !revision || !revision.draftData) {
        return;
    }

    if (revision.draftData.showOnHomePage !== true || liveProject.showOnHomePage === true) {
        return;
    }

    const ProjectModel = require('../models/Project');
    const count = await ProjectModel.countDocuments({
        status: 'published',
        showOnHomePage: true,
        isActive: true,
        _id: { $ne: liveProject._id }
    });

    if (count >= PROJECT_HOME_PAGE_LIMIT) {
        throw new Error(PROJECT_HOME_PAGE_LIMIT_MESSAGE);
    }
}

// Submit content for review (draft -> in_review)
exports.submitForReview = async (req, res) => {
    try {
        const { resource, id } = req.params;
        const { changeSummary } = req.body || {};

        if (!changeSummary || typeof changeSummary !== 'string' || changeSummary.trim().length === 0) {
            return errorResponse(res, 400, 'Change summary is required and must be a non-empty string');
        }

        if (changeSummary.trim().length < 10) {
            return errorResponse(res, 400, 'Change summary must be at least 10 characters long');
        }

        const Model = getModel(resource);
        if (!Model) {
            return errorResponse(res, 400, 'Invalid resource type');
        }

        const subject = await resolveWorkflowSubject({
            resource,
            id,
            Model,
            populate: 'createdBy updatedBy'
        });
        if (!subject) {
            return errorResponse(res, 404, `${resource} not found`);
        }

        const item = subject.item;

        if (!hasResourcePermission(req.user, item, 'edit')) {
            return errorResponse(res, 403, `You do not have permission to submit this ${resource}. Current status: ${item.status}. You need 'update' permission on ${resource}s to submit for review.`);
        }

        const validation = await canTransition(item.status, WORKFLOW_STATES.IN_REVIEW, req.user._id, resource, item);
        if (!validation.isValid) {
            return errorResponse(res, 400, `${validation.message}. Current status: ${item.status}, Target status: ${WORKFLOW_STATES.IN_REVIEW}`);
        }

        const oldStatus = await updateWorkflowSubjectStatus(subject, WORKFLOW_STATES.IN_REVIEW, req.user._id);

        if (resource === 'page' && subject.targetType === 'live') {
            const Section = require('../models/Section');
            await Section.updateMany(
                { pageId: item._id, status: { $in: ['draft', 'changes_requested'] } },
                {
                    status: WORKFLOW_STATES.IN_REVIEW,
                    updatedBy: req.user._id
                }
            );
        }

        await ContentVersion.createVersion(
            resource,
            getWorkflowVersionResourceId(subject),
            getWorkflowSnapshot(subject),
            req.user._id,
            WORKFLOW_STATES.IN_REVIEW,
            changeSummary.trim()
        );

        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'update',
            resource,
            resourceId: getWorkflowVersionResourceId(subject),
            changes: {
                before: { status: oldStatus },
                after: { status: subject.item.status }
            },
            metadata: { action: 'submit_for_review' }
        });

        const reviewerRoles = await Role.find({
            slug: { $in: ['reviewer', 'approver', 'admin', 'super_admin'] }
        }).select('_id');

        const reviewerRoleIds = reviewerRoles.map((role) => role._id);
        const reviewers = await User.find({
            role: { $in: reviewerRoleIds },
            isActive: true
        }).select('_id');

        await notificationService.notifyWorkflowSubmit(
            resource,
            getWorkflowVersionResourceId(subject),
            getResourceTitle(subject.item),
            req.user,
            reviewers.map((reviewer) => reviewer._id),
            changeSummary.trim()
        );

        return successResponse(
            res,
            200,
            'Content submitted for review successfully',
            { [resource]: getWorkflowResponseResource(subject), message: 'Content submitted for review' }
        );
    } catch (error) {
        console.error('Submit for review error:', error);
        return errorResponse(res, 500, 'Failed to submit content for review', error.message);
    }
};

// Mark content as reviewed (in_review -> pending_approval)
exports.markReviewed = async (req, res) => {
    try {
        const { resource, id } = req.params;
        const { feedback, changeSummary } = req.body || {};

        if (changeSummary !== undefined) {
            if (typeof changeSummary !== 'string' || changeSummary.trim().length === 0) {
                return errorResponse(res, 400, 'Change summary must be a non-empty string');
            }
            if (changeSummary.trim().length < 10) {
                return errorResponse(res, 400, 'Change summary must be at least 10 characters long');
            }
        }

        const Model = getModel(resource);
        if (!Model) {
            return errorResponse(res, 400, 'Invalid resource type');
        }

        const subject = await resolveWorkflowSubject({
            resource,
            id,
            Model,
            populate: 'createdBy updatedBy'
        });
        if (!subject) {
            return errorResponse(res, 404, `${resource} not found`);
        }

        const item = subject.item;

        const validation = await canTransition(item.status, WORKFLOW_STATES.PENDING_APPROVAL, req.user._id, resource);
        if (!validation.isValid) {
            return errorResponse(res, 400, `${validation.message}. Current status: ${item.status}, Target status: ${WORKFLOW_STATES.PENDING_APPROVAL}`);
        }

        const oldStatus = await updateWorkflowSubjectStatus(subject, WORKFLOW_STATES.PENDING_APPROVAL, req.user._id, {
            reviewedBy: req.user._id
        });

        if (resource === 'page' && subject.targetType === 'live') {
            await Section.updateMany(
                { pageId: item._id, status: { $in: ['in_review', 'pending_approval'] } },
                {
                    status: WORKFLOW_STATES.PENDING_APPROVAL,
                    updatedBy: req.user._id
                }
            );
        }

        await ContentVersion.createVersion(
            resource,
            getWorkflowVersionResourceId(subject),
            getWorkflowSnapshot(subject),
            req.user._id,
            WORKFLOW_STATES.PENDING_APPROVAL,
            changeSummary ? changeSummary.trim() : 'Marked as reviewed and ready for approval'
        );

        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'update',
            resource,
            resourceId: getWorkflowVersionResourceId(subject),
            changes: {
                before: { status: oldStatus },
                after: { status: subject.item.status }
            },
            metadata: { action: 'mark_reviewed', feedback }
        });

        await notificationService.notifyWorkflowReviewed(
            resource,
            getWorkflowVersionResourceId(subject),
            getResourceTitle(subject.item),
            req.user,
            getWorkflowCreatorId(subject),
            changeSummary ? changeSummary.trim() : null
        );

        const approverRoles = await Role.find({
            slug: { $in: ['approver', 'admin', 'super_admin'] }
        }).select('_id');

        if (approverRoles.length > 0) {
            const approverRoleIds = approverRoles.map((role) => role._id);
            const approvers = await User.find({
                role: { $in: approverRoleIds },
                isActive: true
            }).select('_id email firstName lastName');

            if (approvers.length > 0) {
                await notificationService.notifyWorkflowPendingApproval(
                    resource,
                    getWorkflowVersionResourceId(subject),
                    getResourceTitle(subject.item),
                    req.user,
                    approvers.map((approver) => approver._id),
                    changeSummary ? changeSummary.trim() : null
                );
            } else {
                console.warn(`[WorkflowController] No active approvers found to notify for ${resource} ${getWorkflowVersionResourceId(subject)}`);
            }
        } else {
            console.warn('[WorkflowController] No approver roles found in system');
        }

        return successResponse(
            res,
            200,
            'Content marked as reviewed successfully',
            { [resource]: getWorkflowResponseResource(subject), message: 'Content marked as reviewed' }
        );
    } catch (error) {
        console.error('Mark reviewed error:', error);
        return errorResponse(res, 500, 'Failed to mark content as reviewed', error.message);
    }
};

// Request changes (in_review/pending_approval -> changes_requested)
exports.requestChanges = async (req, res) => {
    try {
        const { resource, id } = req.params;
        const { feedback, changeSummary } = req.body || {};

        const payloadValidation = validateWorkflowPayload('request_changes', { feedback });
        if (!payloadValidation.isValid) {
            return errorResponse(res, 400, payloadValidation.errors.join(', '));
        }

        if (changeSummary !== undefined) {
            if (typeof changeSummary !== 'string' || changeSummary.trim().length === 0) {
                return errorResponse(res, 400, 'Change summary must be a non-empty string');
            }
            if (changeSummary.trim().length < 10) {
                return errorResponse(res, 400, 'Change summary must be at least 10 characters long');
            }
        }

        const Model = getModel(resource);
        if (!Model) {
            return errorResponse(res, 400, 'Invalid resource type');
        }

        const subject = await resolveWorkflowSubject({
            resource,
            id,
            Model,
            populate: 'createdBy updatedBy'
        });
        if (!subject) {
            return errorResponse(res, 404, `${resource} not found`);
        }

        const item = subject.item;

        const validation = await canTransition(item.status, WORKFLOW_STATES.CHANGES_REQUESTED, req.user._id, resource);
        if (!validation.isValid) {
            return errorResponse(res, 400, `${validation.message}. Current status: ${item.status}, Target status: ${WORKFLOW_STATES.CHANGES_REQUESTED}`);
        }

        const oldStatus = await updateWorkflowSubjectStatus(subject, WORKFLOW_STATES.CHANGES_REQUESTED, req.user._id, {
            feedback
        });

        if (resource === 'page' && subject.targetType === 'live') {
            const Section = require('../models/Section');
            await Section.updateMany(
                { pageId: item._id, status: { $in: ['in_review', 'pending_approval'] } },
                {
                    status: WORKFLOW_STATES.CHANGES_REQUESTED,
                    updatedBy: req.user._id
                }
            );
        }

        const version = await ContentVersion.createVersion(
            resource,
            getWorkflowVersionResourceId(subject),
            getWorkflowSnapshot(subject),
            req.user._id,
            WORKFLOW_STATES.CHANGES_REQUESTED,
            changeSummary ? changeSummary.trim() : 'Changes requested'
        );
        version.feedback = feedback;
        await version.save();

        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'update',
            resource,
            resourceId: getWorkflowVersionResourceId(subject),
            changes: {
                before: { status: oldStatus },
                after: { status: subject.item.status, feedback }
            },
            metadata: { action: 'request_changes' }
        });

        await notificationService.notifyWorkflowChangesRequested(
            resource,
            getWorkflowVersionResourceId(subject),
            getResourceTitle(subject.item),
            req.user,
            getWorkflowCreatorId(subject),
            feedback,
            changeSummary ? changeSummary.trim() : null
        );

        return successResponse(
            res,
            200,
            'Changes requested successfully',
            { [resource]: getWorkflowResponseResource(subject), feedback, message: 'Changes requested' }
        );
    } catch (error) {
        console.error('Request changes error:', error);
        return errorResponse(res, 500, 'Failed to request changes', error.message);
    }
};

// Approve content (pending_approval -> pending_publish)
exports.approveContent = async (req, res) => {
    try {
        const { resource, id } = req.params;
        const { changeSummary } = req.body || {};

        if (changeSummary !== undefined) {
            if (typeof changeSummary !== 'string' || changeSummary.trim().length === 0) {
                return errorResponse(res, 400, 'Change summary must be a non-empty string');
            }
            if (changeSummary.trim().length < 10) {
                return errorResponse(res, 400, 'Change summary must be at least 10 characters long');
            }
        }

        const Model = getModel(resource);
        if (!Model) {
            return errorResponse(res, 400, 'Invalid resource type');
        }

        const subject = await resolveWorkflowSubject({
            resource,
            id,
            Model,
            populate: 'createdBy updatedBy'
        });
        if (!subject) {
            return errorResponse(res, 404, `${resource} not found`);
        }

        const item = subject.item;

        const validation = await canTransition(item.status, WORKFLOW_STATES.PENDING_PUBLISH, req.user._id, resource);
        if (!validation.isValid) {
            return errorResponse(res, 400, `${validation.message}. Current status: ${item.status}, Target status: ${WORKFLOW_STATES.PENDING_PUBLISH}`);
        }

        const oldStatus = await updateWorkflowSubjectStatus(subject, WORKFLOW_STATES.PENDING_PUBLISH, req.user._id, {
            approvedBy: req.user._id
        });

        if (resource === 'page' && subject.targetType === 'live') {
            await Section.updateMany(
                { pageId: item._id, status: { $in: ['pending_approval', 'pending_publish'] } },
                {
                    status: WORKFLOW_STATES.PENDING_PUBLISH,
                    updatedBy: req.user._id
                }
            );
        }

        await ContentVersion.createVersion(
            resource,
            getWorkflowVersionResourceId(subject),
            getWorkflowSnapshot(subject),
            req.user._id,
            WORKFLOW_STATES.PENDING_PUBLISH,
            changeSummary ? changeSummary.trim() : 'Content approved and ready for publishing'
        );

        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'approve',
            resource,
            resourceId: getWorkflowVersionResourceId(subject),
            changes: {
                before: { status: oldStatus },
                after: { status: subject.item.status }
            },
            metadata: { action: 'approve_content' }
        });

        try {
            await notificationService.notifyWorkflowApproved(
                resource,
                getWorkflowVersionResourceId(subject),
                getResourceTitle(subject.item),
                req.user,
                getWorkflowCreatorId(subject),
                changeSummary ? changeSummary.trim() : null
            );
        } catch (error) {
            console.error('Failed to send approved notification:', error);
        }

        return successResponse(
            res,
            200,
            'Content approved successfully',
            { [resource]: getWorkflowResponseResource(subject), message: 'Content approved' }
        );
    } catch (error) {
        console.error('Approve content error:', error);
        return errorResponse(res, 500, 'Failed to approve content', error.message);
    }
};

// Reject content (pending_approval -> changes_requested)
exports.rejectContent = async (req, res) => {
    try {
        const { resource, id } = req.params;
        const { feedback, changeSummary } = req.body || {};

        const payloadValidation = validateWorkflowPayload('reject', { feedback });
        if (!payloadValidation.isValid) {
            return errorResponse(res, 400, payloadValidation.errors.join(', '));
        }

        if (changeSummary !== undefined) {
            if (typeof changeSummary !== 'string' || changeSummary.trim().length === 0) {
                return errorResponse(res, 400, 'Change summary must be a non-empty string');
            }
            if (changeSummary.trim().length < 10) {
                return errorResponse(res, 400, 'Change summary must be at least 10 characters long');
            }
        }

        const Model = getModel(resource);
        if (!Model) {
            return errorResponse(res, 400, 'Invalid resource type');
        }

        const subject = await resolveWorkflowSubject({
            resource,
            id,
            Model,
            populate: 'createdBy updatedBy'
        });
        if (!subject) {
            return errorResponse(res, 404, `${resource} not found`);
        }

        const item = subject.item;

        const validation = await canTransition(item.status, WORKFLOW_STATES.CHANGES_REQUESTED, req.user._id, resource);
        if (!validation.isValid) {
            return errorResponse(res, 400, `${validation.message}. Current status: ${item.status}, Target status: ${WORKFLOW_STATES.CHANGES_REQUESTED}`);
        }

        const oldStatus = await updateWorkflowSubjectStatus(subject, WORKFLOW_STATES.CHANGES_REQUESTED, req.user._id, {
            feedback
        });

        if (resource === 'page' && subject.targetType === 'live') {
            const Section = require('../models/Section');
            await Section.updateMany(
                { pageId: item._id, status: { $in: ['pending_approval'] } },
                {
                    status: WORKFLOW_STATES.CHANGES_REQUESTED,
                    updatedBy: req.user._id
                }
            );
        }

        const version = await ContentVersion.createVersion(
            resource,
            getWorkflowVersionResourceId(subject),
            getWorkflowSnapshot(subject),
            req.user._id,
            WORKFLOW_STATES.CHANGES_REQUESTED,
            changeSummary ? changeSummary.trim() : 'Content rejected'
        );
        version.feedback = feedback;
        await version.save();

        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'reject',
            resource,
            resourceId: getWorkflowVersionResourceId(subject),
            changes: {
                before: { status: oldStatus },
                after: { status: subject.item.status, feedback }
            },
            metadata: { action: 'reject_content' }
        });

        await notificationService.notifyWorkflowRejected(
            resource,
            getWorkflowVersionResourceId(subject),
            getResourceTitle(subject.item),
            req.user,
            getWorkflowCreatorId(subject),
            feedback,
            changeSummary ? changeSummary.trim() : null
        );

        return successResponse(
            res,
            200,
            'Content rejected successfully',
            { [resource]: getWorkflowResponseResource(subject), feedback, message: 'Content rejected' }
        );
    } catch (error) {
        console.error('Reject content error:', error);
        return errorResponse(res, 500, 'Failed to reject content', error.message);
    }
};

// Publish content (pending_publish -> published)
exports.publishContent = async (req, res) => {
    try {
        const { resource, id } = req.params;
        const { changeSummary } = req.body || {};

        const Model = getModel(resource);
        if (!Model) {
            return errorResponse(res, 400, 'Invalid resource type');
        }

        const subject = await resolveWorkflowSubject({
            resource,
            id,
            Model,
            populate: 'createdBy updatedBy'
        });
        if (!subject) {
            return errorResponse(res, 404, `${resource} not found`);
        }

        const item = subject.item;

        const validation = await canTransition(item.status, WORKFLOW_STATES.PUBLISHED, req.user._id, resource);
        if (!validation.isValid) {
            return errorResponse(res, 400, `${validation.message}. Current status: ${item.status}, Target status: ${WORKFLOW_STATES.PUBLISHED}`);
        }

        const oldStatus = item.status;
        let responseResource;
        let versionSnapshot;

        if (subject.targetType === 'revision') {
            if (resource === 'project') {
                await assertProjectPublishLimit(subject.liveItem, subject.revision);
            }

            await applyRevisionToLive({
                liveDoc: subject.liveItem,
                revision: subject.revision,
                userId: req.user._id
            });

            subject.item = subject.liveItem;
            responseResource = buildEditableResource(subject.liveItem, null);
            versionSnapshot = typeof subject.liveItem.toObject === 'function' ? subject.liveItem.toObject() : subject.liveItem;
        } else {
            subject.item.status = WORKFLOW_STATES.PUBLISHED;
            subject.item.publishedAt = new Date();
            subject.item.updatedBy = req.user._id;
            await subject.item.save();
            responseResource = subject.item;
            versionSnapshot = subject.item.toObject();
        }

        if (resource === 'page' && subject.targetType === 'live') {
            const Section = require('../models/Section');
            const now = new Date();

            await Section.updateMany(
                { pageId: item._id },
                {
                    $set: {
                        status: WORKFLOW_STATES.PUBLISHED,
                        updatedBy: req.user._id,
                        updatedAt: now
                    }
                }
            );

            await Section.updateMany(
                {
                    pageId: item._id,
                    publishedAt: null
                },
                {
                    $set: {
                        publishedAt: now
                    }
                }
            );

            await Section.updateMany(
                {
                    pageId: item._id,
                    publishedAt: { $exists: false }
                },
                {
                    $set: {
                        publishedAt: now
                    }
                }
            );
        }

        const version = await ContentVersion.createVersion(
            resource,
            subject.liveItem?._id || subject.item._id,
            versionSnapshot,
            req.user._id,
            WORKFLOW_STATES.PUBLISHED,
            changeSummary || 'Content published'
        );
        version.publishedBy = req.user._id;
        await version.save();

        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'publish',
            resource,
            resourceId: subject.liveItem?._id || subject.item._id,
            changes: {
                before: { status: oldStatus },
                after: { status: WORKFLOW_STATES.PUBLISHED, publishedAt: responseResource.publishedAt || subject.liveItem?.publishedAt || subject.item.publishedAt }
            },
            metadata: { action: 'publish_content' }
        });

        try {
            await notificationService.notifyWorkflowPublished(
                resource,
                subject.liveItem?._id || subject.item._id,
                getResourceTitle(subject.targetType === 'revision' ? getWorkflowItem(subject.liveItem, { draftData: responseResource, status: 'published' }) : subject.item),
                req.user,
                getWorkflowCreatorId(subject),
                changeSummary || null
            );
        } catch (error) {
            console.error('Failed to send published notification:', error);
        }

        return successResponse(
            res,
            200,
            'Content published successfully',
            { [resource]: responseResource, message: 'Content published' }
        );
    } catch (error) {
        console.error('Publish content error:', error);
        if (error.message === PROJECT_HOME_PAGE_LIMIT_MESSAGE) {
            return errorResponse(res, 400, PROJECT_HOME_PAGE_LIMIT_MESSAGE);
        }
        return errorResponse(res, 500, 'Failed to publish content', error.message);
    }
};

// Unpublish content (published -> draft)
exports.unpublishContent = async (req, res) => {

    try {
        const { resource, id } = req.params;
        const { changeSummary } = req.body || {};

        const Model = getModel(resource);
        if (!Model) {
            return errorResponse(res, 400, 'Invalid resource type');
        }

        const item = await Model.findById(id);
        if (!item) {
            return errorResponse(res, `${resource} not found`, 404);
        }

        // Validate transition (permission-based)
        const validation = await canTransition(item.status, WORKFLOW_STATES.DRAFT, req.user._id, resource);
        if (!validation.isValid) {
            return errorResponse(res, 400, `${validation.message}. Current status: ${item.status}, Target status: ${WORKFLOW_STATES.DRAFT}`);
        }

        // Update status
        const oldStatus = item.status;
        item.status = WORKFLOW_STATES.DRAFT;
        item.updatedBy = req.user._id;
        await item.save();

        // If this is a page, update all its sections to draft as well
        if (resource === 'page') {
            await Section.updateMany(
                { pageId: item._id, status: 'published' },
                { 
                    status: WORKFLOW_STATES.DRAFT,
                    updatedBy: req.user._id
                }
            );
        }

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

        // If page was in header nav, tell frontend so user can be alerted to update header
        let pageWasInHeader = false;
        if (resource === 'page' && item.path) {
            try {
                pageWasInHeader = await headerPageSyncService.isPagePathInHeader(item.path);
            } catch (e) {
                // ignore
            }
        }

        return successResponse(
            res,
            200,
            'Content unpublished successfully',
            { [resource]: item, message: 'Content unpublished', pageWasInHeader }
        );
    } catch (error) {
        console.error('Unpublish content error:', error);
        return errorResponse(res, 500, 'Failed to unpublish content', error.message);
    }
};

// Archive content (published -> archived)
exports.archiveContent = async (req, res) => {
    try {
        const { resource, id } = req.params;
        const { changeSummary } = req.body || {};

        const Model = getModel(resource);
        if (!Model) {
            return errorResponse(res, 400, 'Invalid resource type');
        }

        const item = await Model.findById(id);
        if (!item) {
            return errorResponse(res, 404, `${resource} not found`);
        }

        // Validate transition (permission-based)
        const validation = await canTransition(item.status, WORKFLOW_STATES.ARCHIVED, req.user._id, resource);
        if (!validation.isValid) {
            return errorResponse(res, 400, `${validation.message}. Current status: ${item.status}, Target status: ${WORKFLOW_STATES.ARCHIVED}`);
        }

        // Update status
        const oldStatus = item.status;
        item.status = WORKFLOW_STATES.ARCHIVED;
        item.updatedBy = req.user._id;
        await item.save();

        // If this is a page, update all its sections to draft as well
        // (sections don't have archived status, so they go to draft)
        if (resource === 'page') {
            await Section.updateMany(
                { pageId: item._id, status: 'published' },
                { 
                    status: WORKFLOW_STATES.DRAFT,
                    updatedBy: req.user._id
                }
            );
        }

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
            200,
            'Content archived successfully',
            { [resource]: item, message: 'Content archived' }
        );
    } catch (error) {
        console.error('Archive content error:', error);
        return errorResponse(res, 500, 'Failed to archive content', error.message);
    }
};

// Restore content (archived -> draft)
exports.restoreContent = async (req, res) => {
    try {
        const { resource, id } = req.params;
        const { changeSummary } = req.body || {};

        const Model = getModel(resource);
        if (!Model) {
            return errorResponse(res, 400, 'Invalid resource type');
        }

        const item = await Model.findById(id);
        if (!item) {
            return errorResponse(res, `${resource} not found`, 404);
        }

        // Validate transition (permission-based)
        const validation = await canTransition(item.status, WORKFLOW_STATES.DRAFT, req.user._id, resource);
        if (!validation.isValid) {
            return errorResponse(res, 400, `${validation.message}. Current status: ${item.status}, Target status: ${WORKFLOW_STATES.DRAFT}`);
        }

        // Update status
        const oldStatus = item.status;
        item.status = WORKFLOW_STATES.DRAFT;
        item.updatedBy = req.user._id;
        await item.save();

        // If this is a page, update all its sections to draft as well
        if (resource === 'page') {
            await Section.updateMany(
                { pageId: item._id },
                { 
                    status: WORKFLOW_STATES.DRAFT,
                    updatedBy: req.user._id
                }
            );
        }

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
            200,
            'Content restored successfully',
            { [resource]: item, message: 'Content restored' }
        );
    } catch (error) {
        console.error('Restore content error:', error);
        return errorResponse(res, 500, 'Failed to restore content', error.message);
    }
};

// Get content version history
exports.getContentVersions = async (req, res) => {
    try {
        const { resource, id } = req.params;
        const { limit = 50, version } = req.query;

        // If a specific version is requested, return only that version
        if (version) {
            const specificVersion = await ContentVersion.findOne({
                resource,
                resourceId: id,
                version: parseInt(version)
            });

            if (!specificVersion) {
                return errorResponse(res, 404, `Version ${version} not found`);
            }

            return successResponse(
                res,
                200,
                'Version retrieved successfully',
                { version: specificVersion }
            );
        }

        // Otherwise, return all versions (up to limit)
        const versions = await ContentVersion.getHistory(resource, id, parseInt(limit));

        return successResponse(
            res,
            200,
            'Version history retrieved successfully',
            { versions, count: versions.length }
        );
    } catch (error) {
        console.error('Get versions error:', error);
        return errorResponse(res, 500, 'Failed to retrieve version history', error.message);
    }
};

// Compare two versions
exports.compareVersions = async (req, res) => {
    try {
        const { resource, id } = req.params;
        // Support both version1/version2 and v1/v2 query parameters
        const version1 = req.query.version1 || req.query.v1;
        const version2 = req.query.version2 || req.query.v2;

        if (!version1 || !version2) {
            return errorResponse(res, 400, 'Both version1 (or v1) and version2 (or v2) query parameters are required');
        }

        const [v1, v2] = await Promise.all([
            ContentVersion.findOne({ resource, resourceId: id, version: parseInt(version1) }),
            ContentVersion.findOne({ resource, resourceId: id, version: parseInt(version2) })
        ]);

        if (!v1 || !v2) {
            return errorResponse(res, 404, 'One or both versions not found');
        }

        const comparison = compareVersions(v1, v2);

        return successResponse(
            res,
            200,
            'Version comparison completed successfully',
            { comparison }
        );
    } catch (error) {
        console.error('Compare versions error:', error);
        return errorResponse(res, 500, 'Failed to compare versions', error.message);
    }
};


// Compare current live published data against the active staged revision
exports.compareLiveDraft = async (req, res) => {
    try {
        const { resource, id } = req.params;

        if (!supportsRevisions(resource)) {
            return errorResponse(res, 400, 'Live vs draft comparison is only available for staged resources');
        }

        const Model = getModel(resource);
        if (!Model) {
            return errorResponse(res, 400, 'Invalid resource type');
        }

        const liveItem = await Model.findById(id).populate('createdBy updatedBy');
        if (!liveItem) {
            return errorResponse(res, 404, `${resource} not found`);
        }

        if (liveItem.status !== WORKFLOW_STATES.PUBLISHED) {
            return errorResponse(res, 400, 'Live vs draft comparison is only available for published content');
        }

        const revision = await getActiveRevision(resource, liveItem._id, 'createdBy updatedBy reviewedBy approvedBy publishedBy');
        if (!revision) {
            return errorResponse(res, 404, 'No active staged revision found for this content');
        }

        const liveVersion = {
            version: 'live',
            label: 'Live Published',
            status: liveItem.status,
            createdAt: liveItem.publishedAt || liveItem.updatedAt || liveItem.createdAt,
            createdBy: liveItem.updatedBy || liveItem.createdBy,
            changeType: 'published',
            changeSummary: 'Current published data shown on the website',
            data: extractDraftData(liveItem)
        };

        const draftVersion = {
            version: revision.revisionNumber,
            label: `Staged Revision #${revision.revisionNumber}`,
            status: revision.status,
            createdAt: revision.updatedAt || revision.createdAt,
            createdBy: revision.updatedBy || revision.createdBy,
            changeType: 'updated',
            changeSummary: revision.changeSummary || 'Pending staged changes',
            feedback: revision.feedback || '',
            data: revision.draftData || {}
        };

        const comparison = compareVersions(liveVersion, draftVersion);

        return successResponse(
            res,
            200,
            'Live vs draft comparison retrieved successfully',
            {
                mode: 'live-draft',
                resourceTitle: getResourceTitle(getWorkflowItem(liveItem, revision)),
                liveStatus: liveItem.status,
                activeRevision: buildRevisionMetadata(revision),
                version1: liveVersion,
                version2: draftVersion,
                comparison
            }
        );
    } catch (error) {
        console.error('Compare live draft error:', error);
        return errorResponse(res, 500, 'Failed to compare live and draft content', error.message);
    }
};

// Restore a previous version
exports.restoreVersion = async (req, res) => {
    try {
        const { resource, id, version } = req.params;
        const { changeSummary } = req.body || {};

        const Model = getModel(resource);
        if (!Model) {
            return errorResponse(res, 400, 'Invalid resource type');
        }

        // Get the version to restore
        const versionToRestore = await ContentVersion.findOne({
            resource,
            resourceId: id,
            version: parseInt(version)
        });

        if (!versionToRestore) {
            return errorResponse(res, 404, 'Version not found');
        }

        // Get current item
        const item = await Model.findById(id);
        if (!item) {
            return errorResponse(res, 404, `${resource} not found`);
        }

        // Check permission
        if (!hasResourcePermission(req.user, item, 'edit')) {
            return errorResponse(res, 403, 'You do not have permission to restore this version');
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
            200,
            'Version restored successfully',
            { [resource]: item, restoredVersion: version, message: 'Version restored' }
        );
    } catch (error) {
        console.error('Restore version error:', error);
        return errorResponse(res, 500, 'Failed to restore version', error.message);
    }
};

// Get available workflow actions for current user
exports.getAvailableActions = async (req, res) => {
    try {
        const { resource, id } = req.params;

        const Model = getModel(resource);
        if (!Model) {
            return errorResponse(res, 400, 'Invalid resource type');
        }

        const subject = await resolveWorkflowSubject({ resource, id, Model });
        if (!subject) {
            return errorResponse(res, 404, `${resource} not found`);
        }

        const possibleStates = await getNextPossibleStates(subject.item.status, req.user._id, resource, subject.item);

        return successResponse(
            res,
            200,
            'Available actions retrieved successfully',
            {
                currentStatus: subject.item.status,
                liveStatus: subject.liveItem?.status || subject.item.status,
                hasActiveRevision: subject.targetType === 'revision',
                availableActions: possibleStates
            }
        );
    } catch (error) {
        console.error('Get available actions error:', error);
        return errorResponse(res, 500, 'Failed to get available actions', error.message);
    }
};
