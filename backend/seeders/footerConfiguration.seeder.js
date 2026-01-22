const path = require('path');

// Load environment variables FIRST, before requiring database config
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
// Fallback to .env.local if .env doesn't exist
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}

// Now require modules that depend on environment variables
const mongoose = require('mongoose');
const FooterConfiguration = require('../models/FooterConfiguration');
const connectDB = require('../configs/database');
const User = require('../models/User');

// Footer configuration data mapped from frontend/components/footer.tsx
const footerConfigData = {
    title: 'Footer Configuration',
    brandInfo: {
        logo: {
            imageUrl: null, // Logo is currently rendered as SVG in frontend, can be updated later
            altText: 'Acero Logo'
        },
        description: 'Leading steel manufacturing company in the UAE. Delivering premium quality steel products with industrial excellence and modern innovation.',
        isFieldActive: true
    },
    contactInfo: {
        phone: '+971 4 893 1000',
        email: 'info@acero.ae',
        address: 'Jebel Ali Industrial Area 1,\nDubai, United Arab Emirates',
        isFieldActive: true
    },
    socialLinks: [
        {
            platform: 'LinkedIn',
            href: '#',
            icon: null, // Icon is rendered as SVG in frontend
            isFieldActive: true
        },
        {
            platform: 'Twitter',
            href: '#',
            icon: null,
            isFieldActive: true
        },
        {
            platform: 'Instagram',
            href: '#',
            icon: null,
            isFieldActive: true
        },
        {
            platform: 'YouTube',
            href: '#',
            icon: null,
            isFieldActive: true
        }
    ],
    quickLinks: [
        { label: 'Who We Are', href: '/who-we-are', isFieldActive: true },
        { label: 'Manufacturing', href: '/products/manufacturing', isFieldActive: true },
        { label: 'Projects', href: '/projects', isFieldActive: true },
        { label: 'Career', href: '/career', isFieldActive: true },
        { label: 'Contact Us', href: '/contact-us', isFieldActive: true } // Note: frontend has /contact but should be /contact-us
    ],
    productsLinks: [
        { label: 'PEB', href: '/products/peb', isFieldActive: true },
        { label: 'Conventional Steel', href: '/products/conventional-steel', isFieldActive: true },
        { label: 'Racking Systems', href: '/products/racking-systems', isFieldActive: true },
        { label: 'Porta Cabins', href: '/products/porta-cabins', isFieldActive: true },
        { label: 'Accessories', href: '/products/accessories', isFieldActive: true },
        { label: 'PEB Comparison', href: '/products/peb-comparison', isFieldActive: true }
    ],
    mediaLinks: [
        { label: 'Literature', href: '/media/literature', isFieldActive: true },
        { label: 'Videos', href: '/media/video', isFieldActive: true },
        { label: 'Company Update', href: '/media/company-update', isFieldActive: true }
    ],
    copyright: {
        text: 'Acero Steel Manufacturing. All rights reserved.',
        year: new Date().getFullYear(),
        isFieldActive: true
    },
    legalLinks: [
        { label: 'Privacy Policy', href: '/privacy', isFieldActive: true },
        { label: 'Terms of Service', href: '/terms', isFieldActive: true }
    ]
};

// Seed function
const seedFooterConfiguration = async () => {
    try {
        // Verify MONGODB_URI is defined
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables. Please create a .env file in the backend directory with MONGODB_URI=your_connection_string');
        }

        await connectDB();

        console.log('Starting footer configuration seeding...\n');

        // Get or find a user for createdBy field
        let user = await User.findOne().sort({ createdAt: 1 }); // Get first user (oldest)
        
        if (!user) {
            console.log('⚠️  No users found in database.');
            console.log('Please create a user first or run the setup script.');
            console.log('You can create a user via the admin panel or use: node scripts/setupSuperAdmin.js\n');
            throw new Error('No user found. Please create a user first.');
        }

        console.log(`Using user: ${user.email} (${user.firstName} ${user.lastName})\n`);

        // Check if footer configuration already exists
        const existingConfig = await FooterConfiguration.findOne({ featured: true });
        
        if (existingConfig) {
            console.log('⚠️  Footer configuration with featured: true already exists.');
            console.log('Updating existing configuration...\n');
            
            // Update existing configuration
            existingConfig.title = footerConfigData.title;
            existingConfig.brandInfo = footerConfigData.brandInfo;
            existingConfig.contactInfo = footerConfigData.contactInfo;
            existingConfig.socialLinks = footerConfigData.socialLinks;
            existingConfig.quickLinks = footerConfigData.quickLinks;
            existingConfig.productsLinks = footerConfigData.productsLinks;
            existingConfig.mediaLinks = footerConfigData.mediaLinks;
            existingConfig.copyright = footerConfigData.copyright;
            existingConfig.legalLinks = footerConfigData.legalLinks;
            existingConfig.status = 'draft'; // Set to draft initially
            existingConfig.featured = true;
            existingConfig.isActive = true;
            existingConfig.updatedBy = user._id;
            
            await existingConfig.save();
            
            console.log('✓ Footer configuration updated successfully!\n');
            console.log(`  Status: ${existingConfig.status}`);
            console.log(`  Featured: ${existingConfig.featured}`);
            console.log(`  Active: ${existingConfig.isActive}`);
            console.log(`  Quick Links: ${existingConfig.quickLinks.length}`);
            console.log(`  Products Links: ${existingConfig.productsLinks.length}`);
            console.log(`  Media Links: ${existingConfig.mediaLinks.length}`);
            console.log(`  Social Links: ${existingConfig.socialLinks.length}`);
            console.log(`  Legal Links: ${existingConfig.legalLinks.length}\n`);
        } else {
            // Create new configuration
            const footerConfig = await FooterConfiguration.create({
                ...footerConfigData,
                status: 'draft', // Initially in draft status for workflow testing
                featured: true,
                isActive: true,
                createdBy: user._id
            });

            console.log('✓ Footer configuration created successfully!\n');
            console.log(`  ID: ${footerConfig._id}`);
            console.log(`  Status: ${footerConfig.status}`);
            console.log(`  Featured: ${footerConfig.featured}`);
            console.log(`  Active: ${footerConfig.isActive}`);
            console.log(`  Quick Links: ${footerConfig.quickLinks.length}`);
            console.log(`  Products Links: ${footerConfig.productsLinks.length}`);
            console.log(`  Media Links: ${footerConfig.mediaLinks.length}`);
            console.log(`  Social Links: ${footerConfig.socialLinks.length}`);
            console.log(`  Legal Links: ${footerConfig.legalLinks.length}\n`);
        }

        // Display contact information
        console.log('Contact Information:');
        console.log(`  Phone: ${footerConfigData.contactInfo.phone}`);
        console.log(`  Email: ${footerConfigData.contactInfo.email}`);
        console.log(`  Address: ${footerConfigData.contactInfo.address.replace('\n', ', ')}\n`);

        // Display social links
        console.log('Social Links:');
        footerConfigData.socialLinks.forEach((social) => {
            console.log(`  ${social.platform}: ${social.href}`);
        });

        console.log('\n⚠️  IMPORTANT: Footer configuration is in DRAFT status.');
        console.log('   It will NOT appear on the frontend until status is changed to "published".');
        console.log('   This is by design for workflow testing.\n');

        console.log('Footer configuration seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding footer configuration:', error);
        process.exit(1);
    }
};

// Run seeder if called directly
if (require.main === module) {
    seedFooterConfiguration();
}

module.exports = { seedFooterConfiguration, footerConfigData };

