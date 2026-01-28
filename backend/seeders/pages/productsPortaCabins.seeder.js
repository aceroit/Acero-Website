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

const seedProductsPortaCabins = async () => {
    try {
        if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not defined');
        await connectDB();
        console.log('Starting Porta Cabins product page seeding...\n');

        let user = await User.findOne({ email: 'admin@acero.com' }) || 
                   await User.findOne({ role: 'admin' }) || 
                   await User.findOne();
        if (!user) throw new Error('No user found.');

        let productsPage = await Page.findOne({ slug: 'products' });
        if (!productsPage) throw new Error('Products parent page not found.');

        let page = await Page.findOne({ slug: 'porta-cabins', parentId: productsPage._id });
        if (!page) {
            page = await Page.create({
                title: 'Porta Cabins',
                slug: 'porta-cabins',
                path: '/products/porta-cabins',
                parentId: productsPage._id,
                level: 1,
                order: 3,
                metaTitle: 'Porta Cabins | Acero Building Systems',
                metaDescription: 'Acero manufactures and supplies Porta Cabins in all sizes, customized as per the requirements. Economical, strong, durable and easy to install.',
                metaKeywords: 'porta cabins,portable cabins,modular cabins,prefabricated cabins',
                showInMenu: true,
                status: 'draft',
                isActive: true,
                createdBy: user._id,
            });
            console.log('✓ Created Porta Cabins page');
        }

        const sectionsData = [
            {
                sectionTypeSlug: 'hero_image',
                order: 0,
                content: { image: '/images/porta-cabins/hero.jpg', title: 'Porta Cabins' },
            },
            {
                sectionTypeSlug: 'content_with_image',
                order: 1,
                content: {
                    title: 'Porta Cabins',
                    paragraphs: [
                        'Acero manufactures and supplies Porta Cabins in all sizes, customized as per the requirements. Acero\'s Porta Cabins are carefully designed to be economical, strong, durable and easy to install.',
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
                            id: 'pitched-roof',
                            title: 'Pitched Roof Porta Cabins',
                            description: 'Acero\'s porta cabins with pitched roofs provide an efficient and adaptable solution for various temporary or semi-permanent structure needs. Designed for enhanced water drainage and increased interior space, these cabins are perfect for uses such as site offices, residential accommodations, classrooms and storage units. The pitched roof design not only adds aesthetic appeal but also improves structural integrity and weather resistance.',
                            image: '/images/porta-cabins/pitched-roof.jpg',
                            imageAlt: 'Pitched Roof Porta Cabins',
                        },
                        {
                            id: 'monoslope',
                            title: 'Monoslope Porta Cabins',
                            description: 'Acero\'s porta cabins with mono slope roofs offer a modern and practical solution for various temporary or semi-permanent needs. The single-slope roof design enhances water runoff and provides a sleek, contemporary appearance. Ideal for applications such as site offices, living quarters, classrooms and storage units. The mono slope design also allows for efficient use of interior space and can be customized to fit your specific project requirements.',
                            image: '/images/porta-cabins/monoslope.jpg',
                            imageAlt: 'Monoslope Porta Cabins',
                        },
                        {
                            id: 'stackable',
                            title: 'Stackable Porta Cabins',
                            description: 'Acero offers stackable porta cabins designed for versatile and efficient use in various applications. These cabins are constructed using high-quality steel and feature a modular design that allows for easy stacking and assembly. With standardized dimensions and components, our stackable porta cabins are suitable for temporary or permanent use in construction sites, remote locations, or as office spaces.',
                            image: '/images/porta-cabins/stackable.jpg',
                            imageAlt: 'Stackable Porta Cabins',
                        },
                        {
                            id: 'flat-roof',
                            title: 'Flat Roof Porta Cabins',
                            description: 'Acero\'s porta cabins with flat roofs offer a versatile and functional solution for temporary or semi-permanent structures. These cabins are designed for easy installation and relocation, making them ideal for various applications such as site offices, security booths, classrooms and accommodation units. The flat roof design allows for efficient stacking, maximizing space utilization and transportation efficiency.',
                            image: '/images/porta-cabins/flat-roof.jpg',
                            imageAlt: 'Flat Roof Porta Cabins',
                        },
                    ],
                    columns: 2,
                },
            },
            {
                sectionTypeSlug: 'advantages_grid',
                order: 3,
                content: {
                    title: 'Advantages of Porta Cabins',
                    advantages: [
                        { id: 'cost', title: 'Cost Saving', icon: 'DollarSign' },
                        { id: 'time', title: 'Time Saving', icon: 'Clock' },
                        { id: 'portability', title: 'Portability', icon: 'Truck' },
                        { id: 'flexibility', title: 'Flexibility', icon: 'Settings' },
                    ],
                    columns: 4,
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

        console.log(`\n✓ Porta Cabins page seeding completed! (${sectionsCreated} created, ${sectionsUpdated} updated)`);
        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
};

if (require.main === module) seedProductsPortaCabins();
module.exports = seedProductsPortaCabins;

