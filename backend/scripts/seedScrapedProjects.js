/**
 * Seeder Script for Scraped Projects
 * 
 * This script reads the scraped-projects.json file and seeds the data into MongoDB
 * following the backend models and schemas.
 * 
 * It will:
 * 1. Create/Update Industries
 * 2. Create/Update Building Types
 * 3. Create/Update Countries, Regions, Areas
 * 4. Create Projects with images
 * 
 * Usage: node scripts/seedScrapedProjects.js
 * 
 * Options:
 *   --dry-run         Show what would be created without actually creating
 *   --skip-master     Skip master data seeding (use if already seeded)
 *   --force           Force update existing projects
 */

const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}

const mongoose = require('mongoose');
const Project = require('../models/Project');
const Industry = require('../models/Industry');
const BuildingType = require('../models/BuildingType');
const Country = require('../models/Country');
const Region = require('../models/Region');
const Area = require('../models/Area');
const User = require('../models/User');
const connectDB = require('../configs/database');

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SKIP_MASTER = args.includes('--skip-master');
const FORCE_UPDATE = args.includes('--force');

// Path to scraped data
const SCRAPED_DATA_PATH = path.join(__dirname, 'scraped-projects.json');

// Helper function to generate slug
function generateSlug(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Helper function to generate code (for Region/Area/Country)
function generateCode(name) {
    const words = name
        .replace(/\b(and|the|of|in|on|at|to|for|with|from)\b/gi, '')
        .split(/\s+/)
        .filter(w => w.length > 0);
    
    if (words.length === 0) {
        return name.substring(0, 3).toUpperCase().padEnd(3, 'X');
    }
    
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

// Helper to generate job number slug
function generateJobNumberSlug(jobNumber) {
    return jobNumber
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Main seeder class
class ScrapedProjectsSeeder {
    constructor() {
        this.user = null;
        this.stats = {
            industries: { created: 0, updated: 0, skipped: 0 },
            buildingTypes: { created: 0, updated: 0, skipped: 0 },
            countries: { created: 0, updated: 0, skipped: 0 },
            regions: { created: 0, updated: 0, skipped: 0 },
            areas: { created: 0, updated: 0, skipped: 0 },
            projects: { created: 0, updated: 0, skipped: 0, errors: 0 }
        };
        this.maps = {
            industries: new Map(),
            buildingTypes: new Map(),
            countries: new Map(),
            regions: new Map(),
            areas: new Map()
        };
        this.errors = [];
    }

    async init() {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined. Please create a .env file.');
        }
        
        await connectDB();
        
        // Get user for createdBy
        this.user = await User.findOne().sort({ createdAt: 1 });
        if (!this.user) {
            throw new Error('No user found. Please create a user first via: node scripts/setupSuperAdmin.js');
        }
        
        console.log(`Using user: ${this.user.email} (${this.user.firstName} ${this.user.lastName})\n`);
    }

    // Load and validate scraped data
    loadScrapedData() {
        if (!fs.existsSync(SCRAPED_DATA_PATH)) {
            throw new Error(`Scraped data file not found: ${SCRAPED_DATA_PATH}\nPlease run the scraper first: node scripts/scrapeProjects.js`);
        }
        
        const data = JSON.parse(fs.readFileSync(SCRAPED_DATA_PATH, 'utf8'));
        
        console.log('Loaded scraped data:');
        console.log(`  - Scraped at: ${data.scrapedAt}`);
        console.log(`  - Industries: ${data.industries?.length || 0}`);
        console.log(`  - Stats: ${JSON.stringify(data.stats)}\n`);
        
        return data;
    }

    // Extract unique master data from scraped projects
    extractMasterData(scrapedData) {
        const masterData = {
            industries: new Set(),
            buildingTypes: new Set(),
            countries: new Set(),
            regions: new Set(),
            areas: new Set()
        };
        
        // Industry images map
        const industryImages = new Map();
        
        for (const industryData of scrapedData.industries) {
            masterData.industries.add(industryData.name);
            if (industryData.image) {
                industryImages.set(industryData.name, industryData.image);
            }
            
            for (const project of industryData.projects) {
                if (project.buildingType) masterData.buildingTypes.add(project.buildingType);
                if (project.country && project.country !== 'Unknown') masterData.countries.add(project.country);
                if (project.region && project.region !== 'Unknown') masterData.regions.add(project.region);
                if (project.area && project.area !== 'Unknown') masterData.areas.add(project.area);
            }
        }
        
        return {
            industries: Array.from(masterData.industries),
            buildingTypes: Array.from(masterData.buildingTypes),
            countries: Array.from(masterData.countries),
            regions: Array.from(masterData.regions),
            areas: Array.from(masterData.areas),
            industryImages
        };
    }

    // Seed Industries
    async seedIndustries(industryNames, industryImages) {
        console.log('1. Seeding Industries...');
        
        for (let i = 0; i < industryNames.length; i++) {
            const name = industryNames[i];
            const slug = generateSlug(name);
            const image = industryImages.get(name);
            
            try {
                let industry = await Industry.findOne({ $or: [{ name }, { slug }] });
                
                if (!industry) {
                    if (!DRY_RUN) {
                        industry = await Industry.create({
                            name,
                            slug,
                            order: i,
                            logo: image ? { url: image } : undefined,
                            isActive: true,
                            status: 'published',
                            featured: true,
                            publishedAt: new Date(),
                            createdBy: this.user._id
                        });
                    }
                    this.stats.industries.created++;
                    console.log(`   ✓ Created: ${name}`);
                } else {
                    // Update if needed
                    if (industry.status !== 'published' || !industry.featured) {
                        if (!DRY_RUN) {
                            industry.status = 'published';
                            industry.featured = true;
                            industry.publishedAt = industry.publishedAt || new Date();
                            if (image && !industry.logo?.url) {
                                industry.logo = { url: image };
                            }
                            await industry.save();
                        }
                        this.stats.industries.updated++;
                    } else {
                        this.stats.industries.skipped++;
                    }
                }
                
                this.maps.industries.set(name, industry?._id || `dry-run-${name}`);
            } catch (error) {
                console.error(`   ✗ Error with industry "${name}": ${error.message}`);
                this.errors.push({ type: 'industry', name, error: error.message });
            }
        }
        
        console.log(`   Summary: ${this.stats.industries.created} created, ${this.stats.industries.updated} updated, ${this.stats.industries.skipped} skipped\n`);
    }

    // Seed Building Types
    async seedBuildingTypes(buildingTypeNames) {
        console.log('2. Seeding Building Types...');
        
        for (const name of buildingTypeNames) {
            const slug = generateSlug(name);
            
            try {
                let buildingType = await BuildingType.findOne({ $or: [{ name }, { slug }] });
                
                if (!buildingType) {
                    if (!DRY_RUN) {
                        buildingType = await BuildingType.create({
                            name,
                            slug,
                            isActive: true,
                            status: 'published',
                            featured: true,
                            publishedAt: new Date(),
                            createdBy: this.user._id
                        });
                    }
                    this.stats.buildingTypes.created++;
                } else {
                    if (buildingType.status !== 'published' || !buildingType.featured) {
                        if (!DRY_RUN) {
                            buildingType.status = 'published';
                            buildingType.featured = true;
                            buildingType.publishedAt = buildingType.publishedAt || new Date();
                            await buildingType.save();
                        }
                        this.stats.buildingTypes.updated++;
                    } else {
                        this.stats.buildingTypes.skipped++;
                    }
                }
                
                this.maps.buildingTypes.set(name, buildingType?._id || `dry-run-${name}`);
            } catch (error) {
                console.error(`   ✗ Error with building type "${name}": ${error.message}`);
                this.errors.push({ type: 'buildingType', name, error: error.message });
            }
        }
        
        console.log(`   Summary: ${this.stats.buildingTypes.created} created, ${this.stats.buildingTypes.updated} updated, ${this.stats.buildingTypes.skipped} skipped\n`);
    }

    // Seed Countries
    async seedCountries(countryNames) {
        console.log('3. Seeding Countries...');
        
        for (const name of countryNames) {
            try {
                let country = await Country.findOne({ name });
                
                if (!country) {
                    const code = generateCode(name);
                    // Check if code exists, if so, add suffix
                    let finalCode = code;
                    let suffix = 1;
                    while (await Country.findOne({ code: finalCode })) {
                        finalCode = `${code}${suffix}`;
                        suffix++;
                    }
                    
                    if (!DRY_RUN) {
                        country = await Country.create({
                            name,
                            code: finalCode,
                            isVisible: true,
                            isActive: true,
                            status: 'published',
                            featured: true,
                            publishedAt: new Date(),
                            createdBy: this.user._id
                        });
                    }
                    this.stats.countries.created++;
                } else {
                    if (country.status !== 'published' || !country.featured) {
                        if (!DRY_RUN) {
                            country.status = 'published';
                            country.featured = true;
                            country.publishedAt = country.publishedAt || new Date();
                            await country.save();
                        }
                        this.stats.countries.updated++;
                    } else {
                        this.stats.countries.skipped++;
                    }
                }
                
                this.maps.countries.set(name, country?._id || `dry-run-${name}`);
            } catch (error) {
                console.error(`   ✗ Error with country "${name}": ${error.message}`);
                this.errors.push({ type: 'country', name, error: error.message });
            }
        }
        
        console.log(`   Summary: ${this.stats.countries.created} created, ${this.stats.countries.updated} updated, ${this.stats.countries.skipped} skipped\n`);
    }

    // Seed Regions
    async seedRegions(regionNames) {
        console.log('4. Seeding Regions...');
        
        for (const name of regionNames) {
            try {
                let region = await Region.findOne({ name });
                
                if (!region) {
                    const code = generateCode(name);
                    let finalCode = code;
                    let suffix = 1;
                    while (await Region.findOne({ code: finalCode })) {
                        finalCode = `${code}${suffix}`;
                        suffix++;
                    }
                    
                    if (!DRY_RUN) {
                        region = await Region.create({
                            name,
                            code: finalCode,
                            isActive: true,
                            status: 'published',
                            featured: true,
                            publishedAt: new Date(),
                            createdBy: this.user._id
                        });
                    }
                    this.stats.regions.created++;
                } else {
                    if (region.status !== 'published' || !region.featured) {
                        if (!DRY_RUN) {
                            region.status = 'published';
                            region.featured = true;
                            region.publishedAt = region.publishedAt || new Date();
                            await region.save();
                        }
                        this.stats.regions.updated++;
                    } else {
                        this.stats.regions.skipped++;
                    }
                }
                
                this.maps.regions.set(name, region?._id || `dry-run-${name}`);
            } catch (error) {
                console.error(`   ✗ Error with region "${name}": ${error.message}`);
                this.errors.push({ type: 'region', name, error: error.message });
            }
        }
        
        console.log(`   Summary: ${this.stats.regions.created} created, ${this.stats.regions.updated} updated, ${this.stats.regions.skipped} skipped\n`);
    }

    // Seed Areas
    async seedAreas(areaNames) {
        console.log('5. Seeding Areas...');
        
        for (const name of areaNames) {
            try {
                let area = await Area.findOne({ name });
                
                if (!area) {
                    const code = generateCode(name);
                    let finalCode = code;
                    let suffix = 1;
                    while (await Area.findOne({ code: finalCode })) {
                        finalCode = `${code}${suffix}`;
                        suffix++;
                    }
                    
                    if (!DRY_RUN) {
                        area = await Area.create({
                            name,
                            code: finalCode,
                            isActive: true,
                            status: 'published',
                            featured: true,
                            publishedAt: new Date(),
                            createdBy: this.user._id
                        });
                    }
                    this.stats.areas.created++;
                } else {
                    if (area.status !== 'published' || !area.featured) {
                        if (!DRY_RUN) {
                            area.status = 'published';
                            area.featured = true;
                            area.publishedAt = area.publishedAt || new Date();
                            await area.save();
                        }
                        this.stats.areas.updated++;
                    } else {
                        this.stats.areas.skipped++;
                    }
                }
                
                this.maps.areas.set(name, area?._id || `dry-run-${name}`);
            } catch (error) {
                console.error(`   ✗ Error with area "${name}": ${error.message}`);
                this.errors.push({ type: 'area', name, error: error.message });
            }
        }
        
        console.log(`   Summary: ${this.stats.areas.created} created, ${this.stats.areas.updated} updated, ${this.stats.areas.skipped} skipped\n`);
    }

    // Load existing master data maps (if skipping master data seeding)
    async loadExistingMasterData() {
        console.log('Loading existing master data...\n');
        
        const industries = await Industry.find({ isActive: true });
        industries.forEach(i => this.maps.industries.set(i.name, i._id));
        
        const buildingTypes = await BuildingType.find({ isActive: true });
        buildingTypes.forEach(bt => this.maps.buildingTypes.set(bt.name, bt._id));
        
        const countries = await Country.find({ isActive: true });
        countries.forEach(c => this.maps.countries.set(c.name, c._id));
        
        const regions = await Region.find({ isActive: true });
        regions.forEach(r => this.maps.regions.set(r.name, r._id));
        
        const areas = await Area.find({ isActive: true });
        areas.forEach(a => this.maps.areas.set(a.name, a._id));
        
        console.log(`  Industries: ${this.maps.industries.size}`);
        console.log(`  Building Types: ${this.maps.buildingTypes.size}`);
        console.log(`  Countries: ${this.maps.countries.size}`);
        console.log(`  Regions: ${this.maps.regions.size}`);
        console.log(`  Areas: ${this.maps.areas.size}\n`);
    }

    // Helper: check if value is a dry-run placeholder (not a valid ObjectId)
    isDryRunPlaceholder(id) {
        if (!id) return true;
        if (typeof id !== 'string') return false;
        return id.startsWith('dry-run-');
    }

    // Seed Projects
    async seedProjects(scrapedData) {
        console.log('6. Seeding Projects...\n');
        
        let orderByIndustry = new Map();
        
        for (const industryData of scrapedData.industries) {
            const industryId = this.maps.industries.get(industryData.name);
            
            if (!industryId) {
                console.log(`   ⚠️  Industry not found: ${industryData.name}, skipping projects...`);
                continue;
            }
            
            // In dry-run, skip DB queries that would cast placeholder strings to ObjectId
            const industryIdValid = !DRY_RUN || !this.isDryRunPlaceholder(industryId);
            
            console.log(`   Processing ${industryData.name} (${industryData.projects.length} projects)...`);
            
            // Initialize order counter
            if (!orderByIndustry.has(industryData.name)) {
                let startOrder = 0;
                if (industryIdValid) {
                    const maxOrder = await Project.findOne({ industry: industryId })
                        .sort({ order: -1 })
                        .select('order')
                        .lean();
                    startOrder = maxOrder ? maxOrder.order + 1 : 0;
                }
                orderByIndustry.set(industryData.name, startOrder);
            }
            
            for (const projectData of industryData.projects) {
                try {
                    // Generate job number if not present
                    const jobNumber = projectData.jobNumber || 
                        `${generateSlug(industryData.name).substring(0, 2).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
                    const jobNumberSlug = generateJobNumberSlug(jobNumber);
                    
                    // Check if project exists
                    let existingProject = await Project.findOne({ jobNumberSlug });
                    
                    if (existingProject && !FORCE_UPDATE) {
                        this.stats.projects.skipped++;
                        continue;
                    }
                    
                    // Get references
                    const buildingTypeId = this.maps.buildingTypes.get(projectData.buildingType);
                    const countryId = this.maps.countries.get(projectData.country);
                    const regionId = this.maps.regions.get(projectData.region);
                    const areaId = this.maps.areas.get(projectData.area);
                    
                    // Validate required references
                    if (!buildingTypeId) {
                        throw new Error(`Building type not found: ${projectData.buildingType}`);
                    }
                    
                    // Use defaults for missing location data
                    const finalCountryId = countryId || this.maps.countries.values().next().value;
                    const finalRegionId = regionId || this.maps.regions.values().next().value;
                    const finalAreaId = areaId || this.maps.areas.values().next().value;
                    
                    if (!finalCountryId || !finalRegionId || !finalAreaId) {
                        throw new Error(`Missing required location data for project ${jobNumber}`);
                    }
                    
                    // Prepare project images
                    const projectImages = (projectData.projectImages || []).map((url, index) => ({
                        url: url,
                        publicId: `scraped_${jobNumberSlug}_${index}`,
                        order: index,
                        altText: `${projectData.buildingType} - Image ${index + 1}`
                    }));
                    
                    // Prepare thumbnail
                    const thumbnailImage = projectData.thumbnailImage ? {
                        url: projectData.thumbnailImage,
                        publicId: `scraped_${jobNumberSlug}_thumb`
                    } : (projectImages[0] ? {
                        url: projectImages[0].url,
                        publicId: projectImages[0].publicId
                    } : null);
                    
                    const currentOrder = orderByIndustry.get(industryData.name);
                    orderByIndustry.set(industryData.name, currentOrder + 1);
                    
                    const projectDoc = {
                        jobNumber,
                        jobNumberSlug,
                        typeSlug: generateSlug(projectData.buildingType),
                        buildingType: buildingTypeId,
                        industry: industryId,
                        country: finalCountryId,
                        region: finalRegionId,
                        area: finalAreaId,
                        thumbnailImage,
                        projectImages,
                        order: currentOrder,
                        status: 'published',
                        isActive: true,
                        featured: true,
                        publishedAt: new Date(),
                        createdBy: this.user._id
                    };
                    
                    if (!DRY_RUN) {
                        if (existingProject && FORCE_UPDATE) {
                            await Project.findByIdAndUpdate(existingProject._id, projectDoc);
                            this.stats.projects.updated++;
                        } else {
                            await Project.create(projectDoc);
                            this.stats.projects.created++;
                        }
                    } else {
                        this.stats.projects.created++;
                    }
                    
                } catch (error) {
                    this.stats.projects.errors++;
                    this.errors.push({
                        type: 'project',
                        jobNumber: projectData.jobNumber,
                        error: error.message
                    });
                }
            }
        }
        
        console.log(`\n   Summary: ${this.stats.projects.created} created, ${this.stats.projects.updated} updated, ${this.stats.projects.skipped} skipped, ${this.stats.projects.errors} errors\n`);
    }

    // Main seed function
    async seed() {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('      SCRAPED PROJECTS SEEDER');
        console.log('═══════════════════════════════════════════════════════════');
        
        if (DRY_RUN) {
            console.log('🔍 DRY RUN MODE - No changes will be made to the database\n');
        }
        
        try {
            await this.init();
            
            // Load scraped data
            const scrapedData = this.loadScrapedData();
            
            if (!scrapedData.industries || scrapedData.industries.length === 0) {
                throw new Error('No industries found in scraped data');
            }
            
            // Extract master data
            const masterData = this.extractMasterData(scrapedData);
            
            console.log('Extracted master data:');
            console.log(`  - Industries: ${masterData.industries.length}`);
            console.log(`  - Building Types: ${masterData.buildingTypes.length}`);
            console.log(`  - Countries: ${masterData.countries.length}`);
            console.log(`  - Regions: ${masterData.regions.length}`);
            console.log(`  - Areas: ${masterData.areas.length}\n`);
            
            if (SKIP_MASTER) {
                await this.loadExistingMasterData();
            } else {
                // Seed master data
                await this.seedIndustries(masterData.industries, masterData.industryImages);
                await this.seedBuildingTypes(masterData.buildingTypes);
                await this.seedCountries(masterData.countries);
                await this.seedRegions(masterData.regions);
                await this.seedAreas(masterData.areas);
            }
            
            // Seed projects
            await this.seedProjects(scrapedData);
            
            // Print summary
            this.printSummary();
            
        } catch (error) {
            console.error('\n❌ Fatal error:', error.message);
            process.exit(1);
        }
        
        process.exit(0);
    }

    printSummary() {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('      SEEDING SUMMARY');
        console.log('═══════════════════════════════════════════════════════════');
        
        if (!SKIP_MASTER) {
            console.log(`Industries:     ${this.stats.industries.created} created, ${this.stats.industries.updated} updated`);
            console.log(`Building Types: ${this.stats.buildingTypes.created} created, ${this.stats.buildingTypes.updated} updated`);
            console.log(`Countries:      ${this.stats.countries.created} created, ${this.stats.countries.updated} updated`);
            console.log(`Regions:        ${this.stats.regions.created} created, ${this.stats.regions.updated} updated`);
            console.log(`Areas:          ${this.stats.areas.created} created, ${this.stats.areas.updated} updated`);
        }
        
        console.log(`Projects:       ${this.stats.projects.created} created, ${this.stats.projects.updated} updated, ${this.stats.projects.skipped} skipped`);
        console.log('═══════════════════════════════════════════════════════════');
        
        if (this.errors.length > 0) {
            console.log(`\n⚠️  ${this.errors.length} errors encountered:`);
            this.errors.slice(0, 10).forEach(err => {
                console.log(`   - [${err.type}] ${err.name || err.jobNumber}: ${err.error}`);
            });
            if (this.errors.length > 10) {
                console.log(`   ... and ${this.errors.length - 10} more errors`);
            }
        }
        
        if (DRY_RUN) {
            console.log('\n🔍 This was a DRY RUN. No changes were made.');
            console.log('   Run without --dry-run to apply changes.');
        } else {
            console.log('\n✅ Seeding completed successfully!');
            console.log('\n📝 Notes:');
            console.log('   - All data is set to "published" status');
            console.log('   - Projects use direct image URLs from the old website');
            console.log('   - To use Cloudinary, run a migration script to upload images');
        }
    }
}

// Run seeder
const seeder = new ScrapedProjectsSeeder();
seeder.seed().catch(console.error);
