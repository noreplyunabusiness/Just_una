const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Import the scrambler tool

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, default: 'player' },
    createdAt: { type: Date, default: Date.now }
});

// A "pre-save" hook: This runs automatically right before a user is saved to the DB
UserSchema.pre('save', async function (next) {
    // Only scramble the password if it's new or being changed
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10); // Generate a random security key
        this.password = await bcrypt.hash(this.password, salt); // Scramble it!
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model('User', UserSchema);
