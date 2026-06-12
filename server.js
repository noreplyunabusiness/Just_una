const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // Added for handling files
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST']
}));

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Successfully connected to MongoDB Atlas!'))
    .catch(err => console.error('Database connection error:', err));

// User Schema & Model
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, 
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// SERVE YOUR HOME PAGE HTML FILE DIRECTLY
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// SIGNUP ROUTE
app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password, signupKey } = req.body;

        if (signupKey !== "swiper no swiping") {
            return res.status(400).json({ success: false, message: "Invalid Registration Key!" });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Username or Email already taken." });
        }

        const newUser = new User({ username, email, password });
        await newUser.save();

        res.status(201).json({ success: true, message: "User registered successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error during registration." });
    }
});

// LOGIN ROUTE
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user || user.password !== password) {
            return res.status(400).json({ success: false, message: "Invalid username or password." });
        }

        res.status(200).json({ 
            success: true, 
            message: "Login successful!", 
            user: { username: user.username, email: user.email } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error during login." });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
