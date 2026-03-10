import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String, 
        unique: [true, "username already exists"],
        required: true
    },
    email: { 
        type: String, 
        required: true, 
        unique: [true, "email already exists with this email address"]
    },
    password: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

export const userModel =  mongoose.model('userModel', userSchema); 