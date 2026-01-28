/**
 * Public API routes. No authentication required.
 *
 * Listed content contract: List and detail endpoints for branches, customers,
 * certifications, company-updates, brochures, and company-update-categories
 * return only records with status: 'published', featured: true, and isActive: true
 * (where applicable). Models implement getPublished() with this contract.
 */
const express = require('express');
const router = express.Router();
const Page = require('../models/Page');
const Section = require('../models/Section');
const Project = require('../models/Project');
const Branch = require('../models/Branch');
const Customer = require('../models/Customer');
const Certification = require('../models/Certification');
const CompanyUpdate = require('../models/CompanyUpdate');
const CompanyUpdateCategory = require('../models/CompanyUpdateCategory');
const Brochure = require('../models/Brochure');
const HeaderConfiguration = require('../models/HeaderConfiguration');
const FooterConfiguration = require('../models/FooterConfiguration');
const WebsiteAppearance = require('../models/WebsiteAppearance');
const GoogleReCaptcha = require('../models/GoogleReCaptcha');
const GoogleMaps = require('../models/GoogleMaps');
const Industry = require('../models/Industry');
const BuildingType = require('../models/BuildingType');
const Country = require('../models/Country');
const Region = require('../models/Region');
const Area = require('../models/Area');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const Vacancy = require('../models/Vacancy');
const Enquiry = require('../models/Enquiry');
const Application = require('../models/Application');
const FormConfiguration = require('../models/FormConfiguration');
const fileUpload = require('express-fileupload');

// Configure file upload middleware for public CV uploads
const uploadMiddleware = fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB max for CV files
    },
    abortOnLimit: true,
    createParentPath: true
});

/**
 * GET /api/public/pages/tree - Get published page tree for navigation
 * No authentication required
 */
router.get('/pages/tree', async (req, res) => {
    try {
        const tree = await Page.getPublishedTree();

        // Set cache headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');

        return successResponse(res, 200, 'Published page tree retrieved successfully', { tree });
    } catch (error) {
        console.error('Error in public getPageTree:', error);
        return errorResponse(res, 500, 'Failed to retrieve page tree');
    }
});

/**
 * GET /api/public/pages/slug/:slug - Get published page by slug with sections
 * No authentication required
 */
router.get('/pages/slug/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        // Find published page by slug
        const page = await Page.findOne({
            slug,
            isActive: true,
            status: 'published'
        }).select('title slug path metaTitle metaDescription metaKeywords');

        if (!page) {
            return errorResponse(res, 404, 'Page not found');
        }

        // Get published sections for this page
        const sections = await Section.getPublishedSections(page._id);

        // Set cache headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');

        return successResponse(res, 200, 'Page retrieved successfully', {
            page,
            sections
        });
    } catch (error) {
        console.error('Error in public getPageBySlug:', error);
        return errorResponse(res, 500, 'Failed to retrieve page');
    }
});

/**
 * GET /api/public/pages/by-path - Get published page by full path
 * Query param: ?path=/some/path
 * No authentication required
 */
router.get('/pages/by-path', async (req, res) => {
    try {
        // Extract the full path from query parameter
        const fullPath = req.query.path;

        // Find published page by path
        const page = await Page.findOne({
            path: fullPath,
            isActive: true,
            status: 'published'
        }).select('title slug path metaTitle metaDescription metaKeywords');

        if (!page) {
            return errorResponse(res, 404, 'Page not found');
        }

        // Get published sections for this page
        const sections = await Section.getPublishedSections(page._id);

        // Get breadcrumb trail
        const breadcrumb = await page.getBreadcrumb();

        // Set cache headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');

        return successResponse(res, 200, 'Page retrieved successfully', {
            page,
            sections,
            breadcrumb
        });
    } catch (error) {
        console.error('Error in public getPageByPath:', error);
        return errorResponse(res, 500, 'Failed to retrieve page');
    }
});

/**
 * GET /api/public/pages/:id/sections - Get published sections for a page
 * No authentication required
 */
