const path = require('path');

// Load environment variables FIRST, before requiring database config
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
// Fallback to .env.local if .env doesn't exist
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });
}

// Now require modules that depend on environment variables
const mongoose = require('mongoose');
const Page = require('../../models/Page');
const Section = require('../../models/Section');
const User = require('../../models/User');
const connectDB = require('../../configs/database');

/**
 * Seed Products main page with all sections from frontend/app/products/page.tsx
 */
const seedProducts = async () => {
    try {
        // Verify MONGODB_URI
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }

        await connectDB();

        console.log('Starting Products page seeding...\n');

        // Get or create a user for createdBy field
        let user = await User.findOne({ email: 'admin@acero.com' });
        if (!user) {
            // Try to get any admin user
            user = await User.findOne({ role: 'admin' });
            if (!user) {
                // Get any user
                user = await User.findOne();
                if (!user) {
                    throw new Error('No user found. Please create a user first.');
                }
            }
        }

        console.log(`Using user: ${user.email} (${user._id})\n`);

        // Step 1: Create or update Products Page
        let productsPage = await Page.findOne({ slug: 'products' });
        
        if (!productsPage) {
            productsPage = await Page.create({
                title: 'Products',
                slug: 'products',
                path: '/products',
                parentId: null,
                level: 0,
                order: 2,
                metaTitle: 'Our Premium Products | Acero Building Systems',
                metaDescription: 'Explore Acero\'s comprehensive range of steel building solutions including Pre-Engineered Buildings (PEB), Conventional Steel Buildings, Racking Systems, Porta Cabins, and Building Accessories.',
                metaKeywords: 'steel buildings,PEB,pre-engineered buildings,conventional steel,racking systems,porta cabins,steel products,Acero',
                showInMenu: true,
                status: 'draft',
                isActive: true,
                createdBy: user._id,
            });
            console.log('✓ Created Products page');
        } else {
            console.log('✓ Products page already exists');
        }

        // Step 2: Create Sections (in order)
        const sectionsData = [
            {
                // Section 1: Hero Image
                sectionTypeSlug: 'hero_image',
                order: 0,
                content: {
                    image: '/images/products/hero.jpg',
                    title: 'Our Premium Products',
                },
            },
            {
                // Section 2: PEB Product Card
                sectionTypeSlug: 'product_card',
                order: 1,
                content: {
                    title: 'PEB',
                    paragraphs: [
                        'Pre-engineered steel buildings (PEBs) consist of built-up structural components, including rafters and columns. These components are designed and manufactured in compliance with building and design codes to ensure the highest standards of quality and safety.',
                        'Acero specializes in Pre-Engineered Steel Buildings (fast-track and customized solutions), Conventional Steel Buildings, Roof and Wall Systems, Porta Cabins, Racking Systems and Building Accessories.',
                    ],
                    image: '/images/products/peb.jpg',
                    imageAlt: 'Pre-Engineered Buildings (PEB)',
                    layout: 'image-right',
                    cta: {
                        label: 'Learn More',
                        href: '/products/peb',
                    },
                },
            },
            {
                // Section 3: Conventional Steel Buildings Product Card
                sectionTypeSlug: 'product_card',
                order: 2,
                content: {
                    title: 'Conventional Steel Buildings',
                    paragraphs: [
                        'Conventional steel buildings are traditional metal structures constructed by hot rolled steel sections which are designed individually and fabricated.',
                    ],
                    image: '/images/products/conventional-steel.jpg',
                    imageAlt: 'Conventional Steel Buildings',
                    layout: 'image-left',
                    cta: {
                        label: 'Learn More',
                        href: '/products/conventional-steel',
                    },
                },
            },
            {
                // Section 4: Racking Systems Product Card
                sectionTypeSlug: 'product_card',
                order: 3,
                content: {
                    title: 'Racking Systems',
                    paragraphs: [
                        'A warehouse racking system is a storage solution designed to stack materials in horizontal rows with multiple levels. These systems can help manage and better utilize warehouse space while organizing materials to streamline operations.',
                    ],
                    image: '/images/products/racking-systems.jpg',
                    imageAlt: 'Racking Systems',
                    layout: 'image-right',
                    cta: {
                        label: 'Learn More',
                        href: '/products/racking-systems',
                    },
                },
            },
            {
                // Section 5: Porta Cabins Product Card
                sectionTypeSlug: 'product_card',
                order: 4,
                content: {
                    title: 'Porta Cabins',
                    paragraphs: [
                        'Acero manufactures and supplies Porta Cabins in all sizes, customized as per the requirements. Acero\'s Porta Cabins are carefully designed to be economical, strong, durable and easy to install.',
                    ],
                    image: '/images/products/porta-cabins.jpg',
                    imageAlt: 'Porta Cabins',
                    layout: 'image-left',
                    cta: {
                        label: 'Learn More',
                        href: '/products/porta-cabins',
                    },
                },
            },
            {
                // Section 6: Sustainable Steel Solutions
                sectionTypeSlug: 'content_with_image',
                order: 5,
                content: {
                    title: 'Sustainable Steel Solutions',
                    paragraphs: [
                        'As a leading player in the market, Acero understands the importance of providing environmentally sustainable building solutions. With this principle at our core, we offer a diverse range of steel building solutions aimed at curbing energy consumption and supporting green initiatives, delivering both ecological and economic benefits.',
                        'Steel buildings offer a host of eco-friendly features, such as unparalleled durability and recyclability. Furthermore, meticulously designed steel structures elevate projects by optimizing energy efficiency, integrating environmentally friendly roofing and wall panels, utilizing skylights & wall lights for natural light, and incorporating various steel-based structural elements.',
                    ],
                    image: '/images/products/sustainable-solutions.jpg',
                    imageAlt: 'Sustainable Steel Solutions',
                    layout: 'image-right',
                },
            },
        ];

        let sectionsCreated = 0;
        let sectionsUpdated = 0;
        let sectionsSkipped = 0;

        for (const sectionData of sectionsData) {
            // Check if section already exists
            let section = await Section.findOne({
                pageId: productsPage._id,
                sectionTypeSlug: sectionData.sectionTypeSlug,
                order: sectionData.order,
            });

            if (!section) {
                section = await Section.create({
                    pageId: productsPage._id,
                    sectionTypeSlug: sectionData.sectionTypeSlug,
                    order: sectionData.order,
                    content: sectionData.content,
                    isVisible: true,
                    status: 'draft',
                    createdBy: user._id,
                });
                sectionsCreated++;
                console.log(`✓ Created section ${sectionData.order + 1}: ${sectionData.sectionTypeSlug} - ${sectionData.content.title || 'N/A'}`);
            } else {
                // Update content if section exists
                section.content = sectionData.content;
                section.isVisible = true;
                await section.save();
                sectionsUpdated++;
                console.log(`✓ Updated section ${sectionData.order + 1}: ${sectionData.sectionTypeSlug} - ${sectionData.content.title || 'N/A'}`);
            }
        }

        console.log('\n=== Seeding Summary ===');
        console.log(`Page: ${productsPage.title} (${productsPage.slug})`);
        console.log(`Sections created: ${sectionsCreated}`);
        console.log(`Sections updated: ${sectionsUpdated}`);
        console.log(`Sections skipped: ${sectionsSkipped}`);
        console.log(`Total sections: ${sectionsData.length}\n`);

        console.log('✓ Products page seeding completed successfully!');
        console.log('\nNote: All sections are in draft status. Publish them via the admin panel when ready.');
        process.exit(0);
    } catch (error) {
        console.error('✗ Error seeding Products page:', error);
        process.exit(1);
    }
};

// Run seeder if called directly
if (require.main === module) {
    seedProducts();
}

module.exports = seedProducts;

