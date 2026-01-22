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

const seedMediaVideo = async () => {
    try {
        if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not defined');
        await connectDB();
        console.log('Starting Media Video page seeding...\n');

        let user = await User.findOne({ email: 'admin@acero.com' }) || 
                   await User.findOne({ role: 'admin' }) || 
                   await User.findOne();
        if (!user) throw new Error('No user found.');

        let mediaPage = await Page.findOne({ slug: 'media' });
        if (!mediaPage) throw new Error('Media parent page not found. Please run mediaLiterature.seeder.js first.');

        let page = await Page.findOne({ slug: 'video', parentId: mediaPage._id });
        if (!page) {
            page = await Page.create({
                title: 'Videos',
                slug: 'video',
                path: '/media/video',
                parentId: mediaPage._id,
                level: 1,
                order: 1,
                metaTitle: 'Videos | Acero Building Systems',
                metaDescription: 'Watch our collection of videos showcasing our projects, manufacturing processes, and company updates.',
                metaKeywords: 'videos,YouTube,company videos,project videos',
                showInMenu: true,
                status: 'draft',
                isActive: true,
                createdBy: user._id,
            });
            console.log('✓ Created Video page');
        }

        const sectionsData = [
            {
                sectionTypeSlug: 'hero_image',
                order: 0,
                content: {
                    image: '/placeholder.jpg',
                    title: 'Videos',
                },
            },
            {
                sectionTypeSlug: 'video_cards',
                order: 1,
                content: {
                    // Note: Videos will be fetched dynamically from the backend Video model
                    // (if it exists, or from a future Video model)
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

        console.log(`\n✓ Media Video page seeding completed! (${sectionsCreated} created, ${sectionsUpdated} updated)`);
        console.log('Note: Videos will be fetched dynamically from the backend Video model.');
        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
};

if (require.main === module) seedMediaVideo();
module.exports = seedMediaVideo;

