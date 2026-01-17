const User = require('../models/User');
const Role = require('../models/Role');
const ActivityLog = require('../models/ActivityLog');
const mongoose = require('mongoose');

/**
 * Helper function to resolve role (ObjectId, slug, or name) to ObjectId
 * @param {String|ObjectId} role - Role ObjectId, slug, or name
 * @returns {Promise<ObjectId|null>} - Role ObjectId or null if not found
 */
const getRoleId = async (role) => {
    // If already a valid ObjectId, return it
    if (mongoose.Types.ObjectId.isValid(role) && role.toString().length === 24) {
        return new mongoose.Types.ObjectId(role);
    }
    
    // Try to find by slug or name
    const roleDoc = await Role.findOne({
        $or: [
            { slug: role },
            { name: role }
        ]
    }).select('_id');
    
    return roleDoc ? roleDoc._id : null;
};

// Get all users (with filtering, pagination, sorting)
const getAllUsers = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            role, 
            isActive, 
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = {};
        
        if (role) {
            // Resolve role to ObjectId (supports ObjectId, slug, or name)
            const roleId = await getRoleId(role);
            if (roleId) {
                query.role = roleId;
            } else {
                // If role not found, return empty result
                return res.status(200).json({
                    success: true,
                    data: {
                        users: [],
                        pagination: {
                            total: 0,
                            page: parseInt(page),
                            limit: parseInt(limit),
                            pages: 0
                        }
                    }
                });
            }
        }
        
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }
        
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query
        const users = await User.find(query)
            .select('-password')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('role', 'name slug description level color isSystem isActive')
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        // Get total count
        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// Get single user by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id)
            .select('-password')
            .populate('role', 'name slug description level color isSystem isActive')
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                user
            }
        });

    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
};

// Create new user
const createUser = async (req, res) => {
    try {
        const { email, password, firstName, lastName, role } = req.body;

        // Validate required fields
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: email, password, firstName, lastName'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Resolve role to ObjectId if provided (supports ObjectId, slug, or name)
        let roleId = null;
        if (role) {
            roleId = await getRoleId(role);
            if (!roleId) {
                return res.status(404).json({
                    success: false,
                    message: `Role not found: ${role}`
                });
            }
            
            // Check if trying to assign super_admin role
            const roleDoc = await Role.findById(roleId).select('slug');
            if (roleDoc && roleDoc.slug === 'super_admin') {
                // Get current user's role
                const currentUser = await User.findById(req.user._id).populate('role', 'slug');
                const currentUserRoleSlug = currentUser?.role?.slug || (typeof req.user.role === 'string' ? req.user.role : null);
                
                if (currentUserRoleSlug !== 'super_admin') {
                    return res.status(403).json({
                        success: false,
                        message: 'Only super admin can create super admin users'
                    });
                }
            }
        } else {
            // Default to viewer role if not provided
            const viewerRole = await Role.findOne({ slug: 'viewer' }).select('_id');
            if (viewerRole) {
                roleId = viewerRole._id;
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Default viewer role not found. Please create roles first.'
                });
            }
        }

        // Create new user
        const user = new User({
            email,
            password,
            firstName,
            lastName,
            role: roleId,
            createdBy: req.user._id
        });

        await user.save();
        
        // Populate role for response and logging
        await user.populate('role', 'name slug description level color');

        // Log activity
        const userRoleSlug = user.role?.slug || user.role?._id?.toString();
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'create',
            resource: 'user',
            resourceId: user._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: { 
                createdUserEmail: user.email,
                createdUserRole: userRoleSlug
            }
        });

        // Return user without password
        const userResponse = user.toJSON();

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                user: userResponse
            }
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
};

// Update user
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, role, isActive } = req.body;

        // Get current user data with populated role
        const oldUser = await User.findById(id).populate('role', 'slug name _id');

        if (!oldUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get current user's role
        const currentUser = await User.findById(req.user._id).populate('role', 'slug');
        const currentUserRoleSlug = currentUser?.role?.slug || (typeof req.user.role === 'string' ? req.user.role : null);
        const oldUserRoleSlug = oldUser?.role?.slug || (typeof oldUser.role === 'string' ? oldUser.role : null);

        // Prevent non-super-admin from updating super-admin users
        if (oldUserRoleSlug === 'super_admin' && currentUserRoleSlug !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Only super admin can update super admin users'
            });
        }

        // Resolve new role to ObjectId if provided
        let newRoleId = null;
        if (role) {
            newRoleId = await getRoleId(role);
            if (!newRoleId) {
                return res.status(404).json({
                    success: false,
                    message: `Role not found: ${role}`
                });
            }
            
            // Check if trying to assign super_admin role
            const newRoleDoc = await Role.findById(newRoleId).select('slug');
            if (newRoleDoc && newRoleDoc.slug === 'super_admin' && currentUserRoleSlug !== 'super_admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Only super admin can assign super admin role'
                });
            }
        }

        // Check if email is being changed and if it's already taken
        if (email && email !== oldUser.email) {
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already in use'
                });
            }
        }

        // Build update object
        const updateData = {
            updatedBy: req.user._id
        };

        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (email) updateData.email = email;
        if (newRoleId) updateData.role = newRoleId;
        if (isActive !== undefined) updateData.isActive = isActive;

        // Update user
        const user = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
        .select('-password')
        .populate('role', 'name slug description level color');

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'update',
            resource: 'user',
            resourceId: user._id,
            changes: {
                before: {
                    firstName: oldUser.firstName,
                    lastName: oldUser.lastName,
                    email: oldUser.email,
                    role: oldUser.role,
                    isActive: oldUser.isActive
                },
                after: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive
                }
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: {
                user
            }
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
};

