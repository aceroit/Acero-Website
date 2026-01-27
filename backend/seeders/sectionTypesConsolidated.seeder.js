/**
 * Consolidated section types seeder
 * Seeds only section types that have a matching component in the frontend section-renderer.
 * Source: sectionTypes.seeder.js (cta, statistics, image_gallery, features_grid) and
 * sectionTypesExtended.seeder.js (all others in ALLOWED_SLUGS).
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}

const SectionType = require('../models/SectionType');
const connectDB = require('../configs/database');

// Slugs that have a case in frontend section-renderer (including 'cta')
const ALLOWED_SLUGS = [
    'hero_carousel',
    'content_with_image',
    'statistics',
    'infinite_carousel',
    'projects_grid',
    'company_updates',
    'hero_image',
    'premium_video',
    'image_gallery',
    'features_grid',
    'product_card',
    'image_modal_gallery',
    'tabbed_comparison',
    'flip_card',
    'advantages_grid',
    'application_cards',
    'circular_advantages',
    'peb_advantage_svg',
    'certificates_grid',
    'video_cards',
    'image_display',
    'hover_card',
    'comparison_table',
    'cta',
];

function getMergedTypes() {
    const { defaultSectionTypes } = require('./sectionTypes.seeder');
    const { extendedSectionTypes } = require('./sectionTypesExtended.seeder');

    const fromDefault = (defaultSectionTypes || []).filter((t) => ALLOWED_SLUGS.includes(t.slug));
    const fromExtended = (extendedSectionTypes || []).filter((t) => ALLOWED_SLUGS.includes(t.slug));

    const bySlug = new Map();
    fromDefault.forEach((t) => bySlug.set(t.slug, t));
    fromExtended.forEach((t) => bySlug.set(t.slug, t));

    return Array.from(bySlug.values()).sort((a, b) => ALLOWED_SLUGS.indexOf(a.slug) - ALLOWED_SLUGS.indexOf(b.slug));
}

const seedSectionTypesConsolidated = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined. Add it to .env in the backend directory.');
        }

        await connectDB();

        const typesToSeed = getMergedTypes();
        console.log(`Starting consolidated section types seeding (${typesToSeed.length} types)...\n`);

        await SectionType.deleteMany({ isSystem: true });
        const inserted = await SectionType.insertMany(typesToSeed);

        console.log(`✓ Seeded ${inserted.length} section types (used by frontend section-renderer):\n`);
        inserted.forEach((t) => console.log(`  ${t.icon} ${t.name} (${t.slug})`));
        console.log('\nConsolidated section types seeding completed.');
        process.exit(0);
    } catch (error) {
        console.error('Error in consolidated section types seeding:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    seedSectionTypesConsolidated();
}

module.exports = { seedSectionTypesConsolidated, ALLOWED_SLUGS, getMergedTypes };
