const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}

const mongoose = require('mongoose');
const Industry = require('../models/Industry');
const connectDB = require('../configs/database');

/**
 * Reads scraped-projects-processed.json (or --file= path) and updates existing
 * Industry documents in the DB with the Cloudinary image from the JSON.
 * Only updates industries that exist in the DB; does not create new ones.
 *
 * Usage:
 *   node scripts/seedIndustryImagesFromProcessedJson.js
 *   node scripts/seedIndustryImagesFromProcessedJson.js --file=scraped-projects-processed.json
 *   node scripts/seedIndustryImagesFromProcessedJson.js --dry-run
 */

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const fileArg = args.find((a) => a.startsWith('--file='));
const fileName = fileArg ? fileArg.replace('--file=', '').trim() : 'scraped-projects-processed.json';
const SCRAPED_DATA_PATH = path.join(__dirname, fileName);

async function seedIndustryImagesFromProcessedJson() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined. Set it in .env or .env.local in the backend directory.');
        }

        if (!fs.existsSync(SCRAPED_DATA_PATH)) {
            throw new Error(
                `File not found: ${SCRAPED_DATA_PATH}\nUse --file=<filename> for a different file.`
            );
        }

        const raw = fs.readFileSync(SCRAPED_DATA_PATH, 'utf8');
        const data = JSON.parse(raw);
        const industriesFromJson = data.industries || [];

        if (industriesFromJson.length === 0) {
            console.log('No industries in JSON. Exiting.');
            process.exit(0);
        }

        await connectDB();
        console.log(isDryRun ? '\n[DRY RUN] No changes will be written.\n' : '');
        console.log(`Loaded ${industriesFromJson.length} industries from ${fileName}\n`);

        let updated = 0;
        let skipped = 0;

        for (const ind of industriesFromJson) {
            const name = ind.name;
            if (!name) {
                console.log(`  ⚠ Skipping industry with no name`);
                skipped++;
                continue;
            }
            if (!ind.image) {
                console.log(`  ⚠ ${name}: No image in JSON.`);
                skipped++;
                continue;
            }

            const logoPayload = {
                url: ind.image,
                publicId: ind.imageData?.publicId ?? null,
                width: ind.imageData?.width ?? null,
                height: ind.imageData?.height ?? null,
            };

            const slug = ind.slug || (name || '').toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            const existing = await Industry.findOne({ $or: [{ name }, { slug }] });
            if (!existing) {
                console.log(`  ⚠ ${name}: No matching industry in DB.`);
                skipped++;
                continue;
            }

            if (isDryRun) {
                console.log(`  [dry] ${name} would get image: ${ind.image.substring(0, 60)}...`);
                updated++;
                continue;
            }

            await Industry.updateOne(
                { _id: existing._id },
                { $set: { logo: logoPayload } }
            );
            console.log(`  ✓ ${name} logo updated.`);
            updated++;
        }

        console.log('\n---');
        console.log(`Industries updated (from JSON): ${updated}`);
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

seedIndustryImagesFromProcessedJson();
