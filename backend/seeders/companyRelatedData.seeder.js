const path = require('path');

// Load environment variables FIRST, before requiring database config
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
// Fallback to .env.local if .env doesn't exist
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}

// Now require modules that depend on environment variables
const mongoose = require('mongoose');
const Certification = require('../models/Certification');
const Customer = require('../models/Customer');
const CompanyUpdateCategory = require('../models/CompanyUpdateCategory');
const CompanyUpdate = require('../models/CompanyUpdate');
const Brochure = require('../models/Brochure');
const Branch = require('../models/Branch');
const Country = require('../models/Country');
const User = require('../models/User');
const connectDB = require('../configs/database');

// Helper function to generate slug from name
function generateSlug(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Certifications data (from frontend/app/page.tsx and frontend/app/products/manufacturing/page.tsx)
const certificationsData = [
    { name: 'ISO 9001', image: '/images/certifications/iso-9001.png' },
    { name: 'ISO 14001', image: '/images/certifications/iso-14001.png' },
    { name: 'ISO 45001', image: '/images/certificates/iso-45001.jpg' },
    { name: 'OHSAS 18001', image: '/images/certifications/ohsas-18001.png' },
    { name: 'AS/NZS ISO 3834', image: '/images/certificates/as-nzs-iso-3834.jpg' },
    { name: 'EN 1090-1', image: '/images/certificates/en-1090-1.jpg' },
    { name: 'QHSE Policy', image: '/images/certificates/qhse-policy.jpg' },
    { name: 'CE Mark', image: '/images/certifications/ce-mark.png' },
    { name: 'ASTM', image: '/images/certifications/astm.png' },
    { name: 'AISC', image: '/images/certifications/aisc.png' },
];

// Customers data (from frontend/app/page.tsx)
const customersData = [
    { name: 'Customer 1', image: '/images/customers/customer-1.png', order: 0 },
    { name: 'Customer 2', image: '/images/customers/customer-2.png', order: 1 },
    { name: 'Customer 3', image: '/images/customers/customer-3.png', order: 2 },
    { name: 'Customer 4', image: '/images/customers/customer-4.png', order: 3 },
    { name: 'Customer 5', image: '/images/customers/customer-5.png', order: 4 },
    { name: 'Customer 6', image: '/images/customers/customer-6.png', order: 5 },
];

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
    },
];

// Brochures data (from frontend/utils/brochures-data.ts)
const brochuresData = [
    {
        title: 'Company Overview Brochure',
        description: 'Comprehensive overview of our company and services',
        brochureImage: {
            url: '/placeholder.jpg',
            publicId: 'brochures/company-overview',
            width: 300,
            height: 400,
        },
        order: 0,
    },
    {
        title: 'Product Catalog 2024',
        description: 'Complete catalog of our steel products and solutions',
        brochureImage: {
            url: '/placeholder.jpg',
            publicId: 'brochures/product-catalog',
            width: 300,
            height: 400,
        },
        order: 1,
    },
    {
        title: 'PEB Solutions Guide',
        description: 'Detailed guide to Pre-Engineered Building solutions',
        brochureImage: {
            url: '/placeholder.jpg',
            publicId: 'brochures/peb-solutions',
            width: 300,
            height: 400,
        },
        order: 2,
    },
    {
        title: 'Sustainability Report',
        description: 'Our commitment to sustainable steel manufacturing',
        brochureImage: {
            url: '/placeholder.jpg',
            publicId: 'brochures/sustainability',
            width: 300,
            height: 400,
        },
        order: 3,
    },
    {
        title: 'Technical Specifications',
        description: 'Technical specifications for all our products',
        brochureImage: {
            url: '/placeholder.jpg',
            publicId: 'brochures/technical-specs',
            width: 300,
            height: 400,
        },
        order: 4,
    },
    {
        title: 'Case Studies Portfolio',
        description: 'Success stories and case studies from our projects',
        brochureImage: {
            url: '/placeholder.jpg',
            publicId: 'brochures/case-studies',
            width: 300,
            height: 400,
        },
        order: 5,
    },
];

