const path = require('path');

// Load environment variables FIRST, before requiring database config
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
// Fallback to .env.local if .env doesn't exist
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}

// Now require modules that depend on environment variables
const CompanyUpdateCategory = require('../models/CompanyUpdateCategory');
const CompanyUpdate = require('../models/CompanyUpdate');
const User = require('../models/User');
const connectDB = require('../configs/database');

// Company Update Categories (extracted from company updates)
const companyUpdateCategoriesData = [
    { name: 'Company News', slug: 'company-news' },
    { name: 'Awards', slug: 'awards' },
    { name: 'Products', slug: 'products' },
    { name: 'Events', slug: 'events' },
];

// Company Updates data (from frontend/utils/company-updates-data.ts)
const companyUpdatesData = [
    {
        slug: 'acero-building-hosts-iftar-dinner',
        title: 'Acero Building Hosts Iftar Dinner for Employees and Families',
        heading: 'Acero Building Hosts Iftar Dinner for Employees and Families',
        categoryName: 'Events',
        shortDescription: 'Acero Building Systems organized a heartwarming Iftar Dinner for its employees and their families on March 22, 2024. Held at the Oaks Ibn Battuta Gate Hotel in Dubai, the event brought together the Acero family to break fast in the holy month of Ramadan.',
        description: `Acero Building Hosts Iftar Dinner for Employees and Families.

Acero Building Systems, a leading name in construction and innovation, recently organized a heartwarming Iftar Dinner for its employees and their families on March 22, 2024. Held at the Oaks Ibn Battuta Gate Hotel in Dubai, the event brought together the Acero family to break fast in the holy month of Ramadan.

The Iftar Dinner served as a remarkable occasion for all staff members to come together with their loved ones and share in the spirit of unity and togetherness. Against the backdrop of the serene setting, employees and their families had the opportunity to interact, fostering stronger bonds between colleagues, peers, and subordinates.

The event witnessed an overwhelming turnout, with employees from various departments joining in the festivities alongside their families. Laughter filled the air as children played and families mingled, creating an atmosphere of warmth and camaraderie.

The evening was marked by delicious cuisine, traditional Ramadan delicacies, and heartfelt conversations. As the sun set and the call to prayer echoed, attendees gathered to break their fast together, symbolizing unity and solidarity.

The Iftar Dinner not only provided an opportunity for employees and their families to share a meal but also served as a platform to reinforce Acero Building Systems' commitment to fostering a supportive and inclusive work environment.

As the evening drew to a close, attendees departed with hearts full of gratitude and cherished memories, strengthening the fabric of the Acero family. The success of the event underscores Acero Building Systems' dedication to nurturing strong relationships and fostering a sense of belonging among its employees.`,
        eventDate: new Date('2024-03-22'),
        featuredImage: {
            url: '/placeholder.jpg',
            publicId: 'company-updates/iftar-dinner',
            width: 1200,
            height: 800,
        },
        gallery: [
            {
                url: '/placeholder.jpg',
                publicId: 'company-updates/iftar-dinner-1',
                width: 800,
                height: 600,
                altText: 'Iftar Dinner Event',
                order: 0,
            },
            {
                url: '/placeholder.jpg',
                publicId: 'company-updates/iftar-dinner-2',
                width: 800,
                height: 600,
                altText: 'Iftar Dinner Event',
                order: 1,
            },
        ],
        featured: true,
        linkedInPosts: [
            {
                companyName: 'Acero Building Systems',
                date: 'March 2024',
                text: 'Strong. Reliable. Engineered by Acero.\n\nThis N-Truss Bridge in Madagascar designed, manufactured and supplied by Acero.',
                imageUrl: '/placeholder.jpg',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                videoThumbnail: '/placeholder.jpg',
                hashtags: ['#Acero', '#AceroSteel', '#PEB', '#SteelBridgeDesign', '#InfrastructureDevelopment', '#MadagascarProjects', '#EngineeringExcellence'],
                likes: 42,
                comments: 1,
                isVideo: true,
                publishedAt: new Date('2024-03-15'),
                order: 0,
            },
            {
                companyName: 'Acero Building Systems',
                date: 'February 2024',
                text: 'Celebrating another successful project completion. Our team\'s dedication to excellence shines through in every structure we build.',
                imageUrl: '/placeholder.jpg',
                hashtags: ['#Acero', '#ProjectCompletion', '#Excellence', '#SteelConstruction'],
                likes: 28,
                comments: 3,
                isVideo: false,
                publishedAt: new Date('2024-02-20'),
                order: 1,
            },
        ],
        banner: { url: '/placeholder.jpg', publicId: 'company-updates/iftar-banner', width: 1280, height: 960 },
        metaTitle: 'Acero Iftar Dinner 2024 | Company Update',
        metaImage: { url: '/placeholder.jpg', publicId: 'company-updates/iftar-meta', width: 150, height: 150 },
        metaDescription: 'Acero Building Systems organized an Iftar Dinner for employees and families in March 2024.',
        metaKeywords: ['acero', 'iftar', 'ramadan', 'company event', 'dubai'],
        showOnHomePage: true,
    },
    {
        slug: 'new-manufacturing-facility-inauguration',
        title: 'New Manufacturing Facility Inauguration',
        heading: 'New Manufacturing Facility Inauguration',
        categoryName: 'Company News',
        shortDescription: 'Acero Building Systems inaugurates state-of-the-art manufacturing facility to meet growing demand for steel structures.',
        description: `New Manufacturing Facility Inauguration.

Acero Building Systems has successfully inaugurated its new state-of-the-art manufacturing facility, marking a significant milestone in the company's expansion journey. The facility, equipped with the latest technology and machinery, will significantly increase production capacity and enable the company to meet the growing demand for high-quality steel structures.

The inauguration ceremony was attended by key stakeholders, partners, and members of the Acero team. The new facility represents our commitment to innovation, quality, and sustainable manufacturing practices.`,
        eventDate: new Date('2024-02-15'),
        featuredImage: {
            url: '/placeholder.jpg',
            publicId: 'company-updates/facility-inauguration',
            width: 1200,
            height: 800,
        },
        gallery: [
            {
                url: '/placeholder.jpg',
                publicId: 'company-updates/facility-1',
                width: 800,
                height: 600,
                altText: 'Manufacturing Facility',
                order: 0,
            },
            {
                url: '/placeholder.jpg',
                publicId: 'company-updates/facility-2',
                width: 800,
                height: 600,
                altText: 'Manufacturing Facility',
                order: 1,
            },
        ],
        featured: true,
        linkedInPosts: [
            {
                companyName: 'Acero Building Systems',
                date: 'February 2024',
                text: 'Innovation meets tradition. Our latest PEB project showcases the perfect blend of modern engineering and timeless quality.',
                imageUrl: '/placeholder.jpg',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                videoThumbnail: '/placeholder.jpg',
                hashtags: ['#Acero', '#PEB', '#Innovation', '#Engineering'],
                likes: 35,
                comments: 2,
                isVideo: true,
                publishedAt: new Date('2024-02-10'),
                order: 0,
            },
            {
                companyName: 'Acero Building Systems',
                date: 'January 2024',
                text: 'Quality is not an act, it is a habit. Our commitment to excellence drives everything we do at Acero.',
                imageUrl: '/placeholder.jpg',
                hashtags: ['#Acero', '#Quality', '#Excellence', '#SteelManufacturing'],
                likes: 19,
                comments: 0,
                isVideo: false,
                publishedAt: new Date('2024-01-05'),
                order: 1,
            },
        ],
        banner: { url: '/placeholder.jpg', publicId: 'company-updates/facility-banner', width: 1280, height: 960 },
        metaTitle: 'New Manufacturing Facility | Acero Building Systems',
        metaImage: { url: '/placeholder.jpg', publicId: 'company-updates/facility-meta', width: 150, height: 150 },
        metaDescription: 'Acero Building Systems inaugurates state-of-the-art manufacturing facility.',
        metaKeywords: ['acero', 'manufacturing', 'facility', 'expansion', 'steel'],
        showOnHomePage: true,
    },
    {
        slug: 'safety-excellence-award-2024',
        title: 'Safety Excellence Award 2024',
        heading: 'Acero Building Systems Wins Safety Excellence Award 2024',
        categoryName: 'Awards',
        shortDescription: 'Acero Building Systems has been recognized with the Safety Excellence Award 2024 for outstanding commitment to workplace safety and QHSE practices.',
        description: `Safety Excellence Award 2024.

Acero Building Systems has been honored with the Safety Excellence Award 2024 in recognition of our outstanding commitment to workplace safety, health, and environmental (QHSE) practices. The award reflects our zero-incident culture and continuous improvement in safety standards across all facilities.

Our safety programs, training initiatives, and on-site protocols have set industry benchmarks. The recognition underscores Acero's dedication to protecting our people and the environment while delivering world-class steel structures.`,
        eventDate: new Date('2024-04-10'),
        featuredImage: {
            url: '/placeholder.jpg',
            publicId: 'company-updates/safety-award',
            width: 1200,
            height: 800,
        },
        gallery: [
            {
                url: '/placeholder.jpg',
                publicId: 'company-updates/safety-award-1',
                width: 800,
                height: 600,
                altText: 'Safety Excellence Award',
                order: 0,
            },
        ],
        featured: true,
        linkedInPosts: [
            {
                companyName: 'Acero Building Systems',
                date: 'April 2024',
                text: 'Proud to receive the Safety Excellence Award 2024. Safety is not optional—it\'s our foundation. Thank you to every team member who makes our workplaces safe.',
                imageUrl: '/placeholder.jpg',
                hashtags: ['#Acero', '#SafetyFirst', '#QHSE', '#Award', '#Excellence'],
                likes: 52,
                comments: 4,
                isVideo: false,
                publishedAt: new Date('2024-04-12'),
                order: 0,
            },
        ],
        banner: { url: '/placeholder.jpg', publicId: 'company-updates/safety-award-banner', width: 1280, height: 960 },
        metaTitle: 'Safety Excellence Award 2024 | Acero Building Systems',
        metaImage: { url: '/placeholder.jpg', publicId: 'company-updates/safety-award-meta', width: 150, height: 150 },
        metaDescription: 'Acero Building Systems wins Safety Excellence Award 2024 for QHSE and workplace safety.',
        metaKeywords: ['acero', 'safety', 'award', 'QHSE', 'excellence'],
        showOnHomePage: false,
    },
    {
        slug: 'new-peb-product-line-launch',
        title: 'New PEB Product Line Launch',
        heading: 'Acero Launches New Pre-Engineered Building Product Line',
        categoryName: 'Products',
        shortDescription: 'Acero Building Systems launches an expanded Pre-Engineered Building (PEB) product line with enhanced design flexibility and sustainability features.',
        description: `New PEB Product Line Launch.

Acero Building Systems has launched an expanded Pre-Engineered Building (PEB) product line, offering enhanced design flexibility, faster delivery, and improved sustainability. The new range includes wider spans, better insulation options, and integrated solar-ready solutions.

Engineered for commercial, industrial, and institutional applications, the product line reinforces Acero's position as a leading provider of steel building solutions in the region.`,
        eventDate: new Date('2024-05-01'),
        featuredImage: {
            url: '/placeholder.jpg',
            publicId: 'company-updates/peb-product-launch',
            width: 1200,
            height: 800,
        },
        gallery: [
            {
                url: '/placeholder.jpg',
                publicId: 'company-updates/peb-product-1',
                width: 800,
                height: 600,
                altText: 'PEB Product Line',
                order: 0,
            },
            {
                url: '/placeholder.jpg',
                publicId: 'company-updates/peb-product-2',
                width: 800,
                height: 600,
                altText: 'PEB Product Line',
                order: 1,
            },
        ],
        featured: true,
        linkedInPosts: [
            {
                companyName: 'Acero Building Systems',
                date: 'May 2024',
                text: 'Introducing our new PEB product line: smarter design, faster delivery, built for the future. Discover what\'s new at Acero.',
                imageUrl: '/placeholder.jpg',
                hashtags: ['#Acero', '#PEB', '#SteelBuildings', '#Innovation', '#Sustainability'],
                likes: 38,
                comments: 2,
                isVideo: false,
                publishedAt: new Date('2024-05-02'),
                order: 0,
            },
        ],
        banner: { url: '/placeholder.jpg', publicId: 'company-updates/peb-product-banner', width: 1280, height: 960 },
        metaTitle: 'New PEB Product Line | Acero Building Systems',
        metaImage: { url: '/placeholder.jpg', publicId: 'company-updates/peb-product-meta', width: 150, height: 150 },
        metaDescription: 'Acero launches expanded Pre-Engineered Building product line with enhanced design and sustainability.',
        metaKeywords: ['acero', 'PEB', 'product launch', 'steel buildings', 'sustainability'],
        showOnHomePage: true,
    },
];

