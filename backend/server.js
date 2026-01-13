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
app.use('/api/pages', require('./routes/pageRoutes'));
app.use('/api/sections', require('./routes/sectionRoutes'));
app.use('/api/section-types', require('./routes/sectionTypeRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));
app.use('/api/workflow', require('./routes/workflowRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/activity', require('./routes/activityRoutes'));
app.use('/api/media', require('./routes/mediaRoutes'));

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
			pages: "/api/pages",
			sections: "/api/sections",
			sectionTypes: "/api/section-types",
			public: "/api/public",
			workflow: "/api/workflow",
			dashboard: "/api/dashboard",
			notifications: "/api/notifications",
			activity: "/api/activity",
			media: "/api/media"
		}
	});
});

// Error handling middleware (must be after all routes)
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
app.use(notFoundHandler);
app.use(errorHandler);

// Listening to the server
app.listen(PORT, () => {
	console.log(`=================================`);
	console.log(`🚀 Server is running on port ${PORT}`);
	console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
	console.log(`🔗 API URL: http://localhost:${PORT}`);
	console.log(`=================================`);
});