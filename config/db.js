// config/db.js
import mongoose from "mongoose";

// --- Direct Model Registration ---
import '../models/Address'; 
import '../models/Order';
import '../models/Product';
import '../models/User'; 
// --- End Direct Model Registration ---

let cached = global.mongoose
// ... rest of connectDB function ...


if (!cached) {
    cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB(){
    if (cached.conn) {
        console.log("=> Using existing database connection");
        return cached.conn;
    }

    if(!cached.promise){
        const opts = {
            bufferCommands: false
        }

        // NOTE: Ensure your MONGODB_URI includes the database name or connect using the dbName option
        cached.promise = mongoose.connect(`${process.env.MONGODB_URI}/quickcart`, opts).then(mongoose => {
            console.log("=> New database connection established");
            return mongoose;
        })
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

export default connectDB;