// Seed function
const seedCompanyRelatedData = async () => {
    try {
        // Verify MONGODB_URI is defined
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables. Please create a .env file in the backend directory with MONGODB_URI=your_connection_string');
        }

        await connectDB();

        console.log('Starting Company Updates seeding...\n');

        // Get or find a user for createdBy field
        let user = await User.findOne().sort({ createdAt: 1 }); // Get first user (oldest)
        
        if (!user) {
            console.log('⚠️  No users found in database.');
            console.log('Please create a user first or run the setup script.');
            console.log('You can create a user via the admin panel or use: node scripts/setupSuperAdmin.js\n');
            throw new Error('No user found. Please create a user first.');
        }

        console.log(`Using user: ${user.email} (${user.firstName} ${user.lastName})\n`);

        // 1. Seed Company Update Categories
        console.log('1. Seeding Company Update Categories...');
        const categoryMap = new Map();
        let categoriesCreated = 0;
        let categoriesSkipped = 0;

        for (const categoryData of companyUpdateCategoriesData) {
            let category = await CompanyUpdateCategory.findOne({ slug: categoryData.slug });
            
            if (!category) {
                category = await CompanyUpdateCategory.create({
                    name: categoryData.name,
                    slug: categoryData.slug,
                    status: 'published',
                    featured: true,
                    isActive: true,
                    publishedAt: new Date(),
                    createdBy: user._id,
                });
                categoriesCreated++;
            } else {
                // Update existing to published if not already
                if (category.status !== 'published' || !category.featured) {
                    category.status = 'published';
                    category.featured = true;
                    category.publishedAt = category.publishedAt || new Date();
                    await category.save();
                    categoriesCreated++;
                } else {
                    categoriesSkipped++;
                }
            }
            
            categoryMap.set(categoryData.name, category._id);
        }

        console.log(`   ✓ Created/Updated: ${categoriesCreated}, Skipped: ${categoriesSkipped}\n`);

        // 2. Seed Company Updates
        console.log('2. Seeding Company Updates...');
        let updatesCreated = 0;
        let updatesSkipped = 0;

        for (const updateData of companyUpdatesData) {
            const existing = await CompanyUpdate.findOne({ slug: updateData.slug });
            const categoryId = categoryMap.get(updateData.categoryName);
            
            if (!categoryId) {
                console.log(`   ⚠️  Warning: Category "${updateData.categoryName}" not found for update "${updateData.title}"`);
                continue;
            }
            
            if (!existing) {
                const updateDoc = {
                    title: updateData.title,
                    heading: updateData.heading,
                    slug: updateData.slug,
                    category: categoryId,
                    shortDescription: updateData.shortDescription,
                    description: updateData.description,
                    eventDate: updateData.eventDate,
                    featureImage: {
                        url: updateData.featuredImage.url,
                        publicId: updateData.featuredImage.publicId,
                        width: updateData.featuredImage.width,
                        height: updateData.featuredImage.height,
                    },
                    gallery: updateData.gallery.map(img => ({
                        url: img.url,
                        publicId: img.publicId,
                        width: img.width,
                        height: img.height,
                        altText: img.altText,
                        order: img.order,
                    })),
                    status: 'published',
                    featured: updateData.featured !== undefined ? updateData.featured : true,
                    isActive: true,
                    publishedAt: updateData.eventDate || new Date(),
                    showOnHomePage: updateData.showOnHomePage !== undefined ? updateData.showOnHomePage : false,
                    createdBy: user._id,
                };
                if (updateData.banner) {
                    updateDoc.banner = {
                        url: updateData.banner.url,
                        publicId: updateData.banner.publicId || null,
                        width: updateData.banner.width || null,
                        height: updateData.banner.height || null,
                    };
                }
                if (updateData.metaTitle) updateDoc.metaTitle = updateData.metaTitle;
                if (updateData.metaDescription) updateDoc.metaDescription = updateData.metaDescription;
                if (updateData.metaKeywords && Array.isArray(updateData.metaKeywords)) updateDoc.metaKeywords = updateData.metaKeywords;
                if (updateData.metaImage) {
                    updateDoc.metaImage = {
                        url: updateData.metaImage.url,
                        publicId: updateData.metaImage.publicId || null,
                        width: updateData.metaImage.width || null,
                        height: updateData.metaImage.height || null,
                    };
                }

                // Add LinkedIn posts if provided
                if (updateData.linkedInPosts && Array.isArray(updateData.linkedInPosts)) {
                    updateDoc.linkedInPosts = updateData.linkedInPosts.map(post => ({
                        companyName: post.companyName || 'Acero Building Systems',
                        date: post.date || '',
                        text: post.text || '',
                        imageUrl: post.imageUrl || null,
                        videoUrl: post.videoUrl || null,
                        videoThumbnail: post.videoThumbnail || null,
                        hashtags: post.hashtags || [],
                        likes: post.likes || 0,
                        comments: post.comments || 0,
                        isVideo: post.isVideo || false,
                        publishedAt: post.publishedAt || null,
                        order: post.order !== undefined ? post.order : 0,
                    }));
                }

                await CompanyUpdate.create(updateDoc);
                updatesCreated++;
            } else {
                // Update existing to published and featured if not already
                if (existing.status !== 'published' || !existing.featured) {
                    existing.status = 'published';
                    existing.featured = true;
                    existing.publishedAt = existing.publishedAt || updateData.eventDate || new Date();
                    
                    // Update LinkedIn posts if provided
                    if (updateData.linkedInPosts && Array.isArray(updateData.linkedInPosts)) {
                        existing.linkedInPosts = updateData.linkedInPosts.map(post => ({
                            companyName: post.companyName || 'Acero Building Systems',
                            date: post.date || '',
                            text: post.text || '',
                            imageUrl: post.imageUrl || null,
                            videoUrl: post.videoUrl || null,
                            videoThumbnail: post.videoThumbnail || null,
                            hashtags: post.hashtags || [],
                            likes: post.likes || 0,
                            comments: post.comments || 0,
                            isVideo: post.isVideo || false,
                            publishedAt: post.publishedAt || null,
                            order: post.order !== undefined ? post.order : 0,
                        }));
                    }
                    
                    await existing.save();
                    updatesCreated++;
                } else {
                    // Update LinkedIn posts even if already published
                    if (updateData.linkedInPosts && Array.isArray(updateData.linkedInPosts)) {
                        existing.linkedInPosts = updateData.linkedInPosts.map(post => ({
                            companyName: post.companyName || 'Acero Building Systems',
                            date: post.date || '',
                            text: post.text || '',
                            imageUrl: post.imageUrl || null,
                            videoUrl: post.videoUrl || null,
                            videoThumbnail: post.videoThumbnail || null,
                            hashtags: post.hashtags || [],
                            likes: post.likes || 0,
                            comments: post.comments || 0,
                            isVideo: post.isVideo || false,
                            publishedAt: post.publishedAt || null,
                            order: post.order !== undefined ? post.order : 0,
                        }));
                        await existing.save();
                        updatesCreated++;
                    } else {
                        updatesSkipped++;
                    }
                }
            }
        }

        console.log(`   ✓ Created: ${updatesCreated}, Skipped: ${updatesSkipped}\n`);

        // 3. Update all existing Company Updates to published and featured
        console.log('3. Updating all existing Company Updates to published and featured...');
        const updateResult = await CompanyUpdate.updateMany(
            {
                $or: [
                    { status: { $ne: 'published' } },
                    { featured: { $ne: true } },
                    { isActive: { $ne: true } }
                ]
            },
            {
                $set: {
                    status: 'published',
                    featured: true,
                    isActive: true
                }
            }
        );
        
        // Also set publishedAt for updates that don't have it
        await CompanyUpdate.updateMany(
            {
                publishedAt: null
            },
            {
                $set: {
                    publishedAt: new Date()
                }
            }
        );
        const additionalUpdatesCount = updateResult.modifiedCount;
        console.log(`   ✓ Updated ${additionalUpdatesCount} existing company updates to published and featured\n`);

        // Summary
        console.log('═══════════════════════════════════════════════════════════');
        console.log('Company Updates Seeding Summary:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`Update Categories:     ${categoriesCreated} created/updated, ${categoriesSkipped} skipped (${companyUpdateCategoriesData.length} total)`);
        console.log(`Company Updates:       ${updatesCreated} created/updated, ${updatesSkipped} skipped (${companyUpdatesData.length} total)`);
        if (additionalUpdatesCount > 0) {
            console.log(`   Additional Updates: ${additionalUpdatesCount} existing updates set to published & featured`);
        }
        console.log('═══════════════════════════════════════════════════════════\n');

        console.log('✓ All company updates are in PUBLISHED status and marked as FEATURED.');
        console.log('   Data is ready for use in frontend.\n');

        console.log('Company Updates seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding company updates:', error);
        process.exit(1);
    }
};

// Run seeder if called directly
if (require.main === module) {
    seedCompanyRelatedData();
}

module.exports = { seedCompanyRelatedData };

