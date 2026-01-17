const Country = require('../models/Country');
const Region = require('../models/Region');
const Area = require('../models/Area');
const Industry = require('../models/Industry');
const BuildingType = require('../models/BuildingType');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * Get all active countries
 */
exports.getCountries = async (req, res) => {
    try {
        const countries = await Country.getActive();
        return successResponse(res, 200, 'Countries retrieved successfully', { countries });
    } catch (error) {
        console.error('Error in getCountries:', error);
        return errorResponse(res, 500, 'Failed to retrieve countries', error.message);
    }
};

/**
 * Get all active regions (optionally filtered by country)
 */
exports.getRegions = async (req, res) => {
    try {
        const { country } = req.query;
        let regions;
        
        if (country) {
            regions = await Region.getByCountry(country);
        } else {
            regions = await Region.getActive();
        }
        
        return successResponse(res, 200, 'Regions retrieved successfully', { regions });
    } catch (error) {
        console.error('Error in getRegions:', error);
        return errorResponse(res, 500, 'Failed to retrieve regions', error.message);
    }
};

/**
 * Get all active areas (optionally filtered by region or country)
 */
exports.getAreas = async (req, res) => {
    try {
        const { region, country } = req.query;
        let areas;
        
        if (region) {
            areas = await Area.getByRegion(region);
        } else if (country) {
            areas = await Area.getByCountry(country);
        } else {
            areas = await Area.getActive();
        }
        
        return successResponse(res, 200, 'Areas retrieved successfully', { areas });
    } catch (error) {
        console.error('Error in getAreas:', error);
        return errorResponse(res, 500, 'Failed to retrieve areas', error.message);
    }
};

/**
 * Get all active industries
 */
exports.getIndustries = async (req, res) => {
    try {
        const industries = await Industry.getActive();
        return successResponse(res, 200, 'Industries retrieved successfully', { industries });
    } catch (error) {
        console.error('Error in getIndustries:', error);
        return errorResponse(res, 500, 'Failed to retrieve industries', error.message);
    }
};

/**
 * Get all active building types
 */
exports.getBuildingTypes = async (req, res) => {
    try {
        const buildingTypes = await BuildingType.getActive();
        return successResponse(res, 200, 'Building types retrieved successfully', { buildingTypes });
    } catch (error) {
        console.error('Error in getBuildingTypes:', error);
        return errorResponse(res, 500, 'Failed to retrieve building types', error.message);
    }
};

