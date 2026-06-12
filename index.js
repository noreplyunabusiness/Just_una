const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const File = require('./models/File');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON payloads
app.use(express.json());

// Pull variables safely from Render's environment locker
const mongoURI = process.env.MONGO_URI;
const masterSignupKey = process.env.SIGNUP_KEY;

// Establish Connection to MongoDB Atlas
mongoose.connect(mongoURI)
  .then(() => console.log("Successfully connected to MongoDB Atlas!"))
  .catch(err => console.error("Database connection error:", err));

// 1. Home Welcome Route
app.get('/', (req, res) => {
    res.json({
        server_name: "rec-una API",
        status: "Online",
        database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
        message: "Welcome to the revival backbone!"
    });
});

// 2. File Upload / Config Tracking Route
app.post('/api/upload-file', async (req, res) => {
    try {
        const { name, type, payload } = req.body;
        
        const newFile = new File({
            fileName: name,
            fileType: type,
            data: payload
        });

        await newFile.save();
        res.status(201).json({ success: true, message: "File data successfully saved to cloud database!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Secure Account Registration Route
app.post('/api/signup', async (req, res) => {
    try {
        const { username, password, signupKey } = req.body;

        // Verify the anti-bot master phrase
        if (signupKey !== masterSignupKey) {
            return res.status(401).json({ success: false, message: "Invalid registration key!" });
        }

        // Verify if username is unique
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ success: false, message: "Username is already taken!" });
        }

        // Passwords are encrypted on the fly inside the User model pre-save hook!
        const newUser = new User({ username, password });
        await newUser.save();

        res.status(201).json({ success: true, message: `Account for ${username} successfully created!` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. Secure Account Login Route
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Locate the user file profile
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid username or password!" });
        }

        // Safe evaluation of the hashed database string against plaintext input
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid username or password!" });
        }

        res.json({ 
            success: true, 
            message: `Welcome back, ${user.username}!`,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
