const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*', // Allows your Google Site to communicate with Render
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
    password: { type: String, required: true }, // Ideally hashed, but keeping it direct for alpha testing connection
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Home route to check if server is awake
app.get('/', (req, res) => {
    res.send('<h1>rec-una API Server is Awake and Ready!</h1>');
});

// SIGNUP ROUTE
app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password, signupKey } = req.body;

        // Check the secret key (matching your "swiper" or alpha key phrase)
        // Adjust the phrase inside the quotes if you have a different key!
        if (signupKey !== "swiper no swiping") {
            return res.status(400).json({ success: false, message: "Invalid Registration Key!" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Username or Email already taken." });
        }

        // Save new user
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

        // Find user by username
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
