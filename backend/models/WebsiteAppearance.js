const mongoose = require('mongoose');

const websiteAppearanceSchema = new mongoose.Schema({
    title: {
        type: String,
        default: 'Website Appearance',
        trim: true
    },

    // Workflow fields
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
    featured: {
        type: Boolean,
        default: false,
        index: true
    },

    // Creator and updater
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    // Appearance fields mapped to frontend design defaults
    colorPalette: {
        lightMode: {
            background: { value: { type: String, default: '#F7F7F7' }, isFieldActive: { type: Boolean, default: true } },
            foreground: { value: { type: String, default: '#0B0D0E' }, isFieldActive: { type: Boolean, default: true } },
            card: { value: { type: String, default: '#FFFFFF' }, isFieldActive: { type: Boolean, default: true } },
            primary: { value: { type: String, default: '#E10600' }, isFieldActive: { type: Boolean, default: true } },
            secondary: { value: { type: String, default: '#E5E5E5' }, isFieldActive: { type: Boolean, default: true } },
            muted: { value: { type: String, default: '#E5E5E5' }, isFieldActive: { type: Boolean, default: true } },
            accent: { value: { type: String, default: '#E10600' }, isFieldActive: { type: Boolean, default: true } },
            border: { value: { type: String, default: '#CCCCCC' }, isFieldActive: { type: Boolean, default: true } },
            ring: { value: { type: String, default: '#E10600' }, isFieldActive: { type: Boolean, default: true } }
        },
        darkMode: {
            background: { value: { type: String, default: '#0B0D0E' }, isFieldActive: { type: Boolean, default: true } },
            foreground: { value: { type: String, default: '#F7F7F7' }, isFieldActive: { type: Boolean, default: true } },
            card: { value: { type: String, default: '#111315' }, isFieldActive: { type: Boolean, default: true } },
            primary: { value: { type: String, default: '#E10600' }, isFieldActive: { type: Boolean, default: true } },
            secondary: { value: { type: String, default: '#1A1D1F' }, isFieldActive: { type: Boolean, default: true } },
            muted: { value: { type: String, default: '#1A1D1F' }, isFieldActive: { type: Boolean, default: true } },
            accent: { value: { type: String, default: '#E10600' }, isFieldActive: { type: Boolean, default: true } },
            border: { value: { type: String, default: '#2E2E2E' }, isFieldActive: { type: Boolean, default: true } },
            ring: { value: { type: String, default: '#E10600' }, isFieldActive: { type: Boolean, default: true } }
        },
        steelColors: {
            steelBlack: { value: { type: String, default: '#0B0D0E' }, isFieldActive: { type: Boolean, default: true } },
            steelWhite: { value: { type: String, default: '#F7F7F7' }, isFieldActive: { type: Boolean, default: true } },
            steelGray: { value: { type: String, default: '#2E2E2E' }, isFieldActive: { type: Boolean, default: true } },
            steelRed: { value: { type: String, default: '#E10600' }, isFieldActive: { type: Boolean, default: true } },
            steelDark: { value: { type: String, default: '#111315' }, isFieldActive: { type: Boolean, default: true } },
            steelMuted: { value: { type: String, default: '#6B7280' }, isFieldActive: { type: Boolean, default: true } }
        }
    },
    typography: {
        fontFamily: {
            primary: { value: { type: String, default: 'Inter' }, isFieldActive: { type: Boolean, default: true } },
            monospace: { value: { type: String, default: 'Geist Mono' }, isFieldActive: { type: Boolean, default: true } }
        },
        fontScale: {
            h1: { value: { type: String, default: 'text-5xl md:text-6xl lg:text-7xl' }, isFieldActive: { type: Boolean, default: true } },
            h2: { value: { type: String, default: 'text-4xl md:text-5xl' }, isFieldActive: { type: Boolean, default: true } },
            h3: { value: { type: String, default: 'text-2xl md:text-3xl' }, isFieldActive: { type: Boolean, default: true } },
            h4: { value: { type: String, default: 'text-xl md:text-2xl' }, isFieldActive: { type: Boolean, default: true } },
            body: { value: { type: String, default: 'leading-relaxed' }, isFieldActive: { type: Boolean, default: true } }
        }
    },
    spacing: {
        containerMaxWidth: { value: { type: String, default: 'max-w-7xl' }, isFieldActive: { type: Boolean, default: true } },
        sectionPadding: { value: { type: String, default: 'px-6 py-24' }, isFieldActive: { type: Boolean, default: true } },
        gridGap: { value: { type: String, default: 'gap-8' }, isFieldActive: { type: Boolean, default: true } }
    },
    borderRadius: {
        defaultRadius: { value: { type: String, default: '0.5rem' }, isFieldActive: { type: Boolean, default: true } }
    }
}, {
    timestamps: true
});

// Indexes
websiteAppearanceSchema.index({ status: 1, featured: 1, isActive: 1 });

// Static method to get published configuration
websiteAppearanceSchema.statics.getPublished = async function(filters = {}) {
    const query = {
        status: 'published',
        featured: true,
        isActive: true,
        ...filters
    };

    return this.findOne(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email');
};

const WebsiteAppearance = mongoose.model('WebsiteAppearance', websiteAppearanceSchema);

module.exports = WebsiteAppearance;