router.get('/pages/:id/sections', async (req, res) => {
    try {
        const { id } = req.params;

        // Verify page exists and is published
        const page = await Page.findOne({
            _id: id,
            isActive: true,
            status: 'published'
        });

        if (!page) {
            return errorResponse(res, 404, 'Page not found');
        }

        const sections = await Section.getPublishedSections(id);

        // Set cache headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');

        return successResponse(res, 200, 'Sections retrieved successfully', { sections });
    } catch (error) {
        console.error('Error in public getPageSections:', error);
        return errorResponse(res, 500, 'Failed to retrieve sections');
    }
});

/**
 * GET /api/public/search - Search published pages
 * No authentication required
 */
router.get('/search', async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;

        if (!q || q.trim().length < 2) {
            return errorResponse(res, 400, 'Search query must be at least 2 characters');
        }

        const searchRegex = new RegExp(q, 'i');

        const pages = await Page.find({
            isActive: true,
            status: 'published',
            $or: [
                { title: searchRegex },
                { metaDescription: searchRegex },
                { metaKeywords: searchRegex }
            ]
        })
            .select('title slug path metaDescription')
            .limit(parseInt(limit))
            .sort({ title: 1 });

        // Set cache headers (cache for 2 minutes for search results)
        res.set('Cache-Control', 'public, max-age=120');

        return successResponse(res, 200, 'Search completed successfully', {
            results: pages,
            count: pages.length
        });
    } catch (error) {
        console.error('Error in public search:', error);
        return errorResponse(res, 500, 'Search failed');
    }
});

/**
 * GET /api/public/industries - Get published industries with logos
 * Query params: country, region, area (for filtering)
 * No authentication required
 */
router.get('/industries', async (req, res) => {
    try {
        const { country, region, area } = req.query;
        
        // Build filter based on location filters
        let industryFilter = {};
        if (country || region || area) {
            // Find projects matching location filters to get industries
            const projectFilters = {};
            if (country) {
                const countryDoc = await Country.findOne({ code: country.toUpperCase(), isActive: true });
                if (countryDoc) projectFilters.country = countryDoc._id;
            }
            if (region) {
                const regionDoc = await Region.findOne({ code: region.toUpperCase(), isActive: true });
                if (regionDoc) projectFilters.region = regionDoc._id;
            }
            if (area) {
                const areaDoc = await Area.findOne({ code: area.toUpperCase(), isActive: true });
                if (areaDoc) projectFilters.area = areaDoc._id;
            }
            
            // Get unique industry IDs from matching projects
            const projects = await Project.find({
                ...projectFilters,
                status: 'published',
                featured: true,
                isActive: true
            }).distinct('industry');
            
            if (projects.length > 0) {
                industryFilter._id = { $in: projects };
            } else {
                // No projects match, return empty array
                return successResponse(res, 200, 'Published industries retrieved successfully', {
                    industries: [],
                    count: 0
                });
            }
        }

        const industries = await Industry.getPublished(industryFilter);

        // Build location filters for project count
        const locationFilters = {};
        if (country) {
            const countryDoc = await Country.findOne({ code: country.toUpperCase(), isActive: true });
            if (countryDoc) locationFilters.country = countryDoc._id;
        }
        if (region) {
            const regionDoc = await Region.findOne({ code: region.toUpperCase(), isActive: true });
            if (regionDoc) locationFilters.region = regionDoc._id;
        }
        if (area) {
            const areaDoc = await Area.findOne({ code: area.toUpperCase(), isActive: true });
            if (areaDoc) locationFilters.area = areaDoc._id;
        }

        // Calculate project count for each industry
        const industriesWithCounts = await Promise.all(
            industries.map(async (industry) => {
                const projectCount = await Project.countDocuments({
                    industry: industry._id,
                    status: 'published',
                    featured: true,
                    isActive: true,
                    ...locationFilters,
                });
                return {
                    ...industry.toObject(),
                    projectCount
                };
            })
        );

        // Set cache headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');

        return successResponse(res, 200, 'Published industries retrieved successfully', {
            industries: industriesWithCounts,
            count: industriesWithCounts.length
        });
    } catch (error) {
        console.error('Error in public getIndustries:', error);
        return errorResponse(res, 500, 'Failed to retrieve industries');
    }
});

/**
 * GET /api/public/building-types - Get published building types by industry slug
 * Query params: industry (slug), country, region, area (for filtering)
 * No authentication required
 */
