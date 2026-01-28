/**
 * Cleanup script: remove SectionType documents whose slug is not used in the frontend section-renderer.
 * Run after deploying the consolidated section types seeder.
 *
 * Usage: node backend/scripts/cleanupUnusedSectionTypes.js
 * (from repo root, or from backend: node scripts/cleanupUnusedSectionTypes.js)
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
}

const connectDB = require('../configs/database');
const SectionType = require('../models/SectionType');
const Section = require('../models/Section');
const { ALLOWED_SLUGS } = require('../seeders/sectionTypesConsolidated.seeder');

async function cleanupUnusedSectionTypes() {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            console.error('Error: MONGODB_URI or MONGO_URI not found in environment variables');
            process.exit(1);
        }

        await connectDB();
        console.log('✓ Connected to MongoDB\n');

        const allTypes = await SectionType.find({}).select('slug name').lean();
        const toRemove = allTypes.filter((t) => !ALLOWED_SLUGS.includes(t.slug));

        if (toRemove.length === 0) {
            console.log('No unused section types found. All section types are in the allowed list.');
            process.exit(0);
            return;
        }

        const removedSlugs = toRemove.map((t) => t.slug);
        const sectionsUsingRemoved = await Section.find({ sectionTypeSlug: { $in: removedSlugs } })
            .select('_id pageId sectionTypeSlug order')
            .lean();

        if (sectionsUsingRemoved.length > 0) {
            console.log('⚠ Sections still reference removed types. Resolve or delete these sections before removing types:\n');
            sectionsUsingRemoved.forEach((s) => {
                console.log(`  - Section ${s._id} (pageId: ${s.pageId}, sectionTypeSlug: ${s.sectionTypeSlug})`);
            });
            console.log('\nAborting. Fix or remove these sections, then run this script again.');
            process.exit(1);
        }

        const deleteResult = await SectionType.deleteMany({ slug: { $in: removedSlugs } });
        console.log(`✓ Removed ${deleteResult.deletedCount} unused section type(s):\n`);
        toRemove.forEach((t) => console.log(`  - ${t.name} (${t.slug})`));
        console.log('\nCleanup completed.');
        process.exit(0);
    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
}

cleanupUnusedSectionTypes();
