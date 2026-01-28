/**
 * Migration Script: Update Page Slug Index to Partial Unique Index
 * 
 * This script:
 * 1. Drops the existing unique index on slug (if it exists)
 * 2. Creates a new partial unique index that only applies to active pages
 * 
 * This allows inactive pages to reuse slugs, but prevents duplicate slugs among active pages.
 * 
 * Run this script once to update your database schema:
 * node backend/scripts/migratePageSlugIndex.js
 */

const mongoose = require('mongoose');
const Page = require('../models/Page');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

async function migratePageSlugIndex() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/acero-cms';
        await mongoose.connect(mongoUri);
        console.log('✓ Connected to MongoDB');

        const collection = Page.collection;

        // Check existing indexes
        const indexes = await collection.indexes();
        console.log('\nCurrent indexes on pages collection:');
        indexes.forEach(index => {
            console.log(`  - ${JSON.stringify(index.key)} (unique: ${index.unique || false})`);
        });

        // Drop existing unique index on slug if it exists
        try {
            await collection.dropIndex('slug_1');
            console.log('\n✓ Dropped existing unique index on slug');
        } catch (error) {
            if (error.code === 27 || error.codeName === 'IndexNotFound') {
                console.log('\n✓ No existing unique index on slug to drop');
            } else {
                throw error;
            }
        }

        // Create partial unique index on slug (only for active pages)
        await collection.createIndex(
            { slug: 1 },
            {
                unique: true,
                partialFilterExpression: { isActive: true },
                name: 'slug_1_partial_active'
            }
        );
        console.log('✓ Created partial unique index on slug (only for active pages)');

        // Verify the new index
        const newIndexes = await collection.indexes();
        const slugIndex = newIndexes.find(index => 
            index.key && index.key.slug === 1
        );
        
        if (slugIndex) {
            console.log('\n✓ Verification: New index created successfully');
            console.log(`  - Unique: ${slugIndex.unique || false}`);
            console.log(`  - Partial Filter: ${JSON.stringify(slugIndex.partialFilterExpression || {})}`);
        }

        console.log('\n✓ Migration completed successfully!');
        console.log('\nNote: You can now create pages with slugs that exist on inactive pages.');

    } catch (error) {
        console.error('\n✗ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
    }
}

// Run migration
migratePageSlugIndex();

