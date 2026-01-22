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

const seedCareer = async () => {
    try {
        if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not defined');
        await connectDB();
        console.log('Starting Career page seeding...\n');

        let user = await User.findOne({ email: 'admin@acero.com' }) || 
                   await User.findOne({ role: 'admin' }) || 
                   await User.findOne();
        if (!user) throw new Error('No user found.');

        let page = await Page.findOne({ slug: 'career' });
        if (!page) {
            page = await Page.create({
                title: 'Career',
                slug: 'career',
                path: '/career',
                parentId: null,
                level: 0,
                order: 5,
                metaTitle: 'Career Opportunities | Acero Building Systems',
                metaDescription: 'Join Acero Building Systems and be part of a leading steel manufacturing company. Explore career opportunities and apply for open positions.',
                metaKeywords: 'career,jobs,employment,opportunities,join Acero',
                showInMenu: true,
                status: 'draft',
                isActive: true,
                createdBy: user._id,
            });
            console.log('✓ Created Career page');
        } else {
            console.log('✓ Career page already exists');
        }

        const sectionsData = [
            {
                sectionTypeSlug: 'hero_image',
                order: 0,
                content: {
                    image: '/placeholder.jpg',
                    title: 'Career',
                },
            },
            {
                sectionTypeSlug: 'career_application_form',
                order: 1,
                content: {
                    // Note: Vacancies will be fetched dynamically from the backend Vacancy model
                    // which we already seeded in vacancies.seeder.js
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

        console.log(`\n✓ Career page seeding completed! (${sectionsCreated} created, ${sectionsUpdated} updated)`);
        console.log('Note: Vacancies will be fetched dynamically from the backend Vacancy model.');
        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
};

if (require.main === module) seedCareer();
module.exports = seedCareer;

