const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
    fileName: { type: String, required: true },
    fileType: { type: String, required: true }, // e.g., 'room', 'player_preset'
    ownerId: { type: String, default: 'anonymous' },
    data: { type: Object, required: true }, // This stores the actual file contents (JSON, settings, etc.)
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', FileSchema);
