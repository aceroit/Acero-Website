/**
 * Migration Script: Publish Sections for Published Pages
 * 
 * This script:
 * 1. Finds all pages with status 'published'
 * 2. Updates all associated sections to 'published' status
 * 3. Sets publishedAt timestamp for sections that don't have it
 * 
 * This fixes the issue where pages were published but their sections were not.
 * 
 * Run this script once to update your database:
 * node backend/scripts/publishSectionsForPublishedPages.js
 */

const mongoose = require('mongoose');
const Page = require('../models/Page');
const Section = require('../models/Section');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

async function publishSectionsForPublishedPages() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/acero-cms';
        await mongoose.connect(mongoUri);
        console.log('✓ Connected to MongoDB');

        // Find all published pages
        const publishedPages = await Page.find({ 
            status: 'published',
            isActive: true 
        });
        
        console.log(`\nFound ${publishedPages.length} published page(s)`);

        if (publishedPages.length === 0) {
            console.log('No published pages found. Nothing to update.');
            await mongoose.connection.close();
            console.log('\n✓ Database connection closed');
            return;
        }

        let totalSectionsUpdated = 0;
        const now = new Date();

        // Process each published page
        for (const page of publishedPages) {
            // Find sections for this page that are not published
            const sectionsToUpdate = await Section.find({
                pageId: page._id,
                status: { $ne: 'published' }
            });

            if (sectionsToUpdate.length > 0) {
                // Update sections to published status and set publishedAt if not already set
                const updateResult = await Section.updateMany(
                    { pageId: page._id, status: { $ne: 'published' } },
                    { 
                        $set: {
                            status: 'published',
                            updatedAt: now
                        }
                    }
                );

                // For sections that don't have publishedAt, set it (including newly published ones)
                // Check for null or missing publishedAt field
                await Section.updateMany(
                    { 
                        pageId: page._id, 
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

                totalSectionsUpdated += updateResult.modifiedCount;
                console.log(`  ✓ Page "${page.title}" (${page.slug}): Updated ${updateResult.modifiedCount} section(s)`);
            } else {
                // Even if all sections are published, check if they have publishedAt set
                const sectionsWithoutPublishedAt = await Section.countDocuments({
                    pageId: page._id,
                    status: 'published',
                    $or: [
                        { publishedAt: null },
                        { publishedAt: { $exists: false } }
                    ]
                });

                if (sectionsWithoutPublishedAt > 0) {
                    await Section.updateMany(
                        { 
                            pageId: page._id, 
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
                    totalSectionsUpdated += sectionsWithoutPublishedAt;
                    console.log(`  ✓ Page "${page.title}" (${page.slug}): Set publishedAt for ${sectionsWithoutPublishedAt} section(s)`);
                } else {
                    console.log(`  - Page "${page.title}" (${page.slug}): All sections already published`);
                }
            }
        }

        console.log(`\n✓ Migration completed successfully!`);
        console.log(`  Total sections updated: ${totalSectionsUpdated}`);

        // Verify the update
        const publishedPagesCount = await Page.countDocuments({ 
            status: 'published',
            isActive: true 
        });
        const publishedSectionsCount = await Section.countDocuments({ 
            status: 'published' 
        });
        
        console.log(`\nVerification:`);
        console.log(`  - Published pages: ${publishedPagesCount}`);
        console.log(`  - Published sections: ${publishedSectionsCount}`);

    } catch (error) {
        console.error('\n✗ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
    }
}

// Run migration
publishSectionsForPublishedPages();

