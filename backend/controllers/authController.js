const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// Register a new user (admin/super_admin only can create users)
const register = async (req, res) => {
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

        // Create new user
        const user = new User({
            email,
            password,
            firstName,
            lastName,
            role: role || 'viewer', // Default to viewer if not specified
            createdBy: req.user?._id || null // If called by authenticated user
        });

        await user.save();

        // Log activity
        if (req.user) {
            await ActivityLog.logActivity({
                userId: req.user._id,
                action: 'create',
                resource: 'user',
                resourceId: user._id,
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                metadata: { createdUserEmail: user.email }
            });
        }

        // Generate token
        const token = user.generateAuthToken();

        // Return user without password
        const userResponse = user.toJSON();

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: userResponse,
                token
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        console.log('Attempting login for:', email);

        // Find user and include password field
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact administrator.'
            });
        }

        // Verify password
        const isPasswordCorrect = await user.comparePassword(password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Log activity
        await ActivityLog.logActivity({
            userId: user._id,
            action: 'login',
            resource: 'auth',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        // Generate token
        const token = user.generateAuthToken();

        // Return user without password
        const userResponse = user.toJSON();

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: userResponse,
                token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login',
            error: error.message
        });
    }
};

// Logout user
const logout = async (req, res) => {
    try {
        // Log activity
        if (req.user) {
            await ActivityLog.logActivity({
                userId: req.user._id,
                action: 'logout',
                resource: 'auth',
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });
        }

        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during logout',
            error: error.message
        });
    }
};

// Get current user profile
const getMe = async (req, res) => {
    try {
        // req.user is set by auth middleware
        const user = await User.findById(req.user._id)
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
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user profile',
            error: error.message
        });
    }
};

// Refresh JWT token
const refreshToken = async (req, res) => {
    try {
        // req.user is set by auth middleware
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated'
            });
        }

        // Generate new token
        const token = user.generateAuthToken();

        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                token
            }
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'Error refreshing token',
            error: error.message
        });
    }
};

// Update user profile (self)
const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, email } = req.body;
        const userId = req.user._id;

        // Get current user data for change tracking
        const oldUser = await User.findById(userId);

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

        // Update user
        const user = await User.findByIdAndUpdate(
            userId,
            {
                firstName: firstName || oldUser.firstName,
                lastName: lastName || oldUser.lastName,
                email: email || oldUser.email,
                updatedBy: userId
            },
            { new: true, runValidators: true }
        ).select('-password');

        // Log activity
        await ActivityLog.logActivity({
            userId,
            action: 'update',
            resource: 'user',
            resourceId: userId,
            changes: {
                before: {
                    firstName: oldUser.firstName,
                    lastName: oldUser.lastName,
                    email: oldUser.email
                },
                after: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email
                }
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current password and new password'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        // Get user with password
        const user = await User.findById(userId).select('+password');

        // Verify current password
        const isPasswordCorrect = await user.comparePassword(currentPassword);
        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Log activity
        await ActivityLog.logActivity({
            userId,
            action: 'update',
            resource: 'user',
            resourceId: userId,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: { action: 'password_changed' }
        });

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: error.message
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    getMe,
    refreshToken,
    updateProfile,
    changePassword
};