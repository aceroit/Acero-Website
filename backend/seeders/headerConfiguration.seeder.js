const path = require('path');

// Load environment variables FIRST, before requiring database config
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
// Fallback to .env.local if .env doesn't exist
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}

// Now require modules that depend on environment variables
const mongoose = require('mongoose');
const HeaderConfiguration = require('../models/HeaderConfiguration');
const connectDB = require('../configs/database');
const User = require('../models/User');

// Header configuration data mapped from frontend/components/header.tsx
const headerConfigData = {
    title: 'Header Configuration',
    logo: {
        imageUrl: null, // Logo is currently rendered as SVG in frontend, can be updated later
        altText: 'Acero Logo',
        isFieldActive: true
    },
    brandName: {
        text: 'ACERO',
        isFieldActive: true
    },
    navigationLinks: [
        {
            label: 'Who We Are',
            href: '/who-we-are',
            order: 0,
            dropdown: [],
            isFieldActive: true
        },
        {
            label: 'Products',
            href: '/products',
            order: 1,
            dropdown: [
                { label: 'PEB', href: '/products/peb', order: 0 },
                { label: 'Conventional Steel', href: '/products/conventional-steel', order: 1 },
                { label: 'Racking Systems', href: '/products/racking-systems', order: 2 },
                { label: 'Porta Cabins', href: '/products/porta-cabins', order: 3 },
                { label: 'Accessories', href: '/products/accessories', order: 4 },
                { label: 'PEB Comparison', href: '/products/peb-comparison', order: 5 }
            ],
            isFieldActive: true
        },
        {
            label: 'Manufacturing',
            href: '/manufacturing',
            order: 2,
            dropdown: [],
            isFieldActive: true
        },
        {
            label: 'Projects',
            href: '/projects',
            order: 3,
            dropdown: [],
            isFieldActive: true
        },
        {
            label: 'Media',
            href: '/media/literature',
            order: 4,
            dropdown: [
                { label: 'Literature', href: '/media/literature', order: 0 },
                { label: 'Video', href: '/media/video', order: 1 },
                { label: 'Company Update', href: '/media/company-update', order: 2 }
            ],
            isFieldActive: true
        },
        {
            label: 'Career',
            href: '/career',
            order: 5,
            dropdown: [],
            isFieldActive: true
        },
        {
            label: 'Contact Us',
            href: '/contact-us',
            order: 6,
            dropdown: [],
            isFieldActive: true
        }
    ],
    themeToggle: {
        enabled: true,
        isFieldActive: true
    },
    ctaButton: {
        text: 'Get Quote',
        href: '/contact-us',
        isFieldActive: true
    }
};

// Seed function
const seedHeaderConfiguration = async () => {
    try {
        // Verify MONGODB_URI is defined
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables. Please create a .env file in the backend directory with MONGODB_URI=your_connection_string');
        }

        await connectDB();

        console.log('Starting header configuration seeding...\n');

        // Get or find a user for createdBy field
        let user = await User.findOne().sort({ createdAt: 1 }); // Get first user (oldest)
        
        if (!user) {
            console.log('⚠️  No users found in database.');
            console.log('Please create a user first or run the setup script.');
            console.log('You can create a user via the admin panel or use: node scripts/setupSuperAdmin.js\n');
            throw new Error('No user found. Please create a user first.');
        }

        console.log(`Using user: ${user.email} (${user.firstName} ${user.lastName})\n`);

        // Check if header configuration already exists
        const existingConfig = await HeaderConfiguration.findOne({ featured: true });
        
        if (existingConfig) {
            console.log('⚠️  Header configuration with featured: true already exists.');
            console.log('Updating existing configuration...\n');
            
            // Update existing configuration
            existingConfig.title = headerConfigData.title;
            existingConfig.logo = headerConfigData.logo;
            existingConfig.brandName = headerConfigData.brandName;
            existingConfig.navigationLinks = headerConfigData.navigationLinks;
            existingConfig.themeToggle = headerConfigData.themeToggle;
            existingConfig.ctaButton = headerConfigData.ctaButton;
            existingConfig.status = 'draft'; // Set to draft initially
            existingConfig.featured = true;
            existingConfig.isActive = true;
            existingConfig.updatedBy = user._id;
            
            await existingConfig.save();
            
            console.log('✓ Header configuration updated successfully!\n');
            console.log(`  Status: ${existingConfig.status}`);
            console.log(`  Featured: ${existingConfig.featured}`);
            console.log(`  Active: ${existingConfig.isActive}`);
            console.log(`  Navigation Links: ${existingConfig.navigationLinks.length}`);
            console.log(`  Theme Toggle: ${existingConfig.themeToggle.enabled ? 'Enabled' : 'Disabled'}`);
            console.log(`  CTA Button: "${existingConfig.ctaButton.text}" → ${existingConfig.ctaButton.href}\n`);
        } else {
            // Create new configuration
            const headerConfig = await HeaderConfiguration.create({
                ...headerConfigData,
                status: 'draft', // Initially in draft status for workflow testing
                featured: true,
                isActive: true,
                createdBy: user._id
            });

            console.log('✓ Header configuration created successfully!\n');
            console.log(`  ID: ${headerConfig._id}`);
            console.log(`  Status: ${headerConfig.status}`);
            console.log(`  Featured: ${headerConfig.featured}`);
            console.log(`  Active: ${headerConfig.isActive}`);
            console.log(`  Navigation Links: ${headerConfig.navigationLinks.length}`);
            console.log(`  Theme Toggle: ${headerConfig.themeToggle.enabled ? 'Enabled' : 'Disabled'}`);
            console.log(`  CTA Button: "${headerConfig.ctaButton.text}" → ${headerConfig.ctaButton.href}\n`);
        }

        // Display navigation structure
        console.log('Navigation Structure:');
        headerConfigData.navigationLinks.forEach((link, index) => {
            console.log(`  ${index + 1}. ${link.label} (${link.href})`);
            if (link.dropdown && link.dropdown.length > 0) {
                link.dropdown.forEach((item, itemIndex) => {
                    console.log(`     └─ ${item.label} (${item.href})`);
                });
            }
        });

        console.log('\n⚠️  IMPORTANT: Header configuration is in DRAFT status.');
        console.log('   It will NOT appear on the frontend until status is changed to "published".');
        console.log('   This is by design for workflow testing.\n');

        console.log('Header configuration seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding header configuration:', error);
        process.exit(1);
    }
};

// Run seeder if called directly
if (require.main === module) {
    seedHeaderConfiguration();
}

module.exports = { seedHeaderConfiguration, headerConfigData };

