const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });
}

const mongoose = require('mongoose');
const Page = require('../../models/Page');
const Section = require('../../models/Section');
const User = require('../../models/User');
const connectDB = require('../../configs/database');

const seedProductsRackingSystems = async () => {
    try {
        if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not defined');
        await connectDB();
        console.log('Starting Racking Systems product page seeding...\n');

        let user = await User.findOne({ email: 'admin@acero.com' }) || 
                   await User.findOne({ role: 'admin' }) || 
                   await User.findOne();
        if (!user) throw new Error('No user found.');

        let productsPage = await Page.findOne({ slug: 'products' });
        if (!productsPage) throw new Error('Products parent page not found.');

        let page = await Page.findOne({ slug: 'racking-systems', parentId: productsPage._id });
        if (!page) {
            page = await Page.create({
                title: 'Racking Systems',
                slug: 'racking-systems',
                path: '/products/racking-systems',
                parentId: productsPage._id,
                level: 1,
                order: 2,
                metaTitle: 'Racking Systems | Acero Building Systems',
                metaDescription: 'A warehouse racking system is a highly efficient storage solution designed to organize materials in horizontal rows across multiple levels.',
                metaKeywords: 'racking systems,warehouse storage,pallet racking,cantilever racking',
                showInMenu: true,
                status: 'draft',
                isActive: true,
                createdBy: user._id,
            });
            console.log('✓ Created Racking Systems page');
        }

        const sectionsData = [
            {
                sectionTypeSlug: 'hero_image',
                order: 0,
                content: { image: '/images/racking-systems/hero.jpg', title: 'Racking Systems' },
            },
            {
                sectionTypeSlug: 'content_with_image',
                order: 1,
                content: {
                    title: 'Racking Systems',
                    paragraphs: [
                        'A warehouse racking system is a highly efficient storage solution designed to organize materials in horizontal rows across multiple levels. These systems optimize warehouse space utilization and streamline operations by systematically arranging materials.',
                        'Racking systems allow the storage of palletized products up to seven stacks high, depending on height and weight considerations. They are ideal not only for goods handling but also for storing raw materials and parts.',
                        'At Acero, we offer both palletized and cantilever racking solutions:',
                        'Pallet Racking System: Perfect for standard-sized items that need efficient, organized storage.',
                        'Cantilever Racking System: Ideal for bulky, non-standard sized items. This solution provides unobstructed storage, making more efficient use of warehouse space.',
                        'Enhance your warehouse operations with Acero\'s optimized racking solutions.',
                    ],
                    layout: 'text-only',
                },
            },
            {
                sectionTypeSlug: 'flip_card',
                order: 2,
                content: {
                    cards: [
                        {
                            id: 'pallet',
                            title: 'Pallet Racking Systems',
                            description: 'Pallet racking systems offered by Acero are robust and versatile storage solutions designed to efficiently organize and store goods in warehouses, distribution centers and industrial facilities. These systems feature sturdy steel frames and beams that provide excellent support for palletized loads of varying sizes and weights.',
                            image: '/images/racking-systems/pallet-racking.jpg',
                            imageAlt: 'Pallet Racking Systems',
                        },
                        {
                            id: 'cantilever',
                            title: 'Cantilever Racking Systems',
                            description: 'Acero\'s Cantilever Racking Systems are designed to efficiently store long and bulky items such as lumber, piping, tubing and other elongated materials. These systems feature sturdy steel columns with horizontal arms that extend outward, providing unobstructed access to stored items.',
                            image: '/images/racking-systems/cantilever-racking.jpg',
                            imageAlt: 'Cantilever Racking Systems',
                        },
                    ],
                    columns: 2,
                },
            },
            {
                sectionTypeSlug: 'comparison_table',
                order: 3,
                content: {
                    title: 'Factors to consider while selecting the right racking system',
                    factors: ['Budget', 'Floor Utilization', 'Versatility', 'Forklift Accessibility', 'Inventory Management'],
                    systems: [
                        { name: 'Drive-in System', values: ['Medium', '60 - 70%', 'Single Row', 'Yes', 'LIFO'] },
                        { name: 'Double Deep Racking System', values: ['Low', '60 - 65%', 'Same SKU', 'Extendable Fork', 'LIFO'] },
                        { name: 'Push Back Racking System', values: ['Very High', '70 - 75%', 'Same SKU Items', 'Various Goods', 'LIFO'] },
                        { name: 'Selective Racking System', values: ['Very Low', '40 - 45%', 'Various Goods', 'Yes', 'LIFO'] },
                        { name: 'Live Racking System', values: ['High', '70 - 75%', 'High Volume SKU', 'Yes', 'LIFO'] },
                    ],
                },
            },
        ];

        let sectionsCreated = 0;
        let sectionsUpdated = 0;

        for (const sectionData of sectionsData) {
            let section = await Section.findOne({
                pageId: page._id,
                sectionTypeSlug: sectionData.sectionTypeSlug,
                order: sectionData.order,
            });

            if (!section) {
                await Section.create({
                    pageId: page._id,
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
                await section.save();
                sectionsUpdated++;
                console.log(`✓ Updated section ${sectionData.order + 1}: ${sectionData.sectionTypeSlug}`);
            }
        }

        console.log(`\n✓ Racking Systems page seeding completed! (${sectionsCreated} created, ${sectionsUpdated} updated)`);
        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
};

if (require.main === module) seedProductsRackingSystems();
module.exports = seedProductsRackingSystems;

