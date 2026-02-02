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
const Project = require('../models/Project');
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

// Helper function to generate slug from text
function generateSlug(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Helper function to clean job number for slug (handle special characters)
function generateJobNumberSlug(jobNumber) {
    return jobNumber
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Seed function
const seedProjects = async () => {
    try {
        // Verify MONGODB_URI is defined
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables. Please create a .env file in the backend directory with MONGODB_URI=your_connection_string');
        }

        await connectDB();

        console.log('Starting Projects seeding...\n');

        // Get or find a user for createdBy field
        let user = await User.findOne().sort({ createdAt: 1 }); // Get first user (oldest)
        
        if (!user) {
            console.log('⚠️  No users found in database.');
            console.log('Please create a user first or run the setup script.');
            console.log('You can create a user via the admin panel or use: node scripts/setupSuperAdmin.js\n');
            throw new Error('No user found. Please create a user first.');
        }

        console.log(`Using user: ${user.email} (${user.firstName} ${user.lastName})\n`);

        // Load all master data for lookups
        console.log('Loading master data...');
        const industries = await Industry.find({ isActive: true });
        const buildingTypes = await BuildingType.find({ isActive: true });
        const countries = await Country.find({ isActive: true });
        const regions = await Region.find({ isActive: true });
        const areas = await Area.find({ isActive: true });

        // Create lookup maps (regions and areas are standalone - lookup by name)
        const industryMap = new Map();
        industries.forEach(ind => {
            industryMap.set(ind.name, ind._id);
        });

        const buildingTypeMap = new Map();
        buildingTypes.forEach(bt => {
            buildingTypeMap.set(bt.name, bt._id);
        });

        const countryMap = new Map();
        countries.forEach(c => {
            countryMap.set(c.name, c._id);
        });

        const regionMap = new Map();
        regions.forEach(r => {
            regionMap.set(r.name, r._id);
        });

        const areaMap = new Map();
        areas.forEach(a => {
            areaMap.set(a.name, a._id);
        });

        console.log(`  Industries: ${industryMap.size}`);
        console.log(`  Building Types: ${buildingTypeMap.size}`);
        console.log(`  Countries: ${countryMap.size}`);
        console.log(`  Regions: ${regionMap.size}`);
        console.log(`  Areas: ${areaMap.size}\n`);

        // Process all projects
        console.log('Processing projects from data.json...\n');
        
        let totalProjects = 0;
        let projectsCreated = 0;
        let projectsSkipped = 0;
        let projectsWithErrors = 0;
        const errors = [];

        // Track order per industry
        const industryOrderMap = new Map();

        for (const industryData of projectsData) {
            const industryName = industryData.industry;
            const industryId = industryMap.get(industryName);

            if (!industryId) {
                console.log(`⚠️  Warning: Industry "${industryName}" not found in database. Skipping all projects in this industry.`);
                continue;
            }

            // Initialize order counter for this industry
            if (!industryOrderMap.has(industryName)) {
                industryOrderMap.set(industryName, 0);
            }

            for (const projectData of industryData.projects) {
                totalProjects++;

                try {
                    // Check if project already exists
                    const jobNumberSlug = generateJobNumberSlug(projectData.jobNumber);
                    const existingProject = await Project.findOne({ jobNumberSlug: jobNumberSlug });

                    if (existingProject) {
                        projectsSkipped++;
                        continue;
                    }

                    // Get references
                    const buildingTypeId = buildingTypeMap.get(projectData.buildingType);
                    const countryId = countryMap.get(projectData.country);
                    
                    // Find region and area by name (standalone - no hierarchy)
                    const regionId = regionMap.get(projectData.region);
                    const areaId = areaMap.get(projectData.area);

                    // Validate required references
                    if (!buildingTypeId) {
                        throw new Error(`Building type "${projectData.buildingType}" not found`);
                    }
                    if (!countryId) {
                        throw new Error(`Country "${projectData.country}" not found`);
                    }
                    if (!regionId) {
                        throw new Error(`Region "${projectData.region}" not found`);
                    }
                    if (!areaId) {
                        throw new Error(`Area "${projectData.area}" not found`);
                    }

                    // Generate slugs
                    const typeSlug = generateSlug(projectData.buildingType);

                    // Process special features
                    let specialFeatures = [];
                    if (projectData.accessoriesAndSpecialFeatures && 
                        projectData.accessoriesAndSpecialFeatures !== '--' &&
                        projectData.accessoriesAndSpecialFeatures.trim() !== '') {
                        // Split by comma or semicolon and clean
                        specialFeatures = projectData.accessoriesAndSpecialFeatures
                            .split(/[,;]/)
                            .map(f => f.trim())
                            .filter(f => f.length > 0);
                    }

                    // Process total area
                    let totalArea = null;
                    if (projectData.builtUpAreaSqm && 
                        projectData.builtUpAreaSqm !== '--' &&
                        projectData.builtUpAreaSqm.trim() !== '') {
                        totalArea = projectData.builtUpAreaSqm.trim();
                    }

                    // Get order for this industry
                    const currentOrder = industryOrderMap.get(industryName);
                    industryOrderMap.set(industryName, currentOrder + 1);

                    // Create project
                    const project = await Project.create({
                        jobNumber: projectData.jobNumber,
                        jobNumberSlug: jobNumberSlug,
                        typeSlug: typeSlug,
                        buildingType: buildingTypeId,
                        industry: industryId,
                        country: countryId,
                        region: regionId,
                        area: areaId,
                        specialFeatures: specialFeatures,
                        totalArea: totalArea,
                        order: currentOrder,
                        status: 'draft',
                        isActive: true,
                        featured: false,
                        createdBy: user._id
                    });

                    projectsCreated++;

                    // Log progress every 50 projects
                    if (projectsCreated % 50 === 0) {
                        console.log(`  Processed ${projectsCreated} projects...`);
                    }

                } catch (error) {
                    projectsWithErrors++;
                    errors.push({
                        jobNumber: projectData.jobNumber,
                        error: error.message
                    });
                    console.log(`  ⚠️  Error processing project ${projectData.jobNumber}: ${error.message}`);
                }
            }
        }

        // Summary
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('Projects Seeding Summary:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`Total Projects:     ${totalProjects}`);
        console.log(`Created:            ${projectsCreated}`);
        console.log(`Skipped (existing): ${projectsSkipped}`);
        console.log(`Errors:             ${projectsWithErrors}`);
        console.log('═══════════════════════════════════════════════════════════\n');

        if (errors.length > 0) {
            console.log('Projects with errors:');
            errors.slice(0, 10).forEach(err => {
                console.log(`  - ${err.jobNumber}: ${err.error}`);
            });
            if (errors.length > 10) {
                console.log(`  ... and ${errors.length - 10} more errors`);
            }
            console.log('');
        }

        // Show projects by industry
        console.log('Projects by Industry:');
        for (const [industryName, order] of industryOrderMap.entries()) {
            const industryId = industryMap.get(industryName);
            if (industryId) {
                const count = await Project.countDocuments({ industry: industryId });
                console.log(`  ${industryName}: ${count} projects`);
            }
        }
        console.log('');

        console.log('⚠️  IMPORTANT: All projects are in DRAFT status.');
        console.log('   They will NOT appear on the frontend until status is changed to "published".');
        console.log('   This is by design for workflow testing.\n');

        console.log('Projects seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding projects:', error);
        process.exit(1);
    }
};

// Run seeder if called directly
if (require.main === module) {
    seedProjects();
}

module.exports = { seedProjects };

