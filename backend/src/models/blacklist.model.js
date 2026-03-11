import mongoose from 'mongoose';

const blacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, 'Token is required'] 
    }
}, {
    timestamps: true
})

const BlacklistToken = mongoose.model('BlacklistToken', blacklistSchema);

export { BlacklistToken };