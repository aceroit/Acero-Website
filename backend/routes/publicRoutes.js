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
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const Vacancy = require('../models/Vacancy');
const Enquiry = require('../models/Enquiry');
const Application = require('../models/Application');
const FormConfiguration = require('../models/FormConfiguration');

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
 * GET /api/public/projects - Get published and featured projects
 * No authentication required
 */
router.get('/projects', async (req, res) => {
    try {
        const { page = 1, limit = 20, buildingType, country, region, area, industry } = req.query;
        
        const filters = {};
        if (buildingType) filters.buildingType = buildingType;
        if (country) filters.country = country;
        if (region) filters.region = region;
        if (area) filters.area = area;
        if (industry) filters.industry = industry;

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
        const enquiry = new Enquiry(payload);
        enquiry.submittedAt = new Date();
        enquiry.ipAddress = req.ip;
        await enquiry.save();

        return successResponse(res, 201, 'Enquiry submitted successfully', { enquiryId: enquiry._id });
    } catch (error) {
        console.error('Error in public submitEnquiry:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to submit enquiry');
    }
});

/**
 * POST /api/public/applications - Submit a job application (Career page)
 * No authentication required
 */
router.post('/applications', async (req, res) => {
    try {
        const payload = req.body || {};
        const application = new Application(payload);
        application.submittedAt = new Date();
        application.ipAddress = req.ip;
        await application.save();

        return successResponse(res, 201, 'Application submitted successfully', { applicationId: application._id });
    } catch (error) {
        console.error('Error in public submitApplication:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to submit application');
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

