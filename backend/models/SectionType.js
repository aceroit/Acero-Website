const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['text', 'richtext', 'textarea', 'number', 'email', 'url', 'tel', 'date', 'datetime', 'time', 'image', 'video', 'file', 'select', 'multiselect', 'checkbox', 'radio', 'color', 'json', 'array', 'boolean'],
        default: 'text'
    },
    label: {
        type: String,
        required: true,
        trim: true
    },
    placeholder: {
        type: String,
        default: ''
    },
    helpText: {
        type: String,
        default: ''
    },
    required: {
        type: Boolean,
        default: false
    },
    validation: {
        min: Number,
        max: Number,
        minLength: Number,
        maxLength: Number,
        pattern: String,
        custom: mongoose.Schema.Types.Mixed
    },
    defaultValue: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    options: [{
        label: String,
        value: mongoose.Schema.Types.Mixed
    }], // For select, multiselect, radio, checkbox
    order: {
        type: Number,
        default: 0
    }
}, { _id: false });

const sectionTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Section type name is required'],
        trim: true,
        index: true
    },
    slug: {
        type: String,
        required: [true, 'Section type slug is required'],
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    icon: {
        type: String,
        default: 'default-icon'
    },
    category: {
        type: String,
        required: true,
        trim: true,
        default: 'General',
        index: true
        // e.g., 'Headers', 'Content', 'Media', 'Forms', 'Custom'
    },
    fields: [fieldSchema],
    previewComponent: {
        type: String,
        default: 'DefaultPreview'
        // Component name for admin preview
    },
    thumbnailUrl: {
        type: String,
        default: null
        // Preview image for section library
    },
    isSystem: {
        type: Boolean,
        default: false,
        index: true
        // System section types cannot be deleted
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

// Index for category and active status
sectionTypeSchema.index({ category: 1, isActive: 1 });

// Method to validate section content against field schema
sectionTypeSchema.methods.validateContent = function(content) {
    const errors = [];
    
    // Check required fields
    for (const field of this.fields) {
        if (field.required && !content[field.name]) {
            errors.push(`Field '${field.label}' is required`);
        }
        
        // Type validation
        if (content[field.name]) {
            const value = content[field.name];
            
            switch (field.type) {
                case 'number':
                    if (isNaN(value)) {
                        errors.push(`Field '${field.label}' must be a number`);
                    } else {
                        if (field.validation?.min !== undefined && value < field.validation.min) {
                            errors.push(`Field '${field.label}' must be at least ${field.validation.min}`);
                        }
                        if (field.validation?.max !== undefined && value > field.validation.max) {
                            errors.push(`Field '${field.label}' must be at most ${field.validation.max}`);
                        }
                    }
                    break;
                    
                case 'text':
                case 'textarea':
                case 'richtext':
                    if (typeof value !== 'string') {
                        errors.push(`Field '${field.label}' must be a string`);
                    } else {
                        if (field.validation?.minLength && value.length < field.validation.minLength) {
                            errors.push(`Field '${field.label}' must be at least ${field.validation.minLength} characters`);
                        }
                        if (field.validation?.maxLength && value.length > field.validation.maxLength) {
                            errors.push(`Field '${field.label}' must be at most ${field.validation.maxLength} characters`);
                        }
                        if (field.validation?.pattern) {
                            const regex = new RegExp(field.validation.pattern);
                            if (!regex.test(value)) {
                                errors.push(`Field '${field.label}' format is invalid`);
                            }
                        }
                    }
                    break;
                    
                case 'email':
                    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
                    if (!emailRegex.test(value)) {
                        errors.push(`Field '${field.label}' must be a valid email`);
                    }
                    break;
                    
                case 'url':
                    try {
                        new URL(value);
                    } catch {
                        errors.push(`Field '${field.label}' must be a valid URL`);
                    }
                    break;
                    
                case 'array':
                    if (!Array.isArray(value)) {
                        errors.push(`Field '${field.label}' must be an array`);
                    } else {
                        if (field.validation?.minItems && value.length < field.validation.minItems) {
                            errors.push(`Field '${field.label}' must have at least ${field.validation.minItems} items`);
                        }
                        if (field.validation?.maxItems && value.length > field.validation.maxItems) {
                            errors.push(`Field '${field.label}' must have at most ${field.validation.maxItems} items`);
                        }
                    }
                    break;
                    
                case 'boolean':
                    if (typeof value !== 'boolean') {
                        errors.push(`Field '${field.label}' must be a boolean`);
                    }
                    break;
                    
                case 'json':
                    // JSON type accepts any valid JSON structure
                    try {
                        if (typeof value === 'string') {
                            JSON.parse(value);
                        }
                    } catch {
                        // If it's not a string, it might already be parsed, which is fine
                        if (typeof value === 'string') {
                            errors.push(`Field '${field.label}' must be valid JSON`);
                        }
                    }
                    break;
            }
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// Static method to get section types by category
sectionTypeSchema.statics.getByCategory = async function(includeInactive = false) {
    const query = includeInactive ? {} : { isActive: true };
    const sectionTypes = await this.find(query).sort({ category: 1, name: 1 });
    
    // Group by category
    const grouped = {};
    for (const sectionType of sectionTypes) {
        if (!grouped[sectionType.category]) {
            grouped[sectionType.category] = [];
        }
        grouped[sectionType.category].push(sectionType);
    }
    
    return grouped;
};

// Static method to get active section types
sectionTypeSchema.statics.getActive = async function() {
    return await this.find({ isActive: true }).sort({ category: 1, name: 1 });
};

const SectionType = mongoose.model('SectionType', sectionTypeSchema);

module.exports = SectionType;

