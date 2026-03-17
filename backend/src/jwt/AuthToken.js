import { userModel } from '../models/user.model.js';
import jwt from 'jsonwebtoken';

// Create JWT token and save it in cookie
const createTokenAndSaveCookie = async(userId, res)=>{
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
    res.cookie("jwt", token, {
        httpOnly: true,
secure: process.env.NODE_ENV === 'production',
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000
    });
    await userModel.findByIdAndUpdate(userId, { token: token });
    return token;
}
export default createTokenAndSaveCookie;