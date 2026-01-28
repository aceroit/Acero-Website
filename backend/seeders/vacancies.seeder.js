const path = require('path');

// Load environment variables FIRST, before requiring database config
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
// Fallback to .env.local if .env doesn't exist
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}

// Now require modules that depend on environment variables
const mongoose = require('mongoose');
const Vacancy = require('../models/Vacancy');
const User = require('../models/User');
const connectDB = require('../configs/database');

// Vacancies data from frontend/utils/career-data.ts
const vacanciesData = [
    {
        _id: "1",
        title: "Structural Engineer",
        department: "Engineering",
        location: "Dubai, UAE",
        type: "Full-time",
        isActive: true,
    },
    {
        _id: "2",
        title: "Project Manager",
        department: "Operations",
        location: "Dubai, UAE",
        type: "Full-time",
        isActive: true,
    },
    {
        _id: "3",
        title: "Quality Control Inspector",
        department: "Quality Assurance",
        location: "Dubai, UAE",
        type: "Full-time",
        isActive: true,
    },
    {
        _id: "4",
        title: "Sales Executive",
        department: "Sales",
        location: "Dubai, UAE",
        type: "Full-time",
        isActive: true,
    },
    {
        _id: "5",
        title: "CAD Designer",
        department: "Design",
        location: "Dubai, UAE",
        type: "Full-time",
        isActive: true,
    },
    {
        _id: "6",
        title: "Production Supervisor",
        department: "Manufacturing",
        location: "Dubai, UAE",
        type: "Full-time",
        isActive: true,
    },
];

// Experience levels, education levels, and languages from career-data.ts
const experienceLevels = [
    { value: "entry", label: "Entry Level (0-2 years)" },
    { value: "mid", label: "Mid Level (3-5 years)" },
    { value: "senior", label: "Senior Level (6-10 years)" },
    { value: "executive", label: "Executive Level (10+ years)" },
];

const educationLevels = [
    { value: "high-school", label: "High School" },
    { value: "diploma", label: "Diploma" },
    { value: "bachelor", label: "Bachelor's Degree" },
    { value: "master", label: "Master's Degree" },
    { value: "phd", label: "PhD" },
];

const languages = [
    { value: "english", label: "English" },
    { value: "arabic", label: "Arabic" },
    { value: "french", label: "French" },
    { value: "spanish", label: "Spanish" },
    { value: "italian", label: "Italian" },
    { value: "portuguese", label: "Portuguese" },
    { value: "russian", label: "Russian" },
    { value: "turkish", label: "Turkish" },
];

// Default notification email (can be configured via environment variable)
const DEFAULT_NOTIFICATION_EMAIL = process.env.VACANCY_NOTIFICATION_EMAIL || 'hr@acero.com';

/**
 * Seed Vacancies from frontend static data
 */
const seedVacancies = async () => {
    try {
        // Verify MONGODB_URI
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }

        await connectDB();

        console.log('Starting Vacancies seeding...\n');

        // Get or create a user for createdBy field
        let user = await User.findOne({ email: 'admin@acero.com' });
        if (!user) {
            // Try to get any admin user
            user = await User.findOne({ role: 'admin' });
            if (!user) {
                // Get any user
                user = await User.findOne();
                if (!user) {
                    throw new Error('No user found. Please create a user first.');
                }
            }
        }

        console.log(`Using user: ${user.email} (${user._id})\n`);

        let vacanciesCreated = 0;
        let vacanciesUpdated = 0;
        let vacanciesSkipped = 0;
        let draftCount = 0;

        // Process each vacancy
        for (let i = 0; i < vacanciesData.length; i++) {
            const vacancyData = vacanciesData[i];
            // First 2 entries should be draft, rest should be published
            const shouldBeDraft = i < 2;
            
            // Check if vacancy already exists by title and department
            let vacancy = await Vacancy.findOne({
                title: vacancyData.title,
                department: vacancyData.department
            });

            if (!vacancy) {
                // Create new vacancy
                const vacancyPayload = {
                    title: vacancyData.title,
                    department: vacancyData.department,
                    location: vacancyData.location,
                    type: vacancyData.type,
                    description: null, // Can be added later via admin panel
                    requirements: [], // Can be added later via admin panel
                    responsibilities: [], // Can be added later via admin panel
                    experienceLevels: experienceLevels,
                    educationLevels: educationLevels,
                    languages: languages,
                    notificationEmail: DEFAULT_NOTIFICATION_EMAIL,
                    status: shouldBeDraft ? 'draft' : 'published',
                    isActive: vacancyData.isActive !== false, // Default to true
                    featured: shouldBeDraft ? false : true, // Draft entries not featured
                    createdBy: user._id,
                };
                
                // Only set publishedAt if not draft
                if (!shouldBeDraft) {
                    vacancyPayload.publishedAt = new Date();
                }
                
                vacancy = await Vacancy.create(vacancyPayload);
                vacanciesCreated++;
                draftCount += shouldBeDraft ? 1 : 0;
                console.log(`✓ Created vacancy: ${vacancy.title} (${vacancy.department}) - Status: ${vacancy.status}`);
            } else {
                // Update existing vacancy
                const shouldUpdate = shouldBeDraft 
                    ? (vacancy.status !== 'draft' || vacancy.featured)
                    : (vacancy.status !== 'published' || !vacancy.featured);
                
                if (shouldUpdate) {
                    vacancy.status = shouldBeDraft ? 'draft' : 'published';
                    vacancy.featured = shouldBeDraft ? false : true;
                    if (!shouldBeDraft) {
                        vacancy.publishedAt = vacancy.publishedAt || new Date();
                    } else {
                        // Clear publishedAt for draft entries
                        vacancy.publishedAt = null;
                    }
                    vacancy.isActive = vacancyData.isActive !== false;
                    // Update experience levels, education levels, and languages if they're empty
                    if (!vacancy.experienceLevels || vacancy.experienceLevels.length === 0) {
                        vacancy.experienceLevels = experienceLevels;
                    }
                    if (!vacancy.educationLevels || vacancy.educationLevels.length === 0) {
                        vacancy.educationLevels = educationLevels;
                    }
                    if (!vacancy.languages || vacancy.languages.length === 0) {
                        vacancy.languages = languages;
                    }
                    await vacancy.save();
                    vacanciesUpdated++;
                    draftCount += shouldBeDraft ? 1 : 0;
                    console.log(`✓ Updated vacancy: ${vacancy.title} (${vacancy.department}) - Status: ${vacancy.status}`);
                } else {
                    vacanciesSkipped++;
                    draftCount += vacancy.status === 'draft' ? 1 : 0;
                    console.log(`⊘ Skipped vacancy (already in correct state): ${vacancy.title} (${vacancy.department}) - Status: ${vacancy.status}`);
                }
            }
        }

        console.log('\n=== Seeding Summary ===');
        console.log(`Vacancies created: ${vacanciesCreated}`);
        console.log(`Vacancies updated: ${vacanciesUpdated}`);
        console.log(`Vacancies skipped: ${vacanciesSkipped}`);
        console.log(`Draft vacancies: ${draftCount}`);
        console.log(`Published vacancies: ${vacanciesData.length - draftCount}`);
        console.log(`Total processed: ${vacanciesData.length}\n`);

        console.log('✓ Vacancies seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('✗ Error seeding vacancies:', error);
        process.exit(1);
    }
};

// Run seeder if called directly
if (require.main === module) {
    seedVacancies();
}

module.exports = seedVacancies;

