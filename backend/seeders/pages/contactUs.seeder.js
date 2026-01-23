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

const seedContactUs = async () => {
    try {
        if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not defined');
        await connectDB();
        console.log('Starting Contact Us page seeding...\n');

        let user = await User.findOne({ email: 'admin@acero.com' }) || 
                   await User.findOne({ role: 'admin' }) || 
                   await User.findOne();
        if (!user) throw new Error('No user found.');

        let page = await Page.findOne({ slug: 'contact-us' });
        if (!page) {
            page = await Page.create({
                title: 'Contact Us',
                slug: 'contact-us',
                path: '/contact-us',
                parentId: null,
                level: 0,
                order: 7, // Updated to 7 (after Career at 6)
                metaTitle: 'Contact Us | Acero Building Systems',
                metaDescription: 'Get in touch with Acero Building Systems. Find our head office location, branch offices, and contact information.',
                metaKeywords: 'contact,get in touch,head office,branches,location,address',
                showInMenu: true,
                status: 'draft',
                isActive: true,
                createdBy: user._id,
            });
            console.log('✓ Created Contact Us page');
        } else {
            // Update order if it exists
            page.order = 7;
            await page.save();
            console.log('✓ Contact Us page already exists (order updated to 7)');
        }

        const sectionsData = [
            {
                sectionTypeSlug: 'hero_image',
                order: 0,
                content: {
                    image: '/placeholder.jpg',
                    title: 'Contact Us',
                },
            },
            {
                sectionTypeSlug: 'head_office_section',
                order: 1,
                content: {
                    // Note: Head office data will be fetched dynamically from the backend Branch model
                    // where isHeadOffice = true (which we already seeded in companyRelatedData.seeder.js)
                    title: null,
                    subtitle: null,
                },
            },
            {
                sectionTypeSlug: 'branch_selector',
                order: 2,
                content: {
                    // Note: Branches will be fetched dynamically from the backend Branch model
                    // which we already seeded in companyRelatedData.seeder.js
                    title: null,
                    subtitle: null,
                },
            },
            {
                sectionTypeSlug: 'contact_form',
                order: 3,
                content: {
                    // Note: Form configuration will be fetched from FormConfiguration model
                    title: null,
                    subtitle: null,
                },
            },
            {
                sectionTypeSlug: 'full_width_map',
                order: 4,
                content: {
                    // Note: Map configuration will be fetched from GoogleMaps model
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

        console.log(`\n✓ Contact Us page seeding completed! (${sectionsCreated} created, ${sectionsUpdated} updated)`);
        console.log('Note: Head office, branches, form config, and map data will be fetched dynamically from backend models.');
        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
};

if (require.main === module) seedContactUs();
module.exports = seedContactUs;

