const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Successfully connected to MongoDB Atlas!'))
    .catch(err => console.error('Database connection error:', err));

// Schemas
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, 
    status: { type: String, default: "Active Tester" },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const photoSchema = new mongoose.Schema({
    username: { type: String, required: true },
    imageUrl: { type: String, required: true },
    title: { type: String, required: true },
    caption: { type: String },
    cheers: { type: [String], default: [] },
    comments: [{
        username: { type: String, required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});
const Photo = mongoose.model('Photo', photoSchema);

// Serve Front-End
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// SIGNUP & LOGIN ROUTES
app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password, signupKey } = req.body;
        if (signupKey !== "swiper no swiping") return res.status(400).json({ success: false, message: "Invalid Key!" });
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) return res.status(400).json({ success: false, message: "Username/Email taken." });
        const newUser = new User({ username, email, password });
        await newUser.save();
        res.status(201).json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || user.password !== password) return res.status(400).json({ success: false, message: "Invalid credentials." });
        res.status(200).json({ success: true, user: { username: user.username, email: user.email, status: user.status } });
    } catch (error) { res.status(500).json({ success: false }); }
});

// GET FEED
app.get('/api/photos', async (req, res) => {
    try {
        const photos = await Photo.find().sort({ createdAt: -1 });
        res.json({ success: true, photos });
    } catch (error) { res.status(500).json({ success: false }); }
});

// POST PHOTO WITH AUTOMATIC WEB SCRAPER
app.post('/api/photos', async (req, res) => {
    try {
        const { username, imageUrl, title, caption } = req.body;
        let finalImageUrl = imageUrl;

        // Check if the link is a standard webpage instead of a direct image file
        const isDirectImage = /\.(jpeg|jpg|gif|png|webp)($|\?)/i.test(imageUrl);

        if (!isDirectImage) {
            try {
                // Secretly visit the website and download the HTML
                const response = await axios.get(imageUrl, { 
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                    timeout: 5000 
                });
                const $ = cheerio.load(response.data);
                
                // Find meta tags where sites declare their primary image preview
                let scrapedImg = $('meta[property="og:image"]').attr('content') || 
                                 $('meta[name="twitter:image"]').attr('content') ||
                                 $('img').first().attr('src'); // Fallback to the very first image on the page

                if (scrapedImg) {
                    // Fix relative URLs (e.g., if it returns '/logo.png' instead of 'https://site.com/logo.png')
                    if (!scrapedImg.startsWith('http')) {
                        const urlObj = new URL(imageUrl);
                        scrapedImg = urlObj.origin + (scrapedImg.startsWith('/') ? '' : '/') + scrapedImg;
                    }
                    finalImageUrl = scrapedImg;
                }
            } catch (scrapeError) {
                console.log("Could not scrape page, attempting fallback to original URL string.");
            }
        }

        const newPhoto = new Photo({ username, imageUrl: finalImageUrl, title, caption });
        await newPhoto.save();
        res.status(201).json({ success: true, photo: newPhoto });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to process photo upload instance." });
    }
});

// INTERACTIVE ENGAGEMENT ENDPOINTS
app.post('/api/photos/:id/cheer', async (req, res) => {
    try {
        const { username } = req.body;
        const photo = await Photo.findById(req.params.id);
        if (photo.cheers.includes(username)) {
            photo.cheers = photo.cheers.filter(name => name !== username);
        } else {
            photo.cheers.push(username);
        }
        await photo.save();
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
});

app.post('/api/photos/:id/comment', async (req, res) => {
    try {
        const { username, text } = req.body;
        const photo = await Photo.findById(req.params.id);
        photo.comments.push({ username, text });
        await photo.save();
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
});

app.post('/api/user/settings', async (req, res) => {
    try {
        const { username, status } = req.body;
        const user = await User.findOneAndUpdate({ username }, { status }, { new: true });
        res.json({ success: true, status: user.status });
    } catch (error) { res.status(500).json({ success: false }); }
});
// FETCH AN INDIVIDUAL USER'S PROFILE PUBLIC DATA
app.get('/api/user/profile/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ success: false, message: "User not found." });
        
        // Only send back public info, NEVER send the password!
        res.json({ 
            success: true, 
            profile: {
                username: user.username,
                status: user.status,
                joined: user.createdAt
            } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching user profile." });
    }
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
