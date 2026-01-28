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
 * Seed Manufacturing page with all sections from frontend/app/manufacturing/page.tsx
 */
const seedProductsManufacturing = async () => {
    try {
        // Verify MONGODB_URI
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }

        await connectDB();

        console.log('Starting Manufacturing page seeding...\n');

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

        // Step 1: Create or update Manufacturing Page (top-level, between Products and Projects)
        let manufacturingPage = await Page.findOne({ slug: 'manufacturing' });
        
        if (!manufacturingPage) {
            manufacturingPage = await Page.create({
                title: 'Manufacturing',
                slug: 'manufacturing',
                path: '/manufacturing', // Standalone page, not under products
                parentId: null,
                level: 0,
                order: 3, // Between Products (2) and Projects (4)
                metaTitle: 'Manufacturing Excellence | Acero Building Systems',
                metaDescription: 'Discover Acero\'s cutting-edge manufacturing facility with fully automated production lines, quality control processes, and certified craftsmanship.',
                metaKeywords: 'manufacturing,steel manufacturing,automated production,quality control,welding,shot blasting,painting,PEB manufacturing',
                showInMenu: true,
                status: 'draft',
                isActive: true,
                createdBy: user._id,
            });
            console.log('✓ Created Manufacturing page');
        } else {
            // Update path and order if it exists
            manufacturingPage.path = '/manufacturing';
            manufacturingPage.order = 2.5;
            await manufacturingPage.save();
            console.log('✓ Manufacturing page already exists (path and order updated)');
        }

        // Step 2: Create Sections (in order)
        const sectionsData = [
            {
                // Section 1: Hero Image
                sectionTypeSlug: 'hero_image',
                order: 0,
                content: {
                    image: '/images/manufacturing/hero.jpg',
                    title: 'Manufacturing Excellence',
                },
            },
            {
                // Section 2: Manufacturing Excellence
                sectionTypeSlug: 'content_with_image',
                order: 1,
                content: {
                    title: 'Manufacturing Excellence',
                    paragraphs: [
                        'At Acero, we take pride in our cutting-edge production facility, equipped with the latest technology and manned by a team of skilled professionals with years of experience. Our commitment to quality and precision is evident in every step of the manufacturing process.',
                        'Our welders are not just workers; they are certified craftsmen trained to meet the highest standards set by organizations such as the American Welding Society (AWS), British Standards (BS), European Standards (EN) and the International Organization for Standardization (ISO). This ensures that each weld meets stringent quality requirements, guaranteeing the structural integrity of every building we produce.',
                        'From start to finish, our manufacturing process is meticulously streamlined to deliver exceptional results. Every component is carefully crafted and inspected to ensure consistency and accuracy. We understand the importance of timely delivery and our efficient production methods ensure that each building is completed on schedule, ready to meet the project deadlines.',
                        'At Acero, we go beyond designing, manufacturing, and supplying steel structures – we provide peace of mind. With a commitment to excellence and a track record for on-time delivery, Acero is your trusted partner for quality and precision.',
                    ],
                    image: '/images/manufacturing/manufacturing-excellence.jpg',
                    imageAlt: 'Manufacturing Excellence',
                    layout: 'image-right',
                },
            },
            {
                // Section 3: Acero's Advanced Manufacturing Process
                sectionTypeSlug: 'content_with_image',
                order: 2,
                content: {
                    title: 'Acero\'s Advanced Manufacturing Process',
                    paragraphs: [
                        'At Acero, our manufacturing facility is equipped with cutting-edge technology and specialized software to ensure the highest standards and efficiency in fabrication. Our comprehensive production setup includes manufacturing of:',
                        'Primary Members - Fully automated beam welding lines integrating plate preparation, tack welding, submerged arc welding (SAW), in-built hydraulic straightening, drilling and cutting for unmatched precision.',
                        'Secondary Members - Automated roll forming lines for Z and C sections, roof, and wall panels with consistent accuracy.',
                        'Shot Blasting and Painting - Automated shot blasting and painting ensure durable, high-quality finishes. These advanced production lines collectively enable Acero to maintain unmatched quality and efficiency in steel building manufacturing.',
                    ],
                    image: '/images/manufacturing/advanced-process.jpg',
                    imageAlt: 'Acero\'s Advanced Manufacturing Process',
                    layout: 'image-left',
                },
            },
            {
                // Section 4: Primary Members
                sectionTypeSlug: 'content_with_image',
                order: 3,
                content: {
                    title: 'Primary Members',
                    paragraphs: [
                        'At Acero, our fully automated continuous beam welding lines deliver unmatched efficiency and precision in the fabrication of structural members, ensuring high-quality output for every project.',
                        'Fully Automated Continuous Beam Welding Line',
                        'We take pride in our state-of-the-art, fully automated beam welding line, the only one of its kind in the world, manufactured and supplied from the USA. This all-in-one software operated system seamlessly integrates every stage of production, from plate preparation for web and flange to tack welding, continuous beam welding, submerged arc welding (SAW), drilling and cutting. The result is unparalleled speed and precision in manufacturing. The process is further optimized by low gantry cranes with electro-magnetic heads, ensuring efficient material handling. Remarkably, the entire beam line is operated by just four skilled operators, highlighting the innovation and operational excellence that define our manufacturing capabilities.',
                        'After the beams are produced through our automatic welding, essential components such as base plates, connection plates and clips are precisely positioned and welded. These components undergo a rigorous inspection by Acero\'s specialized Quality Control (QC) inspectors for dimensional accuracy and location of the weld, ensuring 100% compliance with engineering drawings.',
                    ],
                    image: '/images/manufacturing/primary-members.jpg',
                    imageAlt: 'Primary Members Manufacturing',
                    layout: 'image-right',
                },
            },
            {
                // Section 5: Secondary Members
                sectionTypeSlug: 'content_with_image',
                order: 4,
                content: {
                    title: 'Secondary Members',
                    paragraphs: [
                        'Our continuous automated roll forming lines are designed to form corrugated sheets with exceptional precision, ensuring the integrity of the desired profiles. This line is dedicated to manufacturing roof and wall sheeting panels, as well as decking panels. We offer Acero 45-150 and Acero 45-250 profiles, delivering consistent quality and performance in every panel. We specialize in the precise and efficient production of secondary members. Our roll forming lines produce Z and C sections.',
                    ],
                    image: '/images/manufacturing/secondary-members.jpg',
                    imageAlt: 'Secondary Members Manufacturing',
                    layout: 'image-right',
                },
            },
            {
                // Section 6: Shot Blasting and Painting
                sectionTypeSlug: 'content_with_image',
                order: 5,
                content: {
                    title: 'Shot Blasting and Painting',
                    paragraphs: [
                        'Once fabrication is complete, the primary steel members are shot blasted in our automatic shot blasting line, a process that removes rust and other impurities from the steel surface. These steel shots not only clean the surface but also etch it to ensure accurate paint adhesion, ensuring optimal paint system performance. After shot blasting, the materials are painted. Once coated, they enter the drying area, where a final QC inspection is conducted to check the paint quality as per the requirements. Only after QC approval, the materials are released to the finished goods yard.',
                    ],
                    image: '/images/manufacturing/shot-blasting-painting.jpg',
                    imageAlt: 'Shot Blasting and Painting',
                    layout: 'image-right',
                },
            },
            {
                // Section 7: Quality Policy with Certificates
                sectionTypeSlug: 'certificates_grid',
                order: 6,
                content: {
                    title: 'Quality Policy',
                    paragraphs: [
                        'The Acero quality control team is trained and qualified in using the latest equipment and methods to ensure the consistent quality standards enforced by world-renowned organizations, such as the American Society for Testing and Materials (ASTM), British Standards Institute (BSI), and the European Standards (EN).',
                        'Quality control at Acero starts with receiving raw materials, where every batch of steel is tested for both physical and chemical properties, in-house as well as by third-party certified and accredited labs, to ensure consistent quality. Acero also enforces quality control checks at every workstation in the production cycle, ensuring that only the highest quality products make it to the final stages of the production process.',
                    ],
                    certificates: [
                        {
                            name: 'ISO 9001',
                            image: '/images/certificates/iso-9001.jpg',
                            imageAlt: 'ISO 9001 Certificate',
                        },
                        {
                            name: 'ISO 14001',
                            image: '/images/certificates/iso-14001.jpg',
                            imageAlt: 'ISO 14001 Certificate',
                        },
                        {
                            name: 'ISO 45001',
                            image: '/images/certificates/iso-45001.jpg',
                            imageAlt: 'ISO 45001 Certificate',
                        },
                        {
                            name: 'AS/NZS ISO 3834',
                            image: '/images/certificates/as-nzs-iso-3834.jpg',
                            imageAlt: 'AS/NZS ISO 3834 Certificate',
                        },
                        {
                            name: 'EN 1090-1',
                            image: '/images/certificates/en-1090-1.jpg',
                            imageAlt: 'EN 1090-1 Certificate',
                        },
                        {
                            name: 'QHSE Policy',
                            image: '/images/certificates/qhse-policy.jpg',
                            imageAlt: 'QHSE Policy Certificate',
                        },
                    ],
                },
            },
        ];

        let sectionsCreated = 0;
        let sectionsUpdated = 0;
        let sectionsSkipped = 0;

        for (const sectionData of sectionsData) {
            // Check if section already exists
            let section = await Section.findOne({
                pageId: manufacturingPage._id,
                sectionTypeSlug: sectionData.sectionTypeSlug,
                order: sectionData.order,
            });

            if (!section) {
                section = await Section.create({
                    pageId: manufacturingPage._id,
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
        console.log(`Page: ${manufacturingPage.title} (${manufacturingPage.slug})`);
        console.log(`Sections created: ${sectionsCreated}`);
        console.log(`Sections updated: ${sectionsUpdated}`);
        console.log(`Sections skipped: ${sectionsSkipped}`);
        console.log(`Total sections: ${sectionsData.length}\n`);

        console.log('✓ Manufacturing page seeding completed successfully!');
        console.log('\nNote: All sections are in draft status. Publish them via the admin panel when ready.');
        process.exit(0);
    } catch (error) {
        console.error('✗ Error seeding Manufacturing page:', error);
        process.exit(1);
    }
};

// Run seeder if called directly
if (require.main === module) {
    seedProductsManufacturing();
}

module.exports = seedProductsManufacturing;

