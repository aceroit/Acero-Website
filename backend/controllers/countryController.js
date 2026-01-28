const Country = require('../models/Country');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { canEditContent, canDeleteContent } = require('../utils/workflowStatusValidator');

/**
 * Get all countries (with filters and pagination)
 */
exports.getAllCountries = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            featured,
            isVisible,
            search,
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        // Build query
        const query = { isActive: true };
        
        if (status) query.status = status;
        if (featured !== undefined) query.featured = featured === 'true';
        if (isVisible !== undefined) query.isVisible = isVisible === 'true';
        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { code: new RegExp(search, 'i') }
            ];
        }

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        if (sortBy !== 'name') {
            sortOptions.name = 1;
        }

        const [countries, total] = await Promise.all([
            Country.find(query)
                .populate('createdBy', 'firstName lastName email')
                .populate('updatedBy', 'firstName lastName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Country.countDocuments(query)
        ]);

        return successResponse(res, 200, 'Countries retrieved successfully', {
            countries,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error in getAllCountries:', error);
        return errorResponse(res, 500, 'Failed to retrieve countries', error.message);
    }
};

/**
 * Get single country by ID
 */
exports.getCountryById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const country = await Country.findOne({ _id: id, isActive: true })
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');
        
        if (!country) {
            return errorResponse(res, 404, 'Country not found');
        }

        return successResponse(res, 200, 'Country retrieved successfully', { country });
    } catch (error) {
        console.error('Error in getCountryById:', error);
        return errorResponse(res, 500, 'Failed to retrieve country', error.message);
    }
};

/**
 * Get country by code
 */
exports.getCountryByCode = async (req, res) => {
    try {
        const { code } = req.params;
        
        const country = await Country.findOne({ code: code.toUpperCase(), isActive: true })
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');
        
        if (!country) {
            return errorResponse(res, 404, 'Country not found');
        }

        return successResponse(res, 200, 'Country retrieved successfully', { country });
    } catch (error) {
        console.error('Error in getCountryByCode:', error);
        return errorResponse(res, 500, 'Failed to retrieve country', error.message);
    }
};

/**
 * Create new country
 */
exports.createCountry = async (req, res) => {
    try {
        const countryData = {
            ...req.body,
            code: req.body.code?.toUpperCase(),
            createdBy: req.user._id
        };

        const country = new Country(countryData);
        await country.save();

        const populatedCountry = await Country.findById(country._id)
            .populate('createdBy', 'firstName lastName email');

        return successResponse(
            res,
            201,
            'Country created successfully',
            { country: populatedCountry }
        );
    } catch (error) {
        console.error('Error in createCountry:', error);
        if (error.code === 11000) {
            return errorResponse(res, 400, 'Country with this name or code already exists');
        }
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to create country', error.message);
    }
};

/**
 * Update country
 */
exports.updateCountry = async (req, res) => {
    try {
        const { id } = req.params;
        
        const country = await Country.findById(id);
        
        if (!country) {
            return errorResponse(res, 404, 'Country not found');
        }

        if (!country.isActive) {
            return errorResponse(res, 404, 'Country not found');
        }

        // Check if user can edit based on workflow status
        const editValidation = await canEditContent(req.user, country, 'countries', 'update');
        if (!editValidation.canEdit) {
            return errorResponse(res, 403, editValidation.reason || 'You do not have permission to edit this country');
        }

        // Update fields
        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined && key !== '_id' && key !== 'createdBy') {
                if (key === 'code') {
                    country[key] = req.body[key].toUpperCase();
                } else {
                    country[key] = req.body[key];
                }
            }
        });
        country.updatedBy = req.user._id;
        await country.save();

        const updatedCountry = await Country.findById(country._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        return successResponse(
            res,
            200,
            'Country updated successfully',
            { country: updatedCountry }
        );
    } catch (error) {
        console.error('Error in updateCountry:', error);
        if (error.code === 11000) {
            return errorResponse(res, 400, 'Country with this name or code already exists');
        }
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to update country', error.message);
    }
};

/**
 * Delete country (soft delete)
 */
exports.deleteCountry = async (req, res) => {
    try {
        const { id } = req.params;
        
        const country = await Country.findById(id);
        
        if (!country) {
            return errorResponse(res, 404, 'Country not found');
        }

        if (!country.isActive) {
            return errorResponse(res, 404, 'Country not found');
        }

        // Check if user can delete based on workflow status
        const deleteValidation = await canDeleteContent(req.user, country, 'countries');
        if (!deleteValidation.canDelete) {
            return errorResponse(res, 403, deleteValidation.reason || 'You do not have permission to delete this country');
        }

        // Soft delete
        country.isActive = false;
        country.updatedBy = req.user._id;
        await country.save();

        return successResponse(res, 200, 'Country deleted successfully');
    } catch (error) {
        console.error('Error in deleteCountry:', error);
        return errorResponse(res, 500, 'Failed to delete country', error.message);
    }
};

