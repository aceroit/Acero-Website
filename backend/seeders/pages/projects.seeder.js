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

/**
 * Seed Projects page with all sections from frontend/app/projects/page.tsx
 */
const seedProjects = async () => {
    try {
        if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not defined');
        await connectDB();
        console.log('Starting Projects page seeding...\n');

        let user = await User.findOne({ email: 'admin@acero.com' }) || 
                   await User.findOne({ role: 'admin' }) || 
                   await User.findOne();
        if (!user) throw new Error('No user found.');

        let page = await Page.findOne({ slug: 'projects' });
        if (!page) {
            page = await Page.create({
                title: 'Projects',
                slug: 'projects',
                path: '/projects',
                parentId: null,
                level: 0,
                order: 3,
                metaTitle: 'Our Projects | Acero Building Systems',
                metaDescription: 'Explore our diverse portfolio of projects across various industries and building types. Showcasing our expertise through successful steel building projects.',
                metaKeywords: 'projects,steel building projects,construction projects,PEB projects,industrial projects',
                showInMenu: true,
                status: 'draft',
                isActive: true,
                createdBy: user._id,
            });
            console.log('✓ Created Projects page');
        } else {
            console.log('✓ Projects page already exists');
        }

        const sectionsData = [
            {
                sectionTypeSlug: 'hero_image',
                order: 0,
                content: {
                    image: '/images/projects/hero.jpg',
                    title: 'Our Projects',
                },
            },
            {
                sectionTypeSlug: 'projects_grid_with_filters',
                order: 1,
                content: {
                    title: 'Our Projects',
                    subtitle: 'Explore our diverse portfolio of projects across various industries and building types',
                    // Note: Projects will be fetched dynamically from the backend Project model
                    // Filters will be populated from master data (Industries, BuildingTypes, Countries, Regions, Areas)
                    showFilters: true,
                    filters: {
                        industry: true,
                        buildingType: true,
                        country: true,
                        region: true,
                        area: true,
                    },
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

        console.log(`\n✓ Projects page seeding completed! (${sectionsCreated} created, ${sectionsUpdated} updated)`);
        console.log('Note: Projects data will be fetched dynamically from the backend Project model.');
        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
};

if (require.main === module) seedProjects();
module.exports = seedProjects;

