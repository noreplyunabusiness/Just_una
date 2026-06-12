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

// --- UPDATED PLAYER SCHEMA ---
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, 
    status: { type: String, default: "Just Una Player" },
    pfpUrl: { type: String, default: "https://i.imgur.com/6VB896R.png" }, // Default avatar
    bio: { type: String, default: "Greetings, I am a proud player of Just Una!" },
    twoFactorEnabled: { type: Boolean, default: false },
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

// --- MULTI-PAGE ROUTING ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/rules', (req, res) => res.sendFile(path.join(__dirname, 'rules.html')));
app.get('/settings', (req, res) => res.sendFile(path.join(__dirname, 'settings.html')));

// SIGNUP & LOGIN
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
        res.status(200).json({ 
            success: true, 
            user: { 
                username: user.username, 
                email: user.email, 
                status: user.status,
                pfpUrl: user.pfpUrl,
                bio: user.bio,
                twoFactorEnabled: user.twoFactorEnabled
            } 
        });
    } catch (error) { res.status(500).json({ success: false }); }
});

// PROFILE PROFILE FETCHER (Returns all updated player fields)
app.get('/api/user/profile/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ success: false, message: "User not found." });
        res.json({ 
            success: true, 
            profile: {
                username: user.username,
                status: user.status,
                pfpUrl: user.pfpUrl,
                bio: user.bio,
                joined: user.createdAt
            } 
        });
    } catch (error) { res.status(500).json({ success: false }); }
});

// FULL ADVANCED SETTINGS UPDATE ENDPOINT
app.post('/api/user/settings/update', async (req, res) => {
    try {
        const { username, status, pfpUrl, bio, twoFactorEnabled } = req.body;
        const user = await User.findOneAndUpdate(
            { username }, 
            { status, pfpUrl, bio, twoFactorEnabled }, 
            { new: true }
        );
        res.json({ 
            success: true, 
            user: {
                status: user.status,
                pfpUrl: user.pfpUrl,
                bio: user.bio,
                twoFactorEnabled: user.twoFactorEnabled
            }
        });
    } catch (error) { res.status(500).json({ success: false }); }
});

// FEED & SCRAPER
app.get('/api/photos', async (req, res) => {
    try {
        const photos = await Photo.find().sort({ createdAt: -1 });
        res.json({ success: true, photos });
    } catch (error) { res.status(500).json({ success: false }); }
});

app.post('/api/photos', async (req, res) => {
    try {
        const { username, imageUrl, title, caption } = req.body;
        let finalImageUrl = imageUrl;
        const isDirectImage = /\.(jpeg|jpg|gif|png|webp)($|\?)/i.test(imageUrl);

        if (!isDirectImage) {
            try {
                const response = await axios.get(imageUrl, { 
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    timeout: 4000 
                });
                const $ = cheerio.load(response.data);
                let scrapedImg = $('meta[property="og:image"]').attr('content') || 
                                 $('meta[name="twitter:image"]').attr('content') ||
                                 $('img').first().attr('src');
                if (scrapedImg) {
                    if (!scrapedImg.startsWith('http')) {
                        const urlObj = new URL(imageUrl);
                        scrapedImg = urlObj.origin + (scrapedImg.startsWith('/') ? '' : '/') + scrapedImg;
                    }
                    finalImageUrl = scrapedImg;
                }
            } catch (err) { console.log("Scrape bypassed."); }
        }

        const newPhoto = new Photo({ username, imageUrl: finalImageUrl, title, caption });
        await newPhoto.save();
        res.status(201).json({ success: true });
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

app.listen(PORT, () => console.log(`Server executing cleanly on port ${PORT}`));
