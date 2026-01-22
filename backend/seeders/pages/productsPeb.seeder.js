const path = require('path');

// Load environment variables FIRST, before requiring database config
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });
}

const mongoose = require('mongoose');
const Page = require('../../models/Page');
const Section = require('../../models/Section');
const User = require('../../models/User');
const connectDB = require('../../configs/database');

/**
 * Seed PEB product page with all sections from frontend/app/products/peb/page.tsx
 */
const seedProductsPeb = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }

        await connectDB();
        console.log('Starting PEB product page seeding...\n');

        let user = await User.findOne({ email: 'admin@acero.com' }) || 
                   await User.findOne({ role: 'admin' }) || 
                   await User.findOne();
        if (!user) throw new Error('No user found. Please create a user first.');

        console.log(`Using user: ${user.email} (${user._id})\n`);

        // Get or create Products parent page
        let productsPage = await Page.findOne({ slug: 'products' });
        if (!productsPage) {
            throw new Error('Products parent page not found. Please run products.seeder.js first.');
        }

        // Create or update PEB Page
        let pebPage = await Page.findOne({ slug: 'peb', parentId: productsPage._id });
        if (!pebPage) {
            pebPage = await Page.create({
                title: 'PEB',
                slug: 'peb',
                path: '/products/peb',
                parentId: productsPage._id,
                level: 1,
                order: 0,
                metaTitle: 'Pre-Engineered Buildings (PEB) | Acero Building Systems',
                metaDescription: 'Pre-engineered steel buildings (PEBs) consist of built-up structural components, including rafters and columns. Designed and manufactured in compliance with building and design codes.',
                metaKeywords: 'PEB,pre-engineered buildings,steel buildings,pre-engineered steel,structural steel',
                showInMenu: true,
                status: 'draft',
                isActive: true,
                createdBy: user._id,
            });
            console.log('✓ Created PEB page');
        } else {
            console.log('✓ PEB page already exists');
        }

        // Sections data
        const sectionsData = [
            {
                sectionTypeSlug: 'hero_image',
                order: 0,
                content: {
                    image: '/images/peb/hero.jpg',
                    title: 'PEB',
                },
            },
            {
                sectionTypeSlug: 'content_with_image',
                order: 1,
                content: {
                    title: 'PEB',
                    paragraphs: [
                        'The main concept behind PEBs is the integration of engineering and manufacturing processes. Specialized engineers design buildings that meet specific requirements, considering factors such as load-bearing capacity, wind, snow and seismic loads, and other local regulations. During the design phase the engineering team ensures that the building is structurally sound and optimized for its intended use.',
                        'Once the design is finalized, the manufacturing process begins. Steel components, including columns, rafters, purlins, girts, roof and wall panels, are fabricated in a controlled factory environment. The use of standardized components allows for precise manufacturing, ensuring consistency and accuracy throughout the building process.',
                    ],
                    layout: 'text-only',
                },
            },
            {
                sectionTypeSlug: 'image_modal_gallery',
                order: 2,
                content: {
                    title: 'PEB Types',
                    items: [
                        {
                            id: 'clear-span',
                            title: 'CLEAR SPAN',
                            description: 'CLEAR SPAN buildings have a gable roof with vertical sidewalls and end walls. Interior bay frames are clear span rigid frames (without interior columns).',
                            image: '/images/peb/types/clear-span.jpg',
                            imageAlt: 'Clear Span PEB',
                        },
                        {
                            id: 'lean-to',
                            title: 'LEAN-TO',
                            description: 'LEAN-TO buildings consist of outer sidewall columns supporting simple span rafters attached to the sidewall columns or the end-wall of the main building.',
                            image: '/images/peb/types/lean-to.jpg',
                            imageAlt: 'Lean-To PEB',
                        },
                        {
                            id: 'mono-slope',
                            title: 'MONO SLOPE',
                            description: 'MONO SLOPE is a building with a sloping roof in one plane. The slope extends from one wall to the opposite wall.',
                            image: '/images/peb/types/mono-slope.jpg',
                            imageAlt: 'Mono Slope PEB',
                        },
                        {
                            id: 'multigable',
                            title: 'MULTIGABLE',
                            description: 'MULTIGABLE buildings have a roof with 2 or more gables, vertical side-walls, and vertical end-walls. Interior bay frames are rigid frames.',
                            image: '/images/peb/types/multigable.jpg',
                            imageAlt: 'Multigable PEB',
                        },
                        {
                            id: 'multispan',
                            title: 'MULTISPAN',
                            description: 'MULTISPAN buildings have a gable roof with vertical side-walls and end-walls. Interior bay frames are rigid frames. The designation MS-1 implies one interior column, MS-2 implies two interior columns, and so on.',
                            image: '/images/peb/types/multispan.jpg',
                            imageAlt: 'Multispan PEB',
                        },
                        {
                            id: 'multispan-ms2',
                            title: 'MULTISPAN MS-2',
                            description: 'MULTISPAN MS-2 buildings have a gable roof with vertical side-walls and end-walls. Interior bay frames are rigid frames. The designation MS-2 implies two interior columns, and so on.',
                            image: '/images/peb/types/multispan-ms2.jpg',
                            imageAlt: 'Multispan MS-2 PEB',
                        },
                    ],
                    columns: 3,
                },
            },
            {
                sectionTypeSlug: 'content_with_image',
                order: 3,
                content: {
                    title: 'Why PEB?',
                    paragraphs: [
                        'One of the primary advantages of PEBs is their speed of production since the components are fabricated using standardized raw material which is readily available in the manufacturer\'s raw material yard. The materials are efficiently transported to the construction site and assembled easily and quickly. This significantly reduces construction time and in turn total project time compared to traditional methods, enabling projects to be completed in a fraction of the time.',
                        'PEBs offer exceptional versatility. The design can be customized to meet specific requirements, allowing for various building sizes, configurations and architectural styles. The flexible nature of steel as a building material enables wide-span designs, creating large, open interior spaces without the need for intrusive support columns.',
                        'Pre-engineered steel buildings are also renowned for their durability and strength ensuring a long lifespan with minimal maintenance. Additionally, steel buildings can withstand extreme weather conditions, including high winds, heavy snow loads and seismic activity, providing a safe and secure environment.',
                    ],
                    image: '/images/peb/why-peb.jpg',
                    imageAlt: 'Why PEB',
                    layout: 'image-right',
                },
            },
            {
                sectionTypeSlug: 'image_display',
                order: 4,
                content: {
                    title: 'PEB Model',
                    image: '/images/peb/peb-model.jpg',
                    imageAlt: 'Complete PEB Model',
                },
            },
            {
                sectionTypeSlug: 'application_cards',
                order: 5,
                content: {
                    title: 'Application of PEB',
                    subtitle: 'We are dedicated to providing versatile solutions, with applications extending to, but not limited to:',
                    applications: [
                        { id: '1', name: 'Aircraft Hangar', icon: 'Plane' },
                        { id: '2', name: 'Distribution Center', icon: 'Warehouse' },
                        { id: '3', name: 'Multi Story', icon: 'Building2' },
                        { id: '4', name: 'Refinery System', icon: 'Factory' },
                        { id: '5', name: 'Steel Platform', icon: 'Layers' },
                        { id: '6', name: 'Desalination Plant', icon: 'Droplets' },
                        { id: '7', name: 'Accommodation Camp', icon: 'Home' },
                        { id: '8', name: 'Modular House', icon: 'Building' },
                        { id: '9', name: 'Exhibition Hall', icon: 'Palette' },
                        { id: '10', name: 'Office Building', icon: 'Briefcase' },
                        { id: '11', name: 'Residential Building', icon: 'Home' },
                        { id: '12', name: 'Sugar Mill', icon: 'Wheat' },
                        { id: '13', name: 'Airport Structure', icon: 'PlaneTakeoff' },
                        { id: '14', name: 'Racking System', icon: 'Package' },
                        { id: '15', name: 'Factory Building', icon: 'Factory' },
                        { id: '16', name: 'Pipe Rack', icon: 'Layers' },
                        { id: '17', name: 'Shopping Center', icon: 'ShoppingBag' },
                        { id: '18', name: 'Supermarket', icon: 'Store' },
                        { id: '19', name: 'Bridge Structure', icon: 'Layers' },
                        { id: '20', name: 'Steel Mill', icon: 'Hammer' },
                        { id: '21', name: 'Field Hospital', icon: 'Cross' },
                        { id: '22', name: 'Power Plant', icon: 'Zap' },
                        { id: '23', name: 'Showroom', icon: 'Store' },
                        { id: '24', name: 'Warehouse', icon: 'Warehouse' },
                        { id: '25', name: 'Cold Storage', icon: 'Snowflake' },
                        { id: '26', name: 'Workshop', icon: 'Wrench' },
                        { id: '27', name: 'Flour Mill', icon: 'Wheat' },
                        { id: '28', name: 'Processing Mill', icon: 'Cog' },
                        { id: '29', name: 'Sports Center', icon: 'Trophy' },
                        { id: '30', name: 'Water Tower', icon: 'Droplet' },
                    ],
                },
            },
            {
                sectionTypeSlug: 'circular_advantages',
                order: 6,
                content: {
                    title: 'Advantages of PEB',
                    centerText: 'ACERO',
                    advantages: [
                        {
                            id: 'speed',
                            title: 'Speed of Construction',
                            description: 'One of the primary advantages of PEBs is their speed of production since the components are fabricated using standardized raw material which is readily available. The materials are efficiently transported to the construction site and assembled easily and quickly.',
                            icon: 'Zap',
                            position: 1,
                        },
                        {
                            id: 'cost',
                            title: 'Cost-Effectiveness',
                            description: 'PEBs offer exceptional cost-effectiveness through standardized processes, reduced construction time, and efficient material usage, resulting in lower overall project costs compared to traditional building methods.',
                            icon: 'DollarSign',
                            position: 2,
                        },
                        {
                            id: 'seismic',
                            title: 'Seismic Resistance',
                            description: 'Pre-engineered steel buildings are designed to withstand seismic activity and extreme weather conditions, providing superior structural integrity and safety in earthquake-prone regions.',
                            icon: 'Shield',
                            position: 3,
                        },
                        {
                            id: 'sustainability',
                            title: 'Sustainability',
                            description: 'Steel buildings offer eco-friendly features including recyclability, energy efficiency, and reduced waste during construction, making them an environmentally responsible choice.',
                            icon: 'Leaf',
                            position: 4,
                        },
                        {
                            id: 'quality',
                            title: 'Quality Control',
                            description: 'PEBs are produced in controlled factory environments with rigorous quality assurance processes, ensuring consistency, precision, and adherence to international building codes and standards.',
                            icon: 'CheckCircle',
                            position: 5,
                        },
                        {
                            id: 'efficiency',
                            title: 'Structural Efficiency and Durability',
                            description: 'Pre-engineered steel buildings are renowned for their durability and strength, ensuring a long lifespan with minimal maintenance. Steel\'s inherent properties provide exceptional structural efficiency.',
                            icon: 'Layers',
                            position: 6,
                        },
                        {
                            id: 'energy',
                            title: 'Energy Efficiency',
                            description: 'Meticulously designed steel structures optimize energy efficiency through environmentally friendly roofing and wall panels, skylights, wall lights for natural light, and superior insulation capabilities.',
                            icon: 'Lightbulb',
                            position: 7,
                        },
                        {
                            id: 'customization',
                            title: 'Customization',
                            description: 'PEBs offer exceptional versatility with designs that can be customized to meet specific requirements, allowing for various building sizes, configurations, and architectural styles to suit diverse needs.',
                            icon: 'Settings',
                            position: 8,
                        },
                        {
                            id: 'versatility',
                            title: 'Versatility',
                            description: 'The flexible nature of steel as a building material enables wide-span designs, creating large, open interior spaces without the need for intrusive support columns, making PEBs suitable for numerous applications.',
                            icon: 'Grid',
                            position: 9,
                        },
                    ],
                },
            },
        ];

        let sectionsCreated = 0;
        let sectionsUpdated = 0;

        for (const sectionData of sectionsData) {
            let section = await Section.findOne({
                pageId: pebPage._id,
                sectionTypeSlug: sectionData.sectionTypeSlug,
                order: sectionData.order,
            });

            if (!section) {
                section = await Section.create({
                    pageId: pebPage._id,
                    sectionTypeSlug: sectionData.sectionTypeSlug,
                    order: sectionData.order,
                    content: sectionData.content,
                    isVisible: true,
                    status: 'draft',
                    createdBy: user._id,
                });
                sectionsCreated++;
                console.log(`✓ Created section ${sectionData.order + 1}: ${sectionData.sectionTypeSlug}`);
            } else {
                section.content = sectionData.content;
                section.isVisible = true;
                await section.save();
                sectionsUpdated++;
                console.log(`✓ Updated section ${sectionData.order + 1}: ${sectionData.sectionTypeSlug}`);
            }
        }

        console.log('\n=== Seeding Summary ===');
        console.log(`Page: ${pebPage.title} (${pebPage.slug})`);
        console.log(`Sections created: ${sectionsCreated}`);
        console.log(`Sections updated: ${sectionsUpdated}`);
        console.log(`Total sections: ${sectionsData.length}\n`);

        console.log('✓ PEB product page seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('✗ Error seeding PEB product page:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    seedProductsPeb();
}

module.exports = seedProductsPeb;