router.get('/building-types', async (req, res) => {
    try {
        const { industry, country, region, area } = req.query;
        
        if (!industry) {
            return errorResponse(res, 400, 'Industry slug is required');
        }

        // Find industry by slug
        const industryDoc = await Industry.findBySlug(industry);
        if (!industryDoc) {
            console.log(`Industry with slug "${industry}" not found`);
            return errorResponse(res, 404, 'Industry not found');
        }

        // Always filter building types by finding projects with this industry
        // Build project filters (always include industry)
        const projectFilters = { 
            industry: industryDoc._id,
            status: 'published',
            featured: true,
            isActive: true
        };
        
        // Add location filters if provided
        if (country) {
            const countryDoc = await Country.findOne({ code: country.toUpperCase(), isActive: true });
            if (countryDoc) projectFilters.country = countryDoc._id;
        }
        if (region) {
            const regionDoc = await Region.findOne({ code: region.toUpperCase(), isActive: true });
            if (regionDoc) projectFilters.region = regionDoc._id;
        }
        if (area) {
            const areaDoc = await Area.findOne({ code: area.toUpperCase(), isActive: true });
            if (areaDoc) projectFilters.area = areaDoc._id;
        }
        
        // Debug: Check total projects for this industry
        const totalProjectsForIndustry = await Project.countDocuments({
            industry: industryDoc._id,
            isActive: true
        });
        const publishedProjectsForIndustry = await Project.countDocuments(projectFilters);
        console.log(`Industry "${industry}" (${industryDoc._id}): Total projects: ${totalProjectsForIndustry}, Published/Featured: ${publishedProjectsForIndustry}`);
        
        // Get unique building type IDs from matching projects
        const buildingTypeIds = await Project.find(projectFilters).distinct('buildingType');
        
        console.log(`Industry "${industry}": Found ${buildingTypeIds.length} unique building type IDs from projects`);
        
        if (buildingTypeIds.length === 0) {
            // No projects match, return empty array
            console.log(`No building types found for industry "${industry}" with the given filters`);
            console.log(`Project filters used:`, JSON.stringify(projectFilters, null, 2));
            return successResponse(res, 200, 'Published building types retrieved successfully', {
                buildingTypes: [],
                count: 0
            });
        }

        // Get building types that have projects in this industry
        // Note: We get building types that have published projects, but the building types themselves
        // don't need to be published/featured - they just need to exist and be active
        const buildingTypes = await BuildingType.find({
            _id: { $in: buildingTypeIds },
            isActive: true
        }).select('name slug image status featured isActive publishedAt createdAt updatedAt createdBy updatedBy').sort({ name: 1 });
        
        console.log(`Found ${buildingTypes.length} active building types with projects in industry "${industry}"`);
        
        // Debug: Check if any building types are missing slugs
        const buildingTypesWithoutSlugs = buildingTypes.filter(bt => !bt.slug || bt.slug === '');
        if (buildingTypesWithoutSlugs.length > 0) {
            console.warn(`Warning: ${buildingTypesWithoutSlugs.length} building types are missing slugs:`, buildingTypesWithoutSlugs.map(bt => ({ name: bt.name, _id: bt._id })));
        }

        // Calculate project count for each building type
        const buildingTypesWithCounts = await Promise.all(
            buildingTypes.map(async (buildingType) => {
                const projectCount = await Project.countDocuments({
                    industry: industryDoc._id,
                    buildingType: buildingType._id,
                    status: 'published',
                    featured: true,
                    isActive: true,
                });
                const buildingTypeObj = buildingType.toObject();
                // Ensure slug is included
                console.log(`BuildingType "${buildingTypeObj.name}": slug="${buildingTypeObj.slug}", projectCount=${projectCount}`);
                return {
                    ...buildingTypeObj,
                    projectCount
                };
            })
        );

        // Set cache headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');

        return successResponse(res, 200, 'Published building types retrieved successfully', {
            buildingTypes: buildingTypesWithCounts,
            count: buildingTypesWithCounts.length
        });
    } catch (error) {
        console.error('Error in public getBuildingTypes:', error);
        return errorResponse(res, 500, 'Failed to retrieve building types');
    }
});

