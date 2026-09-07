/**
 * Public API routes. No authentication required.
 *
 * Listed content contract: Most list and detail endpoints for branches, customers,
 * certifications, company-updates, brochures, and company-update-categories
 * return only records with status: 'published', featured: true, and isActive: true
 * (where applicable). Project listing endpoints use published + active records, with
 * featured available as an optional filter.
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
const { saveUploadedFile, getUploadTempDir, normalizeStoredAssetUrlsForRequest } = require('../utils/localFileStorage');
const notificationService = require('../services/notificationService');
const { getPublicCache, setPublicCache, refreshPublicCacheInBackground } = require('../services/publicContentCache');
const {
    enquiryRateLimit,
    getQuoteRateLimit,
    applicationRateLimit,
    uploadCvRateLimit
} = require('../middleware/publicRateLimit');
const { verifyRecaptchaForRequest } = require('../utils/recaptchaVerifier');

function withResolvedSectionAssets(sections, req) {
    const plainSections = Array.isArray(sections)
        ? sections.map((section) => (section && typeof section.toObject === 'function' ? section.toObject() : section))
        : sections;

    return normalizeStoredAssetUrlsForRequest(plainSections, req);
}

async function sendCachedPublicResponse(
    res,
    cacheKey,
    message,
    fetchData,
    freshTtlMs = 2 * 60 * 1000,
    staleTtlMs = 30 * 60 * 1000,
    maxAgeSeconds = 120
) {
    const cached = getPublicCache(cacheKey);

    if (cached.status === 'HIT') {
        res.set('X-Cache', 'HIT');
        res.set('Cache-Control', `public, max-age=${maxAgeSeconds}`);

        return successResponse(res, 200, message, cached.data);
    }

    if (cached.status === 'STALE') {
        res.set('X-Cache', 'STALE');
        res.set('Cache-Control', `public, max-age=${maxAgeSeconds}`);

        refreshPublicCacheInBackground(cacheKey, fetchData, freshTtlMs, staleTtlMs);

        return successResponse(res, 200, message, cached.data);
    }

    const data = await fetchData();

    setPublicCache(cacheKey, data, freshTtlMs, staleTtlMs);

    res.set('X-Cache', 'MISS');
    res.set('Cache-Control', `public, max-age=${maxAgeSeconds}`);

    return successResponse(res, 200, message, data);
}

// Configure file upload middleware for public CV uploads
const uploadMiddleware = fileUpload({
    useTempFiles: true,
    tempFileDir: getUploadTempDir(),
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
        return sendCachedPublicResponse(
            res,
            'public-pages-tree',
            'Published page tree retrieved successfully',
            async () => {
                const tree = await Page.getPublishedTree();
                return { tree };
            },
            2 * 60 * 1000,
            30 * 60 * 1000,
            120
        );
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
        const cacheKey = `public-page-slug:${slug}`;

        const cached = getPublicCache(cacheKey);

        if (cached.status === 'HIT') {
            res.set('X-Cache', 'HIT');
            res.set('Cache-Control', 'public, max-age=120');
            return successResponse(res, 200, 'Page retrieved successfully', cached.data);
        }

        if (cached.status === 'STALE') {
            res.set('X-Cache', 'STALE');
            res.set('Cache-Control', 'public, max-age=120');

            refreshPublicCacheInBackground(
                cacheKey,
                async () => {
                    const page = await Page.findOne({
                        slug,
                        isActive: true,
                        status: 'published'
                    })
                        .select('title slug path metaTitle metaDescription metaKeywords')
                        .lean();

                    if (!page) return cached.data;

                    const sections = await Section.getPublishedSections(page._id);

                    return {
                        page,
                        sections: withResolvedSectionAssets(sections, req)
                    };
                },
                2 * 60 * 1000,
                30 * 60 * 1000
            );

            return successResponse(res, 200, 'Page retrieved successfully', cached.data);
        }

        const page = await Page.findOne({
            slug,
            isActive: true,
            status: 'published'
        })
            .select('title slug path metaTitle metaDescription metaKeywords')
            .lean();

        if (!page) {
            return errorResponse(res, 404, 'Page not found');
        }

        const sections = await Section.getPublishedSections(page._id);

        const data = {
            page,
            sections: withResolvedSectionAssets(sections, req)
        };

        setPublicCache(cacheKey, data, 2 * 60 * 1000, 30 * 60 * 1000);

        res.set('X-Cache', 'MISS');
        res.set('Cache-Control', 'public, max-age=120');

        return successResponse(res, 200, 'Page retrieved successfully', data);
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
            sections: withResolvedSectionAssets(sections, req),
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

        return successResponse(res, 200, 'Sections retrieved successfully', { sections: withResolvedSectionAssets(sections, req) });
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
        
        console.log(`[Industries API] Filters received: region=${region}, country=${country}, area=${area}`);
        
        // Build filter based on location filters
        let industryFilter = {};
        if (country || region || area) {
            // Find projects matching location filters to get industries
            const projectFilters = {
                status: 'published',
                isActive: true
            };
            
            if (country) {
                const countryDoc = await Country.findOne({ code: country.toUpperCase(), isActive: true });
                if (countryDoc) {
                    projectFilters.country = countryDoc._id;
                    console.log(`[Industries API] Country filter: ${country} -> ${countryDoc._id}`);
                } else {
                    console.log(`[Industries API] Country not found: ${country}`);
                }
            }
            if (region) {
                const regionDoc = await Region.findOne({ code: region.toUpperCase(), isActive: true });
                if (regionDoc) {
                    projectFilters.region = regionDoc._id;
                    console.log(`[Industries API] Region filter: ${region} -> ${regionDoc._id}`);
                } else {
                    console.log(`[Industries API] Region not found: ${region}`);
                }
            }
            if (area) {
                const areaDoc = await Area.findOne({ code: area.toUpperCase(), isActive: true });
                if (areaDoc) {
                    projectFilters.area = areaDoc._id;
                    console.log(`[Industries API] Area filter: ${area} -> ${areaDoc._id}`);
                } else {
                    console.log(`[Industries API] Area not found: ${area}`);
                }
            }
            
            console.log(`[Industries API] Project filters:`, JSON.stringify(projectFilters));
            
            // Get unique industry IDs from matching projects
            const industryIds = await Project.find(projectFilters).distinct('industry');
            
            console.log(`[Industries API] Found ${industryIds.length} unique industries from projects`);
            
            if (industryIds.length > 0) {
                industryFilter._id = { $in: industryIds };
            } else {
                // No projects match, return empty array
                console.log(`[Industries API] No projects match filters, returning empty`);
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
                        isActive: true,
                    ...locationFilters,
                });
                return {
                    ...industry.toObject(),
                    projectCount
                };
            })
        );

        // Filter out industries with 0 projects when location filters are applied
        const filteredIndustries = (country || region || area)
            ? industriesWithCounts.filter(ind => ind.projectCount > 0)
            : industriesWithCounts;

        // Debug logging
        if (country || region || area) {
            console.log(`Industries filter: region=${region}, country=${country}, area=${area}`);
            console.log(`Found ${industries.length} industries, ${filteredIndustries.length} with projects after filtering`);
        }

        // Set cache headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');

        return successResponse(res, 200, 'Published industries retrieved successfully', {
            industries: filteredIndustries,
            count: filteredIndustries.length
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
        console.log(`Industry "${industry}" (${industryDoc._id}): Total projects: ${totalProjectsForIndustry}, Published/Public: ${publishedProjectsForIndustry}`);
        
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

        // Build location filters for project count (same filters used for getting building type IDs)
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

        // Calculate project count for each building type (with location filters applied)
        const buildingTypesWithCounts = await Promise.all(
            buildingTypes.map(async (buildingType) => {
                const projectCount = await Project.countDocuments({
                    industry: industryDoc._id,
                    buildingType: buildingType._id,
                    status: 'published',
                        isActive: true,
                    ...locationFilters,
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
        return sendCachedPublicResponse(
            res,
            'public-projects-home',
            'Home page projects retrieved successfully',
            async () => {
                const projects = await Project.getHomePageProjects();

                return {
                    projects,
                    count: projects.length
                };
            }
        );
    } catch (error) {
        console.error('Error in public getHomePageProjects:', error);
        return errorResponse(res, 500, 'Failed to retrieve home page projects');
    }
});

/**
 * GET /api/public/projects - Get published active projects (Projects listing page)
 * Query params: industry (slug), buildingType (slug), country, region, area
 * No authentication required
 */
