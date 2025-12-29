const diff = require('diff');

/**
 * Generate a detailed diff between two objects
 * @param {Object} oldData - Original data
 * @param {Object} newData - Updated data
 * @returns {Object} Diff object with changes
 */
function generateDiff(oldData, newData) {
    const changes = {
        added: {},
        modified: {},
        removed: {},
        unchanged: {}
    };

    // Get all unique keys from both objects
    const allKeys = new Set([
        ...Object.keys(oldData || {}),
        ...Object.keys(newData || {})
    ]);

    for (const key of allKeys) {
        const oldValue = oldData?.[key];
        const newValue = newData?.[key];

        // Skip internal fields
        if (key === '_id' || key === '__v' || key === 'createdAt' || key === 'updatedAt') {
            continue;
        }

        if (oldValue === undefined && newValue !== undefined) {
            // Field was added
            changes.added[key] = newValue;
        } else if (oldValue !== undefined && newValue === undefined) {
            // Field was removed
            changes.removed[key] = oldValue;
        } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            // Field was modified
            changes.modified[key] = {
                old: oldValue,
                new: newValue
            };
        } else {
            // Field unchanged
            changes.unchanged[key] = newValue;
        }
    }

    return changes;
}

/**
 * Generate a human-readable summary of changes
 * @param {Object} diffObj - Diff object from generateDiff
 * @returns {string} Human-readable summary
 */
function summarizeChanges(diffObj) {
    const summary = [];

    const addedCount = Object.keys(diffObj.added || {}).length;
    const modifiedCount = Object.keys(diffObj.modified || {}).length;
    const removedCount = Object.keys(diffObj.removed || {}).length;

    if (addedCount > 0) {
        summary.push(`${addedCount} field${addedCount > 1 ? 's' : ''} added`);
    }
    if (modifiedCount > 0) {
        summary.push(`${modifiedCount} field${modifiedCount > 1 ? 's' : ''} modified`);
    }
    if (removedCount > 0) {
        summary.push(`${removedCount} field${removedCount > 1 ? 's' : ''} removed`);
    }

    if (summary.length === 0) {
        return 'No changes detected';
    }

    return summary.join(', ');
}

/**
 * Get list of changed field names
 * @param {Object} oldData - Original data
 * @param {Object} newData - Updated data
 * @returns {Array} Array of changed field names
 */
function getChangedFields(oldData, newData) {
    const diffObj = generateDiff(oldData, newData);
    return [
        ...Object.keys(diffObj.added || {}),
        ...Object.keys(diffObj.modified || {}),
        ...Object.keys(diffObj.removed || {})
    ];
}

/**
 * Generate text diff for string fields
 * @param {string} oldText - Original text
 * @param {string} newText - Updated text
 * @returns {Array} Array of diff chunks
 */
function generateTextDiff(oldText, newText) {
    if (typeof oldText !== 'string' || typeof newText !== 'string') {
        return null;
    }

    const changes = diff.diffWords(oldText, newText);
    return changes.map(change => ({
        value: change.value,
        added: change.added || false,
        removed: change.removed || false
    }));
}

/**
 * Compare two versions and generate comprehensive diff
 * @param {Object} version1 - First version
 * @param {Object} version2 - Second version
 * @returns {Object} Comprehensive comparison
 */
function compareVersions(version1, version2) {
    if (!version1 || !version2) {
        return {
            error: 'Both versions are required for comparison'
        };
    }

    const dataDiff = generateDiff(version1.data, version2.data);
    const changedFields = getChangedFields(version1.data, version2.data);

    return {
        version1: {
            number: version1.version,
            status: version1.status,
            createdAt: version1.createdAt,
            createdBy: version1.createdBy
        },
        version2: {
            number: version2.version,
            status: version2.status,
            createdAt: version2.createdAt,
            createdBy: version2.createdBy
        },
        diff: dataDiff,
        summary: summarizeChanges(dataDiff),
        changedFields,
        changeCount: changedFields.length
    };
}

/**
 * Format diff for display purposes
 * @param {Object} diffObj - Diff object
 * @returns {Array} Formatted diff items
 */
function formatDiffForDisplay(diffObj) {
    const items = [];

    // Added fields
    for (const [key, value] of Object.entries(diffObj.added || {})) {
        items.push({
            field: key,
            type: 'added',
            value: formatValue(value),
            description: `Added: ${key}`
        });
    }

    // Modified fields
    for (const [key, change] of Object.entries(diffObj.modified || {})) {
        items.push({
            field: key,
            type: 'modified',
            oldValue: formatValue(change.old),
            newValue: formatValue(change.new),
            description: `Modified: ${key}`
        });
    }

    // Removed fields
    for (const [key, value] of Object.entries(diffObj.removed || {})) {
        items.push({
            field: key,
            type: 'removed',
            value: formatValue(value),
            description: `Removed: ${key}`
        });
    }

    return items;
}

/**
 * Format a value for display
 * @param {*} value - Value to format
 * @returns {string} Formatted value
 */
function formatValue(value) {
    if (value === null || value === undefined) {
        return 'null';
    }
    if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
    }
    if (typeof value === 'string' && value.length > 100) {
        return value.substring(0, 100) + '...';
    }
    return String(value);
}

/**
 * Check if two objects are deeply equal
 * @param {*} obj1 - First object
 * @param {*} obj2 - Second object
 * @returns {boolean} True if equal
 */
function deepEqual(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
}

module.exports = {
    generateDiff,
    summarizeChanges,
    getChangedFields,
    generateTextDiff,
    compareVersions,
    formatDiffForDisplay,
    deepEqual
};

