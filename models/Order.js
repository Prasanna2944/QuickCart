import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema({
    // 🛑 FIX: Change type back to String to match the Clerk User ID format
    userId: { 
        type: String, 
        ref: "User", 
        required: true,
    },
    items: [
        {
            productId: { 
                type: Schema.Types.ObjectId, 
                required: true, 
                ref: "Product"
            },
            quantity: { type: Number, required: true },
        },
    ],
    amount: { type: Number, required: true },
    address: { 
        type: Schema.Types.ObjectId, 
        ref: "Address", 
        required: true 
    },
    status: { type: String, default: "Order Placed" },
}, { timestamps: true });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;