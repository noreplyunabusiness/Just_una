const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const File = require('./models/File');
const User = require('./models/User');
const Room = require('./models/Room'); // Import our new Room model

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const mongoURI = process.env.MONGO_URI;
const masterSignupKey = process.env.SIGNUP_KEY;

mongoose.connect(mongoURI)
  .then(() => console.log("Successfully connected to MongoDB Atlas!"))
  .catch(err => console.error("Database connection error:", err));

// Welcome Route
app.get('/', (req, res) => {
    res.json({
        server_name: "rec-una API",
        status: "Online",
        database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
    });
});

/* ==================== FILE ROUTES ==================== */
app.post('/api/upload-file', async (req, res) => {
    try {
        const { name, type, payload } = req.body;
        const newFile = new File({ fileName: name, fileType: type, data: payload });
        await newFile.save();
        res.status(201).json({ success: true, message: "File data saved!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/* ==================== AUTH & PROFILE ROUTES ==================== */
app.post('/api/signup', async (req, res) => {
    try {
        const { username, password, signupKey } = req.body;
        if (signupKey !== masterSignupKey) return res.status(401).json({ success: false, message: "Invalid key!" });
        
        const userExists = await User.findOne({ username });
        if (userExists) return res.status(400).json({ success: false, message: "Username taken!" });

        const newUser = new User({ username, password });
        await newUser.save();
        res.status(201).json({ success: true, message: `Account created for ${username}!` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ success: false, message: "Invalid login!" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Invalid login!" });

        res.json({ 
            success: true, 
            user: { id: user._id, username: user.username, level: user.level, tokens: user.tokens }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Route to give players XP or Tokens after a match
app.post('/api/player/update-stats', async (req, res) => {
    try {
        const { userId, xpToAdd, tokensToAdd } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "Player not found" });

        if (xpToAdd) user.xp += xpToAdd;
        if (tokensToAdd) user.tokens += tokensToAdd;

        // Simple level up calculation: every 1000 XP is a level
        user.level = Math.floor(user.xp / 1000) + 1;

        await user.save();
        res.json({ success: true, message: "Stats updated!", level: user.level, xp: user.xp, tokens: user.tokens });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/* ==================== MATCHMAKING / ROOM ROUTES ==================== */

// Create a new room lobby
app.post('/api/rooms/create', async (req, res) => {
    try {
        const { roomName, hostId, maxPlayers, hostUsername } = req.body;
        
        const newRoom = new Room({
            roomName,
            hostId,
            maxPlayers,
            currentPlayers: [hostUsername] // Host starts inside the room
        });

        await newRoom.save();
        res.status(201).json({ success: true, room: newRoom });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get a list of all active rooms for the matchmaking browser
app.get('/api/rooms', async (req, res) => {
    try {
        const activeRooms = await Room.find({ isActive: true });
        res.json({ success: true, rooms: activeRooms });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