// Branches data (from frontend/utils/branches-data.ts)
const branchesData = [
    {
        branchName: 'Acero Building Systems - Dubai',
        location: 'Dubai',
        countryName: 'United Arab Emirates',
        email: 'info@acero.ae',
        phone: '+97148931000',
        address: 'Jebel Ali Industrial Area 1, Dubai, United Arab Emirates',
        logo: '/images/branches/dubai-logo.png',
        coordinates: { lat: 24.9848, lng: 55.0962 },
        isHeadOffice: true,
        googleLink: 'https://maps.google.com/?q=24.9848,55.0962',
    },
    {
        branchName: 'Acero Building Systems - Abu Dhabi',
        location: 'Abu Dhabi',
        countryName: 'United Arab Emirates',
        email: 'abudhabi@acero.ae',
        phone: '+97125000000',
        address: 'Industrial Area, Abu Dhabi, United Arab Emirates',
        logo: '/images/branches/abudhabi-logo.png',
        coordinates: { lat: 24.4539, lng: 54.3773 },
        isHeadOffice: false,
        googleLink: 'https://maps.google.com/?q=24.4539,54.3773',
    },
    {
        branchName: 'Acero Building Systems - Kannur',
        location: 'Kannur',
        countryName: 'India',
        email: 'kannur@acero.ae',
        phone: '+914971234567',
        address: 'Industrial Estate, Kannur, Kerala, India',
        logo: '/images/branches/kannur-logo.png',
        coordinates: { lat: 11.8745, lng: 75.3704 },
        isHeadOffice: false,
        googleLink: 'https://maps.google.com/?q=11.8745,75.3704',
    },
    {
        branchName: 'Acero Building Systems - Kochi',
        location: 'Kochi',
        countryName: 'India',
        email: 'kochi@acero.ae',
        phone: '+914844123456',
        address: 'Industrial Area, Kochi, Kerala, India',
        logo: '/images/branches/kochi-logo.png',
        coordinates: { lat: 9.9312, lng: 76.2673 },
        isHeadOffice: false,
        googleLink: 'https://maps.google.com/?q=9.9312,76.2673',
    },
    {
        branchName: 'Acero Building Systems - Hyderabad',
        location: 'Hyderabad',
        countryName: 'India',
        email: 'hyderabad@acero.ae',
        phone: '+914012345678',
        address: 'Industrial Park, Hyderabad, Telangana, India',
        logo: '/images/branches/hyderabad-logo.png',
        coordinates: { lat: 17.3850, lng: 78.4867 },
        isHeadOffice: false,
        googleLink: 'https://maps.google.com/?q=17.3850,78.4867',
    },
    {
        branchName: 'Acero Building Systems - Cairo',
        location: 'Cairo',
        countryName: 'Egypt',
        email: 'cairo@acero.ae',
        phone: '+20212345678',
        address: 'Industrial Zone, Cairo, Egypt',
        logo: '/images/branches/cairo-logo.png',
        coordinates: { lat: 30.0444, lng: 31.2357 },
        isHeadOffice: false,
        googleLink: 'https://maps.google.com/?q=30.0444,31.2357',
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

        console.log('Starting Company Related Data seeding...\n');

        // Get or find a user for createdBy field
        let user = await User.findOne().sort({ createdAt: 1 }); // Get first user (oldest)
        
        if (!user) {
            console.log('⚠️  No users found in database.');
            console.log('Please create a user first or run the setup script.');
            console.log('You can create a user via the admin panel or use: node scripts/setupSuperAdmin.js\n');
            throw new Error('No user found. Please create a user first.');
        }

        console.log(`Using user: ${user.email} (${user.firstName} ${user.lastName})\n`);

        // 1. Seed Certifications
        console.log('1. Seeding Certifications...');
        let certificationsCreated = 0;
        let certificationsSkipped = 0;

        for (const certData of certificationsData) {
            const existing = await Certification.findOne({ name: certData.name });
            
            if (!existing) {
                await Certification.create({
                    name: certData.name,
                    certificationImage: {
                        url: certData.image,
                        publicId: null, // Will be updated when uploaded to Cloudinary
                        width: null,
                        height: null,
                    },
                    status: 'published',
                    featured: true,
                    isActive: true,
                    publishedAt: new Date(),
                    createdBy: user._id,
                });
                certificationsCreated++;
            } else {
                // Update existing to published if not already
                if (existing.status !== 'published' || !existing.featured) {
                    existing.status = 'published';
                    existing.featured = true;
                    existing.publishedAt = existing.publishedAt || new Date();
                    await existing.save();
                    certificationsCreated++;
                } else {
                    certificationsSkipped++;
                }
            }
        }

        console.log(`   ✓ Created/Updated: ${certificationsCreated}, Skipped: ${certificationsSkipped}\n`);

        // 2. Seed Customers
        console.log('2. Seeding Customers...');
        let customersCreated = 0;
        let customersSkipped = 0;

        for (const customerData of customersData) {
            const existing = await Customer.findOne({ name: customerData.name });
            
            if (!existing) {
                await Customer.create({
                    name: customerData.name,
                    customerImage: {
                        url: customerData.image,
                        publicId: null,
                        width: null,
                        height: null,
                    },
                    order: customerData.order,
                    status: 'published',
                    featured: true,
                    isActive: true,
                    publishedAt: new Date(),
                    createdBy: user._id,
                });
                customersCreated++;
            } else {
                // Update existing to published if not already
                if (existing.status !== 'published' || !existing.featured) {
                    existing.status = 'published';
                    existing.featured = true;
                    existing.publishedAt = existing.publishedAt || new Date();
                    if (existing.order !== customerData.order) {
                        existing.order = customerData.order;
                    }
                    await existing.save();
                    customersCreated++;
                } else {
                    customersSkipped++;
                }
            }
        }

        console.log(`   ✓ Created/Updated: ${customersCreated}, Skipped: ${customersSkipped}\n`);

        // 3. Seed Company Update Categories
        console.log('3. Seeding Company Update Categories...');
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

        // 4. Seed Company Updates
        console.log('4. Seeding Company Updates...');
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
                    featured: updateData.featured !== undefined ? updateData.featured : true, // Default to featured
                    isActive: true,
                    publishedAt: updateData.eventDate || new Date(),
                    createdBy: user._id,
                };

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

        // 5. Seed Brochures
        console.log('5. Seeding Brochures...');
        let brochuresCreated = 0;
        let brochuresSkipped = 0;

        for (const brochureData of brochuresData) {
            const existing = await Brochure.findOne({ title: brochureData.title });
            
            if (!existing) {
                await Brochure.create({
                    title: brochureData.title,
                    description: brochureData.description,
                    brochureImage: {
                        url: brochureData.brochureImage.url,
                        publicId: brochureData.brochureImage.publicId,
                        width: brochureData.brochureImage.width,
                        height: brochureData.brochureImage.height,
                    },
                    order: brochureData.order,
                    status: 'published',
                    featured: true,
                    isActive: true,
                    publishedAt: new Date(),
                    createdBy: user._id,
                });
                brochuresCreated++;
            } else {
                // Update existing to published if not already
                if (existing.status !== 'published' || !existing.featured) {
                    existing.status = 'published';
                    existing.featured = true;
                    existing.publishedAt = existing.publishedAt || new Date();
                    if (existing.order !== brochureData.order) {
                        existing.order = brochureData.order;
                    }
                    await existing.save();
                    brochuresCreated++;
                } else {
                    brochuresSkipped++;
                }
            }
        }

        console.log(`   ✓ Created/Updated: ${brochuresCreated}, Skipped: ${brochuresSkipped}\n`);

        // 6. Seed Branches
        console.log('6. Seeding Branches...');
        let branchesCreated = 0;
        let branchesSkipped = 0;

        // Load countries for branch references
        const countries = await Country.find({ isActive: true });
        const countryMap = new Map();
        countries.forEach(c => {
            countryMap.set(c.name, c._id);
        });

        for (const branchData of branchesData) {
            const countryId = countryMap.get(branchData.countryName);
            
            if (!countryId) {
                console.log(`   ⚠️  Warning: Country "${branchData.countryName}" not found for branch "${branchData.branchName}"`);
                continue;
            }
            
            // Extract state from address or use location
            const state = branchData.address.split(',')[1]?.trim() || branchData.location;
            
            const existing = await Branch.findOne({ branchName: branchData.branchName });
            
            if (!existing) {
                await Branch.create({
                    branchName: branchData.branchName,
                    country: countryId,
                    state: state,
                    city: branchData.location,
                    address: branchData.address,
                    email: branchData.email,
                    phone: branchData.phone,
                    googleLink: branchData.googleLink,
                    isHeadOffice: branchData.isHeadOffice,
                    logo: branchData.logo ? {
                        url: branchData.logo,
                        publicId: null,
                        width: null,
                        height: null,
                    } : null,
                    status: 'published',
                    featured: true,
                    isActive: true,
                    publishedAt: new Date(),
                    createdBy: user._id,
                });
                branchesCreated++;
            } else {
                // Update existing to published if not already
                if (existing.status !== 'published' || !existing.featured) {
                    existing.status = 'published';
                    existing.featured = true;
                    existing.publishedAt = existing.publishedAt || new Date();
                    await existing.save();
                    branchesCreated++;
                } else {
                    branchesSkipped++;
                }
            }
        }

        console.log(`   ✓ Created/Updated: ${branchesCreated}, Skipped: ${branchesSkipped}\n`);

        // 7. Update all existing Company Updates to published and featured
        console.log('7. Updating all existing Company Updates to published and featured...');
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
        console.log('Company Related Data Seeding Summary:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`Certifications:        ${certificationsCreated} created/updated, ${certificationsSkipped} skipped (${certificationsData.length} total)`);
        console.log(`Customers:             ${customersCreated} created/updated, ${customersSkipped} skipped (${customersData.length} total)`);
        console.log(`Update Categories:     ${categoriesCreated} created/updated, ${categoriesSkipped} skipped (${companyUpdateCategoriesData.length} total)`);
        console.log(`Company Updates:       ${updatesCreated} created/updated, ${updatesSkipped} skipped (${companyUpdatesData.length} total)`);
        if (additionalUpdatesCount > 0) {
            console.log(`   Additional Updates: ${additionalUpdatesCount} existing updates set to published & featured`);
        }
        console.log(`Brochures:             ${brochuresCreated} created/updated, ${brochuresSkipped} skipped (${brochuresData.length} total)`);
        console.log(`Branches:              ${branchesCreated} created/updated, ${branchesSkipped} skipped (${branchesData.length} total)`);
        console.log('═══════════════════════════════════════════════════════════\n');

        console.log('✓ All company related data is in PUBLISHED status and marked as FEATURED.');
        console.log('   Data is ready for use in frontend.\n');

        console.log('Company Related Data seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding company related data:', error);
        process.exit(1);
    }
};

// Run seeder if called directly
if (require.main === module) {
    seedCompanyRelatedData();
}

module.exports = { seedCompanyRelatedData };

