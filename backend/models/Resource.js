const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Resource name is required'],
        trim: true,
        index: true
    },
    slug: {
        type: String,
        required: [true, 'Resource slug is required'],
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
        // URL-friendly identifier (e.g., 'pages', 'users', 'section_types')
        match: [/^[a-z0-9_-]+$/, 'Slug can only contain lowercase letters, numbers, hyphens, and underscores']
    },
    path: {
        type: String,
        required: [true, 'Resource path is required'],
        trim: true,
        // Route path (e.g., '/pages', '/users', '/permissions')
        match: [/^\/[a-z0-9\/_-]*$/, 'Path must start with / and contain only lowercase letters, numbers, slashes, hyphens, and underscores']
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource',
        default: null,
        index: true
        // For hierarchy support (e.g., 'Page Tree' as child of 'Pages')
    },
    icon: {
        type: String,
        default: 'FileTextOutlined',
        trim: true
        // Icon name/class (e.g., 'FileTextOutlined', 'UserOutlined', 'SettingOutlined')
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    category: {
        type: String,
        trim: true,
        default: 'General',
        index: true
        // Grouping category (e.g., 'Content', 'Administration', 'Settings')
    },
    showInMenu: {
        type: Boolean,
        default: true,
        index: true
        // Whether to show this resource in the sidebar menu
    },
    order: {
        type: Number,
        default: 0,
        index: true
        // Display order in menu (lower numbers appear first)
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
        // Additional flexible data (e.g., permissions required, custom config)
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
resourceSchema.index({ parentId: 1, isActive: 1, showInMenu: 1 });
resourceSchema.index({ category: 1, isActive: 1 });
resourceSchema.index({ showInMenu: 1, order: 1, isActive: 1 });

// Virtual for full path (including parent paths)
resourceSchema.virtual('fullPath').get(function() {
    // This will be populated when needed via aggregation or manual population
    return this.path;
});

// Method to get children resources
resourceSchema.methods.getChildren = async function(includeInactive = false) {
    const query = { parentId: this._id };
    if (!includeInactive) {
        query.isActive = true;
    }
    return await mongoose.model('Resource').find(query).sort({ order: 1, name: 1 });
};

// Method to get parent resource
resourceSchema.methods.getParent = async function() {
    if (!this.parentId) {
        return null;
    }
    return await mongoose.model('Resource').findById(this.parentId);
};

// Static method to get all resources for menu (active, showInMenu: true, ordered)
resourceSchema.statics.getMenuResources = async function() {
    return await this.find({
        isActive: true,
        showInMenu: true
    })
    .sort({ order: 1, name: 1 })
    .select('name slug path parentId icon description category order metadata isActive showInMenu')
    .lean();
};

// Static method to get resource tree (hierarchical structure)
resourceSchema.statics.getResourceTree = async function(includeInactive = false) {
    const query = includeInactive ? {} : { isActive: true };
    const resources = await this.find(query)
        .sort({ order: 1, name: 1 })
        .lean();
    
    // Build tree structure
    const resourceMap = {};
    const rootResources = [];
    
    // First pass: create map of all resources
    resources.forEach(resource => {
        resourceMap[resource._id.toString()] = {
            ...resource,
            children: []
        };
    });
    
    // Second pass: build tree
    resources.forEach(resource => {
        const resourceNode = resourceMap[resource._id.toString()];
        if (resource.parentId && resourceMap[resource.parentId.toString()]) {
            // Has parent, add to parent's children
            resourceMap[resource.parentId.toString()].children.push(resourceNode);
        } else {
            // Root level resource
            rootResources.push(resourceNode);
        }
    });
    
    return rootResources;
};

// Static method to get resources by category
resourceSchema.statics.getByCategory = async function(includeInactive = false) {
    const query = includeInactive ? {} : { isActive: true };
    const resources = await this.find(query).sort({ category: 1, order: 1, name: 1 });
    
    // Group by category
    const grouped = {};
    for (const resource of resources) {
        if (!grouped[resource.category]) {
            grouped[resource.category] = [];
        }
        grouped[resource.category].push(resource);
    }
    
    return grouped;
};

// Static method to get active resources
resourceSchema.statics.getActive = async function() {
    return await this.find({ isActive: true }).sort({ order: 1, name: 1 });
};

// Pre-save middleware to ensure slug uniqueness and validate parent
resourceSchema.pre('save', async function() {
    // If slug is modified, check for uniqueness
    if (this.isModified('slug')) {
        const existingResource = await mongoose.model('Resource').findOne({
            slug: this.slug,
            _id: { $ne: this._id }
        });
        
        if (existingResource) {
            throw new Error('Resource with this slug already exists');
        }
    }
    
    // Validate parent doesn't create circular reference
    if (this.parentId) {
        // Skip validation for new documents (no _id yet)
        if (this._id && this.parentId.toString() === this._id.toString()) {
            throw new Error('Resource cannot be its own parent');
        }
        
        // Check for circular references (parent's parent chain) - only for existing documents
        if (this._id) {
            let currentParentId = this.parentId;
            const visited = new Set([this._id.toString()]);
            
            while (currentParentId) {
                if (visited.has(currentParentId.toString())) {
                    throw new Error('Circular reference detected in parent hierarchy');
                }
                visited.add(currentParentId.toString());
                
                const parent = await mongoose.model('Resource').findById(currentParentId).select('parentId');
                if (!parent) {
                    break;
                }
                currentParentId = parent.parentId;
            }
        }
    }
});

// Ensure virtuals are included in JSON output
resourceSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.__v;
        return ret;
    }
});

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource;

