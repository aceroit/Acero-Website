// Initial Imports
const express = require('express');
const app = express();
const dotenv = require("dotenv");
const  connectDB = require('./configs/database');
const cors = require('cors');

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


// Routes


// Testing the server
app.get("/", (req, res) => {
	res.send("Hello World");
});

// Listening to the server
app.listen(PORT, () => {
	console.log(`App is listening at ${PORT}`);
});