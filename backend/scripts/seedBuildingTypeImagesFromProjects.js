const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}

const mongoose = require('mongoose');
const BuildingType = require('../models/BuildingType');
const Project = require('../models/Project');
const connectDB = require('../configs/database');

/**
 * For each project that has a gallery (projectImages): the building type linked to that
 * project gets its image set to the second image of that project's gallery.
 * So: project → buildingType; buildingType.image = project.projectImages[1] (by order).
 * If several projects share the same building type, the last project processed wins.
 *
 * Usage:
 *   node scripts/seedBuildingTypeImagesFromProjects.js
 *   node scripts/seedBuildingTypeImagesFromProjects.js --dry-run
 */

const isDryRun = process.argv.includes('--dry-run');

async function seedBuildingTypeImagesFromProjects() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined. Set it in .env or .env.local in the backend directory.');
        }

        await connectDB();
        console.log(isDryRun ? '\n[DRY RUN] No changes will be written.\n' : '');

        // All projects that have a buildingType and at least 2 gallery images
        const projects = await Project.find({
            buildingType: { $exists: true, $ne: null },
            isActive: true,
            $expr: { $gte: [{ $size: { $ifNull: ['$projectImages', []] } }, 2] },
        })
            .sort({ order: 1 })
            .select('projectImages jobNumber buildingType')
            .populate('buildingType', 'name')
            .lean();

        console.log(`Found ${projects.length} projects with 2+ gallery images.\n`);

        let updated = 0;
        let skipped = 0;

        for (const project of projects) {
            const bt = project.buildingType;
            const buildingTypeId = bt && (bt._id || bt);
            const buildingTypeName = (bt && bt.name) || buildingTypeId;

            if (!buildingTypeId) {
                console.log(`  ⚠ Project ${project.jobNumber}: No building type linked.`);
                skipped++;
                continue;
            }

            // Second image by display order (order field)
            const sortedImages = [...(project.projectImages || [])].sort(
                (a, b) => (a.order ?? 0) - (b.order ?? 0)
            );
            const secondImage = sortedImages[1];
            if (!secondImage || !secondImage.url) {
                console.log(`  ⚠ Project ${project.jobNumber}: Second image missing or no url.`);
                skipped++;
                continue;
            }

            const imagePayload = {
                url: secondImage.url,
                publicId: secondImage.publicId || null,
                width: secondImage.width ?? null,
                height: secondImage.height ?? null,
            };

            if (isDryRun) {
                console.log(`  [dry] Project ${project.jobNumber} → ${buildingTypeName} would get 2nd image`);
                updated++;
                continue;
            }

            await BuildingType.updateOne(
                { _id: buildingTypeId },
                { $set: { image: imagePayload } }
            );
            console.log(`  ✓ Project ${project.jobNumber} → ${buildingTypeName} image set (2nd gallery image).`);
            updated++;
        }

        console.log('\n---');
        console.log(`Building types updated (from projects): ${updated}`);
        if (skipped) console.log(`Skipped: ${skipped}`);
        if (isDryRun) console.log('\n[DRY RUN] No changes were written. Run without --dry-run to apply.');
        console.log('');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect().catch(() => {});
    }
}

seedBuildingTypeImagesFromProjects();