/**
 * GET /api/public/projects/home - Get projects shown on home page (showOnHomePage only, max 6)
 * No authentication required
 */
router.get('/projects/home', async (req, res) => {
    try {
        const projects = await Project.getHomePageProjects();
        res.set('Cache-Control', 'public, max-age=300');
        return successResponse(res, 200, 'Home page projects retrieved successfully', {
            projects,
            count: projects.length
        });
    } catch (error) {
        console.error('Error in public getHomePageProjects:', error);
        return errorResponse(res, 500, 'Failed to retrieve home page projects');
    }
});

/**
 * GET /api/public/projects - Get published and featured projects (Projects listing page)
 * Query params: industry (slug), buildingType (slug), country, region, area
 * No authentication required
 */
router.get('/projects', async (req, res) => {
    try {
        const { industry, buildingType, country, region, area } = req.query;
        
        const filters = {};
        
        // Handle industry slug
        if (industry) {
            const industryDoc = await Industry.findBySlug(industry);
            if (industryDoc) {
                filters.industry = industryDoc._id;
            } else {
                // Industry not found, return empty
                console.log(`Industry with slug "${industry}" not found`);
                return successResponse(res, 200, 'Published projects retrieved successfully', {
                    projects: [],
                    count: 0
                });
            }
        }
        
        // Handle buildingType slug
        if (buildingType) {
            const buildingTypeDoc = await BuildingType.findBySlug(buildingType);
            if (buildingTypeDoc) {
                filters.buildingType = buildingTypeDoc._id;
            } else {
                // BuildingType not found, return empty
                console.log(`BuildingType with slug "${buildingType}" not found`);
                return successResponse(res, 200, 'Published projects retrieved successfully', {
                    projects: [],
                    count: 0
                });
            }
        }
        
        // Handle location filters
        if (country) {
            const countryDoc = await Country.findOne({ code: country.toUpperCase(), isActive: true });
            if (countryDoc) filters.country = countryDoc._id;
        }
        if (region) {
            const regionDoc = await Region.findOne({ code: region.toUpperCase(), isActive: true });
            if (regionDoc) filters.region = regionDoc._id;
        }
        if (area) {
            const areaDoc = await Area.findOne({ code: area.toUpperCase(), isActive: true });
            if (areaDoc) filters.area = areaDoc._id;
        }

        const projects = await Project.getPublished(filters);

        // Set cache headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');

        return successResponse(res, 200, 'Published projects retrieved successfully', {
            projects,
            count: projects.length
        });
    } catch (error) {
        console.error('Error in public getProjects:', error);
        return errorResponse(res, 500, 'Failed to retrieve projects');
    }
});

/**
 * GET /api/public/filter-options - Get available filter options based on current selections (cascading filters)
 * Query params: industry (slug), buildingType (slug), country, region, area
 * No authentication required
 */
