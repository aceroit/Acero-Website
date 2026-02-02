const Country = require('../models/Country');
const Region = require('../models/Region');
const Area = require('../models/Area');
const Industry = require('../models/Industry');
const BuildingType = require('../models/BuildingType');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * Get all active countries (published only for dropdowns)
 */
exports.getCountries = async (req, res) => {
    try {
        // Filter by published status and active for dropdowns
        const countries = await Country.find({ 
            isActive: true, 
            status: 'published' 
        }).sort({ name: 1 });
        return successResponse(res, 200, 'Countries retrieved successfully', { countries });
    } catch (error) {
        console.error('Error in getCountries:', error);
        return errorResponse(res, 500, 'Failed to retrieve countries', error.message);
    }
};

/**
 * Get all active regions (published only for dropdowns; regions are standalone)
 */
exports.getRegions = async (req, res) => {
    try {
        const regions = await Region.find({
            isActive: true,
            status: 'published'
        }).sort({ name: 1 });

        return successResponse(res, 200, 'Regions retrieved successfully', { regions });
    } catch (error) {
        console.error('Error in getRegions:', error);
        return errorResponse(res, 500, 'Failed to retrieve regions', error.message);
    }
};

/**
 * Get all active areas (published only for dropdowns; areas are standalone)
 */
exports.getAreas = async (req, res) => {
    try {
        const areas = await Area.find({
            isActive: true,
            status: 'published'
        }).sort({ name: 1 });

        return successResponse(res, 200, 'Areas retrieved successfully', { areas });
    } catch (error) {
        console.error('Error in getAreas:', error);
        return errorResponse(res, 500, 'Failed to retrieve areas', error.message);
    }
};

/**
 * Get all active industries (published only for dropdowns)
 */
exports.getIndustries = async (req, res) => {
    try {
        // Filter by published status and active for dropdowns
        const industries = await Industry.find({ 
            isActive: true, 
            status: 'published' 
        }).sort({ order: 1, name: 1 });
        return successResponse(res, 200, 'Industries retrieved successfully', { industries });
    } catch (error) {
        console.error('Error in getIndustries:', error);
        return errorResponse(res, 500, 'Failed to retrieve industries', error.message);
    }
};

/**
 * Get all active building types (published only for dropdowns)
 */
exports.getBuildingTypes = async (req, res) => {
    try {
        // Filter by published status and active for dropdowns
        const buildingTypes = await BuildingType.find({ 
            isActive: true, 
            status: 'published' 
        }).sort({ name: 1 });
        return successResponse(res, 200, 'Building types retrieved successfully', { buildingTypes });
    } catch (error) {
        console.error('Error in getBuildingTypes:', error);
        return errorResponse(res, 500, 'Failed to retrieve building types', error.message);
    }
};

