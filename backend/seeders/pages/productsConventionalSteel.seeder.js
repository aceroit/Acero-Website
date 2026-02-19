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

const seedProductsConventionalSteel = async () => {
    try {
        if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not defined');
        await connectDB();
        console.log('Starting Conventional Steel product page seeding...\n');

        let user = await User.findOne({ email: 'admin@acero.com' }) || 
                   await User.findOne({ role: 'admin' }) || 
                   await User.findOne();
        if (!user) throw new Error('No user found.');

        let productsPage = await Page.findOne({ slug: 'products' });
        if (!productsPage) throw new Error('Products parent page not found.');

        let page = await Page.findOne({ slug: 'conventional-steel', parentId: productsPage._id });
        if (!page) {
            page = await Page.create({
                title: 'Conventional Steel',
                slug: 'conventional-steel',
                path: '/products/conventional-steel',
                parentId: productsPage._id,
                level: 1,
                order: 1,
                metaTitle: 'Conventional Steel Buildings | Acero Building Systems',
                metaDescription: 'Conventional steel buildings are traditional metal structures constructed by hot-rolled steel sections which are designed individually and fabricated.',
                metaKeywords: 'conventional steel,steel buildings,hot-rolled steel,structural steel',
                showInMenu: true,
                status: 'draft',
                isActive: true,
                createdBy: user._id,
            });
            console.log('✓ Created Conventional Steel page');
        }

        const sectionsData = [
            {
                sectionTypeSlug: 'hero_image',
                order: 0,
                content: { image: '/images/conventional-steel/hero.jpg', title: 'Conventional Steel' },
            },
            {
                sectionTypeSlug: 'content_with_image',
                order: 1,
                content: {
                    title: 'Conventional Steel',
                    paragraphs: [
                        'Conventional steel buildings are traditional metal structures constructed by hot-rolled steel sections which are designed individually and fabricated. Primary steel members are selected from international standard hot-rolled sections, such as but not limited to "UB", "UC" and "PFC" (British Specifications), "HE" and "IPE" (EU Specifications) and "JIS" (Japanese Specifications).',
                        'Components of conventional steel buildings come in standard shapes and sizes with limited modifications permitted. These components are ordered from the steel mills (hot-rolled sections) according to unique specifications and are generally ordered based on project requirements.',
                    ],
                    layout: 'text-only',
                },
            },
            {
                sectionTypeSlug: 'image_modal_gallery',
                order: 2,
                content: {
                    title: 'Conventional Steel Types',
                    items: [
                        { id: 't-bar', title: 'T Bar', description: 'Hot-rolled steel tees are favored for applications requiring extensive load-bearing capabilities. The T-shaped design ensures optimal performance: the top flange provides resistance against compressive stress, while the vertical section (web) effectively resists shear and bending forces.', image: '/images/conventional-steel/t-bar.jpg', imageAlt: 'T Bar' },
                        { id: 'wide-flange', title: 'Wide Flange', description: 'Hot-rolled steel wide flange I-beams are among the most widely used beams and are highly versatile for various processing techniques. Typically featuring non-tapered flanges, and a robust center web, they offer enhanced strength for diverse applications.', image: '/images/conventional-steel/wide-flange.jpg', imageAlt: 'Wide Flange' },
                        { id: 'hss', title: 'HSS', description: 'Hot-rolled square sections are steel profiles characterized by uniform dimensions on all four sides, resulting in a square shape. Renowned for their robustness and durability, these sections are widely utilized in construction, manufacturing and structural applications where ensuring strength and stability is critical.', image: '/images/conventional-steel/hss.jpg', imageAlt: 'HSS' },
                        { id: 'i-beam', title: 'I Beam', description: 'Hot-rolled steel I-beams, a crucial element in structural steel, boasts an I-shaped cross-section, delivering an exceptional strength-to-weight ratio. It finds extensive application in construction, serving as beams, columns and other load-bearing components, guaranteeing structural stability.', image: '/images/conventional-steel/i-beam.jpg', imageAlt: 'I Beam' },
                        { id: 'channel', title: 'Channel', description: 'C channels are hot-rolled steel profiles distinguished by a C-shaped cross-section. Manufactured through a hot-rolling process, they exhibit uniform dimensions, ensuring consistency and quality.', image: '/images/conventional-steel/channel.jpg', imageAlt: 'Channel' },
                        { id: 'angle', title: 'Angle', description: 'Angles are hot-rolled steel profiles known for their distinctive L-shaped cross-section. Produced via hot-rolling, they exhibit uniform dimensions.', image: '/images/conventional-steel/angle.jpg', imageAlt: 'Angle' },
                    ],
                    columns: 3,
                },
            },
            {
                sectionTypeSlug: 'application_cards',
                order: 3,
                content: {
                    title: 'Conventional Steel Applications',
                    subtitle: 'Conventional steel finds applications across various industries and sectors:',
                    clickBehavior: 'both',
                    applications: [
                        { id: '1', name: 'Pipe Racks', icon: 'Layers', description: 'Structural steel pipe racks for industrial piping systems, providing support and routing for process pipelines in refineries and chemical plants.', redirectUrl: '' },
                        { id: '2', name: 'Equipment', icon: 'Cog', description: 'Heavy-duty structural steel platforms and supports for industrial equipment installations, ensuring stability and load-bearing capacity.', redirectUrl: '' },
                        { id: '3', name: 'Desalination Plant', icon: 'Droplets', description: 'Conventional steel structures for desalination facilities, designed to withstand corrosive marine environments while supporting complex water treatment processes.', redirectUrl: '' },
                        { id: '4', name: 'Petrochemical Plant', icon: 'Factory', description: 'Robust steel frameworks for petrochemical processing facilities, built to handle extreme temperatures and chemical exposure.', redirectUrl: '' },
                        { id: '5', name: 'Steel Mill', icon: 'Hammer', description: 'High-strength structural steel solutions for steel manufacturing plants, engineered to endure heavy loads and intense heat.', redirectUrl: '' },
                        { id: '6', name: 'Bridge Structure', icon: 'Layers', description: 'Conventional steel bridge components including girders, trusses, and support structures for transportation infrastructure.', redirectUrl: '' },
                        { id: '7', name: 'Cement Plant', icon: 'Factory', description: 'Durable steel structures for cement manufacturing facilities, supporting heavy machinery and withstanding dusty, high-temperature conditions.', redirectUrl: '' },
                        { id: '8', name: 'Oil and Gas', icon: 'Droplets', description: 'Structural steel solutions for oil and gas industry installations, from offshore platforms to onshore processing facilities.', redirectUrl: '' },
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

        console.log(`\n✓ Conventional Steel page seeding completed! (${sectionsCreated} created, ${sectionsUpdated} updated)`);
        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
};

if (require.main === module) seedProductsConventionalSteel();
module.exports = seedProductsConventionalSteel;

