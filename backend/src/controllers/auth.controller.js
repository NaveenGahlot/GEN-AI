import createTokenAndSaveCookie from "../jwt/AuthToken.js";
import { BlacklistToken } from "../models/blacklist.model.js";
import { userModel } from "../models/user.model.js";
import bcrypt from "bcryptjs";

/**
 * @name registerUser
 * @description This function will handle the registration of a new user. It will take the user details from the request body, create a new user in the database, and return a success message.
 * @access Public 
 */
export const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        // Check if the user already exists
        const existingUser = await userModel.findOne({ username, email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this username or email address" });
        }
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Please provide all required fields: username, email, and password" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new userModel({
            username,
            email,
            password: hashedPassword
        });
        await newUser.save();
        // User registered successfully, create JWT token and save it in cookie
        if (newUser) {
            let Token = await createTokenAndSaveCookie(newUser._id, res);
            res.status(201).json({
                message: "User registered successfully", user: {
                    id: newUser._id,
                    username: newUser.username,
                    email: newUser.email,
                    password: newUser.password
                }, token: Token
            });
        } else {
            res.status(500).json({ message: "Failed to register user" });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

/**
 * @name loginUser
 * @description This function will handle the login of a user. It will take the user credentials from the request body, verify them against the database, and return a success message along with a JWT token if the credentials are valid.
 * @access Public
 */

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Check if the user exists
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        // Compare the provided password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        // User authenticated successfully, create JWT token and save it in cookie
        let Token = await createTokenAndSaveCookie(user._id, res);
        res.status(200).json({
            message: "User logged in successfully", user: {
                id: user._id,
                username: user.username,
                email: user.email,
                password: user.password
            }, token: Token
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

/**
 * @name logoutUser
 * @description This function will handle the logout of a user. It will clear the JWT token from the cookie and return a success message.
 * @access Public
 */
export const logoutUser = async (req, res) => {
    const token = req.cookies.jwt; // Use the cookie name set in AuthToken.js
    if (token) {
        await BlacklistToken.create({ token })
    }
    res.clearCookie("jwt")
    res.status(200).json({
        message: "User logged out successfully"
    })
}

/**
 * @name getMe
 * @description This function will return the authenticated user's information. It will use the user ID from the JWT token to fetch the user's details from the database and return them in the response.
 * @access Private
 */
export const getMe = async (req, res) => {
    const user = await userModel.findById(req.user.id)
    res.status(200).json({
        message: "User details fetched successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}