router.get('/filter-options', async (req, res) => {
    try {
        const { industry, buildingType, country, region, area } = req.query;
        
        // Build base project query based on current selections
        const projectQuery = {
            status: 'published',
            featured: true,
            isActive: true
        };
        
        // Add industry filter if provided
        if (industry) {
            const industryDoc = await Industry.findBySlug(industry);
            if (industryDoc) {
                projectQuery.industry = industryDoc._id;
            }
        }
        
        // Add buildingType filter if provided
        if (buildingType) {
            const buildingTypeDoc = await BuildingType.findBySlug(buildingType);
            if (buildingTypeDoc) {
                projectQuery.buildingType = buildingTypeDoc._id;
            }
        }
        
        // Add location filters if provided
        if (country) {
            const countryDoc = await Country.findOne({ code: country.toUpperCase(), isActive: true });
            if (countryDoc) projectQuery.country = countryDoc._id;
        }
        if (region) {
            const regionDoc = await Region.findOne({ code: region.toUpperCase(), isActive: true });
            if (regionDoc) projectQuery.region = regionDoc._id;
        }
        if (area) {
            const areaDoc = await Area.findOne({ code: area.toUpperCase(), isActive: true });
            if (areaDoc) projectQuery.area = areaDoc._id;
        }
        
        // Get all matching projects
        const projects = await Project.find(projectQuery)
            .populate('industry', 'name slug')
            .populate('buildingType', 'name slug')
            .populate('country', 'name code')
            .populate('region', 'name code')
            .populate('area', 'name code');
        
        // Extract unique values for each filter
        const industriesMap = new Map();
        const countriesMap = new Map();
        const regionsMap = new Map();
        const areasMap = new Map();
        
        projects.forEach(project => {
            // Industries
            if (project.industry && project.industry.slug) {
                industriesMap.set(project.industry.slug, {
                    name: project.industry.name,
                    slug: project.industry.slug
                });
            }
            
            // Countries
            if (project.country && project.country.code) {
                countriesMap.set(project.country.code, {
                    name: project.country.name,
                    code: project.country.code
                });
            }
            
            // Regions
            if (project.region && project.region.code) {
                regionsMap.set(project.region.code, {
                    name: project.region.name,
                    code: project.region.code,
                    country: project.country ? project.country.code : null
                });
            }
            
            // Areas
            if (project.area && project.area.code) {
                areasMap.set(project.area.code, {
                    name: project.area.name,
                    code: project.area.code,
                    region: project.region ? project.region.code : null
                });
            }
        });
        
        // Convert maps to sorted arrays
        const industries = Array.from(industriesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        const countries = Array.from(countriesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        const regions = Array.from(regionsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        const areas = Array.from(areasMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        
        // Set cache headers (cache for 2 minutes - shorter due to dynamic nature)
        res.set('Cache-Control', 'public, max-age=120');
        
        return successResponse(res, 200, 'Filter options retrieved successfully', {
            industries,
            countries,
            regions,
            areas
        });
    } catch (error) {
        console.error('Error in public getFilterOptions:', error);
        return errorResponse(res, 500, 'Failed to retrieve filter options');
    }
});

/**
 * GET /api/public/projects/slug/:slug - Get published and featured project by slug
 * No authentication required
 */
router.get('/projects/slug/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const project = await Project.findOne({
            jobNumberSlug: slug,
            status: 'published',
            featured: true,
            isActive: true
        })
            .populate('buildingType', 'name')
            .populate('country', 'name code')
            .populate('region', 'name code')
            .populate('area', 'name code')
            .populate('industry', 'name slug logo');

        if (!project) {
            return errorResponse(res, 404, 'Project not found');
        }

        // Set cache headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');

        return successResponse(res, 200, 'Project retrieved successfully', { project });
    } catch (error) {
        console.error('Error in public getProjectBySlug:', error);
        return errorResponse(res, 500, 'Failed to retrieve project');
    }
});

/**
 * GET /api/public/vacancies - Get published and featured vacancies
 * No authentication required
 */
router.get('/vacancies', async (req, res) => {
    try {
        const { page = 1, limit = 20, department, type, search } = req.query;

        const filters = {};
        if (department) filters.department = department;
        if (type) filters.type = type;
        if (search) {
            filters.$or = [
                { title: new RegExp(search, 'i') },
                { department: new RegExp(search, 'i') },
                { location: new RegExp(search, 'i') }
            ];
        }

        const vacancies = await Vacancy.getPublished(filters);

        // Set cache headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');

        return successResponse(res, 200, 'Published vacancies retrieved successfully', {
            vacancies,
            count: vacancies.length
        });
    } catch (error) {
        console.error('Error in public getVacancies:', error);
        return errorResponse(res, 500, 'Failed to retrieve vacancies');
    }
});

/**
 * POST /api/public/enquiries - Submit an enquiry (Contact Us)
 * No authentication required
 */
