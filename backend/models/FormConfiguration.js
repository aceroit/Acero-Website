const mongoose = require('mongoose');

const formConfigurationSchema = new mongoose.Schema({
    // Career form configuration
    career: {
        thankYouTimeout: {
            type: Number,
            default: 5,
            min: [1, 'Timeout must be at least 1 second'],
            max: [300, 'Timeout cannot exceed 300 seconds']
        },
        thankYouRedirectUrl: {
            type: String,
            default: '/',
            trim: true,
            validate: {
                validator: function(v) {
                    // Must start with / or be a valid URL
                    return v.startsWith('/') || /^https?:\/\//.test(v);
                },
                message: 'Redirect URL must be a relative path (starting with /) or a valid URL'
            }
        }
    },
    
    // Contact form configuration
    contact: {
        thankYouTimeout: {
            type: Number,
            default: 5,
            min: [1, 'Timeout must be at least 1 second'],
            max: [300, 'Timeout cannot exceed 300 seconds']
        },
        thankYouRedirectUrl: {
            type: String,
            default: '/',
            trim: true,
            validate: {
                validator: function(v) {
                    // Must start with / or be a valid URL
                    return v.startsWith('/') || /^https?:\/\//.test(v);
                },
                message: 'Redirect URL must be a relative path (starting with /) or a valid URL'
            }
        }
    },
    
    // Default notification emails
    defaultEnquiryEmail: {
        type: String,
        trim: true,
        lowercase: true,
        default: null,
        validate: {
            validator: function(v) {
                if (!v) return true; // Optional field
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Please enter a valid email address'
        }
    },
    defaultApplicationEmail: {
        type: String,
        trim: true,
        lowercase: true,
        default: null,
        validate: {
            validator: function(v) {
                if (!v) return true; // Optional field
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Please enter a valid email address'
        }
    },
    
    // Single active configuration
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true
});

// Index for active configuration
formConfigurationSchema.index({ isActive: 1 });

// Static method to get active configuration
formConfigurationSchema.statics.getActive = async function() {
    const config = await this.findOne({ isActive: true });
    
    // If no active config exists, return default configuration
    if (!config) {
        return {
            career: {
                thankYouTimeout: 5,
                thankYouRedirectUrl: '/'
            },
            contact: {
                thankYouTimeout: 5,
                thankYouRedirectUrl: '/'
            },
            defaultEnquiryEmail: null,
            defaultApplicationEmail: null,
            isActive: true
        };
    }
    
    return config;
};

// Pre-save middleware to ensure only one active configuration
formConfigurationSchema.pre('save', async function() {
    // If this configuration is being set as active
    if (this.isActive && this.isNew) {
        // Deactivate all other configurations
        await this.constructor.updateMany(
            { _id: { $ne: this._id }, isActive: true },
            { isActive: false }
        );
    } else if (this.isActive && this.isModified('isActive')) {
        // If updating an existing document to be active
        await this.constructor.updateMany(
            { _id: { $ne: this._id }, isActive: true },
            { isActive: false }
        );
    }
});

// Pre-update middleware (for findOneAndUpdate, updateOne, etc.)
formConfigurationSchema.pre(['findOneAndUpdate', 'updateOne'], async function() {
    const update = this.getUpdate();
    
    // If setting this configuration as active
    if (update.isActive === true || (update.$set && update.$set.isActive === true)) {
        const docToUpdate = await this.model.findOne(this.getQuery());
        if (docToUpdate) {
            // Deactivate all other configurations
            await this.model.updateMany(
                { _id: { $ne: docToUpdate._id }, isActive: true },
                { isActive: false }
            );
        }
    }
});

const FormConfiguration = mongoose.model('FormConfiguration', formConfigurationSchema);

module.exports = FormConfiguration;

