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
 * Seed Homepage with all sections from frontend/app/page.tsx
 */
const seedHomepage = async () => {
    try {
        // Verify MONGODB_URI
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }

        await connectDB();

        console.log('Starting Homepage seeding...\n');

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

        // Step 1: Create or update Homepage Page
        let homepage = await Page.findOne({ slug: 'home' });
        
        if (!homepage) {
            homepage = await Page.create({
                title: 'Home',
                slug: 'home',
                path: '/',
                parentId: null,
                level: 0,
                order: 0,
                metaTitle: 'Acero | Premium Steel Manufacturing UAE',
                metaDescription: 'Leading steel manufacturing company in the UAE. Delivering premium quality steel products with industrial excellence and modern innovation.',
                metaKeywords: 'steel manufacturing,UAE,industrial,steel products,premium steel,construction materials,Acero,Dubai steel',
                showInMenu: false, // Homepage typically not shown in menu
                status: 'draft',
                isActive: true,
                createdBy: user._id,
            });
            console.log('✓ Created homepage page');
        } else {
            console.log('✓ Homepage page already exists');
        }

        // Step 2: Create Sections (in order)
        // Note: Images use Cloudinary URLs. When updating existing sections, images are preserved.
        const sectionsData = [
            {
                // Section 1: Hero Carousel
                sectionTypeSlug: 'hero_carousel',
                order: 0,
                preserveImages: true, // Don't overwrite existing images
                content: {
                    slides: [
                        {
                            image: 'https://res.cloudinary.com/dwaw2hfch/image/upload/v1769155248/acero-cms/hero/yckoqubyvqzcnplrbmch.jpg',
                            title: 'GLOBAL REACH, LOCAL IMPACT',
                            description: 'Our extensive global network empowers us to serve customers across borders while maintaining a localized approach, our steel building systems resonate with local needs.',
                        },
                        {
                            image: 'https://res.cloudinary.com/dwaw2hfch/image/upload/v1769157172/acero-cms/hero/xrcfo73nkq7fxtcdmrmb.jpg',
                            title: 'MANUFACTURING MASTERY',
                            description: 'With a robust production capacity exceeding 100,000 tons per year, we stand tall as industry leaders. Our commitment to precision and quality ensures that every ton we produce meets the highest standards.',
                        },
                        {
                            image: 'https://res.cloudinary.com/dwaw2hfch/image/upload/v1769158570/acero-cms/hero/idt55f4mjjdmestlongp.jpg',
                            title: 'ENGINEERING EXCELLENCE',
                            description: 'Our engineering prowess lies in our ability to deliver steel buildings that are not only precise but also cost-effective. We optimize designs, processes and materials to create value for our customers.',
                        },
                        {
                            image: 'https://res.cloudinary.com/dwaw2hfch/image/upload/v1769159048/acero-cms/hero/mnofe5i0qrqejmppezuk.jpg',
                            title: 'QUALITY UNCOMPROMISED',
                            description: 'From the moment raw materials arrive at our doorstep, we embark on a journey of excellence. Our unwavering commitment to quality ensures that each product leaving our facility bears the mark of excellence.',
                        },
                        {
                            image: 'https://res.cloudinary.com/dwaw2hfch/image/upload/v1769432396/acero-cms/hero/yuek0tfe2wjs8agdo8su.jpg',
                            title: 'SAFETY FIRST',
                            description: 'Our relentless pursuit of safety drives us toward our goal: zero accidents. We invest in training, protocols and cutting-edge technology to safeguard our workforce and the communities we serve.',
                        },
                    ],
                    autoPlay: true,
                    interval: 5000,
                },
            },
            {
                // Section 2: Complete Steel Building Solutions
                sectionTypeSlug: 'content_with_image',
                order: 1,
                preserveImages: true, // Don't overwrite existing images
                content: {
                    title: 'Complete Steel Building Solutions',
                    paragraphs: [
                        'Acero Building Systems provides total solutions for customized steel buildings, including design, manufacture and supply, using internationally recognized engineering software and advanced production equipment. Acero specializes in Pre-Engineered Steel Buildings (fast-track and customized solutions), Conventional Steel Buildings, Roof and Wall Systems, Porta Cabins, Racking Systems and Building Accessories.',
                    ],
                    image: 'https://res.cloudinary.com/dwaw2hfch/image/upload/v1769155248/acero-cms/hero/yckoqubyvqzcnplrbmch.jpg',
                    imageAlt: 'Complete Steel Building Solutions',
                    layout: 'image-right',
                    cta: {
                        label: 'Learn More',
                        href: '/products',
                    },
                },
            },
            {
                // Section 3: Company Information Stats
                sectionTypeSlug: 'statistics',
                order: 2,
                content: {
                    title: null, // No title for stats section
                    stats: [
                        {
                            value: '100+',
                            label: 'Countries',
                            sublabel: 'Sales Distribution Network',
                        },
                        {
                            value: '100,000+',
                            label: 'MT / Year',
                            sublabel: 'Manufacturing Capacity',
                        },
                        {
                            value: '1,000+',
                            label: 'Number of Employees',
                            sublabel: 'Human Resource Globally',
                        },
                    ],
                    columns: 3,
                },
            },
            {
                // Section 4: Products Grid
                sectionTypeSlug: 'products_grid',
                order: 3,
                content: {
                    title: 'Our Products',
                    subtitle: 'Comprehensive steel building solutions designed for industrial, commercial and infrastructure projects.',
                },
            },
            {
                // Section 5: Quality Certifications
                sectionTypeSlug: 'infinite_carousel',
                order: 4,
                content: {
                    title: 'Our Quality Certifications',
                    subtitle: 'Certified quality standards that reflect our commitment to engineering excellence and reliable delivery.',
                    items: [
                        { image: '/images/certifications/iso-9001.png', alt: 'ISO 9001' },
                        { image: '/images/certifications/iso-14001.png', alt: 'ISO 14001' },
                        { image: '/images/certifications/ohsas-18001.png', alt: 'OHSAS 18001' },
                        { image: '/images/certifications/ce-mark.png', alt: 'CE Mark' },
                        { image: '/images/certifications/astm.png', alt: 'ASTM' },
                        { image: '/images/certifications/aisc.png', alt: 'AISC' },
                    ],
                    speed: 'medium',
                    direction: 'left',
                    pauseOnHover: true,
                    itemClassName: 'h-20 w-32 md:h-24 md:w-40',
                },
            },
            {
                // Section 6: Our Projects
                sectionTypeSlug: 'projects_grid',
                order: 5,
                content: {
                    title: 'Our Projects',
                    subtitle: 'Showcasing our expertise through successful steel building projects',
                    projects: [
                        {
                            id: '1',
                            title: 'Industrial Warehouse Complex',
                            description: 'A state-of-the-art warehouse facility spanning 50,000 square meters, showcasing our PEB expertise.',
                            image: '/images/projects/project-1.jpg',
                            category: 'PEB',
                            link: '/projects/industrial-warehouse',
                        },
                        {
                            id: '2',
                            title: 'Commercial Office Building',
                            description: 'Modern steel-framed office complex demonstrating our conventional steel building capabilities.',
                            image: '/images/projects/project-2.jpg',
                            category: 'Conventional',
                            link: '/projects/commercial-office',
                        },
                        {
                            id: '3',
                            title: 'Distribution Center',
                            description: 'Large-scale distribution center with advanced racking systems and optimized storage solutions.',
                            image: '/images/projects/project-3.jpg',
                            category: 'Racking Systems',
                            link: '/projects/distribution-center',
                        },
                    ],
                },
            },
            {
                // Section 7: Our Customers
                sectionTypeSlug: 'infinite_carousel',
                order: 6,
                content: {
                    title: 'Our Customers',
                    subtitle: 'Trusted by leading companies across the UAE, India and global markets.',
                    items: [
                        { image: '/images/customers/customer-1.png', alt: 'Customer 1' },
                        { image: '/images/customers/customer-2.png', alt: 'Customer 2' },
                        { image: '/images/customers/customer-3.png', alt: 'Customer 3' },
                        { image: '/images/customers/customer-4.png', alt: 'Customer 4' },
                        { image: '/images/customers/customer-5.png', alt: 'Customer 5' },
                        { image: '/images/customers/customer-6.png', alt: 'Customer 6' },
                    ],
                    speed: 'slow',
                    direction: 'left',
                    pauseOnHover: true,
                    itemClassName: 'h-16 w-32 md:h-20 md:w-40',
                },
            },
            {
                // Section 8: Company Updates
                sectionTypeSlug: 'company_updates',
                order: 7,
                content: {
                    title: 'Company Updates',
                    subtitle: 'Stay updated with our latest news and announcements',
                    updates: [
                        {
                            id: '1',
                            title: 'New Manufacturing Facility Expansion',
                            description: 'We\'re excited to announce the expansion of our manufacturing facility, increasing our production capacity by 30%.',
                            image: '/images/updates/update-1.jpg',
                            date: '2024-01-15',
                            category: 'Company News',
                            link: '/media/company-update/facility-expansion',
                        },
                        {
                            id: '2',
                            title: 'Award for Excellence in Safety',
                            description: 'Acero has been recognized with the prestigious safety award for maintaining zero accidents for three consecutive years.',
                            image: '/images/updates/update-2.jpg',
                            date: '2024-02-20',
                            category: 'Awards',
                            link: '/media/company-update/safety-award',
                        },
                        {
                            id: '3',
                            title: 'Launch of New Product Line',
                            description: 'Introducing our new line of eco-friendly steel building solutions, designed for sustainable construction.',
                            image: '/images/updates/update-3.jpg',
                            date: '2024-03-10',
                            category: 'Products',
                            link: '/media/company-update/new-product-line',
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
                pageId: homepage._id,
                sectionTypeSlug: sectionData.sectionTypeSlug,
                order: sectionData.order,
            });

            if (!section) {
                section = await Section.create({
                    pageId: homepage._id,
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
                // If preserveImages is true, merge content but keep existing images
                if (sectionData.preserveImages && section.content) {
                    const existingContent = section.content;
                    const newContent = { ...sectionData.content };
                    
                    // Preserve existing image field if it exists and is a valid URL
                    if (existingContent.image && existingContent.image.startsWith('http')) {
                        newContent.image = existingContent.image;
                    }
                    
                    // Preserve existing slides images if they exist
                    if (existingContent.slides && Array.isArray(existingContent.slides)) {
                        const existingSlides = existingContent.slides;
                        if (newContent.slides && Array.isArray(newContent.slides)) {
                            newContent.slides = newContent.slides.map((slide, index) => {
                                if (existingSlides[index] && existingSlides[index].image && existingSlides[index].image.startsWith('http')) {
                                    return { ...slide, image: existingSlides[index].image };
                                }
                                return slide;
                            });
                        }
                    }
                    
                    section.content = newContent;
                } else {
                    section.content = sectionData.content;
                }
                section.isVisible = true;
                await section.save();
                sectionsUpdated++;
                console.log(`✓ Updated section ${sectionData.order + 1}: ${sectionData.sectionTypeSlug}`);
            }
        }

        console.log('\n=== Seeding Summary ===');
        console.log(`Page: ${homepage.title} (${homepage.slug})`);
        console.log(`Sections created: ${sectionsCreated}`);
        console.log(`Sections updated: ${sectionsUpdated}`);
        console.log(`Sections skipped: ${sectionsSkipped}`);
        console.log(`Total sections: ${sectionsData.length}\n`);

        console.log('✓ Homepage seeding completed successfully!');
        console.log('\nNote: All sections are in draft status. Publish them via the admin panel when ready.');
        process.exit(0);
    } catch (error) {
        console.error('✗ Error seeding homepage:', error);
        process.exit(1);
    }
};

// Run seeder if called directly
if (require.main === module) {
    seedHomepage();
}

module.exports = seedHomepage;