router.post('/enquiries', async (req, res) => {
    try {
        const payload = req.body || {};
        
        // Validate required fields
        if (!payload.purpose) {
            return errorResponse(res, 400, 'Purpose is required');
        }
        if (!payload.fullName || !payload.fullName.trim()) {
            return errorResponse(res, 400, 'Full name is required');
        }
        if (!payload.email || !payload.email.trim()) {
            return errorResponse(res, 400, 'Email is required');
        }
        if (!payload.mobileNumber || !payload.mobileNumber.trim()) {
            return errorResponse(res, 400, 'Mobile number is required');
        }
        if (!payload.country || !payload.country.trim()) {
            return errorResponse(res, 400, 'Country is required');
        }
        if (!payload.subject || !payload.subject.trim()) {
            return errorResponse(res, 400, 'Subject is required');
        }
        if (!payload.message || !payload.message.trim()) {
            return errorResponse(res, 400, 'Message is required');
        }

        const enquiry = new Enquiry(payload);
        enquiry.submittedAt = new Date();
        enquiry.ipAddress = req.ip || req.connection.remoteAddress;
        await enquiry.save();

        return successResponse(res, 201, 'Enquiry submitted successfully', { 
            enquiryId: enquiry._id 
        });
    } catch (error) {
        console.error('Error in public submitEnquiry:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to submit enquiry', error.message);
    }
});

/**
 * POST /api/public/applications - Submit a job application (Career page)
 * No authentication required
 */
router.post('/applications', async (req, res) => {
    try {
        const payload = req.body || {};
        
        // Validate required fields
        if (!payload.vacancyId) {
            return errorResponse(res, 400, 'Vacancy ID is required');
        }
        if (!payload.cvFile || !payload.cvFile.url) {
            return errorResponse(res, 400, 'CV file is required');
        }

        // Ensure CV file has all required fields
        if (!payload.cvFile.publicId || !payload.cvFile.filename) {
            return errorResponse(res, 400, 'CV file must include url, publicId, and filename');
        }

        const application = new Application(payload);
        application.submittedAt = new Date();
        application.ipAddress = req.ip || req.connection.remoteAddress;
        await application.save();

        return successResponse(res, 201, 'Application submitted successfully', { 
            applicationId: application._id 
        });
    } catch (error) {
        console.error('Error in public submitApplication:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to submit application', error.message);
    }
});

/**
 * POST /api/public/upload-cv - Upload CV file for job application
 * No authentication required
 */
router.post('/upload-cv', uploadMiddleware, async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return errorResponse(res, 400, 'No file uploaded');
        }

        const file = req.files.file;
        const fileExt = file.name.split('.').pop().toLowerCase();
        
        // Validate file type (PDF, DOC, DOCX, JPEG, JPG, PNG)
        const allowedTypes = ['pdf', 'doc', 'docx', 'jpeg', 'jpg', 'png'];
        if (!allowedTypes.includes(fileExt)) {
            return errorResponse(res, 400, 'Invalid file type. Allowed: PDF, DOC, DOCX, JPEG, JPG, PNG');
        }

        // Validate file size (max 2MB)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            return errorResponse(res, 400, 'File size exceeds 2MB limit');
        }

        // Upload directly to Cloudinary (bypass Media model for public CV uploads)
        const cloudinary = require('cloudinary').v2;
        const isImage = ['jpeg', 'jpg', 'png'].includes(fileExt);
        
        const uploadOptions = {
            folder: `${process.env.MEDIA_FOLDER_PREFIX || 'acero-cms'}/career-applications/cv`,
            resource_type: isImage ? 'image' : 'raw',
        };

        let result;
        if (file.buffer) {
            result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    uploadOptions,
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(file.buffer);
            });
        } else if (file.path || file.tempFilePath) {
            result = await cloudinary.uploader.upload(
                file.path || file.tempFilePath,
                uploadOptions
            );
        } else {
            return errorResponse(res, 400, 'Invalid file object');
        }

        // Determine mime type from file extension
        const mimeTypes = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'jpeg': 'image/jpeg',
            'jpg': 'image/jpeg',
            'png': 'image/png'
        };
        const mimeType = mimeTypes[fileExt] || null;

        return successResponse(res, 201, 'CV uploaded successfully', {
            cvFile: {
                url: result.secure_url || result.url,
                publicId: result.public_id,
                filename: result.original_filename || file.name || file.originalname,
                size: result.bytes,
                mimeType: mimeType
            }
        });
    } catch (error) {
        console.error('Error in public uploadCV:', error);
        return errorResponse(res, 500, 'Failed to upload CV file', error.message);
    }
});

/**
 * GET /api/public/form-configuration - Get active form configuration
 * No authentication required
 */
