const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
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

// --- SCHEMAS & MODELS ---

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, 
    status: { type: String, default: "Active Tester" },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// Photo & Feed Schema
const photoSchema = new mongoose.Schema({
    username: { type: String, required: true },
    imageUrl: { type: String, required: true },
    title: { type: String, required: true },
    caption: { type: String },
    cheers: { type: [String], default: [] }, // Array of usernames who cheered
    comments: [{
        username: { type: String, required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});
const Photo = mongoose.model('Photo', photoSchema);

// --- ROUTES ---

// Serve front-end
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// SIGNUP
app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password, signupKey } = req.body;
        if (signupKey !== "swiper no swiping") {
            return res.status(400).json({ success: false, message: "Invalid Registration Key!" });
        }
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) return res.status(400).json({ success: false, message: "Username or Email taken." });

        const newUser = new User({ username, email, password });
        await newUser.save();
        res.status(201).json({ success: true, message: "User registered successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error during registration." });
    }
});

// LOGIN
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || user.password !== password) {
            return res.status(400).json({ success: false, message: "Invalid credentials." });
        }
        res.status(200).json({ 
            success: true, 
            user: { username: user.username, email: user.email, status: user.status } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error during login." });
    }
});

// GET ALL PHOTOS
app.get('/api/photos', async (req, res) => {
    try {
        const photos = await Photo.find().sort({ createdAt: -1 });
        res.json({ success: true, photos });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch photos." });
    }
});

// POST A NEW PHOTO
app.post('/api/photos', async (req, res) => {
    try {
        const { username, imageUrl, title, caption } = req.body;
        const newPhoto = new Photo({ username, imageUrl, title, caption });
        await newPhoto.save();
        res.status(201).json({ success: true, photo: newPhoto });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to post photo." });
    }
});

// CHEER / UNCHEER A PHOTO
app.post('/api/photos/:id/cheer', async (req, res) => {
    try {
        const { username } = req.body;
        const photo = await Photo.findById(req.params.id);
        if (!photo) return res.status(404).json({ success: false, message: "Photo not found" });

        if (photo.cheers.includes(username)) {
            photo.cheers = photo.cheers.filter(name => name !== username); // Remove cheer
        } else {
            photo.cheers.push(username); // Add cheer
        }
        await photo.save();
        res.json({ success: true, cheersCount: photo.cheers.length, cheered: photo.cheers.includes(username) });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error processing cheer." });
    }
});

// ADD A COMMENT
app.post('/api/photos/:id/comment', async (req, res) => {
    try {
        const { username, text } = req.body;
        const photo = await Photo.findById(req.params.id);
        if (!photo) return res.status(404).json({ success: false, message: "Photo not found" });

        photo.comments.push({ username, text });
        await photo.save();
        res.json({ success: true, comments: photo.comments });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error adding comment." });
    }
});

// UPDATE USER STATUS (SETTINGS PAGE)
app.post('/api/user/settings', async (req, res) => {
    try {
        const { username, status } = req.body;
        const user = await User.findOneAndUpdate({ username }, { status }, { new: true });
        res.json({ success: true, status: user.status });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update profile." });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
