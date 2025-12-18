const mongoose = require("mongoose");
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;

const connectDB = async () => {
	try {
		await mongoose.connect(MONGO_URI);
		console.log("Database connected successfully");
	} catch (error) {
		console.log("Database connection failed: ", error.message);
		process.exit(1);
	}
};

module.exports = connectDB;