router.get('/form-configuration', async (req, res) => {
    try {
        const config = await FormConfiguration.getActive();

        // Set cache headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');

        return successResponse(res, 200, 'Form configuration retrieved successfully', { config });
    } catch (error) {
        console.error('Error in public getFormConfiguration:', error);
        return errorResponse(res, 500, 'Failed to retrieve form configuration');
    }
});

/**
 * GET /api/public/branches - Get published and featured branches
 * No authentication required
 */
router.get('/branches', async (req, res) => {
    try {
        const branches = await Branch.getPublished();

        // Set cache headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');

        return successResponse(res, 200, 'Published branches retrieved successfully', {
            branches,
            count: branches.length
        });
    } catch (error) {
        console.error('Error in public getBranches:', error);
        return errorResponse(res, 500, 'Failed to retrieve branches');
    }
});

/**
 * GET /api/public/customers - Get published and featured customers
 * No authentication required
 */
router.get('/customers', async (req, res) => {
    try {
        const customers = await Customer.getPublished();

        // Set cache headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');

        return successResponse(res, 200, 'Published customers retrieved successfully', {
            customers,
            count: customers.length
        });
    } catch (error) {
        console.error('Error in public getCustomers:', error);
        return errorResponse(res, 500, 'Failed to retrieve customers');
    }
});

/**
 * GET /api/public/certifications - Get published and featured certifications
 * No authentication required
 */
router.get('/certifications', async (req, res) => {
    try {
        const certifications = await Certification.getPublished();

        // Set cache headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');

        return successResponse(res, 200, 'Published certifications retrieved successfully', {
            certifications,
            count: certifications.length
        });
    } catch (error) {
        console.error('Error in public getCertifications:', error);
        return errorResponse(res, 500, 'Failed to retrieve certifications');
    }
});

/**
 * GET /api/public/company-updates/home - Get company updates for home page (showOnHomePage only, max 3)
 * No authentication required. Must be defined before /company-updates so "home" is not parsed as slug.
 */
router.get('/company-updates/home', async (req, res) => {
    try {
        const companyUpdates = await CompanyUpdate.getHomePageCompanyUpdates();
        res.set('Cache-Control', 'public, max-age=300');
        return successResponse(res, 200, 'Home page company updates retrieved successfully', {
            companyUpdates,
            count: companyUpdates.length
        });
    } catch (error) {
        console.error('Error in public getHomePageCompanyUpdates:', error);
        return errorResponse(res, 500, 'Failed to retrieve home page company updates');
    }
});

/**
 * GET /api/public/company-updates - Get published and featured company updates
 * No authentication required
 */
router.get('/company-updates', async (req, res) => {
    try {
        const { page = 1, limit = 20, category } = req.query;
        
        const filters = {};
        if (category) filters.category = category;

        const companyUpdates = await CompanyUpdate.getPublished(filters);

        // Set cache headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');

        return successResponse(res, 200, 'Published company updates retrieved successfully', {
            companyUpdates,
            count: companyUpdates.length
        });
    } catch (error) {
        console.error('Error in public getCompanyUpdates:', error);
        return errorResponse(res, 500, 'Failed to retrieve company updates');
    }
});

/**
 * GET /api/public/company-updates/slug/:slug - Get published and featured company update by slug
 * No authentication required
 */
router.get('/company-updates/slug/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const companyUpdate = await CompanyUpdate.findOne({
            slug: slug,
            status: 'published',
            featured: true,
            isActive: true
        })
            .populate('category', 'name slug');

        if (!companyUpdate) {
            return errorResponse(res, 404, 'Company update not found');
        }

        // Set cache headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');

        return successResponse(res, 200, 'Company update retrieved successfully', { companyUpdate });
    } catch (error) {
        console.error('Error in public getCompanyUpdateBySlug:', error);
        return errorResponse(res, 500, 'Failed to retrieve company update');
    }
});

/**
 * GET /api/public/company-update-categories - Get published and featured company update categories
 * No authentication required
 */
router.get('/company-update-categories', async (req, res) => {
    try {
        const categories = await CompanyUpdateCategory.getPublished();

        // Set cache headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');

        return successResponse(res, 200, 'Published company update categories retrieved successfully', {
            categories,
            count: categories.length
        });
    } catch (error) {
        console.error('Error in public getCompanyUpdateCategories:', error);
        return errorResponse(res, 500, 'Failed to retrieve company update categories');
    }
});

