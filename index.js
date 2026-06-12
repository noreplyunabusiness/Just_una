const express = require('express');
const mongoose = require('mongoose');
const File = require('./models/File'); // Import our new file layout
const app = express();
const PORT = process.env.PORT || 3000;

// This allows our server to read JSON data sent in incoming requests
app.use(express.json());

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
  .then(() => console.log("Successfully connected to MongoDB Atlas!"))
  .catch(err => console.error("Database connection error:", err));

// Your original welcome route
app.get('/', (req, res) => {
    res.json({
        server_name: "rec-una API",
        status: "Online",
        database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
        message: "Welcome to the revival backbone!"
    });
});

// NEW ROUTE: Test uploading/saving a file config to the database
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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
