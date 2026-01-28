const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Role name is required'],
        unique: true,
        trim: true,
        index: true
    },
    slug: {
        type: String,
        required: [true, 'Role slug is required'],
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
        // URL-friendly identifier (e.g., 'super_admin', 'admin', 'approver')
        match: [/^[a-z0-9_-]+$/, 'Slug can only contain lowercase letters, numbers, hyphens, and underscores']
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    level: {
        type: Number,
        default: 0,
        index: true
        // For hierarchy/ordering (higher number = more privileges)
    },
    color: {
        type: String,
        trim: true,
        default: 'default'
        // Color for UI display (e.g., 'red', 'blue', 'purple', 'green', 'orange')
    },
    isSystem: {
        type: Boolean,
        default: false,
        index: true
        // Marks migrated system roles (cannot be deleted, slug cannot be changed)
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
        // Additional flexible data (e.g., custom permissions, config)
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
roleSchema.index({ isActive: 1, isSystem: 1 });
roleSchema.index({ level: 1, isActive: 1 });

/**
 * Static method to get role by slug
 * @param {string} slug - Role slug
 * @returns {Promise<Object|null>} Role document or null
 */
roleSchema.statics.getRoleBySlug = async function(slug) {
    return await this.findOne({ slug: slug.toLowerCase().trim() });
};

/**
 * Static method to get all active roles
 * @param {boolean} includeSystem - Whether to include system roles
 * @returns {Promise<Array>} Array of active role documents
 */
roleSchema.statics.getActiveRoles = async function(includeSystem = true) {
    const query = { isActive: true };
    if (!includeSystem) {
        query.isSystem = false;
    }
    return await this.find(query).sort({ level: -1, name: 1 });
};

/**
 * Pre-save middleware to generate slug from name if not provided
 * and ensure slug uniqueness
 */
roleSchema.pre('save', async function() {
    // Generate slug from name if slug is not provided or name is modified
    if (!this.slug || (this.isModified('name') && !this.isModified('slug'))) {
        // Convert name to slug: lowercase, replace spaces with underscores, remove special chars
        this.slug = this.name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_-]/g, '');
    }
    
    // Ensure slug is lowercase and trimmed
    this.slug = this.slug.toLowerCase().trim();
    
    // Check for slug uniqueness (skip if this is a new document and slug wasn't modified)
    if (this.isModified('slug') || this.isNew) {
        const existingRole = await mongoose.model('Role').findOne({
            slug: this.slug,
            _id: { $ne: this._id }
        });
        
        if (existingRole) {
            throw new Error(`Role with slug '${this.slug}' already exists`);
        }
    }
    
    // Prevent changing slug for system roles
    if (!this.isNew && this.isModified('slug') && this.isSystem) {
        throw new Error('Cannot change slug for system roles');
    }
});

// Ensure virtuals are included in JSON output
roleSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.__v;
        return ret;
    }
});

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;

