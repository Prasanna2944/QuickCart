import { inngest } from "@/config/inngest";
import Product from "@/models/Product";
import User from "@/models/user";
import Order from "@/models/Order"; // Added import for Order model
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";

export async function POST(request) {
    try {
        
        await connectDB()

        const { userId } = getAuth(request);
        const { address, items } = await request.json();

        if (!address || items.length === 0) {
            return NextResponse.json({ success: false, message: "Invalid data" }); 
        }

        // calculate amount using items
        const totalAmount = await items.reduce(async (acc, item) => {
            const product = await Product.findById(item.productId);
            
            // FIX: Check if the product exists before accessing properties
            if (!product) {
                // Throw an error to stop the transaction if a product is missing/invalid
                throw new Error(`Product not found for ID: ${item.productId}.`);
            }
            
            // Wait for the accumulator promise to resolve before adding
            const currentAcc = await acc;
            return currentAcc + product.offerPrice * item.quantity;
        }, Promise.resolve(0)); // Initialize accumulator with a resolved promise of 0

        const finalAmount = totalAmount + Math.floor(totalAmount * 0.02);
        
        //  NEW: CREATE AND SAVE THE ORDER DOCUMENT TO MONGODB
        const newOrder = new Order({
            userId: userId,
            address: address, 
            items: items,
            amount: finalAmount,
            // status will default to 'Order Placed' as defined in Order model
        });

        await newOrder.save();
        
        // Send Inngest event
        await inngest.send({
            name: 'order/created',
            data:{
                userId,
                address,
                items,
                amount: finalAmount,
                // Removed the date field, as the Mongoose model now uses timestamps
            }
        })

        // Clear User cart

        const user = await User.findById(userId);
        user.cartItems = {};
        await user.save();

        return NextResponse.json({ success: true, message: "Order Placed Successfully" });

    } catch (error) {
        console.log(error);
        return NextResponse.json({ success: false, message: error.message });
    }
}