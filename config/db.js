import mongoose from "mongoose";

// 🛑 FIX: Import the model index file to guarantee all schemas are registered
import "../models/Index.js"; 

let cached = global.mongoose

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB(){
    if (cached.conn) {
        return cached.conn;
    }

    if(!cached.promise){
        const opts = {
            bufferCommands: false
        }

        cached.promise = mongoose.connect(`${process.env.MONGODB_URI}/quickcart`, opts).then(mongoose => {
            return mongoose;
        })
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

export default connectDB;