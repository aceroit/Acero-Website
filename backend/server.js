// Initial Imports
const express = require('express');
const app = express();
const dotenv = require("dotenv");
const  connectDB = require('./configs/database');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const { cloudinaryConnect } = require('./configs/cloudinary');
// Loading environment variables from .env file
dotenv.config();

// setting up the port 
const PORT = process.env.PORT || 3000;

// Connecting to database
connectDB()

// Middlewares
app.use(
	cors({
		origin: "*",
		credentials: true,
	})
);
app.use(express.json());

// Connecting to cloudinary
cloudinaryConnect();

// Activity logging middleware (must be after basic middleware, before routes)
const { activityLogger } = require('./middleware/logger');
app.use(activityLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/permissions', require('./routes/permissionRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/roles', require('./routes/roleRoutes'));
app.use('/api/pages', require('./routes/pageRoutes'));
app.use('/api/sections', require('./routes/sectionRoutes'));
app.use('/api/section-types', require('./routes/sectionTypeRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));
app.use('/api/workflow', require('./routes/workflowRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/activity', require('./routes/activityRoutes'));
app.use('/api/media', require('./routes/mediaRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/branches', require('./routes/branchRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/certifications', require('./routes/certificationRoutes'));
app.use('/api/company-updates', require('./routes/companyUpdateRoutes'));
app.use('/api/company-update-categories', require('./routes/companyUpdateCategoryRoutes'));
app.use('/api/brochures', require('./routes/brochureRoutes'));
app.use('/api/reference', require('./routes/referenceRoutes'));
app.use('/api/building-types', require('./routes/buildingTypeRoutes'));
app.use('/api/industries', require('./routes/industryRoutes'));
app.use('/api/countries', require('./routes/countryRoutes'));
app.use('/api/regions', require('./routes/regionRoutes'));
app.use('/api/areas', require('./routes/areaRoutes'));
app.use('/api/header-configurations', require('./routes/headerConfigurationRoutes'));
app.use('/api/footer-configurations', require('./routes/footerConfigurationRoutes'));
app.use('/api/website-appearance', require('./routes/websiteAppearanceRoutes'));
app.use('/api/smtp-settings', require('./routes/smtpSettingsRoutes'));
app.use('/api/google-recaptcha', require('./routes/googleReCaptchaRoutes'));
app.use('/api/google-maps', require('./routes/googleMapsRoutes'));
app.use('/api/vacancies', require('./routes/vacancyRoutes'));
app.use('/api/enquiries', require('./routes/enquiryRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/form-configurations', require('./routes/formConfigurationRoutes'));

// Testing the server
app.get("/", (req, res) => {
	res.status(200).json({
		success: true,
		message: "Acero CMS Backend API is running",
		version: "4.0.0",
		endpoints: {
			auth: "/api/auth",
			users: "/api/users",
			permissions: "/api/permissions",
			resources: "/api/resources",
			roles: "/api/roles",
			pages: "/api/pages",
			sections: "/api/sections",
			sectionTypes: "/api/section-types",
			public: "/api/public",
			workflow: "/api/workflow",
			dashboard: "/api/dashboard",
			notifications: "/api/notifications",
			activity: "/api/activity",
			media: "/api/media",
			projects: "/api/projects",
			branches: "/api/branches",
			customers: "/api/customers",
			certifications: "/api/certifications",
			companyUpdates: "/api/company-updates",
			companyUpdateCategories: "/api/company-update-categories",
			brochures: "/api/brochures",
			reference: "/api/reference",
			buildingTypes: "/api/building-types",
			industries: "/api/industries",
			countries: "/api/countries",
			regions: "/api/regions",
			areas: "/api/areas"
		}
	});
});

// Error handling middleware (must be after all routes)
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
app.use(notFoundHandler);
app.use(errorHandler);

// Get network IP address
const { getNetworkIP } = require('./utils/urlHelper');

const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces
const networkIP = getNetworkIP();

// Listening to the server
app.listen(PORT, HOST, () => {
	console.log(`=================================`);
	console.log(`🚀 Server is running on port ${PORT}`);
	console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
	console.log(`🔗 Local URL: http://localhost:${PORT}`);
	console.log(`🌐 Network URL: http://${networkIP}:${PORT}`);
	console.log(`=================================`);
});