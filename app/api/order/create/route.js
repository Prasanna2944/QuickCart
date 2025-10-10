import { inngest } from "@/config/inngest";
import Product from "@/models/Product";
import User from "@/models/user"; // <-- Your MongoDB User model
import { getAuth } from "@clerk/nextjs/server"; // <-- CORRECTED: Removed duplicate 'User'
// If you need Clerk's User utility for another purpose, rename it like this:
// import { getAuth, User as ClerkUser } from "@clerk/nextjs/server"; 

import { NextResponse } from "next/server";



export async function POST(request) {
    try {
        
        const { userId } = getAuth(request);
        const { address, items } = await request.json();

        if (!address || items.length === 0) {
            return NextResponse.json({ success: false, message: "Invalid data" });    
        }

        // calculate amount using items
        const amount = await items.reduce(async (acc, item) => {
            const product = await Product.findById(item.productId);
            // Wait for the accumulator promise to resolve before adding
            const currentAcc = await acc;
            return currentAcc + product.offerPrice * item.quantity;
        }, Promise.resolve(0)); // Initialize accumulator with a resolved promise of 0

        await inngest.send({
            name: 'order/created',
            data:{
                userId,
                address,
                items,
                amount: amount + Math.floor(amount * 0.02),
                date: Date.now() 
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