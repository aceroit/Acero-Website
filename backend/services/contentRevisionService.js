const ContentRevision = require('../models/ContentRevision');

const STAGED_RESOURCES = new Set(['project', 'vacancy', 'section']);
const SYSTEM_FIELDS = new Set(['_id', '__v', 'status', 'publishedAt', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'isActive']);

function supportsRevisions(resource) {
    return STAGED_RESOURCES.has(resource);
}

function cloneValue(value) {
    return JSON.parse(JSON.stringify(value));
}

function toPlain(doc) {
    if (!doc) return null;
    if (typeof doc.toObject === 'function') {
        return doc.toObject({ depopulate: true });
    }
    return cloneValue(doc);
}

function extractDraftData(liveDoc) {
    const data = toPlain(liveDoc);
    if (!data) return null;

    for (const field of SYSTEM_FIELDS) {
        delete data[field];
    }

    return cloneValue(data);
}

function sanitizeDraftUpdateData(updateData = {}) {
    const sanitized = cloneValue(updateData || {});

    for (const field of SYSTEM_FIELDS) {
        delete sanitized[field];
    }

    return sanitized;
}

async function getActiveRevision(resource, liveResourceId, populate = '') {
    let query = ContentRevision.findOne({ resource, liveResourceId, isActive: true }).sort({ updatedAt: -1 });
    if (populate) {
        query = query.populate(populate);
    }
    return query;
}

async function getActiveRevisionMap(resource, liveResourceIds, populate = '') {
    if (!supportsRevisions(resource) || !Array.isArray(liveResourceIds) || liveResourceIds.length === 0) {
        return new Map();
    }

    let query = ContentRevision.find({
        resource,
        liveResourceId: { $in: liveResourceIds },
        isActive: true
    }).sort({ updatedAt: -1 });

    if (populate) {
        query = query.populate(populate);
    }

    const revisions = await query;
    const map = new Map();

    for (const revision of revisions) {
        const key = revision.liveResourceId.toString();
        if (!map.has(key)) {
            map.set(key, revision);
        }
    }

    return map;
}

function buildRevisionMetadata(revision) {
    if (!revision) return null;

    return {
        _id: revision._id,
        status: revision.status,
        changeSummary: revision.changeSummary || '',
        feedback: revision.feedback || '',
        revisionNumber: revision.revisionNumber,
        createdAt: revision.createdAt,
        updatedAt: revision.updatedAt,
        createdBy: revision.createdBy || null,
        updatedBy: revision.updatedBy || null,
        reviewedBy: revision.reviewedBy || null,
        approvedBy: revision.approvedBy || null,
        publishedBy: revision.publishedBy || null,
        isActive: revision.isActive
    };
}

function buildEditableResource(liveDoc, revision) {
    const liveData = toPlain(liveDoc);
    if (!liveData) return null;

    if (!revision) {
        return {
            ...liveData,
            liveStatus: liveData.status,
            hasActiveRevision: false,
            activeRevision: null
        };
    }

    const merged = {
        ...liveData,
        ...cloneValue(revision.draftData || {})
    };

    merged._id = liveData._id;
    merged.status = revision.status;
    merged.liveStatus = liveData.status;
    merged.livePublishedAt = liveData.publishedAt || null;
    merged.hasActiveRevision = true;
    merged.activeRevision = buildRevisionMetadata(revision);

    return merged;
}

async function attachActiveRevisions(resource, docs, populate = '') {
    if (!Array.isArray(docs) || docs.length === 0) {
        return [];
    }

    if (!supportsRevisions(resource)) {
        return docs.map((doc) => buildEditableResource(doc, null));
    }

    const ids = docs.map((doc) => doc._id);
    const revisionMap = await getActiveRevisionMap(resource, ids, populate);

    return docs.map((doc) => buildEditableResource(doc, revisionMap.get(doc._id.toString()) || null));
}

async function stagePublishedUpdate({ resource, liveDoc, updateData, userId }) {
    const sanitizedUpdate = sanitizeDraftUpdateData(updateData);
    let revision = await getActiveRevision(resource, liveDoc._id);

    if (!revision) {
        revision = new ContentRevision({
            resource,
            liveResourceId: liveDoc._id,
            revisionNumber: await ContentRevision.getNextRevisionNumber(resource, liveDoc._id),
            status: 'draft',
            draftData: extractDraftData(liveDoc),
            liveSnapshot: extractDraftData(liveDoc),
            createdBy: userId,
            updatedBy: userId
        });
    }

    revision.draftData = {
        ...(revision.draftData || {}),
        ...sanitizedUpdate
    };
    revision.updatedBy = userId;

    await revision.save();

    return revision;
}

function getWorkflowItem(liveDoc, revision) {
    const liveData = toPlain(liveDoc) || {};
    const revisionData = revision?.draftData || {};

    return {
        _id: revision?._id || liveData._id,
        status: revision?.status || liveData.status,
        createdBy: revision?.createdBy || liveData.createdBy,
        updatedBy: revision?.updatedBy || liveData.updatedBy,
        title: revisionData.title || liveData.title,
        jobNumber: revisionData.jobNumber || liveData.jobNumber,
        name: revisionData.name || liveData.name,
        sectionTypeSlug: revisionData.sectionTypeSlug || liveData.sectionTypeSlug,
        content: revisionData.content || liveData.content,
        path: revisionData.path || liveData.path,
        draftData: revisionData
    };
}

async function resolveWorkflowSubject({ resource, id, Model, populate = '' }) {
    let liveQuery = Model.findById(id);
    if (populate) {
        liveQuery = liveQuery.populate(populate);
    }

    const liveItem = await liveQuery;
    if (!liveItem) {
        return null;
    }

    if (!supportsRevisions(resource) || liveItem.status !== 'published') {
        return {
            targetType: 'live',
            liveItem,
            revision: null,
            item: liveItem
        };
    }

    const revision = await getActiveRevision(resource, liveItem._id, 'createdBy updatedBy reviewedBy approvedBy publishedBy');
    if (!revision) {
        return {
            targetType: 'live',
            liveItem,
            revision: null,
            item: liveItem
        };
    }

    return {
        targetType: 'revision',
        liveItem,
        revision,
        item: getWorkflowItem(liveItem, revision)
    };
}

async function applyRevisionToLive({ liveDoc, revision, userId }) {
    const draftData = cloneValue(revision.draftData || {});

    Object.keys(draftData).forEach((key) => {
        liveDoc[key] = draftData[key];
    });

    liveDoc.status = 'published';
    liveDoc.publishedAt = new Date();
    liveDoc.updatedBy = userId;
    await liveDoc.save();

    revision.status = 'published';
    revision.publishedBy = userId;
    revision.publishedAt = liveDoc.publishedAt;
    revision.isActive = false;
    revision.closedAt = new Date();
    await revision.save();

    return liveDoc;
}

module.exports = {
    supportsRevisions,
    extractDraftData,
    sanitizeDraftUpdateData,
    getActiveRevision,
    getActiveRevisionMap,
    buildEditableResource,
    buildRevisionMetadata,
    attachActiveRevisions,
    stagePublishedUpdate,
    getWorkflowItem,
    resolveWorkflowSubject,
    applyRevisionToLive
};