// Delete user (soft delete - deactivate)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get current user's role
        const currentUser = await User.findById(req.user._id).populate('role', 'slug');
        const currentUserRoleSlug = currentUser?.role?.slug || (typeof req.user.role === 'string' ? req.user.role : null);
        const userRoleSlug = user?.role?.slug || (typeof user.role === 'string' ? user.role : null);

        // Prevent non-super-admin from deleting super-admin users
        if (userRoleSlug === 'super_admin' && currentUserRoleSlug !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Only super admin can delete super admin users'
            });
        }

        // Prevent users from deleting themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        // Soft delete - just deactivate
        user.isActive = false;
        user.updatedBy = req.user._id;
        await user.save();

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'delete',
            resource: 'user',
            resourceId: user._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: { 
                deletedUserEmail: user.email,
                deletedUserRole: userRoleSlug || user.role?._id?.toString()
            }
        });

        res.status(200).json({
            success: true,
            message: 'User deleted successfully (deactivated)'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

// Change user role
const changeUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({
                success: false,
                message: 'Role is required'
            });
        }

        // Get current user's role
        const currentUser = await User.findById(req.user._id).populate('role', 'slug');
        const currentUserRoleSlug = currentUser?.role?.slug || (typeof req.user.role === 'string' ? req.user.role : null);

        // Only super admin can change roles
        if (currentUserRoleSlug !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Only super admin can change user roles'
            });
        }

        // Resolve role to ObjectId (supports ObjectId, slug, or name)
        const roleId = await getRoleId(role);
        if (!roleId) {
            return res.status(404).json({
                success: false,
                message: `Role not found: ${role}`
            });
        }

        const user = await User.findById(id).populate('role', 'name slug');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const oldRole = user.role;
        user.role = roleId;
        user.updatedBy = req.user._id;
        await user.save();
        
        // Populate new role for response
        await user.populate('role', 'name slug description level color');

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'update',
            resource: 'user',
            resourceId: user._id,
            changes: {
                before: { 
                    role: oldRole?.slug || oldRole?.name || oldRole?._id?.toString() || oldRole 
                },
                after: { 
                    role: user.role?.slug || user.role?.name || user.role?._id?.toString() || user.role 
                }
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: { action: 'role_changed' }
        });

        res.status(200).json({
            success: true,
            message: 'User role changed successfully',
            data: {
                user: user.toJSON()
            }
        });

    } catch (error) {
        console.error('Change user role error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing user role',
            error: error.message
        });
    }
};

// Get user statistics
const getUserStats = async (req, res) => {
    try {
        const stats = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 },
                    active: {
                        $sum: { $cond: ['$isActive', 1, 0] }
                    },
                    inactive: {
                        $sum: { $cond: ['$isActive', 0, 1] }
                    }
                }
            }
        ]);

        // Populate role details for stats
        const statsWithRoles = await Promise.all(
            stats.map(async (stat) => {
                if (stat._id) {
                    const role = await Role.findById(stat._id).select('name slug description level color');
                    return {
                        ...stat,
                        role: role || { _id: stat._id }
                    };
                }
                return stat;
            })
        );

        // Sort by role level (desc) then name
        statsWithRoles.sort((a, b) => {
            if (a.role && b.role) {
                if (a.role.level !== b.role.level) {
                    return (b.role.level || 0) - (a.role.level || 0);
                }
                return (a.role.name || '').localeCompare(b.role.name || '');
            }
            return 0;
        });

        const total = await User.countDocuments();
        const active = await User.countDocuments({ isActive: true });
        const inactive = await User.countDocuments({ isActive: false });

        res.status(200).json({
            success: true,
            data: {
                total,
                active,
                inactive,
                byRole: statsWithRoles
            }
        });

    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user statistics',
            error: error.message
        });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    changeUserRole,
    getUserStats
};

