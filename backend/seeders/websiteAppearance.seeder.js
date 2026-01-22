const path = require('path');

// Load environment variables FIRST, before requiring database config
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
// Fallback to .env.local if .env doesn't exist
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}

// Now require modules that depend on environment variables
const mongoose = require('mongoose');
const WebsiteAppearance = require('../models/WebsiteAppearance');
const connectDB = require('../configs/database');
const User = require('../models/User');

// Website appearance data mapped from frontend/app/globals.css and frontendDesign.md
const appearanceData = {
    title: 'Website Appearance',
    colorPalette: {
        lightMode: {
            background: { value: '#F7F7F7', isFieldActive: true },
            foreground: { value: '#0B0D0E', isFieldActive: true },
            card: { value: '#FFFFFF', isFieldActive: true },
            primary: { value: '#E10600', isFieldActive: true },
            secondary: { value: '#E5E5E5', isFieldActive: true },
            muted: { value: '#E5E5E5', isFieldActive: true },
            accent: { value: '#E10600', isFieldActive: true },
            border: { value: '#CCCCCC', isFieldActive: true },
            ring: { value: '#E10600', isFieldActive: true }
        },
        darkMode: {
            background: { value: '#0B0D0E', isFieldActive: true },
            foreground: { value: '#F7F7F7', isFieldActive: true },
            card: { value: '#111315', isFieldActive: true },
            primary: { value: '#E10600', isFieldActive: true },
            secondary: { value: '#1A1D1F', isFieldActive: true },
            muted: { value: '#1A1D1F', isFieldActive: true },
            accent: { value: '#E10600', isFieldActive: true },
            border: { value: '#2E2E2E', isFieldActive: true },
            ring: { value: '#E10600', isFieldActive: true }
        },
        steelColors: {
            steelBlack: { value: '#0B0D0E', isFieldActive: true },
            steelWhite: { value: '#F7F7F7', isFieldActive: true },
            steelGray: { value: '#2E2E2E', isFieldActive: true },
            steelRed: { value: '#E10600', isFieldActive: true },
            steelDark: { value: '#111315', isFieldActive: true },
            steelMuted: { value: '#6B7280', isFieldActive: true }
        }
    },
    typography: {
        fontFamily: {
            primary: { value: 'Inter', isFieldActive: true },
            monospace: { value: 'Geist Mono', isFieldActive: true }
        },
        fontScale: {
            h1: { value: 'text-5xl md:text-6xl lg:text-7xl', isFieldActive: true },
            h2: { value: 'text-4xl md:text-5xl', isFieldActive: true },
            h3: { value: 'text-2xl md:text-3xl', isFieldActive: true },
            h4: { value: 'text-xl md:text-2xl', isFieldActive: true },
            body: { value: 'leading-relaxed', isFieldActive: true }
        }
    },
    spacing: {
        containerMaxWidth: { value: 'max-w-7xl', isFieldActive: true },
        sectionPadding: { value: 'px-6 py-24', isFieldActive: true },
        gridGap: { value: 'gap-8', isFieldActive: true }
    },
    borderRadius: {
        defaultRadius: { value: '0.5rem', isFieldActive: true }
    }
};

