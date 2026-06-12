const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    roomName: { type: String, required: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roomType: { type: String, default: 'public' }, // public, private
    maxPlayers: { type: Number, default: 8 },
    currentPlayers: { type: [String], default: [] }, // Array of usernames inside the room
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', RoomSchema);
