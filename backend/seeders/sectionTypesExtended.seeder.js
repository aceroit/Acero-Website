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

// Extended section types - Additional types needed for Acero frontend
const extendedSectionTypes = [
    {
        name: 'Hero Carousel',
        slug: 'hero_carousel',
        description: 'Full-screen hero carousel with multiple slides, auto-play functionality, and navigation controls. Perfect for homepage banners showcasing key company messages.',
        icon: '🎠',
        category: 'Headers',
        isSystem: true,
        fields: [
            {
                name: 'slides',
                type: 'json',
                label: 'Carousel Slides',
                helpText: 'Array of slide objects: [{"image": "url", "title": "Title", "description": "Description"}]',
                required: true,
                validation: {
                    minItems: 1
                },
                order: 0
            },
            {
                name: 'autoPlay',
                type: 'boolean',
                label: 'Auto Play',
                helpText: 'Automatically advance slides',
                required: false,
                defaultValue: true,
                order: 1
            },
            {
                name: 'interval',
                type: 'number',
                label: 'Auto Play Interval (ms)',
                helpText: 'Time in milliseconds between slide transitions',
                required: false,
                defaultValue: 5000,
                validation: {
                    min: 1000,
                    max: 30000
                },
                order: 2
            }
        ],
        previewComponent: 'HeroCarousel',
        thumbnailUrl: null
    },
    {
        name: 'Hero Image',
        slug: 'hero_image',
        description: 'Simple hero section with background image and centered title. Used for page headers.',
        icon: '🖼️',
        category: 'Headers',
        isSystem: true,
        fields: [
            {
                name: 'image',
                type: 'image',
                label: 'Background Image',
                helpText: 'Recommended: 1920x1080px',
                required: true,
                order: 0
            },
            {
                name: 'title',
                type: 'text',
                label: 'Title',
                placeholder: 'e.g., Page Title (optional)',
                required: false,
                validation: {
                    maxLength: 100
                },
                order: 1
            },
            {
                name: 'overlay',
                type: 'boolean',
                label: 'Show Dark Overlay',
                helpText: 'Add dark overlay for better text readability',
                required: false,
                defaultValue: true,
                order: 2
            }
        ],
        previewComponent: 'HeroImageSection',
        thumbnailUrl: null
    },
    {
        name: 'Content with Image',
        slug: 'content_with_image',
        description: 'Content section with optional image, paragraphs, and call-to-action button. Supports multiple layout options.',
        icon: '📄',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Section Title',
                placeholder: 'e.g., Complete Steel Building Solutions',
                required: true,
                validation: {
                    minLength: 1,
                    maxLength: 200
                },
                order: 0
            },
            {
                name: 'paragraphs',
                type: 'array',
                label: 'Content Paragraphs',
                helpText: 'Array of text paragraphs: ["Paragraph 1", "Paragraph 2"]',
                required: true,
                validation: {
                    minItems: 1
                },
                order: 1
            },
            {
                name: 'image',
                type: 'image',
                label: 'Image',
                helpText: 'Optional image to display alongside content. Recommended: 1200×800 px (3:2) so it fits the column and content height without overlap.',
                required: false,
                order: 2
            },
            {
                name: 'imageAlt',
                type: 'text',
                label: 'Image Alt Text',
                required: false,
                order: 3
            },
            {
                name: 'images',
                type: 'json',
                label: 'Additional Images',
                helpText: 'Optional array for multiple images: [{"url": "...", "imageAlt": "..."}]. When 2+ images exist, they appear in a vertical stack. Recommended per image: 1200×500 px for a perfect fit and no overlap.',
                required: false,
                order: 3.5
            },
            {
                name: 'layout',
                type: 'select',
                label: 'Layout',
                required: false,
                defaultValue: 'image-right',
                options: [
                    { label: 'Image Right', value: 'image-right' },
                    { label: 'Image Left', value: 'image-left' },
                    { label: 'Image Center', value: 'image-center' },
                    { label: 'Text Only', value: 'text-only' },
                    { label: 'Split', value: 'split' }
                ],
                order: 4
            },
            {
                name: 'imageFit',
                type: 'select',
                label: 'Image Fit',
                helpText: 'Contain: show full image (no cropping)—use for diagrams/infographics. Cover: fill the box (may crop)—use for photos.',
                required: false,
                defaultValue: 'contain',
                options: [
                    { label: 'Contain (show full image)', value: 'contain' },
                    { label: 'Cover (fill box, may crop)', value: 'cover' }
                ],
                order: 4.5
            },
            {
                name: 'cta',
                type: 'json',
                label: 'Call to Action',
                helpText: 'Optional CTA button: {"label": "Learn More", "href": "/products"}',
                required: false,
                order: 5
            },
            {
                name: 'variant',
                type: 'select',
                label: 'Variant Style',
                required: false,
                defaultValue: 'default',
                options: [
                    { label: 'Default', value: 'default' },
                    { label: 'Accent', value: 'accent' },
                    { label: 'Muted', value: 'muted' }
                ],
                order: 6
            }
        ],
        previewComponent: 'ContentSection',
        thumbnailUrl: null
    },
    {
        name: 'Infinite Carousel',
        slug: 'infinite_carousel',
        description: 'Infinite scrolling carousel for logos, certifications, or customer logos. Supports multiple speed and direction options.',
        icon: '♾️',
        category: 'Media',
        isSystem: true,
        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Section Title',
                placeholder: 'e.g., Our Quality Certifications, Our Customers',
                required: false,
                validation: {
                    maxLength: 200
                },
                order: 0
            },
            {
                name: 'items',
                type: 'json',
                label: 'Carousel Items',
                helpText: 'Array: [{"image": "url", "alt": "Alt text", "width": 200, "height": 100}]',
                required: true,
                validation: {
                    minItems: 1
                },
                order: 1
            },
            {
                name: 'speed',
                type: 'select',
                label: 'Scroll Speed',
                required: false,
                defaultValue: 'medium',
                options: [
                    { label: 'Slow', value: 'slow' },
                    { label: 'Medium', value: 'medium' },
                    { label: 'Fast', value: 'fast' }
                ],
                order: 2
            },
            {
                name: 'direction',
                type: 'select',
                label: 'Scroll Direction',
                required: false,
                defaultValue: 'left',
                options: [
                    { label: 'Left', value: 'left' },
                    { label: 'Right', value: 'right' }
                ],
                order: 3
            },
            {
                name: 'pauseOnHover',
                type: 'boolean',
                label: 'Pause on Hover',
                required: false,
                defaultValue: true,
                order: 4
            },
            {
                name: 'itemClassName',
                type: 'text',
                label: 'Item CSS Classes',
                helpText: 'CSS classes for carousel items (e.g., "h-20 w-32 md:h-24 md:w-40" for certifications, "h-16 w-32 md:h-20 md:w-40" for customers)',
                required: false,
                order: 5
            }
        ],
        previewComponent: 'InfiniteCarousel',
        thumbnailUrl: null
    },
    {
        name: 'Projects Grid',
        slug: 'projects_grid',
        description: 'Display projects in a grid layout with images, titles, descriptions, and links. Used for showcasing company projects.',
        icon: '🏗️',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Section Title',
                placeholder: 'e.g., Our Projects',
                required: true,
                validation: {
                    maxLength: 200
                },
                order: 0
            },
            {
                name: 'subtitle',
                type: 'textarea',
                label: 'Subtitle',
                placeholder: 'e.g., Showcasing our expertise through successful steel building projects',
                required: false,
                validation: {
                    maxLength: 300
                },
                order: 1
            },
            {
                name: 'projects',
                type: 'json',
                label: 'Projects',
                helpText: 'Array: [{"id": "1", "title": "Project Title", "description": "Description", "image": "url", "category": "PEB", "link": "/projects/1"}]',
                required: true,
                validation: {
                    minItems: 1
                },
                order: 2
            },
            {
                name: 'columns',
                type: 'select',
                label: 'Number of Columns',
                required: false,
                defaultValue: '3',
                options: [
                    { label: '3 Columns', value: '3' },
                    { label: '4 Columns', value: '4' }
                ],
                order: 3
            }
        ],
        previewComponent: 'ProjectsSection',
        thumbnailUrl: null
    },
    {
        name: 'Company Updates',
        slug: 'company_updates',
        description: 'Display company updates/news in a grid layout. Used on homepage to showcase latest company news.',
        icon: '📰',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Section Title',
                placeholder: 'e.g., Company Updates',
                required: true,
                validation: {
                    maxLength: 200
                },
                order: 0
            },
            {
                name: 'subtitle',
                type: 'textarea',
                label: 'Subtitle',
                placeholder: 'e.g., Stay updated with our latest news and announcements',
                required: false,
                validation: {
                    maxLength: 300
                },
                order: 1
            },
            {
                name: 'updates',
                type: 'json',
                label: 'Company Updates',
                helpText: 'Array: [{"id": "1", "title": "Update Title", "description": "Description", "image": "url", "date": "2024-01-15", "category": "News", "link": "/media/company-update/1"}]',
                required: true,
                validation: {
                    minItems: 1
                },
                order: 2
            },
            {
                name: 'columns',
                type: 'select',
                label: 'Number of Columns',
                required: false,
                defaultValue: '3',
                options: [
                    { label: '3 Columns', value: '3' },
                    { label: '4 Columns', value: '4' }
                ],
                order: 3
            }
        ],
        previewComponent: 'CompanyUpdatesSection',
        thumbnailUrl: null
    },
    {
        name: 'Product Card',
        slug: 'product_card',
        description: 'Product card section with image, title, paragraphs, and CTA button. Used for product pages.',
        icon: '📦',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Product Title',
                required: true,
                validation: {
                    minLength: 1,
                    maxLength: 200
                },
                order: 0
            },
            {
                name: 'paragraphs',
                type: 'array',
                label: 'Content Paragraphs',
                helpText: 'Array of text paragraphs',
                required: true,
                validation: {
                    minItems: 1
                },
                order: 1
            },
            {
                name: 'image',
                type: 'image',
                label: 'Product Image',
                required: true,
                order: 2
            },
            {
                name: 'imageAlt',
                type: 'text',
                label: 'Image Alt Text',
                required: true,
                order: 3
            },
            {
                name: 'cta',
                type: 'json',
                label: 'Call to Action',
                helpText: '{"label": "Learn More", "href": "/products/peb"}',
                required: true,
                order: 4
            },
            {
                name: 'layout',
                type: 'select',
                label: 'Layout',
                required: false,
                defaultValue: 'image-right',
                options: [
                    { label: 'Image Right', value: 'image-right' },
                    { label: 'Image Left', value: 'image-left' }
                ],
                order: 5
            }
        ],
        previewComponent: 'ProductCardSection',
        thumbnailUrl: null
    },
    {
        name: 'Products Grid',
        slug: 'products_grid',
        description: 'Products grid section with 4 horizontal cards matching projects card design. Displays PEB, Conventional Steel, Racking Systems, and Porta Cabins.',
        icon: '📦',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Section Title',
                placeholder: 'e.g., Our Products',
                required: false,
                validation: {
                    maxLength: 200
                },
                order: 0
            },
            {
                name: 'subtitle',
                type: 'textarea',
                label: 'Subtitle',
                required: false,
                validation: {
                    maxLength: 300
                },
                order: 1
            }
        ],
        previewComponent: 'ProductsGridSection',
        thumbnailUrl: null
    },
    {
        name: 'Image Modal Gallery',
        slug: 'image_modal_gallery',
        description: 'Image gallery with modal functionality for viewing larger images. Used for product types, project galleries, etc.',
        icon: '🖼️',
        category: 'Media',
        isSystem: true,
        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Gallery Title',
                required: false,
                validation: {
                    maxLength: 200
                },
                order: 0
            },
            {
                name: 'items',
                type: 'json',
                label: 'Gallery Items',
                helpText: 'Array: [{"id": "unique-id", "title": "Item Title", "description": "Description", "image": "url", "imageAlt": "Alt text"}]',
                required: true,
                validation: {
                    minItems: 1
                },
                order: 1
            },
            {
                name: 'columns',
                type: 'number',
                label: 'Number of Columns',
                required: false,
                defaultValue: 3,
                validation: {
                    min: 2,
                    max: 6
                },
                order: 2
            }
        ],
        previewComponent: 'ImageModalGallery',
        thumbnailUrl: null
    },
    {
        name: 'Image Display',
        slug: 'image_display',
        description: 'Single image display section. Used for showcasing a single product image or diagram.',
        icon: '🖼️',
        category: 'Media',
        isSystem: true,
        fields: [
            {
                name: 'image',
                type: 'image',
                label: 'Image',
                required: true,
                order: 0
            },
            {
                name: 'imageAlt',
                type: 'text',
                label: 'Image Alt Text',
                required: true,
                order: 1
            },
            {
                name: 'title',
                type: 'text',
                label: 'Title',
                required: false,
                validation: {
                    maxLength: 200
                },
                order: 2
            },
            {
                name: 'caption',
                type: 'textarea',
                label: 'Caption',
                required: false,
                validation: {
                    maxLength: 500
                },
                order: 3
            }
        ],
        previewComponent: 'ImageDisplay',
        thumbnailUrl: null
    },
    {
        name: 'Application Cards',
        slug: 'application_cards',
        description: 'Grid of application icons with titles and descriptions. Used for showcasing product applications.',
        icon: '🎯',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Section Title',
                required: false,
                validation: {
                    maxLength: 200
                },
                order: 0
            },
            {
                name: 'subtitle',
                type: 'textarea',
                label: 'Subtitle',
                required: true,
                validation: {
                    maxLength: 500
                },
                order: 1
            },
            {
                name: 'applications',
                type: 'json',
                label: 'Applications',
                helpText: 'Array: [{"id": "unique-id", "name": "Application Name", "icon": "icon-name", "description": "optional text", "redirectUrl": "optional /route"}]',
                required: true,
                validation: {
                    minItems: 1
                },
                order: 2
            },
            {
                name: 'columns',
                type: 'number',
                label: 'Number of Columns',
                required: false,
                defaultValue: 4,
                validation: {
                    min: 2,
                    max: 6
                },
                order: 3
            },
            {
                name: 'clickBehavior',
                type: 'select',
                label: 'Click Behavior',
                helpText: 'What happens when an application card is clicked',
                required: false,
                defaultValue: 'both',
                options: ['both', 'modal', 'redirect'],
                order: 4
            }
        ],
        previewComponent: 'ApplicationCards',
        thumbnailUrl: null
    },
    {
        name: 'Circular Advantages',
        slug: 'circular_advantages',
        description: 'Circular/round advantages display with icons and text. Used for showcasing product benefits.',
        icon: '⭕',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Section Title',
                required: true,
                validation: {
                    maxLength: 200
                },
                order: 0
            },
            {
                name: 'centerText',
                type: 'text',
                label: 'Center Text',
                required: false,
                defaultValue: 'ACERO',
                validation: {
                    maxLength: 50
                },
                order: 1
            },
            {
                name: 'advantages',
                type: 'json',
                label: 'Advantages',
                helpText: 'Array: [{"id": "unique-id", "title": "Advantage Title", "description": "Description", "icon": "icon-name", "position": 1-9}]',
                required: true,
                validation: {
                    minItems: 1
                },
                order: 2
            }
        ],
        previewComponent: 'CircularAdvantages',
        thumbnailUrl: null
    },
    {
        name: 'PEB Advantages Graphic',
        slug: 'peb_advantage_svg',
        description: 'Displays only the PEB advantages SVG graphic with no section wrapper. Used on PEB page for the advantages diagram.',
        icon: '📐',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'svgUrl',
                type: 'text',
                label: 'SVG URL (optional)',
                helpText: 'Override the default /svgs/peb-advantage.svg. Leave blank to use default.',
                required: false,
                order: 0
            }
        ],
        previewComponent: 'PebAdvantageSvg',
        thumbnailUrl: null
    },
    {
        name: 'Premium Video',
        slug: 'premium_video',
        description: 'Premium video section with YouTube embed, autoplay, and muted options. Used for company videos.',
        icon: '🎬',
        category: 'Media',
        isSystem: true,
        fields: [
            {
                name: 'videoId',
                type: 'text',
                label: 'YouTube Video ID',
                placeholder: 'e.g., dQw4w9WgXcQ',
                helpText: 'YouTube video ID (from URL: youtube.com/watch?v=VIDEO_ID)',
                required: true,
                order: 0
            },
            {
                name: 'title',
                type: 'text',
                label: 'Video Title',
                required: false,
                validation: {
                    maxLength: 200
                },
                order: 1
            },
            {
                name: 'autoplay',
                type: 'boolean',
                label: 'Autoplay',
                required: false,
                defaultValue: true,
                order: 2
            },
            {
                name: 'muted',
                type: 'boolean',
                label: 'Muted',
                required: false,
                defaultValue: true,
                order: 3
            },
            {
                name: 'loop',
                type: 'boolean',
                label: 'Loop',
                required: false,
                defaultValue: true,
                order: 4
            }
        ],
        previewComponent: 'PremiumVideoSection',
        thumbnailUrl: null
    },
    {
        name: 'Image Gallery',
        slug: 'image_gallery',
        description: 'Image gallery section with title, paragraph, and grid of images. Used for showcasing photos, engineering work, etc.',
        icon: '🖼️',
        category: 'Media',
        isSystem: true,
        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Gallery Title',
                placeholder: 'e.g., Engineering Excellence',
                required: true,
                validation: {
                    maxLength: 200
                },
                order: 0
            },
            {
                name: 'paragraph',
                type: 'textarea',
                label: 'Description Paragraph',
                placeholder: 'e.g., Description text about the gallery',
                required: false,
                validation: {
                    maxLength: 1000
                },
                order: 1
            },
            {
                name: 'images',
                type: 'json',
                label: 'Gallery Images',
                helpText: 'Array: [{"src": "url", "alt": "Alt text", "name": "Optional label", "link": "Optional URL (makes image clickable)"}]',
                required: true,
                validation: {
                    minItems: 1
                },
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
                    max: 6
                },
                order: 3
            },
            {
                name: 'imageOrientation',
                type: 'select',
                label: 'Display Orientation',
                helpText: 'Horizontal = more columns (e.g. 3 cols, 2 rows). Vertical = fewer columns (e.g. 2 cols).',
                required: false,
                defaultValue: 'horizontal',
                options: [
                    { label: 'Horizontal (2 rows × 3 columns)', value: 'horizontal' },
                    { label: 'Vertical (3 rows × 2 columns)', value: 'vertical' }
                ],
                order: 4
            }
        ],
        previewComponent: 'ImageGallerySection',
        thumbnailUrl: null
    },
    {
        name: 'Features Grid',
        slug: 'features_grid',
        description: 'Grid of feature cards with icons, titles, and descriptions. Used for showcasing company features, benefits, etc.',
        icon: '⭐',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Section Title',
                placeholder: 'e.g., Why Acero?',
                required: true,
                validation: {
                    maxLength: 200
                },
                order: 0
            },
            {
                name: 'features',
                type: 'json',
                label: 'Features',
                helpText: 'Array: [{"icon": "Globe", "title": "Feature Title", "description": "Feature description"}]',
                required: true,
                validation: {
                    minItems: 1
                },
                order: 1
            },
            {
                name: 'columns',
                type: 'number',
                label: 'Number of Columns',
                required: false,
                defaultValue: 3,
                validation: {
                    min: 3,
                    max: 4
                },
                order: 2
            }
        ],
        previewComponent: 'FeaturesSection',
        thumbnailUrl: null
    },
    {
        name: 'Brochure Cards',
        slug: 'brochure_cards',
        description: 'Grid of brochure cards with images and titles. Used for literature/media pages.',
        icon: '📚',
        category: 'Media',
        isSystem: true,
        fields: [
            {
                name: 'brochures',
                type: 'json',
                label: 'Brochures',
                helpText: 'Array of brochure objects from backend API or static data',
                required: true,
                validation: {
                    minItems: 0
                },
                order: 0
            }
        ],
        previewComponent: 'BrochureCardsSection',
        thumbnailUrl: null
    },
    {
        name: 'Video Cards',
        slug: 'video_cards',
        description: 'Grid of video cards with thumbnails and titles. Used for video/media pages.',
        icon: '🎥',
        category: 'Media',
        isSystem: true,
        fields: [
            {
                name: 'videos',
                type: 'json',
                label: 'Videos',
                helpText: 'Array of video objects from backend API or static data',
                required: true,
                validation: {
                    minItems: 0
                },
                order: 0
            }
        ],
        previewComponent: 'VideoCardsSection',
        thumbnailUrl: null
    },
    {
        name: 'Company Updates List',
        slug: 'company_updates_list',
        description: 'List view of company updates with featured update and list of all updates. Used for company update page.',
        icon: '📋',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'featuredUpdate',
                type: 'json',
                label: 'Featured Update',
                helpText: 'Featured company update object',
                required: false,
                order: 0
            },
            {
                name: 'updates',
                type: 'json',
                label: 'All Updates',
                helpText: 'Array of company update objects',
                required: true,
                validation: {
                    minItems: 0
                },
                order: 1
            }
        ],
        previewComponent: 'CompanyUpdateLayout',
        thumbnailUrl: null
    },
    {
        name: 'LinkedIn Posts',
        slug: 'linkedin_posts',
        description: 'Section displaying LinkedIn posts in a grid or list. Used for company update page.',
        icon: '💼',
        category: 'Media',
        isSystem: true,
        fields: [
            {
                name: 'posts',
                type: 'json',
                label: 'LinkedIn Posts',
                helpText: 'Array: [{"_id": "1", "companyName": "Acero", "date": "January 2026", "text": "Post text", "imageUrl": "url", "hashtags": ["#tag"], "likes": 42, "comments": 1, "isVideo": false, "publishedAt": "2026-01-15"}]',
                required: true,
                validation: {
                    minItems: 0
                },
                order: 0
            }
        ],
        previewComponent: 'LinkedInPosts',
        thumbnailUrl: null
    },
    {
        name: 'Career Application Form',
        slug: 'career_application_form',
        description: 'Career/job application form with file upload for CV. Used for career page.',
        icon: '📝',
        category: 'Forms',
        isSystem: true,
        fields: [
            {
                name: 'formConfig',
                type: 'json',
                label: 'Form Configuration',
                helpText: 'Form configuration object - form fields are handled by component',
                required: false,
                order: 0
            }
        ],
        previewComponent: 'CareerApplicationForm',
        thumbnailUrl: null
    },
    {
        name: 'Head Office Section',
        slug: 'head_office_section',
        description: 'Display head office information with address, contact details, and map. Used for contact page.',
        icon: '🏢',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'officeData',
                type: 'json',
                label: 'Head Office Data',
                helpText: 'Head office information object from backend API',
                required: true,
                order: 0
            }
        ],
        previewComponent: 'HeadOfficeSection',
        thumbnailUrl: null
    },
    {
        name: 'Branch Selector',
        slug: 'branch_selector',
        description: 'Accordion-style branch selector showing all company branches. Used for contact page.',
        icon: '📍',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'branches',
                type: 'json',
                label: 'Branches',
                helpText: 'Array of branch objects from backend API',
                required: true,
                validation: {
                    minItems: 0
                },
                order: 0
            }
        ],
        previewComponent: 'BranchSelector',
        thumbnailUrl: null
    },
    {
        name: 'Contact Form',
        slug: 'contact_form',
        description: 'Contact form with purpose, name, email, phone, subject, and message fields. Used for contact page.',
        icon: '✉️',
        category: 'Forms',
        isSystem: true,
        fields: [
            {
                name: 'formConfig',
                type: 'json',
                label: 'Form Configuration',
                helpText: 'Form configuration object - form fields are handled by component',
                required: false,
                order: 0
            }
        ],
        previewComponent: 'ContactForm',
        thumbnailUrl: null
    },
    {
        name: 'Full Width Map',
        slug: 'full_width_map',
        description: 'Full-width Google Maps embed. Used for contact page to show location.',
        icon: '🗺️',
        category: 'Media',
        isSystem: true,
        fields: [
            {
                name: 'mapConfig',
                type: 'json',
                label: 'Map Configuration',
                helpText: 'Map configuration: {"embedUrl": "Google Maps embed URL", "height": 600}',
                required: true,
                order: 0
            }
        ],
        previewComponent: 'FullWidthMap',
        thumbnailUrl: null
    },
    {
        name: 'Thank You Content',
        slug: 'thank_you_content',
        description: 'Thank you page content with message and optional CTA. Used for thank you page after form submission.',
        icon: '✅',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Title',
                placeholder: 'e.g., Thank You!',
                required: true,
                validation: {
                    maxLength: 200
                },
                order: 0
            },
            {
                name: 'message',
                type: 'textarea',
                label: 'Message',
                placeholder: 'e.g., We have received your message and will get back to you soon.',
                required: true,
                validation: {
                    maxLength: 500
                },
                order: 1
            },
            {
                name: 'cta',
                type: 'json',
                label: 'Call to Action',
                helpText: 'Optional CTA: {"label": "Back to Home", "href": "/"}',
                required: false,
                order: 2
            }
        ],
        previewComponent: 'ThankYouContent',
        thumbnailUrl: null
    },
    {
        name: 'Projects Grid with Filters',
        slug: 'projects_grid_with_filters',
        description: 'Projects grid with filtering capabilities by industry, building type, country, region, area. Used for projects page.',
        icon: '🔍',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Section Title',
                placeholder: 'e.g., Our Projects',
                required: false,
                validation: {
                    maxLength: 200
                },
                order: 0
            },
            {
                name: 'subtitle',
                type: 'textarea',
                label: 'Subtitle',
                required: false,
                validation: {
                    maxLength: 300
                },
                order: 1
            },
            {
                name: 'filterConfig',
                type: 'json',
                label: 'Filter Configuration',
                helpText: 'Filter options configuration - filters are handled dynamically from backend',
                required: false,
                order: 2
            }
        ],
        previewComponent: 'ProjectsGridWithFilters',
        thumbnailUrl: null
    },
    {
        name: 'Tabbed Comparison',
        slug: 'tabbed_comparison',
        description: 'Tabbed comparison section with multiple comparison tables. Used for PEB comparison page to compare different building systems.',
        icon: '📊',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Section Title',
                placeholder: 'e.g., PEB Comparison',
                required: true,
                validation: {
                    maxLength: 200
                },
                order: 0
            },
            {
                name: 'subtitle',
                type: 'textarea',
                label: 'Subtitle',
                placeholder: 'e.g., To learn more about PEB Comparison, click to see comparison',
                required: true,
                validation: {
                    maxLength: 300
                },
                order: 1
            },
            {
                name: 'tabs',
                type: 'json',
                label: 'Comparison Tabs',
                helpText: 'Array: [{"id": "general", "label": "General Criteria", "legend": [{"value": "good", "color": "bg-green-500", "label": "Good"}], "data": [{"criteria": "Design dimension", "preEngineered": {"value": "good", "label": "Good"}, "conventionalSteel": {"value": "average", "label": "Average"}, "reinforcedConcrete": {"value": "average", "label": "Average"}}]}]',
                required: true,
                validation: {
                    minItems: 1
                },
                order: 2
            }
        ],
        previewComponent: 'TabbedComparisonSection',
        thumbnailUrl: null
    },
    {
        name: 'Flip Card',
        slug: 'flip_card',
        description: 'Interactive flip cards that reveal content on hover. Used for showcasing product types, racking systems, porta cabins, etc.',
        icon: '🔄',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Section Title',
                required: false,
                validation: {
                    maxLength: 200
                },
                order: 0
            },
            {
                name: 'cards',
                type: 'json',
                label: 'Flip Cards',
                helpText: 'Array: [{"id": "1", "title": "Card Title", "description": "Card description", "image": "url", "imageAlt": "Alt text"}]',
                required: true,
                validation: {
                    minItems: 1
                },
                order: 1
            },
            {
                name: 'columns',
                type: 'select',
                label: 'Number of Columns',
                required: false,
                defaultValue: '2',
                options: [
                    { label: '2 Columns', value: '2' },
                    { label: '3 Columns', value: '3' },
                    { label: '4 Columns', value: '4' }
                ],
                order: 2
            }
        ],
        previewComponent: 'FlipCardSection',
        thumbnailUrl: null
    },
    {
        name: 'Comparison Table',
        slug: 'comparison_table',
        description: 'Simple comparison table showing factors vs different systems. Used for comparing racking systems, products, etc.',
        icon: '📋',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Table Title',
                placeholder: 'e.g., Factors to consider while selecting the right racking system',
                required: true,
                validation: {
                    maxLength: 200
                },
                order: 0
            },
            {
                name: 'factors',
                type: 'array',
                label: 'Comparison Factors',
                helpText: 'Array of factor names: ["Budget", "Floor Utilization", "Versatility"]',
                required: true,
                validation: {
                    minItems: 1
                },
                order: 1
            },
            {
                name: 'systems',
                type: 'json',
                label: 'Systems to Compare',
                helpText: 'Array: [{"name": "Drive-in System", "values": ["Medium", "60 - 70%", "Single Row"]}]',
                required: true,
                validation: {
                    minItems: 1
                },
                order: 2
            }
        ],
        previewComponent: 'ComparisonTableSection',
        thumbnailUrl: null
    },
    {
        name: 'Hover Card',
        slug: 'hover_card',
        description: 'Cards with hover effect revealing description overlay. Used for accessories, product features, etc.',
        icon: '🃏',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Section Title',
                required: false,
                validation: {
                    maxLength: 200
                },
                order: 0
            },
            {
                name: 'subtitle',
                type: 'textarea',
                label: 'Subtitle',
                required: false,
                validation: {
                    maxLength: 300
                },
                order: 1
            },
            {
                name: 'cards',
                type: 'json',
                label: 'Hover Cards',
                helpText: 'Array: [{"id": "1", "title": "Card Title", "description": "Card description", "image": "url", "imageAlt": "Alt text"}]',
                required: true,
                validation: {
                    minItems: 1
                },
                order: 2
            },
            {
                name: 'columns',
                type: 'select',
                label: 'Number of Columns',
                required: false,
                defaultValue: '3',
                options: [
                    { label: '3 Columns', value: '3' },
                    { label: '4 Columns', value: '4' }
                ],
                order: 3
            }
        ],
        previewComponent: 'HoverCardSection',
        thumbnailUrl: null
    },
    {
        name: 'Advantages Grid',
        slug: 'advantages_grid',
        description: 'Grid of advantages with icons and titles. Used for showcasing product benefits, porta cabin advantages, etc.',
        icon: '✨',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Section Title',
                required: false,
                validation: {
                    maxLength: 200
                },
                order: 0
            },
            {
                name: 'advantages',
                type: 'json',
                label: 'Advantages',
                helpText: 'Array: [{"id": "1", "title": "Advantage Title", "icon": "icon-name"}] - Note: Icons are handled by frontend component',
                required: true,
                validation: {
                    minItems: 1
                },
                order: 1
            },
            {
                name: 'columns',
                type: 'select',
                label: 'Number of Columns',
                required: false,
                defaultValue: '4',
                options: [
                    { label: '2 Columns', value: '2' },
                    { label: '3 Columns', value: '3' },
                    { label: '4 Columns', value: '4' }
                ],
                order: 2
            }
        ],
        previewComponent: 'AdvantagesGridSection',
        thumbnailUrl: null
    },
    {
        name: 'Certificates Grid',
        slug: 'certificates_grid',
        description: 'Grid display of certificates with images and names. Includes title and paragraphs. Used for manufacturing/quality pages.',
        icon: '🏆',
        category: 'Content',
        isSystem: true,
        fields: [
            {
                name: 'title',
                type: 'text',
                label: 'Section Title',
                placeholder: 'e.g., Quality Policy',
                required: true,
                validation: {
                    maxLength: 200
                },
                order: 0
            },
            {
                name: 'paragraphs',
                type: 'array',
                label: 'Content Paragraphs',
                helpText: 'Array of text paragraphs: ["Paragraph 1", "Paragraph 2"]',
                required: true,
                validation: {
                    minItems: 1
                },
                order: 1
            },
            {
                name: 'certificates',
                type: 'json',
                label: 'Certificates',
                helpText: 'Array: [{"name": "ISO 9001", "image": "url", "imageAlt": "ISO 9001 Certificate"}]',
                required: true,
                validation: {
                    minItems: 1
                },
                order: 2
            }
        ],
        previewComponent: 'CertificatesGridSection',
        thumbnailUrl: null
    }
];