// Seed function
const seedWebsiteAppearance = async () => {
    try {
        // Verify MONGODB_URI is defined
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables. Please create a .env file in the backend directory with MONGODB_URI=your_connection_string');
        }

        await connectDB();

        console.log('Starting website appearance seeding...\n');

        // Get or find a user for createdBy field
        let user = await User.findOne().sort({ createdAt: 1 }); // Get first user (oldest)
        
        if (!user) {
            console.log('⚠️  No users found in database.');
            console.log('Please create a user first or run the setup script.');
            console.log('You can create a user via the admin panel or use: node scripts/setupSuperAdmin.js\n');
            throw new Error('No user found. Please create a user first.');
        }

        console.log(`Using user: ${user.email} (${user.firstName} ${user.lastName})\n`);

        // Check if website appearance already exists
        const existingAppearance = await WebsiteAppearance.findOne({ featured: true });
        
        if (existingAppearance) {
            console.log('⚠️  Website appearance with featured: true already exists.');
            console.log('Updating existing appearance...\n');
            
            // Update existing appearance
            existingAppearance.title = appearanceData.title;
            existingAppearance.colorPalette = appearanceData.colorPalette;
            existingAppearance.typography = appearanceData.typography;
            existingAppearance.spacing = appearanceData.spacing;
            existingAppearance.borderRadius = appearanceData.borderRadius;
            existingAppearance.status = 'draft'; // Set to draft initially
            existingAppearance.featured = true;
            existingAppearance.isActive = true;
            existingAppearance.updatedBy = user._id;
            
            await existingAppearance.save();
            
            console.log('✓ Website appearance updated successfully!\n');
            console.log(`  Status: ${existingAppearance.status}`);
            console.log(`  Featured: ${existingAppearance.featured}`);
            console.log(`  Active: ${existingAppearance.isActive}\n`);
        } else {
            // Create new appearance
            const websiteAppearance = await WebsiteAppearance.create({
                ...appearanceData,
                status: 'draft', // Initially in draft status for workflow testing
                featured: true,
                isActive: true,
                createdBy: user._id
            });

            console.log('✓ Website appearance created successfully!\n');
            console.log(`  ID: ${websiteAppearance._id}`);
            console.log(`  Status: ${websiteAppearance.status}`);
            console.log(`  Featured: ${websiteAppearance.featured}`);
            console.log(`  Active: ${websiteAppearance.isActive}\n`);
        }

        // Display color palette summary
        console.log('Color Palette:');
        console.log('  Light Mode:');
        console.log(`    Background: ${appearanceData.colorPalette.lightMode.background.value}`);
        console.log(`    Foreground: ${appearanceData.colorPalette.lightMode.foreground.value}`);
        console.log(`    Primary: ${appearanceData.colorPalette.lightMode.primary.value}`);
        console.log('  Dark Mode:');
        console.log(`    Background: ${appearanceData.colorPalette.darkMode.background.value}`);
        console.log(`    Foreground: ${appearanceData.colorPalette.darkMode.foreground.value}`);
        console.log(`    Primary: ${appearanceData.colorPalette.darkMode.primary.value}`);
        console.log('  Steel Colors:');
        console.log(`    Steel Red: ${appearanceData.colorPalette.steelColors.steelRed.value}`);
        console.log(`    Steel Black: ${appearanceData.colorPalette.steelColors.steelBlack.value}`);
        console.log(`    Steel White: ${appearanceData.colorPalette.steelColors.steelWhite.value}\n`);

        // Display typography summary
        console.log('Typography:');
        console.log(`  Primary Font: ${appearanceData.typography.fontFamily.primary.value}`);
        console.log(`  Monospace Font: ${appearanceData.typography.fontFamily.monospace.value}`);
        console.log(`  H1 Scale: ${appearanceData.typography.fontScale.h1.value}`);
        console.log(`  H2 Scale: ${appearanceData.typography.fontScale.h2.value}\n`);

        // Display spacing summary
        console.log('Spacing:');
        console.log(`  Container: ${appearanceData.spacing.containerMaxWidth.value}`);
        console.log(`  Section Padding: ${appearanceData.spacing.sectionPadding.value}`);
        console.log(`  Grid Gap: ${appearanceData.spacing.gridGap.value}\n`);

        // Display border radius
        console.log('Border Radius:');
        console.log(`  Default: ${appearanceData.borderRadius.defaultRadius.value}\n`);

        console.log('⚠️  IMPORTANT: Website appearance is in DRAFT status.');
        console.log('   It will NOT be applied to the frontend until status is changed to "published".');
        console.log('   This is by design for workflow testing.\n');

        console.log('Website appearance seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding website appearance:', error);
        process.exit(1);
    }
};

// Run seeder if called directly
if (require.main === module) {
    seedWebsiteAppearance();
}

module.exports = { seedWebsiteAppearance, appearanceData };

