import jwt from "jsonwebtoken";
import { BlacklistToken } from "../models/blacklist.model.js";


/** 
 * @name authenticateUser
 * @description This middleware will authenticate the user by verifying the JWT token from the cookie. If the token is valid, it will allow the request to proceed to the next middleware or route handler. If the token is invalid or not present, it will return an unauthorized error response.
 * @access Private
 */

const authenticateUser = async (req, res, next) => {
    try {
        const token = req.cookies.jwt; // Use the cookie name set in AuthToken.js
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }
        // Check if the token is blacklisted       
        const blacklistedToken = await BlacklistToken.findOne({ token });
        if (blacklistedToken) {
            return res.status(401).json({ message: "Unauthorized: Token is blacklisted" });
        }
        // Verify the token and get the user ID from it
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.userId }; // Attach user id for downstream handlers
        next();
    } catch (err) {
        console.error(err);
        res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
}

export default authenticateUser;