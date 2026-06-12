const express = require('express');
const mongoose = require('mongoose');
const File = require('./models/File');
const User = require('./models/User'); // Import the new User model
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const mongoURI = process.env.MONGO_URI;
const masterSignupKey = process.env.SIGNUP_KEY; // Grab our secret signup key

mongoose.connect(mongoURI)
  .then(() => console.log("Successfully connected to MongoDB Atlas!"))
  .catch(err => console.error("Database connection error:", err));

// Welcome route
app.get('/', (req, res) => {
    res.json({
        server_name: "rec-una API",
        status: "Online",
        database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
    });
});

// NEW ROUTE: Account Registration
app.post('/api/signup', async (req, res) => {
    try {
        const { username, password, signupKey } = req.body;

        // 1. Check if the registration key matches our secret key
        if (signupKey !== masterSignupKey) {
            return res.status(401).json({ success: false, message: "Invalid registration key!" });
        }

        // 2. Check if username already exists
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ success: false, message: "Username is already taken!" });
        }

        // 3. Create and save the new user
        const newUser = new User({
            username,
            password // Note: In a production app, we will use 'bcrypt' to scramble this!
        });

        await newUser.save();
        res.status(201).json({ success: true, message: `Account for ${username} successfully created!` });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
