import mongoose from "mongoose";
import config from "./server.config.js";

const connectToDatabase = async () => {
    try {
        await mongoose.connect(config.mongodbUri);
        console.log("Connected to MongoDB successfully!");  
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1); // Exit the process with an error code
    }
};

export default connectToDatabase;