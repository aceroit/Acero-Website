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

const seedProductsPebComparison = async () => {
    try {
        if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not defined');
        await connectDB();
        console.log('Starting PEB Comparison product page seeding...\n');

        let user = await User.findOne({ email: 'admin@acero.com' }) || 
                   await User.findOne({ role: 'admin' }) || 
                   await User.findOne();
        if (!user) throw new Error('No user found.');

        let productsPage = await Page.findOne({ slug: 'products' });
        if (!productsPage) throw new Error('Products parent page not found.');

        let page = await Page.findOne({ slug: 'peb-comparison', parentId: productsPage._id });
        if (!page) {
            page = await Page.create({
                title: 'PEB Comparison',
                slug: 'peb-comparison',
                path: '/products/peb-comparison',
                parentId: productsPage._id,
                level: 1,
                order: 5,
                metaTitle: 'Pre-Engineered Steel Building vs Conventional Steel | Acero',
                metaDescription: 'Compare Pre-Engineered Steel Buildings (PEB) with Conventional Steel and Reinforced Concrete across various criteria including cost, time, and quality.',
                metaKeywords: 'PEB comparison,pre-engineered vs conventional,steel building comparison',
                showInMenu: true,
                status: 'draft',
                isActive: true,
                createdBy: user._id,
            });
            console.log('✓ Created PEB Comparison page');
        }

        const sectionsData = [
            {
                sectionTypeSlug: 'hero_image',
                order: 0,
                content: {
                    image: '/images/peb-comparison/hero.jpg',
                    title: 'Pre-Engineered Steel Building vs Conventional Steel',
                    imageFit: 'cover',
                    imagePosition: 'center',
                },
            },
            {
                sectionTypeSlug: 'tabbed_comparison',
                order: 1,
                content: {
                    title: 'PEB Comparison',
                    subtitle: 'To learn more about PEB Comparison, click to see comparison',
                    tabs: [
                        {
                            id: 'general',
                            label: 'General Criteria',
                            legend: [
                                { value: 'good', color: 'bg-green-500', label: 'Good' },
                                { value: 'average', color: 'bg-yellow-500', label: 'Average' },
                                { value: 'poor', color: 'bg-red-500', label: 'Poor' },
                            ],
                            data: [
                                { criteria: 'Design dimension', preEngineered: { value: 'good', label: 'Good' }, conventionalSteel: { value: 'average', label: 'Average' }, reinforcedConcrete: { value: 'average', label: 'Average' } },
                                { criteria: 'Architectural flexibility', preEngineered: { value: 'good', label: 'Good' }, conventionalSteel: { value: 'poor', label: 'Poor' }, reinforcedConcrete: { value: 'poor', label: 'Poor' } },
                                { criteria: 'Quality control', preEngineered: { value: 'good', label: 'Good' }, conventionalSteel: { value: 'poor', label: 'Poor' }, reinforcedConcrete: { value: 'poor', label: 'Poor' } },
                                { criteria: 'Traceability of material', preEngineered: { value: 'good', label: 'Good' }, conventionalSteel: { value: 'average', label: 'Average' }, reinforcedConcrete: { value: 'poor', label: 'Poor' } },
                                { criteria: 'Delivery and logistics', preEngineered: { value: 'good', label: 'Good' }, conventionalSteel: { value: 'average', label: 'Average' }, reinforcedConcrete: { value: 'poor', label: 'Poor' } },
                                { criteria: 'Error modification', preEngineered: { value: 'good', label: 'Good' }, conventionalSteel: { value: 'poor', label: 'Poor' }, reinforcedConcrete: { value: 'good', label: 'Good' } },
                                { criteria: 'Future options', preEngineered: { value: 'good', label: 'Good' }, conventionalSteel: { value: 'poor', label: 'Poor' }, reinforcedConcrete: { value: 'average', label: 'Average' } },
                                { criteria: 'Efficiency', preEngineered: { value: 'good', label: 'Good' }, conventionalSteel: { value: 'average', label: 'Average' }, reinforcedConcrete: { value: 'good', label: 'Good' } },
                                { criteria: 'Seismic resistance', preEngineered: { value: 'good', label: 'Good' }, conventionalSteel: { value: 'poor', label: 'Poor' }, reinforcedConcrete: { value: 'poor', label: 'Poor' } },
                                { criteria: 'Lifespan of building', preEngineered: { value: 'good', label: 'Good' }, conventionalSteel: { value: 'good', label: 'Good' }, reinforcedConcrete: { value: 'average', label: 'Average' } },
                                { criteria: 'Construction accuracy', preEngineered: { value: 'good', label: 'Good' }, conventionalSteel: { value: 'good', label: 'Good' }, reinforcedConcrete: { value: 'poor', label: 'Poor' } },
                            ],
                        },
                        {
                            id: 'cost',
                            label: 'Cost Comparison',
                            legend: [
                                { value: 'low', color: 'bg-green-500', label: 'Low' },
                                { value: 'medium', color: 'bg-yellow-500', label: 'Medium' },
                                { value: 'high', color: 'bg-red-500', label: 'High' },
                            ],
                            data: [
                                { criteria: 'Design engineering', preEngineered: { value: 'low', label: 'Low' }, conventionalSteel: { value: 'medium', label: 'Medium' }, reinforcedConcrete: { value: 'low', label: 'Low' } },
                                { criteria: 'Materials', preEngineered: { value: 'low', label: 'Low' }, conventionalSteel: { value: 'high', label: 'High' }, reinforcedConcrete: { value: 'medium', label: 'Medium' } },
                                { criteria: 'Fabrication', preEngineered: { value: 'low', label: 'Low' }, conventionalSteel: { value: 'medium', label: 'Medium' }, reinforcedConcrete: { value: 'low', label: 'Low' } },
                                { criteria: 'Structure weight', preEngineered: { value: 'low', label: 'Low' }, conventionalSteel: { value: 'high', label: 'High' }, reinforcedConcrete: { value: 'high', label: 'High' } },
                                { criteria: 'Erection', preEngineered: { value: 'low', label: 'Low' }, conventionalSteel: { value: 'high', label: 'High' }, reinforcedConcrete: { value: 'low', label: 'Low' } },
                                { criteria: 'Delivery logistics', preEngineered: { value: 'low', label: 'Low' }, conventionalSteel: { value: 'medium', label: 'Medium' }, reinforcedConcrete: { value: 'high', label: 'High' } },
                                { criteria: 'Maintenance', preEngineered: { value: 'low', label: 'Low' }, conventionalSteel: { value: 'medium', label: 'Medium' }, reinforcedConcrete: { value: 'high', label: 'High' } },
                                { criteria: 'Foundation', preEngineered: { value: 'low', label: 'Low' }, conventionalSteel: { value: 'medium', label: 'Medium' }, reinforcedConcrete: { value: 'high', label: 'High' } },
                                { criteria: 'Building accessories', preEngineered: { value: 'low', label: 'Low' }, conventionalSteel: { value: 'high', label: 'High' }, reinforcedConcrete: { value: 'medium', label: 'Medium' } },
                            ],
                        },
                        {
                            id: 'time',
                            label: 'Time Comparison',
                            legend: [
                                { value: 'on-time', color: 'bg-green-500', label: 'On-Time' },
                                { value: 'average', color: 'bg-yellow-500', label: 'Average' },
                                { value: 'slow', color: 'bg-red-500', label: 'Slow' },
                            ],
                            data: [
                                { criteria: 'Total project time', preEngineered: { value: 'on-time', label: 'On-Time' }, conventionalSteel: { value: 'average', label: 'Average' }, reinforcedConcrete: { value: 'slow', label: 'Slow' } },
                                { criteria: 'Materials', preEngineered: { value: 'on-time', label: 'On-Time' }, conventionalSteel: { value: 'slow', label: 'Slow' }, reinforcedConcrete: { value: 'on-time', label: 'On-Time' } },
                                { criteria: 'Design engineering', preEngineered: { value: 'on-time', label: 'On-Time' }, conventionalSteel: { value: 'average', label: 'Average' }, reinforcedConcrete: { value: 'average', label: 'Average' } },
                                { criteria: 'Fabrication', preEngineered: { value: 'on-time', label: 'On-Time' }, conventionalSteel: { value: 'slow', label: 'Slow' }, reinforcedConcrete: { value: 'average', label: 'Average' } },
                                { criteria: 'Erection', preEngineered: { value: 'on-time', label: 'On-Time' }, conventionalSteel: { value: 'slow', label: 'Slow' }, reinforcedConcrete: { value: 'average', label: 'Average' } },
                                { criteria: 'Foundation', preEngineered: { value: 'on-time', label: 'On-Time' }, conventionalSteel: { value: 'average', label: 'Average' }, reinforcedConcrete: { value: 'slow', label: 'Slow' } },
                            ],
                        },
                    ],
                },
            },
            {
                sectionTypeSlug: 'content_with_image',
                order: 2,
                content: {
                    title: '',
                    paragraphs: [
                        'Acero\'s PEBs benefit from factory-controlled manufacturing processes, ensuring consistency and high quality across components. Precision engineering reduces the need for on-site adjustments, minimizing the potential for errors during construction. Acero\'s PEBs optimize material usage through computerized design, reducing waste and enhancing efficiency. Strict quality control measures during fabrication and assembly contribute to the overall quality assurance of Acero\'s PEBs.',
                    ],
                    layout: 'text-only',
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

        console.log(`\n✓ PEB Comparison page seeding completed! (${sectionsCreated} created, ${sectionsUpdated} updated)`);
        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error);
        process.exit(1);
    }
};

if (require.main === module) seedProductsPebComparison();
module.exports = seedProductsPebComparison;

