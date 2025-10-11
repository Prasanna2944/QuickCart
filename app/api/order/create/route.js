import { inngest } from "@/config/inngest";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import User from "@/models/User";
import Order from "@/models/Order";
import Address from "@/models/Address"; // Ensures Address model is registered
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // Connect to MongoDB
    await connectDB();

    const { userId } = getAuth(request);
    const { address, items } = await request.json();

    // Basic validation
    if (!userId || !address || items.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Invalid data — missing user, address, or items.",
      });
    }

    // Calculate total amount
    const totalAmount = await items.reduce(async (accPromise, item) => {
      const acc = await accPromise;

      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Product not found for ID: ${item.productId}`);
      }

      return acc + product.offerPrice * item.quantity;
    }, Promise.resolve(0));

    // Add 2% tax/fee (optional)
    const finalAmount = totalAmount + Math.floor(totalAmount * 0.02);

    // Ensure the address field is stored as an ObjectId if needed
    const orderData = {
      userId, // Clerk ID, stored as String in schema
      address: address._id || address, // Works for both object or ObjectId
      items,
      amount: finalAmount,
    };

    // Create and save order
    const newOrder = new Order(orderData);
    await newOrder.save();

    // Trigger Inngest event
    await inngest.send({
      name: "order/created",
      data: {
        userId,
        address,
        items,
        amount: finalAmount,
      },
    });

    // Clear user's cart
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
