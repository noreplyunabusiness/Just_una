const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }, // We will encrypt this later!
    role: { type: String, default: 'player' },  // 'player', 'moderator', 'admin'
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
