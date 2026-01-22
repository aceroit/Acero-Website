const path = require('path');

// Load environment variables FIRST
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}

const mongoose = require('mongoose');
const Vacancy = require('../models/Vacancy');
const connectDB = require('../configs/database');

// Base URL for API (default to localhost:3000)
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Simple HTTP client using Node.js built-in modules
const http = require('http');
const https = require('https');
const { URL } = require('url');

/**
 * Make HTTP request
 */
const makeRequest = (url, method = 'GET', data = null) => {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;

        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const req = client.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const parsedBody = body ? JSON.parse(body) : {};
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: parsedBody,
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body,
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
};

/**
 * Test the API endpoints
 */
const testAPIEndpoints = async () => {
    try {
        // Verify MONGODB_URI
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }

        await connectDB();

        console.log('=== Testing API Endpoints ===\n');
        console.log(`API Base URL: ${API_BASE_URL}\n`);

        // Step 1: Get published vacancies from database to use for testing
        console.log('Step 1: Getting published vacancies from database...');
        const publishedVacancies = await Vacancy.find({
            status: 'published',
            featured: true,
            isActive: true
        }).limit(2);

        if (publishedVacancies.length === 0) {
            console.log('⚠ Warning: No published vacancies found. Please run the vacancies seeder first.');
            console.log('   Run: node backend/seeders/vacancies.seeder.js\n');
            process.exit(1);
        }

        console.log(`✓ Found ${publishedVacancies.length} published vacancies:`);
        publishedVacancies.forEach((v, i) => {
            console.log(`   ${i + 1}. ${v.title} (${v.department}) - ID: ${v._id}`);
        });

        // Step 2: Test GET /api/public/vacancies
        console.log('\nStep 2: Testing GET /api/public/vacancies...');
        try {
            const response = await makeRequest(`${API_BASE_URL}/api/public/vacancies`);
            if (response.statusCode === 200) {
                console.log(`✓ Success! Status: ${response.statusCode}`);
                console.log(`  Message: ${response.body.message || 'N/A'}`);
                console.log(`  Vacancies count: ${response.body.data?.count || response.body.data?.vacancies?.length || 0}`);
                if (response.body.data?.vacancies && response.body.data.vacancies.length > 0) {
                    console.log(`  Sample vacancy: ${response.body.data.vacancies[0].title}`);
                }
            } else {
                console.log(`✗ Failed! Status: ${response.statusCode}`);
                console.log(`  Response: ${JSON.stringify(response.body, null, 2)}`);
            }
        } catch (error) {
            console.log(`✗ Error: ${error.message}`);
            console.log('  Make sure the backend server is running on', API_BASE_URL);
        }

        // Step 3: Test POST /api/public/enquiries
        console.log('\nStep 3: Testing POST /api/public/enquiries...');
        const enquiryData = {
            purpose: 'general',
            fullName: 'Test User',
            companyName: 'Test Company Ltd',
            mobileNumber: '+971501234567',
            email: 'test.user@example.com',
            country: 'United Arab Emirates',
            countryCode: '+971',
            telephoneNumber: '+97141234567',
            subject: 'Test Enquiry from Script',
            message: 'This is a test enquiry created by the test script to verify the API endpoint is working correctly.',
        };

        try {
            const response = await makeRequest(`${API_BASE_URL}/api/public/enquiries`, 'POST', enquiryData);
            if (response.statusCode === 201) {
                console.log(`✓ Success! Status: ${response.statusCode}`);
                console.log(`  Message: ${response.body.message || 'N/A'}`);
                console.log(`  Enquiry ID: ${response.body.data?.enquiryId || 'N/A'}`);
            } else {
                console.log(`✗ Failed! Status: ${response.statusCode}`);
                console.log(`  Response: ${JSON.stringify(response.body, null, 2)}`);
            }
        } catch (error) {
            console.log(`✗ Error: ${error.message}`);
            console.log('  Make sure the backend server is running on', API_BASE_URL);
        }

        // Step 4: Test POST /api/public/applications
        console.log('\nStep 4: Testing POST /api/public/applications...');
        const applicationData = {
            vacancyId: publishedVacancies[0]._id.toString(),
            firstName: 'Test',
            lastName: 'Applicant',
            email: 'test.applicant@example.com',
            mobileNumber: '+971502345678',
            country: 'United Arab Emirates',
            experienceLevel: 'mid',
            educationLevel: 'bachelor',
            hasEngineeringDegree: 'yes',
            languages: ['english', 'arabic'],
            coverLetter: 'This is a test application created by the test script to verify the API endpoint is working correctly.',
            cvFile: {
                url: 'https://example.com/cv/test-applicant.pdf',
                publicId: 'applications/cv/test-applicant',
                filename: 'Test_Applicant_CV.pdf',
                size: 245760,
                mimeType: 'application/pdf',
            },
        };

        try {
            const response = await makeRequest(`${API_BASE_URL}/api/public/applications`, 'POST', applicationData);
            if (response.statusCode === 201) {
                console.log(`✓ Success! Status: ${response.statusCode}`);
                console.log(`  Message: ${response.body.message || 'N/A'}`);
                console.log(`  Application ID: ${response.body.data?.applicationId || 'N/A'}`);
            } else {
                console.log(`✗ Failed! Status: ${response.statusCode}`);
                console.log(`  Response: ${JSON.stringify(response.body, null, 2)}`);
            }
        } catch (error) {
            console.log(`✗ Error: ${error.message}`);
            console.log('  Make sure the backend server is running on', API_BASE_URL);
        }

        // Summary
        console.log('\n=== Test Summary ===');
        console.log('✓ API endpoint tests completed!');
        console.log('\nNote: Make sure the backend server is running before testing.');
        console.log('  Start server: npm run dev (in backend directory)');
        console.log(`  Server should be running on: ${API_BASE_URL}`);

        process.exit(0);
    } catch (error) {
        console.error('✗ Error testing API endpoints:', error);
        process.exit(1);
    }
};

// Run test if called directly
if (require.main === module) {
    testAPIEndpoints();
}

module.exports = testAPIEndpoints;

