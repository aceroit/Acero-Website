const path = require('path');

// Load environment variables FIRST
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}

const mongoose = require('mongoose');
const Vacancy = require('../models/Vacancy');
const Enquiry = require('../models/Enquiry');
const Application = require('../models/Application');
const connectDB = require('../configs/database');

// Base URL for API (default to localhost:3000)
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

/**
 * Test the enquiries and applications routes
 */
const testRoutes = async () => {
    try {
        // Verify MONGODB_URI
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }

        await connectDB();

        console.log('=== Testing Enquiries and Applications Routes ===\n');
        console.log(`API Base URL: ${API_BASE_URL}\n`);

        // Step 1: Get published vacancies
        console.log('Step 1: Getting published vacancies...');
        const publishedVacancies = await Vacancy.find({
            status: 'published',
            featured: true,
            isActive: true
        }).limit(2);

        if (publishedVacancies.length === 0) {
            console.log('⚠ Warning: No published vacancies found. Please run the vacancies seeder first.');
            console.log('   Run: node backend/seeders/vacancies.seeder.js\n');
        } else {
            console.log(`✓ Found ${publishedVacancies.length} published vacancies:`);
            publishedVacancies.forEach((v, i) => {
                console.log(`   ${i + 1}. ${v.title} (${v.department}) - ID: ${v._id}`);
            });
        }

        // Step 2: Create dummy enquiries
        console.log('\nStep 2: Creating dummy enquiries...');
        const dummyEnquiries = [
            {
                purpose: 'general',
                fullName: 'John Doe',
                companyName: 'ABC Construction Ltd',
                mobileNumber: '+971501234567',
                email: 'john.doe@example.com',
                country: 'United Arab Emirates',
                countryCode: '+971',
                telephoneNumber: '+97141234567',
                subject: 'General Inquiry about Services',
                message: 'I would like to know more about your structural engineering services. Please contact me at your earliest convenience.',
            },
            {
                purpose: 'sales',
                fullName: 'Jane Smith',
                companyName: 'XYZ Developers',
                mobileNumber: '+971502345678',
                email: 'jane.smith@example.com',
                country: 'United Arab Emirates',
                countryCode: '+971',
                telephoneNumber: '+97142345678',
                subject: 'Request for Quotation',
                message: 'We are planning a new project and would like to request a quotation for your services. Please provide details about pricing and timelines.',
            },
            {
                purpose: 'support',
                fullName: 'Ahmed Al-Mansoori',
                companyName: null,
                mobileNumber: '+971503456789',
                email: 'ahmed.almansoori@example.com',
                country: 'United Arab Emirates',
                countryCode: '+971',
                telephoneNumber: null,
                subject: 'Technical Support Request',
                message: 'I need assistance with a technical issue regarding one of your products. Can someone from your support team contact me?',
            },
        ];

        let enquiriesCreated = 0;
        for (const enquiryData of dummyEnquiries) {
            try {
                const enquiry = new Enquiry(enquiryData);
                enquiry.submittedAt = new Date();
                enquiry.ipAddress = '127.0.0.1';
                await enquiry.save();
                enquiriesCreated++;
                console.log(`✓ Created enquiry: ${enquiry.fullName} - ${enquiry.subject} (ID: ${enquiry._id})`);
            } catch (error) {
                console.log(`✗ Failed to create enquiry for ${enquiryData.fullName}: ${error.message}`);
            }
        }
        console.log(`\n✓ Created ${enquiriesCreated} dummy enquiries`);

        // Step 3: Create dummy applications (using published vacancies)
        console.log('\nStep 3: Creating dummy applications...');
        if (publishedVacancies.length === 0) {
            console.log('⚠ Skipping applications - no published vacancies available');
        } else {
            const dummyApplications = [
                {
                    vacancyId: publishedVacancies[0]._id,
                    firstName: 'Mohammed',
                    lastName: 'Al-Rashid',
                    email: 'mohammed.alrashid@example.com',
                    mobileNumber: '+971504567890',
                    country: 'United Arab Emirates',
                    experienceLevel: 'mid',
                    educationLevel: 'bachelor',
                    hasEngineeringDegree: 'yes',
                    languages: ['english', 'arabic'],
                    coverLetter: 'I am a structural engineer with 4 years of experience in the construction industry. I am very interested in this position and believe my skills align perfectly with your requirements.',
                    cvFile: {
                        url: 'https://example.com/cv/mohammed-alrashid.pdf',
                        publicId: 'applications/cv/mohammed-alrashid',
                        filename: 'Mohammed_AlRashid_CV.pdf',
                        size: 245760, // 240 KB
                        mimeType: 'application/pdf',
                    },
                },
                {
                    vacancyId: publishedVacancies[0]._id,
                    firstName: 'Sarah',
                    lastName: 'Johnson',
                    email: 'sarah.johnson@example.com',
                    mobileNumber: '+971505678901',
                    country: 'United Kingdom',
                    experienceLevel: 'senior',
                    educationLevel: 'master',
                    hasEngineeringDegree: 'yes',
                    languages: ['english', 'french'],
                    coverLetter: 'With over 8 years of experience in project management and structural engineering, I am excited to apply for this position. I have a proven track record of delivering complex projects on time and within budget.',
                    cvFile: {
                        url: 'https://example.com/cv/sarah-johnson.pdf',
                        publicId: 'applications/cv/sarah-johnson',
                        filename: 'Sarah_Johnson_CV.pdf',
                        size: 307200, // 300 KB
                        mimeType: 'application/pdf',
                    },
                },
            ];

            // If we have a second vacancy, add an application for it too
            if (publishedVacancies.length > 1) {
                dummyApplications.push({
                    vacancyId: publishedVacancies[1]._id,
                    firstName: 'David',
                    lastName: 'Chen',
                    email: 'david.chen@example.com',
                    mobileNumber: '+971506789012',
                    country: 'China',
                    experienceLevel: 'entry',
                    educationLevel: 'bachelor',
                    hasEngineeringDegree: 'yes',
                    languages: ['english', 'chinese'],
                    coverLetter: 'I am a recent graduate with a Bachelor\'s degree in Civil Engineering. I am eager to start my career and learn from experienced professionals in your team.',
                    cvFile: {
                        url: 'https://example.com/cv/david-chen.pdf',
                        publicId: 'applications/cv/david-chen',
                        filename: 'David_Chen_CV.pdf',
                        size: 204800, // 200 KB
                        mimeType: 'application/pdf',
                    },
                });
            }

            let applicationsCreated = 0;
            for (const applicationData of dummyApplications) {
                try {
                    const application = new Application(applicationData);
                    application.submittedAt = new Date();
                    application.ipAddress = '127.0.0.1';
                    await application.save();
                    applicationsCreated++;
                    const vacancy = publishedVacancies.find(v => v._id.toString() === applicationData.vacancyId.toString());
                    console.log(`✓ Created application: ${application.firstName} ${application.lastName} for ${vacancy?.title || 'Unknown'} (ID: ${application._id})`);
                } catch (error) {
                    console.log(`✗ Failed to create application for ${applicationData.firstName} ${applicationData.lastName}: ${error.message}`);
                }
            }
            console.log(`\n✓ Created ${applicationsCreated} dummy applications`);
        }

        // Step 4: Display summary
        console.log('\n=== Test Summary ===');
        console.log(`Published vacancies found: ${publishedVacancies.length}`);
        console.log(`Dummy enquiries created: ${enquiriesCreated}`);
        if (publishedVacancies.length > 0) {
            const applicationsCount = await Application.countDocuments({ isActive: true });
            console.log(`Total applications in database: ${applicationsCount}`);
        }
        console.log('\n✓ Testing completed successfully!');
        console.log('\nYou can now test the API endpoints:');
        console.log(`  GET  ${API_BASE_URL}/api/public/vacancies`);
        console.log(`  POST ${API_BASE_URL}/api/public/enquiries`);
        console.log(`  POST ${API_BASE_URL}/api/public/applications`);
        console.log('\nTo test with curl:');
        console.log(`  curl ${API_BASE_URL}/api/public/vacancies`);
        console.log(`  curl -X POST ${API_BASE_URL}/api/public/enquiries \\`);
        console.log(`    -H "Content-Type: application/json" \\`);
        console.log(`    -d '{"purpose":"general","fullName":"Test User","email":"test@example.com","mobileNumber":"+971501234567","country":"UAE","subject":"Test","message":"Test message"}'`);

        process.exit(0);
    } catch (error) {
        console.error('✗ Error testing routes:', error);
        process.exit(1);
    }
};

// Run test if called directly
if (require.main === module) {
    testRoutes();
}

module.exports = testRoutes;

