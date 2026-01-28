const FormConfiguration = require('../models/FormConfiguration');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/**
 * Get all configurations
 */
exports.getAllConfigs = async (req, res) => {
    try {
        const configs = await FormConfiguration.find().sort({ createdAt: -1 });
        return successResponse(res, 200, 'Form configurations retrieved successfully', { configs });
    } catch (error) {
        console.error('Error in getAllConfigs:', error);
        return errorResponse(res, 500, 'Failed to retrieve form configurations', error.message);
    }
};

/**
 * Get active configuration
 */
exports.getActiveConfig = async (req, res) => {
    try {
        const config = await FormConfiguration.getActive();
        return successResponse(res, 200, 'Active form configuration retrieved successfully', { config });
    } catch (error) {
        console.error('Error in getActiveConfig:', error);
        return errorResponse(res, 500, 'Failed to retrieve active form configuration', error.message);
    }
};

/**
 * Create configuration
 */
exports.createConfig = async (req, res) => {
    try {
        const configData = { ...req.body };

        const config = new FormConfiguration(configData);
        await config.save();

        return successResponse(res, 201, 'Form configuration created successfully', { config });
    } catch (error) {
        console.error('Error in createConfig:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to create form configuration', error.message);
    }
};

/**
 * Update configuration
 */
exports.updateConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const config = await FormConfiguration.findById(id);
        if (!config) {
            return errorResponse(res, 404, 'Form configuration not found');
        }

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined && key !== '_id') {
                config[key] = updateData[key];
            }
        });

        await config.save();

        return successResponse(res, 200, 'Form configuration updated successfully', { config });
    } catch (error) {
        console.error('Error in updateConfig:', error);
        if (error.name === 'ValidationError') {
            return errorResponse(res, 400, 'Validation error', error.message);
        }
        return errorResponse(res, 500, 'Failed to update form configuration', error.message);
    }
};

/**
 * Delete configuration
 */
exports.deleteConfig = async (req, res) => {
    try {
        const { id } = req.params;

        const config = await FormConfiguration.findById(id);
        if (!config) {
            return errorResponse(res, 404, 'Form configuration not found');
        }

        await FormConfiguration.deleteOne({ _id: id });

        return successResponse(res, 200, 'Form configuration deleted successfully', { config: { _id: id } });
    } catch (error) {
        console.error('Error in deleteConfig:', error);
        return errorResponse(res, 500, 'Failed to delete form configuration', error.message);
    }
};


