//Continuously error making file
import { inngest } from "@/config/inngest";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import User from "@/models/User"; // Should be capitalized and correct
import Order from "@/models/Order";
// import Address from "@/models/Address";
import { getAuth } from "@clerk/nextjs/server"; // ⬅️ MUST NOT include "User"
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        await connectDB();

        const { userId } = getAuth(request);
        const { address, items } = await request.json();

        if (!userId || !address || items.length === 0) {
            return NextResponse.json({
                success: false,
                message: "Invalid data — missing user, address, or items.",
            });
        }

        const totalAmount = await items.reduce(async (accPromise, item) => {
            const acc = await accPromise;
            const product = await Product.findById(item.productId);
            if (!product) throw new Error(`Product not found for ID: ${item.productId}`);
            return acc + product.offerPrice * item.quantity;
        }, Promise.resolve(0));

        const finalAmount = totalAmount + Math.floor(totalAmount * 0.02);

        const orderData = {
            userId,
            address: address._id || address,
            items,
            amount: finalAmount,
        };

        const newOrder = new Order(orderData);
        await newOrder.save();

        await inngest.send({
            name: "order/created",
            data: { userId, address, items, amount: finalAmount },
        });

        const user = await User.findById(userId);
        if (user) {
            user.cartItems = {};
            await user.save();
        }

        return NextResponse.json({
            success: true,
            message: "Order placed successfully.",
        });
    } catch (error) {
        console.error("Order creation failed:", error);
        return NextResponse.json({
            success: false,
            message: error.message || "An error occurred while creating the order.",
        });
    }
}

