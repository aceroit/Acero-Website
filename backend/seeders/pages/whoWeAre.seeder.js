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
 * Seed Who We Are page with all sections from frontend/app/who-we-are/page.tsx
 */
const seedWhoWeAre = async () => {
    try {
        // Verify MONGODB_URI
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }

        await connectDB();

        console.log('Starting Who We Are page seeding...\n');

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

        // Step 1: Create or update Who We Are Page
        let whoWeArePage = await Page.findOne({ slug: 'who-we-are' });
        
        if (!whoWeArePage) {
            whoWeArePage = await Page.create({
                title: 'Who We Are',
                slug: 'who-we-are',
                path: '/who-we-are',
                parentId: null,
                level: 0,
                order: 1,
                metaTitle: 'Who We Are | Acero Building Systems',
                metaDescription: 'Acero Building Systems is a premier manufacturer of comprehensive steel buildings. From conceptualization to delivery, we seamlessly integrate design, manufacturing and supply services.',
                metaKeywords: 'Acero,steel buildings,manufacturing,UAE,Dubai,pre-engineered buildings,steel construction',
                showInMenu: true,
                status: 'draft',
                isActive: true,
                createdBy: user._id,
            });
            console.log('✓ Created Who We Are page');
        } else {
            console.log('✓ Who We Are page already exists');
        }

        // Step 2: Create Sections (in order)
        const sectionsData = [
            {
                // Section 1: Hero Image
                sectionTypeSlug: 'hero_image',
                order: 0,
                content: {
                    image: '/images/who-we-are/hero.jpg',
                    title: 'Acero Building Systems',
                },
            },
            {
                // Section 2: Reliability, Excellence, Trust
                sectionTypeSlug: 'content_with_image',
                order: 1,
                content: {
                    title: 'Reliability, Excellence, Trust',
                    paragraphs: [
                        'Acero Building Systems is a premier manufacturer of comprehensive steel buildings. From conceptualization to delivery, Acero seamlessly integrates design, manufacturing and supply services, leveraging internationally recognized engineering software and cutting-edge production equipment. Our headquarters and manufacturing facility stand proudly in Jebel Ali, Dubai, United Arab Emirates.',
                        'At Acero, we pride ourselves on delivering tailored steel buildings that encompass the entire steel building system. Our commitment extends globally, offering specialized expertise in pre-engineered steel buildings, including both fast-track and customized solutions, conventional steel buildings, roof and wall systems, racking systems, porta cabins and various building accessories.',
                        'Backed by a team of highly experienced professionals in the steel building industry and equipped with one of the largest manufacturing facilities, Acero caters to the diverse needs of the global steel building market.',
                        'At Acero Building Systems, we do not just provide steel buildings; we deliver reliability, excellence, and a partnership you can trust. Experience the Acero advantage as we redefine the standards of the steel building industry.',
                    ],
                    image: '/images/who-we-are/reliability-excellence-trust.jpg',
                    imageAlt: 'Reliability, Excellence, Trust',
                    layout: 'image-right',
                },
            },
            {
                // Section 3: Premium Video
                sectionTypeSlug: 'premium_video',
                order: 2,
                content: {
                    videoId: 'YOUR_VIDEO_ID_HERE',
                    autoplay: true,
                    muted: true,
                    loop: true,
                },
            },
            {
                // Section 4: Engineering Excellence
                sectionTypeSlug: 'image_gallery',
                order: 3,
                content: {
                    title: 'Engineering Excellence',
                    paragraph: 'At Acero Building Systems, we combine global presence with precision-driven processes to deliver exceptional results. With engineering groups in five locations (Dubai, Kannur, Kochi, Hyderabad and Cairo) across three countries (UAE, India and Egypt), procedural safeguards are in place to ensure that all engineering inputs and outputs, such as design calculations, approval drawings, shop details and bills of material, are generated, checked, released, and archived in digital format, ensuring the customer\'s best interests are at heart.',
                    images: [
                        { src: '/images/engineering/engineering-1.jpg', alt: 'Engineering Excellence 1' },
                        { src: '/images/engineering/engineering-2.jpg', alt: 'Engineering Excellence 2' },
                        { src: '/images/engineering/engineering-3.jpg', alt: 'Engineering Excellence 3' },
                        { src: '/images/engineering/engineering-4.jpg', alt: 'Engineering Excellence 4' },
                        { src: '/images/engineering/engineering-5.jpg', alt: 'Engineering Excellence 5' },
                        { src: '/images/engineering/engineering-6.jpg', alt: 'Engineering Excellence 6' },
                    ],
                    columns: 6,
                },
            },
            {
                // Section 5: Elevating Customer Experience
                sectionTypeSlug: 'content_with_image',
                order: 4,
                content: {
                    title: 'Elevating Customer Experience',
                    paragraphs: [
                        'Acero\'s dedicated sales engineers meticulously address every building inquiry, delivering optimal solutions with the utmost attention to detail and cost-effectiveness. Committed to exceptional customer service, the Acero sales team ensures continuous and seamless communication with our valued customers.',
                    ],
                    image: '/images/who-we-are/customer-experience.jpg',
                    imageAlt: 'Elevating Customer Experience',
                    layout: 'image-left',
                },
            },
            {
                // Section 6: Transforming Industries Globally
                sectionTypeSlug: 'content_with_image',
                order: 5,
                content: {
                    title: 'Transforming Industries Globally',
                    paragraphs: [
                        'Acero takes pride in designing, manufacturing and supplying a diverse range of steel buildings tailored to meet the unique needs of global industries and sectors.',
                        'Our portfolio spans across agriculture, education, aviation, transportation, logistics, industrial, commercial and residential domains.',
                    ],
                    image: '/images/who-we-are/transforming-industries.jpg',
                    imageAlt: 'Transforming Industries Globally',
                    layout: 'image-right',
                },
            },
            {
                // Section 7: Why Acero?
                sectionTypeSlug: 'features_grid',
                order: 6,
                content: {
                    title: 'Why Acero?',
                    features: [
                        {
                            icon: 'Globe',
                            title: 'Global Reach, Local Expertise',
                            description: 'Worldwide presence with localized service. Our extensive global network empowers us to serve customers across borders while maintaining a localized approach.',
                        },
                        {
                            icon: 'Factory',
                            title: 'Manufacturing Excellence',
                            description: 'With a robust production capacity exceeding 100,000 tons per year, we stand tall as industry leaders. Our commitment to precision and quality ensures excellence.',
                        },
                        {
                            icon: 'Code',
                            title: 'Engineering Innovation',
                            description: 'Engineering groups in five locations across three countries ensure that all engineering inputs and outputs are generated with precision and digital excellence.',
                        },
                        {
                            icon: 'Award',
                            title: 'Quality Assurance',
                            description: 'International certifications and unwavering commitment to quality ensure that each product leaving our facility bears the mark of excellence.',
                        },
                        {
                            icon: 'Users',
                            title: 'Customer-Centric',
                            description: 'Dedicated sales engineers meticulously address every building inquiry, delivering optimal solutions with the utmost attention to detail and cost-effectiveness.',
                        },
                        {
                            icon: 'TrendingUp',
                            title: 'Industry Leadership',
                            description: '25+ years of experience in the steel building industry, backed by a team of highly experienced professionals and one of the largest manufacturing facilities.',
                        },
                    ],
                    columns: 3,
                },
            },
        ];

        let sectionsCreated = 0;
        let sectionsUpdated = 0;
        let sectionsSkipped = 0;

        for (const sectionData of sectionsData) {
            // Check if section already exists
            let section = await Section.findOne({
                pageId: whoWeArePage._id,
                sectionTypeSlug: sectionData.sectionTypeSlug,
                order: sectionData.order,
            });

            if (!section) {
                section = await Section.create({
                    pageId: whoWeArePage._id,
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
                // Update content if section exists
                section.content = sectionData.content;
                section.isVisible = true;
                await section.save();
                sectionsUpdated++;
                console.log(`✓ Updated section ${sectionData.order + 1}: ${sectionData.sectionTypeSlug}`);
            }
        }

        console.log('\n=== Seeding Summary ===');
        console.log(`Page: ${whoWeArePage.title} (${whoWeArePage.slug})`);
        console.log(`Sections created: ${sectionsCreated}`);
        console.log(`Sections updated: ${sectionsUpdated}`);
        console.log(`Sections skipped: ${sectionsSkipped}`);
        console.log(`Total sections: ${sectionsData.length}\n`);

        console.log('✓ Who We Are page seeding completed successfully!');
        console.log('\nNote: All sections are in draft status. Publish them via the admin panel when ready.');
        process.exit(0);
    } catch (error) {
        console.error('✗ Error seeding Who We Are page:', error);
        process.exit(1);
    }
};

// Run seeder if called directly
if (require.main === module) {
    seedWhoWeAre();
}

module.exports = seedWhoWeAre;

