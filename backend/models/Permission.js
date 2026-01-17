const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: function() {
            // Role is required if userId is not provided
            return !this.userId;
        },
        index: true
        // Role-based permission (either role or userId must be provided)
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true
        // User-specific permission override (optional, for per-user permissions)
    },
    resource: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource',
        required: [true, 'Resource is required'],
        index: true
        // Reference to Resource model (was previously a string)
    },
    actions: [{
        type: String,
        enum: ['create', 'read', 'update', 'delete', 'review', 'approve', 'publish'],
        required: true
    }],
    conditions: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
        // e.g., { ownOnly: true } - user can only edit own content
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true
});

// Compound indexes for efficient permission lookups
permissionSchema.index({ role: 1, resource: 1, isActive: 1 });
permissionSchema.index({ userId: 1, resource: 1, isActive: 1 });
permissionSchema.index({ role: 1, isActive: 1 });
permissionSchema.index({ userId: 1, isActive: 1 });

// Validation: Either role or userId must be provided, but not both
// Using a pre-validate hook that works with both save() and insertMany()
permissionSchema.pre('validate', function() {
    // Validate synchronously (works with both save and insertMany)
    // Don't use next() callback as it may not be available with insertMany
    if (!this.role && !this.userId) {
        this.invalidate('role', 'Either role or userId must be provided');
        this.invalidate('userId', 'Either role or userId must be provided');
    }
    if (this.role && this.userId) {
        this.invalidate('role', 'Cannot specify both role and userId. Use role for role-based permissions or userId for user-specific permissions');
        this.invalidate('userId', 'Cannot specify both role and userId. Use role for role-based permissions or userId for user-specific permissions');
    }
});

// Static method to check if a role has permission for an action on a resource
// role can be Role ObjectId, slug, or name
permissionSchema.statics.hasPermission = async function(role, resource, action) {
    const Role = mongoose.model('Role');
    
    // Resolve role to ObjectId (supports ObjectId, slug, or name)
    let roleId = role;
    if (!mongoose.Types.ObjectId.isValid(role) || role.toString().length !== 24) {
        // Not a valid ObjectId, try to find by slug or name
        const roleDoc = await Role.findOne({
            $or: [
                { slug: role },
                { name: role }
            ]
        }).select('_id');
        if (!roleDoc) {
            return false;
        }
        roleId = roleDoc._id;
    } else {
        roleId = new mongoose.Types.ObjectId(role);
    }
    
    // Support both ObjectId and string resource (for backward compatibility during migration)
    const resourceQuery = mongoose.Types.ObjectId.isValid(resource) 
        ? { resource: new mongoose.Types.ObjectId(resource) }
        : { resource };
    
    const permission = await this.findOne({
        role: roleId,
        ...resourceQuery,
        isActive: true,
        actions: action
    });
    return !!permission;
};

// Static method to check if a user has permission (checks both user-specific and role permissions)
permissionSchema.statics.hasUserPermission = async function(userId, resource, action) {
    // Support both ObjectId and string resource
    const resourceQuery = mongoose.Types.ObjectId.isValid(resource) 
        ? { resource: new mongoose.Types.ObjectId(resource) }
        : { resource };
    
    // First check user-specific permissions
    const userPermission = await this.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        ...resourceQuery,
        isActive: true,
        actions: action
    });
    
    if (userPermission) {
        return true;
    }
    
    // If no user-specific permission, check role permission
    // Get user's role first
    const User = mongoose.model('User');
    const user = await User.findById(userId).select('role').populate('role', '_id');
    if (!user || !user.role) {
        return false;
    }
    
    // user.role is now ObjectId, pass it to hasPermission
    return await this.hasPermission(user.role._id || user.role, resource, action);
};

