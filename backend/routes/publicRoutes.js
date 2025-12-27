const express = require('express');
const router = express.Router();
const Page = require('../models/Page');
const Section = require('../models/Section');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * GET /api/public/pages/tree - Get published page tree for navigation
 * No authentication required
 */
router.get('/pages/tree', async (req, res) => {
    try {
        const tree = await Page.getPublishedTree();

        // Set cache headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');

        return successResponse(res, { tree }, 'Published page tree retrieved successfully');
    } catch (error) {
        console.error('Error in public getPageTree:', error);
        return errorResponse(res, 'Failed to retrieve page tree', 500);
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
            return errorResponse(res, 'Page not found', 404);
        }

        // Get published sections for this page
        const sections = await Section.getPublishedSections(page._id);

        // Set cache headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');

        return successResponse(res, {
            page,
            sections
        }, 'Page retrieved successfully');
    } catch (error) {
        console.error('Error in public getPageBySlug:', error);
        return errorResponse(res, 'Failed to retrieve page', 500);
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
            return errorResponse(res, 'Page not found', 404);
        }

        // Get published sections for this page
        const sections = await Section.getPublishedSections(page._id);

        // Get breadcrumb trail
        const breadcrumb = await page.getBreadcrumb();

        // Set cache headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');

        return successResponse(res, {
            page,
            sections,
            breadcrumb
        }, 'Page retrieved successfully');
    } catch (error) {
        console.error('Error in public getPageByPath:', error);
        return errorResponse(res, 'Failed to retrieve page', 500);
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
            return errorResponse(res, 'Page not found', 404);
        }

        const sections = await Section.getPublishedSections(id);

        // Set cache headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');

        return successResponse(res, { sections }, 'Sections retrieved successfully');
    } catch (error) {
        console.error('Error in public getPageSections:', error);
        return errorResponse(res, 'Failed to retrieve sections', 500);
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
            return errorResponse(res, 'Search query must be at least 2 characters', 400);
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

        return successResponse(res, {
            results: pages,
            count: pages.length
        }, 'Search completed successfully');
    } catch (error) {
        console.error('Error in public search:', error);
        return errorResponse(res, 'Search failed', 500);
    }
});

module.exports = router;

