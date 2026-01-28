/**
 * Migration Script: Publish All Projects
 * 
 * This script:
 * 1. Finds all projects with status 'draft' or any non-published status
 * 2. Updates all projects to 'published' status
 * 3. Sets publishedAt timestamp for projects that don't have it
 * 
 * Run this script once to publish all projects:
 * node backend/scripts/publishAllProjects.js
 */

const mongoose = require('mongoose');
const Project = require('../models/Project');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function publishAllProjects() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            console.error('Error: MONGODB_URI or MONGO_URI not found in environment variables');
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log('✓ Connected to MongoDB\n');

        // Find all projects that are not published
        const projectsToUpdate = await Project.find({ 
            status: { $ne: 'published' },
            isActive: true 
        });
        
        console.log(`Found ${projectsToUpdate.length} project(s) to publish\n`);

        if (projectsToUpdate.length === 0) {
            console.log('No projects need to be published. All projects are already published.');
            await mongoose.connection.close();
            console.log('\n✓ Database connection closed');
            return;
        }

        const now = new Date();

        // Update all projects to published status
        const updateResult = await Project.updateMany(
            { 
                status: { $ne: 'published' },
                isActive: true 
            },
            { 
                $set: {
                    status: 'published',
                    updatedAt: now
                }
            }
        );

        console.log(`✓ Updated ${updateResult.modifiedCount} project(s) to published status\n`);

        // Set publishedAt for projects that don't have it
        const publishedAtResult = await Project.updateMany(
            { 
                status: 'published',
                $or: [
                    { publishedAt: null },
                    { publishedAt: { $exists: false } }
                ]
            },
            { 
                $set: {
                    publishedAt: now
                }
            }
        );

        if (publishedAtResult.modifiedCount > 0) {
            console.log(`✓ Set publishedAt timestamp for ${publishedAtResult.modifiedCount} project(s)\n`);
        }

        // Verify the update
        const totalPublishedProjects = await Project.countDocuments({ 
            status: 'published',
            isActive: true 
        });
        const totalProjects = await Project.countDocuments({ 
            isActive: true 
        });
        
        console.log('Verification:');
        console.log(`  - Total projects: ${totalProjects}`);
        console.log(`  - Published projects: ${totalPublishedProjects}`);
        console.log(`  - Draft/Other status: ${totalProjects - totalPublishedProjects}\n`);

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
publishAllProjects();

