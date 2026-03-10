import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// ensure we read the same variable that’s set in .env (MONGO_URI)
const mongoURl = process.env.MONGO_URI || process.env.MONGO_URL; // MONGO_URL fallback

main().then(()=>{
    console.log("connected to DB");
}).catch((err)=>{
    console.error("Failed to connect to MongoDB:", err);
})

async function main() {
    if (!mongoURl) {
        throw new Error("MongoDB connection string is not defined. Set MONGO_URI in your environment.");
    }
    await mongoose.connect(mongoURl);
}

export { main }