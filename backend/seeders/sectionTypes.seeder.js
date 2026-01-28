const path = require('path');

// Load environment variables FIRST, before requiring database config
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
// Fallback to .env.local if .env doesn't exist
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}

// Now require modules that depend on environment variables
const mongoose = require('mongoose');
const SectionType = require('../models/SectionType');
const connectDB = require('../configs/database');
// Default section types - Real-world examples for Acero Steel
const defaultSectionTypes = [
    {
        name: 'Hero Section',
        slug: 'hero',
        description: 'Large header section with background image, title, subtitle and call-to-action button. Perfect for homepage banners showcasing manufacturing facilities or steel products.',
        icon: '🎯',
        category: 'Headers',
        isSystem: true,
        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Main Heading',
                placeholder: 'e.g., Leading Steel Manufacturer Since 1950',
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
                label: 'Subtitle / Description',
                placeholder: 'e.g., Quality steel products for construction, automotive, and industrial applications worldwide',
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
                helpText: 'Recommended: 1920x1080px. Use high-quality images of manufacturing facilities, steel products, or industrial settings',
                required: true,
                order: 2
            },
            {
                name: 'ctaButtonText',
                type: 'text',
                label: 'CTA Button Text',
                placeholder: 'e.g., Request Quote, View Products, Contact Us',
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
                placeholder: '/products, /contact, /request-quote',
                required: false,
                order: 4
            },
            {
                name: 'height',
                type: 'select',
                label: 'Section Height',
                required: false,
                defaultValue: 'large',
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
        description: 'Rich text content section with optional heading. Use for company information, product descriptions, service details, or any formatted text content.',
        icon: '📝',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'heading',
                type: 'text',
                label: 'Section Heading',
                placeholder: 'e.g., About Acero Steel, Our Manufacturing Process, Quality Standards',
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
                placeholder: 'Enter your content here... Use rich text editor for formatting, lists, links, etc.',
                helpText: 'Supports rich text formatting, bold, italic, lists, links, and more',
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
                helpText: 'Optional background color for the section',
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
        description: 'Display multiple images in various layouts. Perfect for showcasing manufacturing facilities, product photos, project portfolios, or facility tours.',
        icon: '🖼️',
        category: 'Media',
        isSystem: true,
        fields: [
            {
                name: 'heading',
                type: 'text',
                label: 'Gallery Heading',
                placeholder: 'e.g., Our Manufacturing Facilities, Product Showcase, Project Gallery',
                required: false,
                order: 0
            },
            {
                name: 'images',
                type: 'json',
                label: 'Images',
                helpText: 'Array of image objects: [{"url": "image.jpg", "alt": "Description", "caption": "Optional caption"}]',
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
                    { label: 'Grid (Uniform)', value: 'grid' },
                    { label: 'Masonry (Pinterest-style)', value: 'masonry' },
                    { label: 'Slider/Carousel', value: 'slider' }
                ],
                order: 2
            },
            {
                name: 'columns',
                type: 'number',
                label: 'Number of Columns',
                helpText: 'For grid and masonry layouts (1-6 columns)',
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
        description: 'Display company capabilities, services, or key benefits in a grid layout with icons. Ideal for showcasing what makes Acero Steel unique.',
        icon: '⚡',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'heading',
                type: 'text',
                label: 'Section Heading',
                placeholder: 'e.g., Why Choose Acero Steel, Our Capabilities, Key Benefits',
                required: false,
                validation: {
                    maxLength: 100
                },
                order: 0
            },
            {
                name: 'subheading',
                type: 'textarea',
                label: 'Subheading / Description',
                placeholder: 'e.g., We deliver exceptional quality and service in every project',
                required: false,
                validation: {
                    maxLength: 200
                },
                order: 1
            },
            {
                name: 'features',
                type: 'json',
                label: 'Features / Services',
                helpText: 'Array: [{"title": "Quality Materials", "description": "Premium grade steel", "icon": "check-circle"}]',
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
        description: 'Embed video from YouTube, Vimeo, or direct link. Perfect for factory tours, product demonstrations, company overviews, or customer testimonials.',
        icon: '🎥',
        category: 'Media',
        isSystem: true,
        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Video Title',
                placeholder: 'e.g., Virtual Factory Tour, Product Manufacturing Process, Company Overview',
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
                placeholder: 'https://www.youtube.com/watch?v=... or https://vimeo.com/...',
                helpText: 'Supports YouTube, Vimeo, and direct video file URLs',
                required: true,
                order: 1
            },
            {
                name: 'description',
                type: 'textarea',
                label: 'Video Description',
                placeholder: 'Brief description of what the video shows or explains',
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
                helpText: 'Video will play automatically when page loads (muted for browser compatibility)',
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
        description: 'Display company milestones, history, or project timeline in a chronological format. Great for showcasing company evolution and achievements.',
        icon: '📅',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'heading',
                type: 'text',
                label: 'Timeline Heading',
                placeholder: 'e.g., Our Journey, Company History, Project Timeline',
                required: false,
                validation: {
                    maxLength: 100
                },
                order: 0
            },
            {
                name: 'items',
                type: 'json',
                label: 'Timeline Events',
                helpText: 'Array: [{"year": "1950", "title": "Company Founded", "description": "Acero Steel established in Pittsburgh"}]',
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
                    { label: 'Vertical (Recommended)', value: 'vertical' },
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
        description: 'Prominent call-to-action section with button. Use for lead generation, quote requests, contact forms, or directing visitors to key pages.',
        icon: '📢',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'heading',
                type: 'text',
                label: 'Heading',
                placeholder: 'e.g., Ready to Start Your Project?, Get a Free Quote Today, Contact Our Experts',
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
                placeholder: 'e.g., Let our team help you find the perfect steel solution for your needs',
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
                placeholder: 'e.g., Request Quote, Contact Us, Get Started, View Products',
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
                placeholder: '/contact, /request-quote, /products',
                required: true,
                order: 3
            },
            {
                name: 'backgroundColor',
                type: 'color',
                label: 'Background Color',
                required: false,
                defaultValue: '#1e3a5f',
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
        description: 'Display key company statistics, achievements, or metrics in an eye-catching format. Perfect for showcasing production numbers, years in business, or company achievements.',
        icon: '📊',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'heading',
                type: 'text',
                label: 'Section Heading',
                placeholder: 'e.g., By The Numbers, Our Achievements, Company Statistics',
                required: false,
                order: 0
            },
            {
                name: 'stats',
                type: 'json',
                label: 'Statistics',
                helpText: 'Array: [{"value": "75+", "label": "Years Experience", "sublabel": "Serving industry since 1950"}, {"value": "500+", "label": "Projects Completed", "sublabel": "Successfully delivered worldwide"}]',
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
        // Verify MONGODB_URI is defined
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables. Please create a .env file in the backend directory with MONGODB_URI=your_connection_string');
        }

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

