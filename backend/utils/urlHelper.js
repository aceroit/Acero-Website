/**
 * URL Helper Utility
 * Provides functions to get base URLs dynamically from requests or environment variables
 */

const os = require('os');

/**
 * Get network IP address
 * @returns {string} Network IP address or 'localhost' if not found
 */
const getNetworkIP = () => {
	const interfaces = os.networkInterfaces();
	for (const name of Object.keys(interfaces)) {
		for (const iface of interfaces[name]) {
			// Skip internal (loopback) and non-IPv4 addresses
			if (iface.family === 'IPv4' && !iface.internal) {
				return iface.address;
			}
		}
	}
	return 'localhost';
};

/**
 * Get base URL from request
 * Uses the request's host header to determine the correct URL
 * @param {Object} req - Express request object
 * @returns {string} Base URL (e.g., http://192.168.1.100:3000)
 */
const getBaseUrlFromRequest = (req) => {
	if (!req) {
		return process.env.BACKEND_URL || `http://${getNetworkIP()}:${process.env.PORT || 3000}`;
	}

	const protocol = req.protocol || (req.secure ? 'https' : 'http');
	const host = req.get('host') || req.headers.host;
	
	if (host) {
		return `${protocol}://${host}`;
	}

	// Fallback to environment variable or network IP
	return process.env.BACKEND_URL || `http://${getNetworkIP()}:${process.env.PORT || 3000}`;
};

/**
 * Get admin panel URL
 * Uses environment variable or falls back to network IP
 * @returns {string} Admin panel URL
 */
const getAdminPanelUrl = () => {
	if (process.env.ADMIN_PANEL_URL) {
		return process.env.ADMIN_PANEL_URL;
	}
	
	// If not set, try to construct from network IP
	const networkIP = getNetworkIP();
	const adminPort = process.env.ADMIN_PANEL_PORT || 5173;
	return `http://${networkIP}:${adminPort}`;
};

/**
 * Get public site URL
 * Uses environment variable or falls back to network IP
 * @returns {string} Public site URL
 */
const getPublicSiteUrl = () => {
	if (process.env.PUBLIC_SITE_URL) {
		return process.env.PUBLIC_SITE_URL;
	}
	
	// If not set, try to construct from network IP
	const networkIP = getNetworkIP();
	const publicPort = process.env.PUBLIC_SITE_PORT || 5174;
	return `http://${networkIP}:${publicPort}`;
};

module.exports = {
	getNetworkIP,
	getBaseUrlFromRequest,
	getAdminPanelUrl,
	getPublicSiteUrl
};