// Seed function
const seedExtendedSectionTypes = async () => {
    try {
        // Verify MONGODB_URI is defined
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables. Please create a .env file in the backend directory with MONGODB_URI=your_connection_string');
        }

        await connectDB();

        console.log('Starting extended section types seeding...\n');

        // Check for existing section types with same slugs
        const existingSlugs = await SectionType.find({ 
            slug: { $in: extendedSectionTypes.map(st => st.slug) } 
        }).select('slug name');

        let updatedCount = 0;
        let insertedCount = 0;

        // Update or insert each section type
        for (const sectionTypeData of extendedSectionTypes) {
            const existing = await SectionType.findOne({ slug: sectionTypeData.slug });
            
            if (existing) {
                // Update existing section type
                await SectionType.findOneAndUpdate(
                    { slug: sectionTypeData.slug },
                    { 
                        $set: {
                            name: sectionTypeData.name,
                            description: sectionTypeData.description,
                            icon: sectionTypeData.icon,
                            category: sectionTypeData.category,
                            fields: sectionTypeData.fields,
                            previewComponent: sectionTypeData.previewComponent,
                            thumbnailUrl: sectionTypeData.thumbnailUrl,
                            isSystem: sectionTypeData.isSystem
                        }
                    },
                    { new: true }
                );
                updatedCount++;
                console.log(`✓ Updated: ${sectionTypeData.icon} ${sectionTypeData.name} (${sectionTypeData.slug})`);
            } else {
                // Insert new section type
                await SectionType.create(sectionTypeData);
                insertedCount++;
                console.log(`✓ Created: ${sectionTypeData.icon} ${sectionTypeData.name} (${sectionTypeData.slug})`);
            }
        }

        console.log(`\n✓ Successfully processed ${extendedSectionTypes.length} extended section types:`);
        console.log(`  - Updated: ${updatedCount}`);
        console.log(`  - Created: ${insertedCount}\n`);

        console.log('Extended section types seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding extended section types:', error);
        process.exit(1);
    }
};

// Run seeder if called directly
if (require.main === module) {
    seedExtendedSectionTypes();
}

module.exports = { seedExtendedSectionTypes, extendedSectionTypes };