// Static method to get all permissions for a role
// role can be Role ObjectId, slug, or name
permissionSchema.statics.getRolePermissions = async function(role) {
    const Role = mongoose.model('Role');
    
    // Resolve role to ObjectId (supports ObjectId, slug, or name)
    let roleId = role;
    if (!mongoose.Types.ObjectId.isValid(role) || role.toString().length !== 24) {
        // Not a valid ObjectId, try to find by slug or name
        const roleDoc = await Role.findOne({
            $or: [
                { slug: role },
                { name: role }
            ]
        }).select('_id');
        if (!roleDoc) {
            return [];
        }
        roleId = roleDoc._id;
    } else {
        roleId = new mongoose.Types.ObjectId(role);
    }
    
    return await this.find({ role: roleId, isActive: true })
        .populate('resource', 'name slug path icon')
        .populate('role', 'name slug description level color');
};

// Static method to get all permissions for a user (user-specific overrides only)
permissionSchema.statics.getUserPermissions = async function(userId) {
    return await this.find({ 
        userId: new mongoose.Types.ObjectId(userId), 
        isActive: true 
    }).populate('resource', 'name slug path icon');
};

// Static method to get effective permissions for a user (merged: role + user overrides)
permissionSchema.statics.getEffectivePermissions = async function(userId) {
    const User = mongoose.model('User');
    const user = await User.findById(userId).select('role').populate('role', '_id');
    
    if (!user || !user.role) {
        return [];
    }
    
    // Get role permissions (user.role is now ObjectId)
    const rolePermissions = await this.find({ 
        role: user.role._id || user.role, 
        isActive: true 
    }).populate('resource', 'name slug path icon')
      .populate('role', 'name slug description level color');
    
    // Get user-specific permissions
    const userPermissions = await this.find({ 
        userId: new mongoose.Types.ObjectId(userId), 
        isActive: true 
    }).populate('resource', 'name slug path icon');
    
    // Merge: user permissions override role permissions for same resource
    const permissionMap = new Map();
    
    // First, add all role permissions (filter out null resources)
    rolePermissions.forEach(perm => {
        if (!perm.resource || !perm.resource._id) {
            return; // Skip permissions with null/deleted resources
        }
        const key = perm.resource._id.toString();
        permissionMap.set(key, {
            resource: perm.resource,
            actions: [...perm.actions],
            conditions: perm.conditions,
            source: 'role'
        });
    });
    
    // Then, override/add user-specific permissions (filter out null resources)
    userPermissions.forEach(perm => {
        if (!perm.resource || !perm.resource._id) {
            return; // Skip permissions with null/deleted resources
        }
        const key = perm.resource._id.toString();
        if (permissionMap.has(key)) {
            // Override: replace with user permission
            permissionMap.set(key, {
                resource: perm.resource,
                actions: [...perm.actions],
                conditions: perm.conditions,
                source: 'user'
            });
        } else {
            // Add new permission
            permissionMap.set(key, {
                resource: perm.resource,
                actions: [...perm.actions],
                conditions: perm.conditions,
                source: 'user'
            });
        }
    });
    
    return Array.from(permissionMap.values());
};

// Static method to get all resources a role can access
// role can be Role ObjectId, slug, or name
permissionSchema.statics.getRoleResources = async function(role) {
    const Role = mongoose.model('Role');
    
    // Resolve role to ObjectId (supports ObjectId, slug, or name)
    let roleId = role;
    if (!mongoose.Types.ObjectId.isValid(role) || role.toString().length !== 24) {
        // Not a valid ObjectId, try to find by slug or name
        const roleDoc = await Role.findOne({
            $or: [
                { slug: role },
                { name: role }
            ]
        }).select('_id');
        if (!roleDoc) {
            return [];
        }
        roleId = roleDoc._id;
    } else {
        roleId = new mongoose.Types.ObjectId(role);
    }
    
    const permissions = await this.find({ role: roleId, isActive: true })
        .populate('resource', 'name slug path')
        .select('resource');
    return [...new Set(permissions.map(p => p.resource).filter(Boolean))];
};

// Static method to get all resources a user can access (effective permissions)
permissionSchema.statics.getUserResources = async function(userId) {
    const effectivePermissions = await this.getEffectivePermissions(userId);
    return effectivePermissions.map(p => p.resource).filter(Boolean);
};

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;

