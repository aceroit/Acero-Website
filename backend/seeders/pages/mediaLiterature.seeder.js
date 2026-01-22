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

const seedMediaLiterature = async () => {
    try {
        if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not defined');
        await connectDB();
        console.log('Starting Media Literature page seeding...\n');

        let user = await User.findOne({ email: 'admin@acero.com' }) || 
                   await User.findOne({ role: 'admin' }) || 
                   await User.findOne();
        if (!user) throw new Error('No user found.');

        // Create or get Media parent page
        let mediaPage = await Page.findOne({ slug: 'media' });
        if (!mediaPage) {
            mediaPage = await Page.create({
                title: 'Media',
                slug: 'media',
                path: '/media',
                parentId: null,
                level: 0,
                order: 4,
                metaTitle: 'Media | Acero Building Systems',
                metaDescription: 'Browse our literature, videos, and company updates.',
                metaKeywords: 'media,literature,brochures,videos,company updates',
                showInMenu: true,
                status: 'draft',
                isActive: true,
                createdBy: user._id,
            });
            console.log('✓ Created Media parent page');
        }

        let page = await Page.findOne({ slug: 'literature', parentId: mediaPage._id });
        if (!page) {
            page = await Page.create({
                title: 'Literature',
                slug: 'literature',
                path: '/media/literature',
                parentId: mediaPage._id,
                level: 1,
                order: 0,
                metaTitle: 'Literature | Acero Building Systems',
                metaDescription: 'Browse our collection of brochures and literature available in multiple languages.',
                metaKeywords: 'literature,brochures,downloads,PDF',
                showInMenu: true,
                status: 'draft',
                isActive: true,
                createdBy: user._id,
            });
            console.log('✓ Created Literature page');
        }

        const sectionsData = [
            {
                sectionTypeSlug: 'hero_image',
                order: 0,
                content: {
                    image: '/placeholder.jpg',
                    title: 'Media',
                },
            },
            {
                sectionTypeSlug: 'brochure_cards',
                order: 1,
                content: {
                    // Note: Brochures will be fetched dynamically from the backend Brochure model
                    // which we already seeded in companyRelatedData.seeder.js
                    title: null,
                    subtitle: null,
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

        console.log(`\n✓ Media Literature page seeding completed! (${sectionsCreated} created, ${sectionsUpdated} updated)`);
        console.log('Note: Brochures will be fetched dynamically from the backend Brochure model.');
        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
};

if (require.main === module) seedMediaLiterature();
module.exports = seedMediaLiterature;

