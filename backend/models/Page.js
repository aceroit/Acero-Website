const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Page title is required'],
        trim: true
    },
    slug: {
        type: String,
        required: [true, 'Page slug is required'],
        lowercase: true,
        trim: true
        // Note: Unique constraint is enforced via partial index (see below) to allow inactive pages to reuse slugs
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Page',
        default: null,
        index: true
    },
    path: {
        type: String,
        required: true,
        trim: true,
        index: true
        // e.g., '/who-we-are/our-history'
    },
    level: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        index: true
        // Depth in tree (0 = root)
    },
    order: {
        type: Number,
        required: true,
        default: 0,
        min: 0
        // Order among siblings
    },
    metaTitle: {
        type: String,
        trim: true,
        default: null
    },
    metaDescription: {
        type: String,
        trim: true,
        default: null
    },
    metaImage: {
        url: {
            type: String,
            default: null
        },
        publicId: {
            type: String,
            default: null
        },
        width: {
            type: Number,
            default: null
        },
        height: {
            type: Number,
            default: null
        }
    },
    metaKeywords: {
        type: String,
        trim: true,
        default: null
    },
    showInMenu: {
        type: Boolean,
        default: true
    },
    menuIcon: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['draft', 'in_review', 'pending_approval', 'pending_publish', 'published', 'changes_requested', 'archived'],
        default: 'draft',
        index: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    publishedAt: {
        type: Date,
        default: null
    },
    // Page-level permissions (optional override)
    permissions: {
        allowedRoles: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role'
        }],
        restrictedUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        allowedUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    
    // Sync tracking field
    lastSyncedToHeader: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Compound indexes
pageSchema.index({ parentId: 1, order: 1 });
pageSchema.index({ status: 1, isActive: 1 });

// Partial unique index on slug - only enforces uniqueness for active pages
// This allows inactive pages to reuse slugs, but prevents duplicate slugs among active pages
pageSchema.index(
    { slug: 1 },
    { 
        unique: true,
        partialFilterExpression: { isActive: true }
    }
);

// Pre-save middleware to generate path and calculate level
pageSchema.pre('save', async function() {
    if (this.isModified('parentId') || this.isNew) {
        if (this.parentId) {
            try {
                const parent = await this.constructor.findById(this.parentId);
                if (parent) {
                    this.level = parent.level + 1;
                    this.path = `${parent.path}/${this.slug}`;
                } else {
                    this.level = 0;
                    this.path = `/${this.slug}`;
                }
            } catch (error) {
                this.level = 0;
                this.path = `/${this.slug}`;
            }
        } else {
            this.level = 0;
            this.path = `/${this.slug}`;
        }
    }
});

// Method to get all children (direct descendants)
pageSchema.methods.getChildren = async function() {
    return await this.constructor.find({ parentId: this._id, isActive: true }).sort({ order: 1 });
};

// Method to get all descendants (recursive)
pageSchema.methods.getDescendants = async function() {
    const children = await this.getChildren();
    let descendants = [...children];
    
    for (const child of children) {
        const childDescendants = await child.getDescendants();
        descendants = [...descendants, ...childDescendants];
    }
    
    return descendants;
};

// Method to get breadcrumb trail
pageSchema.methods.getBreadcrumb = async function() {
    const breadcrumb = [{ id: this._id, title: this.title, slug: this.slug, path: this.path }];
    
    let currentPage = this;
    while (currentPage.parentId) {
        currentPage = await this.constructor.findById(currentPage.parentId);
        if (currentPage) {
            breadcrumb.unshift({ 
                id: currentPage._id, 
                title: currentPage.title, 
                slug: currentPage.slug,
                path: currentPage.path 
            });
        } else {
            break;
        }
    }
    
    return breadcrumb;
};

// Static method to get page tree
pageSchema.statics.getTree = async function(parentId = null) {
    const pages = await this.find({ parentId, isActive: true }).sort({ order: 1 });
    
    const tree = await Promise.all(pages.map(async (page) => {
        const children = await this.getTree(page._id);
        return {
            ...page.toJSON(),
            children
        };
    }));
    
    return tree;
};

// Static method to get published page tree for public site
pageSchema.statics.getPublishedTree = async function(parentId = null) {
    const pages = await this.find({
        isActive: true,
        status: 'published',
        showInMenu: true
    })
        .select('_id title slug path menuIcon parentId order')
        .sort({ order: 1, title: 1 })
        .lean();

    const pageMap = new Map();
    const roots = [];

    pages.forEach((page) => {
        pageMap.set(String(page._id), {
            id: page._id,
            title: page.title,
            slug: page.slug,
            path: page.path,
            menuIcon: page.menuIcon,
            children: []
        });
    });

    pages.forEach((page) => {
        const current = pageMap.get(String(page._id));
        const parentKey = page.parentId ? String(page.parentId) : null;

        if (parentKey && pageMap.has(parentKey)) {
            pageMap.get(parentKey).children.push(current);
        } else {
            roots.push(current);
        }
    });

    if (parentId) {
        const parent = pageMap.get(String(parentId));
        return parent ? parent.children : [];
    }

    return roots;
};

const Page = mongoose.model('Page', pageSchema);

module.exports = Page;

