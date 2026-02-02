const path = require('path');
const fs = require('fs');

// Load environment variables FIRST, before requiring database config
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
// Fallback to .env.local if .env doesn't exist
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}

// Now require modules that depend on environment variables
const mongoose = require('mongoose');
const Industry = require('../models/Industry');
const BuildingType = require('../models/BuildingType');
const Country = require('../models/Country');
const Region = require('../models/Region');
const Area = require('../models/Area');
const User = require('../models/User');
const connectDB = require('../configs/database');

// Read data.json file
const dataFilePath = path.join(__dirname, '..', '..', 'frontend', 'data.json');
let projectsData = [];

try {
    const dataFileContent = fs.readFileSync(dataFilePath, 'utf8');
    projectsData = JSON.parse(dataFileContent);
} catch (error) {
    console.error('Error reading data.json:', error.message);
    process.exit(1);
}

// Helper function to generate slug from name
function generateSlug(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Helper function to generate code from name (first 3 uppercase letters)
function generateCode(name) {
    // Remove common words and get first meaningful words
    const words = name
        .replace(/\b(and|the|of|in|on|at|to|for|with|from)\b/gi, '')
        .split(/\s+/)
        .filter(w => w.length > 0);
    
    if (words.length === 0) {
        // Fallback: use first 3 characters
        return name.substring(0, 3).toUpperCase().padEnd(3, 'X');
    }
    
    // Use first letter of first 3 words, or first 3 letters if only one word
    if (words.length === 1) {
        return words[0].substring(0, 3).toUpperCase().padEnd(3, 'X');
    }
    
    return words
        .slice(0, 3)
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .padEnd(3, 'X');
}

// Extract unique values from projects data
function extractMasterData(projectsData) {
    const industries = new Set();
    const buildingTypes = new Set();
    const countries = new Set();
    const regions = new Set();
    const areas = new Set();
    
    // Map to store region->country and area->region relationships
    const regionToCountry = new Map();
    const areaToRegion = new Map();
    
    projectsData.forEach(industryData => {
        industries.add(industryData.industry);
        
        industryData.projects.forEach(project => {
            buildingTypes.add(project.buildingType);
            countries.add(project.country);
            regions.add(project.region);
            areas.add(project.area);
            
            // Store relationships
            regionToCountry.set(project.region, project.country);
            areaToRegion.set(project.area, project.region);
        });
    });
    
    return {
        industries: Array.from(industries).sort(),
        buildingTypes: Array.from(buildingTypes).sort(),
        countries: Array.from(countries).sort(),
        regions: Array.from(regions).sort(),
        areas: Array.from(areas).sort(),
        regionToCountry,
        areaToRegion
    };
}

// Seed function
const seedProjectsMasterData = async () => {
    try {
        // Verify MONGODB_URI is defined
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables. Please create a .env file in the backend directory with MONGODB_URI=your_connection_string');
        }

        await connectDB();

        console.log('Starting Projects Master Data seeding...\n');

        // Get or find a user for createdBy field
        let user = await User.findOne().sort({ createdAt: 1 }); // Get first user (oldest)
        
        if (!user) {
            console.log('⚠️  No users found in database.');
            console.log('Please create a user first or run the setup script.');
            console.log('You can create a user via the admin panel or use: node scripts/setupSuperAdmin.js\n');
            throw new Error('No user found. Please create a user first.');
        }

        console.log(`Using user: ${user.email} (${user.firstName} ${user.lastName})\n`);

        // Extract master data
        const masterData = extractMasterData(projectsData);
        
        console.log(`Extracted from data.json:`);
        console.log(`  Industries: ${masterData.industries.length}`);
        console.log(`  Building Types: ${masterData.buildingTypes.length}`);
        console.log(`  Countries: ${masterData.countries.length}`);
        console.log(`  Regions: ${masterData.regions.length}`);
        console.log(`  Areas: ${masterData.areas.length}\n`);

        // 1. Seed Countries (check if they exist, create if not)
        console.log('1. Seeding Countries...');
        const countryMap = new Map();
        let countriesCreated = 0;
        let countriesSkipped = 0;
        
        for (const countryName of masterData.countries) {
            // Try to find existing country by name
            let country = await Country.findOne({ name: countryName });
            
            if (!country) {
                // Try to find by code (extract from name)
                const code = generateCode(countryName);
                country = await Country.findOne({ code: code });
            }
            
            if (!country) {
                // Create new country
                const code = generateCode(countryName);
                country = await Country.create({
                    name: countryName,
                    code: code,
                    isVisible: true,
                    isActive: true,
                    status: 'published',
                    featured: true,
                    publishedAt: new Date(),
                    createdBy: user._id
                });
                countriesCreated++;
            } else {
                // Update existing country to published if not already
                if (country.status !== 'published' || !country.featured) {
                    country.status = 'published';
                    country.featured = true;
                    country.publishedAt = country.publishedAt || new Date();
                    await country.save();
                    countriesCreated++; // Count as updated
                } else {
                    countriesSkipped++;
                }
            }
            
            countryMap.set(countryName, country._id);
        }
        
        console.log(`   ✓ Created: ${countriesCreated}, Skipped: ${countriesSkipped}\n`);

        // 2. Seed Regions (standalone - no country)
        console.log('2. Seeding Regions...');
        const regionMap = new Map();
        let regionsCreated = 0;
        let regionsSkipped = 0;
        
        for (const regionName of masterData.regions) {
            // Check if region exists by name (regions are standalone)
            let region = await Region.findOne({ name: regionName });
            
            if (!region) {
                let code = generateCode(regionName);
                try {
                    region = await Region.create({
                        name: regionName,
                        code: code,
                        isActive: true,
                        status: 'published',
                        featured: true,
                        publishedAt: new Date(),
                        createdBy: user._id
                    });
                    regionsCreated++;
                } catch (err) {
                    if (err.code === 11000) {
                        region = await Region.findOne({ code });
                        if (region) regionsSkipped++;
                    } else throw err;
                }
            } else {
                if (region.status !== 'published' || !region.featured) {
                    region.status = 'published';
                    region.featured = true;
                    region.publishedAt = region.publishedAt || new Date();
                    await region.save();
                    regionsCreated++;
                } else {
                    regionsSkipped++;
                }
            }
            
            regionMap.set(regionName, region._id);
        }
        
        console.log(`   ✓ Created: ${regionsCreated}, Skipped: ${regionsSkipped}\n`);

        // 3. Seed Areas (standalone - no region)
        console.log('3. Seeding Areas...');
        const areaMap = new Map();
        let areasCreated = 0;
        let areasSkipped = 0;
        
        for (const areaName of masterData.areas) {
            // Check if area exists by name (areas are standalone)
            let area = await Area.findOne({ name: areaName });
            
            if (!area) {
                let code = generateCode(areaName);
                try {
                    area = await Area.create({
                        name: areaName,
                        code: code,
                        isActive: true,
                        status: 'published',
                        featured: true,
                        publishedAt: new Date(),
                        createdBy: user._id
                    });
                    areasCreated++;
                } catch (err) {
                    if (err.code === 11000) {
                        area = await Area.findOne({ code });
                        if (area) areasSkipped++;
                    } else throw err;
                }
            } else {
                if (area.status !== 'published' || !area.featured) {
                    area.status = 'published';
                    area.featured = true;
                    area.publishedAt = area.publishedAt || new Date();
                    await area.save();
                    areasCreated++;
                } else {
                    areasSkipped++;
                }
            }
            
            areaMap.set(areaName, area._id);
        }
        
        console.log(`   ✓ Created: ${areasCreated}, Skipped: ${areasSkipped}\n`);

        // 4. Seed Industries
        console.log('4. Seeding Industries...');
        const industryMap = new Map();
        let industriesCreated = 0;
        let industriesSkipped = 0;
        
        for (let i = 0; i < masterData.industries.length; i++) {
            const industryName = masterData.industries[i];
            const slug = generateSlug(industryName);
            
            // Check if industry exists
            let industry = await Industry.findOne({ slug: slug });
            
            if (!industry) {
                industry = await Industry.create({
                    name: industryName,
                    slug: slug,
                    order: i,
                    isActive: true,
                    status: 'published',
                    featured: true,
                    publishedAt: new Date(),
                    createdBy: user._id
                });
                industriesCreated++;
            } else {
                // Update existing industry to published if not already
                if (industry.status !== 'published' || !industry.featured) {
                    industry.status = 'published';
                    industry.featured = true;
                    industry.publishedAt = industry.publishedAt || new Date();
                    // Update order if needed
                    if (industry.order !== i) {
                        industry.order = i;
                    }
                    await industry.save();
                    industriesCreated++; // Count as updated
                } else {
                    industriesSkipped++;
                }
            }
            
            industryMap.set(industryName, industry._id);
        }
        
        console.log(`   ✓ Created: ${industriesCreated}, Skipped: ${industriesSkipped}\n`);

        // 5. Seed Building Types
        console.log('5. Seeding Building Types...');
        const buildingTypeMap = new Map();
        let buildingTypesCreated = 0;
        let buildingTypesSkipped = 0;
        
        for (const buildingTypeName of masterData.buildingTypes) {
            // Check if building type exists
            let buildingType = await BuildingType.findOne({ name: buildingTypeName });
            
            if (!buildingType) {
                buildingType = await BuildingType.create({
                    name: buildingTypeName,
                    isActive: true,
                    status: 'published',
                    featured: true,
                    publishedAt: new Date(),
                    createdBy: user._id
                });
                buildingTypesCreated++;
            } else {
                // Update existing building type to published if not already
                if (buildingType.status !== 'published' || !buildingType.featured) {
                    buildingType.status = 'published';
                    buildingType.featured = true;
                    buildingType.publishedAt = buildingType.publishedAt || new Date();
                    await buildingType.save();
                    buildingTypesCreated++; // Count as updated
                } else {
                    buildingTypesSkipped++;
                }
            }
            
            buildingTypeMap.set(buildingTypeName, buildingType._id);
        }
        
        console.log(`   ✓ Created: ${buildingTypesCreated}, Skipped: ${buildingTypesSkipped}\n`);

        // Summary
        console.log('═══════════════════════════════════════════════════════════');
        console.log('Master Data Seeding Summary:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`Countries:     ${countriesCreated} created, ${countriesSkipped} skipped (${masterData.countries.length} total)`);
        console.log(`Regions:       ${regionsCreated} created, ${regionsSkipped} skipped (${masterData.regions.length} total)`);
        console.log(`Areas:         ${areasCreated} created, ${areasSkipped} skipped (${masterData.areas.length} total)`);
        console.log(`Industries:    ${industriesCreated} created, ${industriesSkipped} skipped (${masterData.industries.length} total)`);
        console.log(`Building Types: ${buildingTypesCreated} created, ${buildingTypesSkipped} skipped (${masterData.buildingTypes.length} total)`);
        console.log('═══════════════════════════════════════════════════════════\n');

        console.log('✓ All master data is in PUBLISHED status and marked as FEATURED.');
        console.log('   Master data is ready for use in Projects seeder.\n');

        console.log('Projects Master Data seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding projects master data:', error);
        process.exit(1);
    }
};

// Run seeder if called directly
if (require.main === module) {
    seedProjectsMasterData();
}

module.exports = { seedProjectsMasterData };

