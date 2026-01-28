const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't include password in queries by default
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: [true, 'Role is required'],
        index: true
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLogin: {
        type: Date,
        default: null
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
    },
}, {
    timestamps: true // Automatically manage createdAt and updatedAt
});

// Hash password before saving
userSchema.pre('save', async function () {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});


// Method to compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Method to generate JWT token
// Note: Role should be populated before calling this method, or it will use role._id
userSchema.methods.generateAuthToken = async function () {
    // Get role slug/name for JWT
    let roleValue = null;
    
    // If role is populated (object), use slug
    if (this.role && typeof this.role === 'object' && this.role.slug) {
        roleValue = this.role.slug;
    } 
    // If role is ObjectId, populate it first
    else if (this.role) {
        // Populate role if not already populated
        if (!this.populated('role')) {
            await this.populate('role', 'slug name');
        }
        roleValue = this.role?.slug || this.role?._id?.toString();
    }
    
    const token = jwt.sign(
        {
            id: this._id,
            email: this.email,
            role: roleValue,
            firstName: this.firstName,
            lastName: this.lastName
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    return token;
};

// Method to get user full name
userSchema.methods.getFullName = function () {
    return `${this.firstName} ${this.lastName}`;
};

// Virtual for full name
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for role name (requires role to be populated)
userSchema.virtual('roleName').get(function () {
    if (this.role && typeof this.role === 'object') {
        return this.role.name || this.role.slug;
    }
    return null;
});

// Virtual for role slug (requires role to be populated)
userSchema.virtual('roleSlug').get(function () {
    if (this.role && typeof this.role === 'object') {
        return this.role.slug;
    }
    return null;
});

// Method to get role name/slug (async, populates if needed)
userSchema.methods.getRoleName = async function () {
    if (!this.role) {
        return null;
    }
    
    // If role is populated, return name
    if (typeof this.role === 'object' && this.role.name) {
        return this.role.name;
    }
    
    // Otherwise, populate and return
    await this.populate('role', 'name slug');
    return this.role?.name || this.role?.slug || null;
};

// Method to get role slug (async, populates if needed)
userSchema.methods.getRoleSlug = async function () {
    if (!this.role) {
        return null;
    }
    
    // If role is populated, return slug
    if (typeof this.role === 'object' && this.role.slug) {
        return this.role.slug;
    }
    
    // Otherwise, populate and return
    await this.populate('role', 'slug');
    return this.role?.slug || null;
};

// Ensure virtuals are included in JSON output
userSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        delete ret.password; // Remove password from JSON output
        return ret;
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;