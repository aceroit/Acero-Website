const mongoose = require('mongoose');
const BuildingType = require('../models/BuildingType');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

/**
 * Migration script to generate slugs for existing BuildingTypes
 * Run this script before deploying the new BuildingType schema with slug field
 * 
 * Usage: node backend/scripts/migrateBuildingTypes.js
 */

async function migrateBuildingTypes() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            console.error('Error: MONGODB_URI or MONGO_URI not found in environment variables');
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Find all building types without slugs
        const buildingTypes = await BuildingType.find({ 
            $or: [
                { slug: { $exists: false } },
                { slug: null },
                { slug: '' }
            ]
        });

        console.log(`Found ${buildingTypes.length} building types without slugs`);

        if (buildingTypes.length === 0) {
            console.log('No building types need migration. Exiting...');
            await mongoose.disconnect();
            process.exit(0);
        }

        let successCount = 0;
        let errorCount = 0;

        for (const buildingType of buildingTypes) {
            try {
                // Generate slug from name
                const slug = buildingType.name
                    .toLowerCase()
                    .trim()
                    .replace(/[^\w\s-]/g, '') // Remove special characters
                    .replace(/\s+/g, '-') // Replace spaces with hyphens
                    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen

                // Check if slug already exists
                const existing = await BuildingType.findOne({ 
                    slug, 
                    _id: { $ne: buildingType._id } 
                });

                let finalSlug = slug;
                if (existing) {
                    // Append a number if slug exists
                    let counter = 1;
                    while (await BuildingType.findOne({ 
                        slug: `${slug}-${counter}`, 
                        _id: { $ne: buildingType._id } 
                    })) {
                        counter++;
                    }
                    finalSlug = `${slug}-${counter}`;
                }

                // Update building type with slug
                buildingType.slug = finalSlug;
                await buildingType.save();

                console.log(`✓ Migrated: "${buildingType.name}" → slug: "${finalSlug}"`);
                successCount++;
            } catch (error) {
                console.error(`✗ Error migrating "${buildingType.name}":`, error.message);
                errorCount++;
            }
        }

        console.log('\n=== Migration Summary ===');
        console.log(`Total processed: ${buildingTypes.length}`);
        console.log(`Successful: ${successCount}`);
        console.log(`Errors: ${errorCount}`);

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run migration
migrateBuildingTypes();
