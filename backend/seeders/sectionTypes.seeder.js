const mongoose = require('mongoose');
const SectionType = require('../models/SectionType');
require('dotenv').config();

// Connect to database
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Default section types
const defaultSectionTypes = [
    {
        name: 'Hero Section',
        slug: 'hero',
        description: 'Large header section with background image, title, subtitle and call-to-action button',
        icon: '🎯',
        category: 'Headers',
        isSystem: true,
        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Title',
                placeholder: 'Enter main heading',
                required: true,
                validation: {
                    minLength: 3,
                    maxLength: 100
                },
                order: 0
            },
            {
                name: 'subtitle',
                type: 'textarea',
                label: 'Subtitle',
                placeholder: 'Enter subtitle or description',
                required: false,
                validation: {
                    maxLength: 300
                },
                order: 1
            },
            {
                name: 'backgroundImage',
                type: 'image',
                label: 'Background Image',
                helpText: 'Recommended size: 1920x1080px',
                required: true,
                order: 2
            },
            {
                name: 'ctaButtonText',
                type: 'text',
                label: 'CTA Button Text',
                placeholder: 'e.g., Learn More',
                required: false,
                validation: {
                    maxLength: 30
                },
                order: 3
            },
            {
                name: 'ctaButtonLink',
                type: 'url',
                label: 'CTA Button Link',
                placeholder: '/about or https://example.com',
                required: false,
                order: 4
            },
            {
                name: 'height',
                type: 'select',
                label: 'Section Height',
                required: false,
                defaultValue: 'medium',
                options: [
                    { label: 'Small (400px)', value: 'small' },
                    { label: 'Medium (600px)', value: 'medium' },
                    { label: 'Large (800px)', value: 'large' },
                    { label: 'Full Screen', value: 'fullscreen' }
                ],
                order: 5
            },
            {
                name: 'textAlignment',
                type: 'select',
                label: 'Text Alignment',
                required: false,
                defaultValue: 'center',
                options: [
                    { label: 'Left', value: 'left' },
                    { label: 'Center', value: 'center' },
                    { label: 'Right', value: 'right' }
                ],
                order: 6
            }
        ],
        previewComponent: 'HeroSection',
        thumbnailUrl: null
    },
    {
        name: 'Text Block',
        slug: 'text_block',
        description: 'Rich text content section with optional heading',
        icon: '📝',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'heading',
                type: 'text',
                label: 'Heading',
                placeholder: 'Section heading (optional)',
                required: false,
                validation: {
                    maxLength: 100
                },
                order: 0
            },
            {
                name: 'content',
                type: 'richtext',
                label: 'Content',
                placeholder: 'Enter your content here...',
                helpText: 'Supports rich text formatting',
                required: true,
                validation: {
                    minLength: 10
                },
                order: 1
            },
            {
                name: 'alignment',
                type: 'select',
                label: 'Text Alignment',
                required: false,
                defaultValue: 'left',
                options: [
                    { label: 'Left', value: 'left' },
                    { label: 'Center', value: 'center' },
                    { label: 'Right', value: 'right' },
                    { label: 'Justify', value: 'justify' }
                ],
                order: 2
            },
            {
                name: 'backgroundColor',
                type: 'color',
                label: 'Background Color',
                helpText: 'Optional background color',
                required: false,
                defaultValue: '#ffffff',
                order: 3
            }
        ],
        previewComponent: 'TextBlockSection',
        thumbnailUrl: null
    },
    {
        name: 'Image Gallery',
        slug: 'image_gallery',
        description: 'Display multiple images in various layouts (grid, masonry, slider)',
        icon: '🖼️',
        category: 'Media',
        isSystem: true,
        fields: [
            {
                name: 'heading',
                type: 'text',
                label: 'Gallery Heading',
                placeholder: 'Optional gallery title',
                required: false,
                order: 0
            },
            {
                name: 'images',
                type: 'json',
                label: 'Images',
                helpText: 'Array of image objects with url, alt, caption',
                required: true,
                order: 1
            },
            {
                name: 'layout',
                type: 'select',
                label: 'Layout Style',
                required: false,
                defaultValue: 'grid',
                options: [
                    { label: 'Grid', value: 'grid' },
                    { label: 'Masonry', value: 'masonry' },
                    { label: 'Slider/Carousel', value: 'slider' }
                ],
                order: 2
            },
            {
                name: 'columns',
                type: 'number',
                label: 'Number of Columns',
                helpText: 'For grid and masonry layouts',
                required: false,
                defaultValue: 3,
                validation: {
                    min: 1,
                    max: 6
                },
                order: 3
            },
            {
                name: 'showCaptions',
                type: 'checkbox',
                label: 'Show Image Captions',
                required: false,
                defaultValue: true,
                order: 4
            }
        ],
        previewComponent: 'ImageGallerySection',
        thumbnailUrl: null
    },
    {
        name: 'Features Grid',
        slug: 'features_grid',
        description: 'Display features or services in a grid layout with icons',
        icon: '⚡',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'heading',
                type: 'text',
                label: 'Section Heading',
                placeholder: 'e.g., Our Features',
                required: false,
                validation: {
                    maxLength: 100
                },
                order: 0
            },
            {
                name: 'subheading',
                type: 'textarea',
                label: 'Subheading',
                placeholder: 'Brief description',
                required: false,
                validation: {
                    maxLength: 200
                },
                order: 1
            },
            {
                name: 'features',
                type: 'json',
                label: 'Features',
                helpText: 'Array of features with title, description, icon',
                required: true,
                order: 2
            },
            {
                name: 'columns',
                type: 'number',
                label: 'Number of Columns',
                required: false,
                defaultValue: 3,
                validation: {
                    min: 2,
                    max: 4
                },
                order: 3
            }
        ],
        previewComponent: 'FeaturesGridSection',
        thumbnailUrl: null
    },
    {
        name: 'Video Section',
        slug: 'video',
        description: 'Embed video from URL (YouTube, Vimeo, or direct link)',
        icon: '🎥',
        category: 'Media',
        isSystem: true,
        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Video Title',
                placeholder: 'Optional video title',
                required: false,
                validation: {
                    maxLength: 100
                },
                order: 0
            },
            {
                name: 'videoUrl',
                type: 'url',
                label: 'Video URL',
                placeholder: 'YouTube, Vimeo, or direct video URL',
                helpText: 'Supports YouTube, Vimeo, and direct video files',
                required: true,
                order: 1
            },
            {
                name: 'description',
                type: 'textarea',
                label: 'Description',
                placeholder: 'Optional video description',
                required: false,
                validation: {
                    maxLength: 500
                },
                order: 2
            },
            {
                name: 'autoplay',
                type: 'checkbox',
                label: 'Autoplay Video',
                helpText: 'Video will play automatically (muted)',
                required: false,
                defaultValue: false,
                order: 3
            },
            {
                name: 'showControls',
                type: 'checkbox',
                label: 'Show Video Controls',
                required: false,
                defaultValue: true,
                order: 4
            }
        ],
        previewComponent: 'VideoSection',
        thumbnailUrl: null
    },
    {
        name: 'Timeline',
        slug: 'timeline',
        description: 'Display chronological events in a timeline format',
        icon: '📅',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'heading',
                type: 'text',
                label: 'Timeline Heading',
                placeholder: 'e.g., Our History',
                required: false,
                validation: {
                    maxLength: 100
                },
                order: 0
            },
            {
                name: 'items',
                type: 'json',
                label: 'Timeline Items',
                helpText: 'Array of events with year, title, description',
                required: true,
                order: 1
            },
            {
                name: 'layout',
                type: 'select',
                label: 'Layout Style',
                required: false,
                defaultValue: 'vertical',
                options: [
                    { label: 'Vertical', value: 'vertical' },
                    { label: 'Horizontal', value: 'horizontal' }
                ],
                order: 2
            }
        ],
        previewComponent: 'TimelineSection',
        thumbnailUrl: null
    },
    {
        name: 'Call to Action',
        slug: 'cta',
        description: 'Prominent call-to-action section with button',
        icon: '📢',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'heading',
                type: 'text',
                label: 'Heading',
                placeholder: 'Compelling headline',
                required: true,
                validation: {
                    minLength: 5,
                    maxLength: 100
                },
                order: 0
            },
            {
                name: 'description',
                type: 'textarea',
                label: 'Description',
                placeholder: 'Supporting text',
                required: false,
                validation: {
                    maxLength: 300
                },
                order: 1
            },
            {
                name: 'buttonText',
                type: 'text',
                label: 'Button Text',
                placeholder: 'e.g., Get Started',
                required: true,
                validation: {
                    maxLength: 30
                },
                order: 2
            },
            {
                name: 'buttonLink',
                type: 'url',
                label: 'Button Link',
                placeholder: '/contact or https://example.com',
                required: true,
                order: 3
            },
            {
                name: 'backgroundColor',
                type: 'color',
                label: 'Background Color',
                required: false,
                defaultValue: '#0066cc',
                order: 4
            },
            {
                name: 'textColor',
                type: 'color',
                label: 'Text Color',
                required: false,
                defaultValue: '#ffffff',
                order: 5
            }
        ],
        previewComponent: 'CTASection',
        thumbnailUrl: null
    },
    {
        name: 'Statistics',
        slug: 'statistics',
        description: 'Display key statistics or numbers in an eye-catching format',
        icon: '📊',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'heading',
                type: 'text',
                label: 'Section Heading',
                placeholder: 'Optional heading',
                required: false,
                order: 0
            },
            {
                name: 'stats',
                type: 'json',
                label: 'Statistics',
                helpText: 'Array of stats with number, label, description',
                required: true,
                order: 1
            },
            {
                name: 'columns',
                type: 'number',
                label: 'Number of Columns',
                required: false,
                defaultValue: 4,
                validation: {
                    min: 2,
                    max: 4
                },
                order: 2
            },
            {
                name: 'backgroundColor',
                type: 'color',
                label: 'Background Color',
                required: false,
                defaultValue: '#f8f9fa',
                order: 3
            }
        ],
        previewComponent: 'StatisticsSection',
        thumbnailUrl: null
    }
];

// Seed function
const seedSectionTypes = async () => {
    try {
        await connectDB();

        console.log('Starting section types seeding...\n');

        // Clear existing system section types
        const deleteResult = await SectionType.deleteMany({ isSystem: true });
        console.log(`Removed ${deleteResult.deletedCount} existing system section types\n`);

        // Insert default section types
        const insertedTypes = await SectionType.insertMany(defaultSectionTypes);
        console.log(`✓ Successfully seeded ${insertedTypes.length} section types:\n`);

        // Display seeded section types
        insertedTypes.forEach(type => {
            console.log(`  ${type.icon} ${type.name} (${type.slug})`);
            console.log(`     Category: ${type.category}`);
            console.log(`     Fields: ${type.fields.length}`);
            console.log('');
        });

        console.log('Section types seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding section types:', error);
        process.exit(1);
    }
};

// Run seeder if called directly
if (require.main === module) {
    seedSectionTypes();
}

module.exports = { seedSectionTypes, defaultSectionTypes };

