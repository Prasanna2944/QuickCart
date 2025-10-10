import mongoose, { Schema } from "mongoose";


const orderSchema = new Schema({
    userId: { type: String, required: true, ref: "user" },
    items:[{
        productId: {type: Schema.Types.ObjectId, required: true, ref: 'Product' },
        quantity: { type: Number, required: true }
    }],
    amount: {type: Number, required: true },
    address: {type: Schema.Types.ObjectId, ref: 'Address', required: true },
    status: { type: String, default: 'Order Placed' },

}, { timestamps: true })

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;