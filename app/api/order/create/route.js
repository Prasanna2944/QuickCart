import { inngest } from "@/config/inngest";
import Product from "@/models/Product";
import User from "@/models/User";
import Order from "@/models/Order"; 
import Address from "@/models/Address"; // Added for explicit model registration
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
            
            if (!product) {
                throw new Error(`Product not found for ID: ${item.productId}.`);
            }
            
            const currentAcc = await acc;
            return currentAcc + product.offerPrice * item.quantity;
        }, Promise.resolve(0)); 

        const finalAmount = totalAmount + Math.floor(totalAmount * 0.02);
        
        // CREATE AND SAVE THE ORDER DOCUMENT TO MONGODB
        const newOrder = new Order({
            userId: userId,
            address: address, 
            items: items,
            amount: finalAmount,
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