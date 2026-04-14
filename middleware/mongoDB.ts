import mongoose from "mongoose";

const createMongoConnection = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined in environment variables");
        }

        const URI = process.env.MONGODB_URI;
        await mongoose.connect(URI);

        console.log('Mongoose connected');
    }

    catch (e) {
        console.log('Connection Failed', e);
    }
}

export default createMongoConnection;