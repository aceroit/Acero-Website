const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

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
            query.role = role;
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

        // Admin can't create super_admin users
        if (role === 'super_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Only super admin can create super admin users'
            });
        }

        // Create new user
        const user = new User({
            email,
            password,
            firstName,
            lastName,
            role: role || 'viewer',
            createdBy: req.user._id
        });

        await user.save();

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'create',
            resource: 'user',
            resourceId: user._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: { 
                createdUserEmail: user.email,
                createdUserRole: user.role 
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

        // Get current user data
        const oldUser = await User.findById(id);

        if (!oldUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent non-super-admin from updating super-admin users
        if (oldUser.role === 'super_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Only super admin can update super admin users'
            });
        }

        // Prevent non-super-admin from making users super-admin
        if (role === 'super_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Only super admin can assign super admin role'
            });
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
        if (role) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;

        // Update user
        const user = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

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

        // Prevent non-super-admin from deleting super-admin users
        if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
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
                deletedUserRole: user.role 
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

        const validRoles = ['super_admin', 'admin', 'approver', 'reviewer', 'editor', 'viewer'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role',
                validRoles
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Only super admin can change roles
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Only super admin can change user roles'
            });
        }

        const oldRole = user.role;
        user.role = role;
        user.updatedBy = req.user._id;
        await user.save();

        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            action: 'update',
            resource: 'user',
            resourceId: user._id,
            changes: {
                before: { role: oldRole },
                after: { role: user.role }
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
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const total = await User.countDocuments();
        const active = await User.countDocuments({ isActive: true });
        const inactive = await User.countDocuments({ isActive: false });

        res.status(200).json({
            success: true,
            data: {
                total,
                active,
                inactive,
                byRole: stats
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