/**
 * GET /api/public/brochures - Get published and featured brochures
 * No authentication required
 */
router.get('/brochures', async (req, res) => {
    try {
        const brochures = await Brochure.getPublished();

        // Set cache headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');

        return successResponse(res, 200, 'Published brochures retrieved successfully', {
            brochures,
            count: brochures.length
        });
    } catch (error) {
        console.error('Error in public getBrochures:', error);
        return errorResponse(res, 500, 'Failed to retrieve brochures');
    }
});

/**
 * GET /api/public/videos - Get YouTube videos from Media Library
 * No authentication required
 */
router.get('/videos', async (req, res) => {
    try {
        const Media = require('../models/Media');
        
        // Fetch Media entries with YouTube links
        const videos = await Media.find({
            isActive: true,
            youtubeId: { $exists: true, $ne: null }
        })
            .sort({ createdAt: -1 })
            .lean();

        // Transform to video format
        const transformedVideos = videos.map(media => ({
            _id: media._id,
            title: media.filename || media.originalName || 'Untitled Video',
            description: media.description || '',
            youtubeId: media.youtubeId,
            youtubeUrl: media.youtubeUrl || media.url,
            thumbnailUrl: media.youtubeThumbnail || getYouTubeThumbnail(media.youtubeId),
            order: 0,
            featured: false,
            status: 'published',
            isActive: media.isActive
        }));

        // Set cache headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');

        return successResponse(res, 200, 'Videos retrieved successfully', {
            videos: transformedVideos,
            count: transformedVideos.length
        });
    } catch (error) {
        console.error('Error in public getVideos:', error);
        return errorResponse(res, 500, 'Failed to retrieve videos');
    }
});

// Helper function to get YouTube thumbnail
function getYouTubeThumbnail(videoId, quality = 'hqdefault') {
    if (!videoId) return null;
    return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

// Header configuration (published + featured)
router.get('/header-configuration', async (req, res) => {
    try {
        const header = await HeaderConfiguration.getPublished();
        return successResponse(res, 200, 'Published header configuration retrieved successfully', { header });
    } catch (error) {
        console.error('Error in public getHeaderConfiguration:', error);
        return errorResponse(res, 500, 'Failed to retrieve header configuration');
    }
});

// Footer configuration (published + featured)
router.get('/footer-configuration', async (req, res) => {
    try {
        const footer = await FooterConfiguration.getPublished();
        return successResponse(res, 200, 'Published footer configuration retrieved successfully', { footer });
    } catch (error) {
        console.error('Error in public getFooterConfiguration:', error);
        return errorResponse(res, 500, 'Failed to retrieve footer configuration');
    }
});

// Website appearance (published + featured)
router.get('/website-appearance', async (req, res) => {
    try {
        const appearance = await WebsiteAppearance.getPublished();
        return successResponse(res, 200, 'Published website appearance retrieved successfully', { appearance });
    } catch (error) {
        console.error('Error in public getWebsiteAppearance:', error);
        return errorResponse(res, 500, 'Failed to retrieve website appearance');
    }
});

// Google ReCaptcha (published + featured) — hide secret key
router.get('/google-recaptcha', async (req, res) => {
    try {
        const recaptcha = await GoogleReCaptcha.getPublished();
        if (recaptcha) {
            recaptcha.secretKey = undefined;
        }
        return successResponse(res, 200, 'Published Google ReCaptcha settings retrieved successfully', { recaptcha });
    } catch (error) {
        console.error('Error in public getGoogleReCaptcha:', error);
        return errorResponse(res, 500, 'Failed to retrieve Google ReCaptcha settings');
    }
});

// Google Maps (published + featured)
router.get('/google-maps', async (req, res) => {
    try {
        const maps = await GoogleMaps.getPublished();
        return successResponse(res, 200, 'Published Google Maps settings retrieved successfully', { maps });
    } catch (error) {
        console.error('Error in public getGoogleMaps:', error);
        return errorResponse(res, 500, 'Failed to retrieve Google Maps settings');
    }
});

module.exports = router;

