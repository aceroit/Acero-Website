/**
 * Migration Script: Feature All Published Projects
 * 
 * This script:
 * 1. Finds all projects with status 'published' that are not featured
 * 2. Updates all published projects to featured: true
 * 
 * This ensures project counts are visible on the frontend
 * 
 * Run this script:
 * node backend/scripts/featureAllPublishedProjects.js
 */

const mongoose = require('mongoose');
const Project = require('../models/Project');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function featureAllPublishedProjects() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            console.error('Error: MONGODB_URI or MONGO_URI not found in environment variables');
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log('✓ Connected to MongoDB\n');

        // Find all published projects that are not featured
        const projectsToFeature = await Project.find({ 
            status: 'published',
            featured: { $ne: true },
            isActive: true 
        });
        
        console.log(`Found ${projectsToFeature.length} published project(s) that are not featured\n`);

        if (projectsToFeature.length === 0) {
            console.log('All published projects are already featured.');
            await mongoose.connection.close();
            console.log('\n✓ Database connection closed');
            return;
        }

        const now = new Date();

        // Update all published projects to featured
        const updateResult = await Project.updateMany(
            { 
                status: 'published',
                featured: { $ne: true },
                isActive: true 
            },
            { 
                $set: {
                    featured: true,
                    updatedAt: now
                }
            }
        );

        console.log(`✓ Updated ${updateResult.modifiedCount} project(s) to featured status\n`);

        // Verify the update
        const totalFeaturedProjects = await Project.countDocuments({ 
            status: 'published',
            featured: true,
            isActive: true 
        });
        const totalPublishedProjects = await Project.countDocuments({ 
            status: 'published',
            isActive: true 
        });
        
        console.log('Verification:');
        console.log(`  - Total published projects: ${totalPublishedProjects}`);
        console.log(`  - Featured projects: ${totalFeaturedProjects}`);
        console.log(`  - Not featured: ${totalPublishedProjects - totalFeaturedProjects}\n`);

        console.log('✓ Migration completed successfully!\n');

        // Close connection
        await mongoose.connection.close();
        console.log('✓ Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('\n✗ Migration failed:', error);
        console.error(error.stack);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run migration
featureAllPublishedProjects();