router.get('/projects', async (req, res) => {
    try {
        const { industry, buildingType, country, region, area, featured } = req.query;
        
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
        
        if (featured !== undefined) {
            filters.featured = featured === 'true';
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
        const { industry, buildingType, country, region, area, featured } = req.query;
        
        // Resolve references to get ObjectIds efficiently
        let industryDoc, buildingTypeDoc, countryDoc, regionDoc, areaDoc;
        await Promise.all([
            industry ? Industry.findBySlug(industry).then(d => industryDoc = d) : Promise.resolve(null),
            buildingType ? BuildingType.findBySlug(buildingType).then(d => buildingTypeDoc = d) : Promise.resolve(null),
            country ? Country.findOne({ code: country.toUpperCase(), isActive: true }).then(d => countryDoc = d) : Promise.resolve(null),
            region ? Region.findOne({ code: region.toUpperCase(), isActive: true }).then(d => regionDoc = d) : Promise.resolve(null),
            area ? Area.findOne({ code: area.toUpperCase(), isActive: true }).then(d => areaDoc = d) : Promise.resolve(null)
        ]);

        // Function to build query excluding a specific facet
        const buildQuery = (excludeFacet) => {
            const query = { status: 'published', isActive: true };
            if (industryDoc && excludeFacet !== 'industry') query.industry = industryDoc._id;
            if (buildingTypeDoc && excludeFacet !== 'buildingType') query.buildingType = buildingTypeDoc._id;
            if (countryDoc && excludeFacet !== 'country') query.country = countryDoc._id;
            if (regionDoc && excludeFacet !== 'region') query.region = regionDoc._id;
            if (areaDoc && excludeFacet !== 'area') query.area = areaDoc._id;
            return query;
        };

        // Fetch independent facets
        const [industryProjects, countryProjects, regionProjects, areaProjects] = await Promise.all([
            Project.find(buildQuery('industry')).populate('industry', 'name slug'),
            Project.find(buildQuery('country')).populate('country', 'name code'),
            Project.find(buildQuery('region')).populate('region', 'name code').populate('country', 'code'),
            Project.find(buildQuery('area')).populate('area', 'name code').populate('region', 'code')
        ]);
        
        // Extract unique values for each filter independently
        const industriesMap = new Map();
        industryProjects.forEach(project => {
            if (project.industry && project.industry.slug) {
                industriesMap.set(project.industry.slug, {
                    name: project.industry.name,
                    slug: project.industry.slug
                });
            }
        });
        
        const countriesMap = new Map();
        countryProjects.forEach(project => {
            if (project.country && project.country.code) {
                countriesMap.set(project.country.code, {
                    name: project.country.name,
                    code: project.country.code
                });
            }
        });
        
        const regionsMap = new Map();
        regionProjects.forEach(project => {
            if (project.region && project.region.code) {
                regionsMap.set(project.region.code, {
                    name: project.region.name,
                    code: project.region.code,
                    country: project.country ? project.country.code : null
                });
            }
        });
        
        const areasMap = new Map();
        areaProjects.forEach(project => {
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
 * GET /api/public/projects/slug/:slug - Get published active project by slug
 * No authentication required
 */
router.get('/projects/slug/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const project = await Project.findOne({
            jobNumberSlug: slug,
            status: 'published',
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
 * GET /api/public/vacancies - Get published active vacancies
 * No authentication required
 */
router.get('/vacancies', async (req, res) => {
    try {
        const { page = 1, limit = 20, department, type, featured, search } = req.query;

        const filters = {};
        if (department) filters.department = department;
        if (type) filters.type = type;
        if (featured !== undefined) filters.featured = featured === 'true';
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

const PUBLIC_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PUBLIC_PHONE_REGEX = /^[0-9+\-\s()]{6,20}$/;

function normalizeRequiredPublicField(value) {
    return String(value || '').trim();
}

function normalizeOptionalPublicField(value) {
    const normalized = String(value || '').trim();
    return normalized || null;
}

/**
 * POST /api/public/enquiries - Submit an enquiry (Contact Us)
 * No authentication required
 */
router.post('/enquiries', enquiryRateLimit, async (req, res) => {
    try {
        const payload = req.body || {};
        const recaptchaResult = await verifyRecaptchaForRequest(req, 'contact_submit');
        if (!recaptchaResult.success) {
            return errorResponse(res, 400, recaptchaResult.message);
        }

        const normalizedPayload = {
            submissionType: 'contact',
            purpose: normalizeRequiredPublicField(payload.purpose),
            fullName: normalizeRequiredPublicField(payload.fullName),
            companyName: normalizeOptionalPublicField(payload.companyName),
            mobileNumber: normalizeRequiredPublicField(payload.mobileNumber),
            email: normalizeRequiredPublicField(payload.email).toLowerCase(),
            country: normalizeRequiredPublicField(payload.country),
            countryCode: normalizeOptionalPublicField(payload.countryCode),
            telephoneNumber: normalizeOptionalPublicField(payload.telephoneNumber),
            subject: normalizeRequiredPublicField(payload.subject),
            message: normalizeRequiredPublicField(payload.message),
            notificationEmail: normalizeOptionalPublicField(payload.notificationEmail)
        };

        if (!normalizedPayload.purpose) {
            return errorResponse(res, 400, 'Purpose is required');
        }
        if (!normalizedPayload.fullName) {
            return errorResponse(res, 400, 'Full name is required');
        }
        if (!normalizedPayload.email) {
            return errorResponse(res, 400, 'Email is required');
        }
        if (!PUBLIC_EMAIL_REGEX.test(normalizedPayload.email)) {
            return errorResponse(res, 400, 'Please enter a valid email address');
        }
        if (!normalizedPayload.mobileNumber) {
            return errorResponse(res, 400, 'Mobile number is required');
        }
        if (!PUBLIC_PHONE_REGEX.test(normalizedPayload.mobileNumber)) {
            return errorResponse(res, 400, 'Please enter a valid mobile number');
        }
        if (!normalizedPayload.country) {
            return errorResponse(res, 400, 'Country is required');
        }
        if (!normalizedPayload.subject) {
            return errorResponse(res, 400, 'Subject is required');
        }
        if (!normalizedPayload.message) {
            return errorResponse(res, 400, 'Message is required');
        }

        const enquiry = new Enquiry(normalizedPayload);
        enquiry.submittedAt = new Date();
        enquiry.ipAddress = req.ip || req.connection.remoteAddress;
        await enquiry.save();

        const emailResults = await Promise.allSettled([
            notificationService.notifyEnquirySubmission(enquiry),
            notificationService.sendEnquiryConfirmation(enquiry)
        ]);
        emailResults.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error('Enquiry email task ' + (index + 1) + ' failed:', result.reason);
            } else if (result.value === false) {
                console.warn('Enquiry email task ' + (index + 1) + ' did not send. Check SMTP and form notification settings.');
            }
        });

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
 * POST /api/public/get-quote - Submit Get Quote popup request
 * No authentication required
 */
router.post('/get-quote', getQuoteRateLimit, async (req, res) => {
    try {
        const payload = req.body || {};
        const recaptchaResult = await verifyRecaptchaForRequest(req, 'get_quote_submit');
        if (!recaptchaResult.success) {
            return errorResponse(res, 400, recaptchaResult.message);
        }

        const fullName = normalizeRequiredPublicField(payload.fullName);
        const email = normalizeRequiredPublicField(payload.email).toLowerCase();
        const country = normalizeOptionalPublicField(payload.country);
        const countryCode = normalizeOptionalPublicField(payload.countryCode);
        const mobileNumber = normalizeOptionalPublicField(payload.mobileNumber);

        if (!fullName) {
            return errorResponse(res, 400, 'Full name is required');
        }
        if (!email) {
            return errorResponse(res, 400, 'Email is required');
        }
        if (!PUBLIC_EMAIL_REGEX.test(email)) {
            return errorResponse(res, 400, 'Please enter a valid email address');
        }
        if (mobileNumber && !PUBLIC_PHONE_REGEX.test(mobileNumber)) {
            return errorResponse(res, 400, 'Please enter a valid mobile number');
        }

        const enquiry = new Enquiry({
            submissionType: 'get_quote',
            purpose: 'sales',
            fullName,
            companyName: null,
            mobileNumber,
            email,
            country: country || null,
            countryCode,
            telephoneNumber: null,
            subject: 'Get Quote Request',
            message: 'Website header Get Quote popup submitted.',
            notificationEmail: null
        });

        enquiry.submittedAt = new Date();
        enquiry.ipAddress = req.ip || req.connection.remoteAddress;
        await enquiry.save();

        const emailResults = await Promise.allSettled([
            notificationService.notifyEnquirySubmission(enquiry),
            notificationService.sendEnquiryConfirmation(enquiry)
        ]);
        emailResults.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error('Get quote email task ' + (index + 1) + ' failed:', result.reason);
            } else if (result.value === false) {
                console.warn('Get quote email task ' + (index + 1) + ' did not send. Check SMTP and form notification settings.');
            }
        });

        return successResponse(res, 201, 'Quote request submitted successfully', {
            enquiryId: enquiry._id
        });
    } catch (error) {
        console.error('Error in public submitGetQuote:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to submit quote request', error.message);
    }
});
/**
 * POST /api/public/applications - Submit a job application (Career page)
 * No authentication required
 */
router.post('/applications', applicationRateLimit, async (req, res) => {
    try {
        const payload = req.body || {};
        const recaptchaResult = await verifyRecaptchaForRequest(req, 'career_application_submit');
        if (!recaptchaResult.success) {
            return errorResponse(res, 400, recaptchaResult.message);
        }
        delete payload.recaptchaToken;
        delete payload.captchaToken;
        delete payload['g-recaptcha-response'];

        payload.mobileNumber = payload.mobileNumber && String(payload.mobileNumber).trim()
            ? String(payload.mobileNumber).trim()
            : null;
        payload.countryCode = normalizeOptionalPublicField(payload.countryCode);
        
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

        const emailResults = await Promise.allSettled([
            notificationService.notifyApplicationSubmission(application),
            notificationService.sendApplicationConfirmation(application)
        ]);
        emailResults.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(`Application email task ${index + 1} failed:`, result.reason);
            } else if (result.value === false) {
                console.warn(`Application email task ${index + 1} did not send. Check SMTP and form notification settings.`);
            }
        });

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
router.post('/upload-cv', uploadCvRateLimit, uploadMiddleware, async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return errorResponse(res, 400, 'No file uploaded');
        }

        const file = req.files.file;
        const fileExt = '.' + String(file.name || '').split('.').pop().toLowerCase();
        const mimeType = String(file.mimetype || file.mimeType || '').toLowerCase();

        // Validate file type (PDF only)
        if (fileExt !== '.pdf' || mimeType !== 'application/pdf') {
            return errorResponse(res, 400, 'Only PDF files are allowed.');
        }

        // Validate file size (max 2MB)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            return errorResponse(res, 400, 'File size exceeds 2MB limit');
        }

        // Public applicants often upload generic names like cv.pdf. Keep CV
        // storage unique while the admin/email download routes present a
        // candidate-friendly filename.
        const savedFile = await saveUploadedFile(file, 'career-applications/cv', {
            namingStrategy: 'generated',
            rejectDuplicateFilename: false
        });

        return successResponse(res, 201, 'CV uploaded successfully', {
            cvFile: {
                url: savedFile.url,
                publicId: savedFile.publicId,
                filename: savedFile.filename,
                size: savedFile.size,
                mimeType: savedFile.mimeType
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
        return sendCachedPublicResponse(
            res,
            'public-form-configuration',
            'Form configuration retrieved successfully',
            async () => {
                const config = await FormConfiguration.getActive();
                return { config };
            }
        );
    } catch (error) {
        console.error('Error in public getFormConfiguration:', error);
        return errorResponse(res, 500, 'Failed to retrieve form configuration');
    }
});

/**
 * GET /api/public/branches - Get published and featured branches
 * No authentication required.
 * Branches with missing/invalid country ref (e.g. deleted country) are excluded so the dropdown always has valid country data.
 */
router.get('/branches', async (req, res) => {
    try {
        return sendCachedPublicResponse(
            res,
            'public-branches',
            'Published branches retrieved successfully',
            async () => {
                const branches = await Branch.getPublished();

                const withCountry = Array.isArray(branches)
                    ? branches.filter((b) => b.country != null)
                    : [];

                return {
                    branches: withCountry,
                    count: withCountry.length
                };
            }
        );
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
        return sendCachedPublicResponse(
            res,
            'public-customers',
            'Published customers retrieved successfully',
            async () => {
                const customers = await Customer.getPublished();

                return {
                    customers,
                    count: customers.length
                };
            }
        );
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
        return sendCachedPublicResponse(
            res,
            'public-certifications',
            'Published certifications retrieved successfully',
            async () => {
                const certifications = await Certification.getPublished();

                return {
                    certifications,
                    count: certifications.length
                };
            }
        );
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
        return sendCachedPublicResponse(
            res,
            'public-company-updates-home',
            'Home page company updates retrieved successfully',
            async () => {
                const companyUpdates = await CompanyUpdate.getHomePageCompanyUpdates();

                return {
                    companyUpdates,
                    count: companyUpdates.length
                };
            }
        );
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
        return sendCachedPublicResponse(
            res,
            'public-brochures',
            'Published brochures retrieved successfully',
            async () => {
                const brochures = await Brochure.getPublished();

                return {
                    brochures,
                    count: brochures.length
                };
            }
        );
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
        return sendCachedPublicResponse(
            res,
            'public-header-configuration',
            'Published header configuration retrieved successfully',
            async () => {
                const header = await HeaderConfiguration.getPublished();
                return { header };
            }
        );
    } catch (error) {
        console.error('Error in public getHeaderConfiguration:', error);
        return errorResponse(res, 500, 'Failed to retrieve header configuration');
    }
});

// Footer configuration (published + featured)
router.get('/footer-configuration', async (req, res) => {
    try {
        return sendCachedPublicResponse(
            res,
            'public-footer-configuration',
            'Published footer configuration retrieved successfully',
            async () => {
                const footer = await FooterConfiguration.getPublished();
                return { footer };
            }
        );
    } catch (error) {
        console.error('Error in public getFooterConfiguration:', error);
        return errorResponse(res, 500, 'Failed to retrieve footer configuration');
    }
});

// Website appearance (published + featured)
router.get('/website-appearance', async (req, res) => {
    try {
        return sendCachedPublicResponse(
            res,
            'public-website-appearance',
            'Published website appearance retrieved successfully',
            async () => {
                const appearance = await WebsiteAppearance.getPublished();
                return { appearance };
            }
        );
    } catch (error) {
        console.error('Error in public getWebsiteAppearance:', error);
        return errorResponse(res, 500, 'Failed to retrieve website appearance');
    }
});

// Google ReCaptcha (published + featured) — hide secret key
router.get('/google-recaptcha', async (req, res) => {
    try {
        const recaptcha = await GoogleReCaptcha.getPublished();
        const publicRecaptcha = recaptcha ? {
            _id: recaptcha._id,
            title: recaptcha.title,
            status: recaptcha.status,
            featured: recaptcha.featured,
            siteKey: recaptcha.siteKey,
            version: recaptcha.version,
            enabled: recaptcha.enabled,
        } : null;

        return successResponse(res, 200, 'Published Google ReCaptcha settings retrieved successfully', { recaptcha: publicRecaptcha });
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












