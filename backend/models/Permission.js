const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    role: {
        type: String,
        required: [true, 'Role is required'],
        enum: ['super_admin', 'admin', 'approver', 'reviewer', 'editor', 'viewer'],
        index: true
    },
    resource: {
        type: String,
        required: [true, 'Resource is required'],
        trim: true,
        index: true
        // e.g., 'pages', 'sections', 'users', 'permissions', 'section_types'
    },
    actions: [{
        type: String,
        enum: ['create', 'read', 'update', 'delete', 'approve', 'publish'],
        required: true
    }],
    conditions: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
        // e.g., { ownOnly: true } - user can only edit own content
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index for efficient permission lookups
permissionSchema.index({ role: 1, resource: 1 });

// Static method to check if a role has permission for an action on a resource
permissionSchema.statics.hasPermission = async function(role, resource, action) {
    const permission = await this.findOne({
        role,
        resource,
        isActive: true,
        actions: action
    });
    return !!permission;
};

// Static method to get all permissions for a role
permissionSchema.statics.getRolePermissions = async function(role) {
    return await this.find({ role, isActive: true });
};

// Static method to get all resources a role can access
permissionSchema.statics.getRoleResources = async function(role) {
    const permissions = await this.find({ role, isActive: true }).select('resource');
    return [...new Set(permissions.map(p => p.resource))];
};

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;

