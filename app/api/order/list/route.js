import connectDB from "@/config/db";
// ❌ REMOVE the redundant imports:
// import Address from "@/models/Address";
// import Product from "@/models/Product";
import Order from "@/models/Order"; 
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


export async function GET(request) {
    try {
        const { userId } = getAuth(request);

        // All models are registered here because connectDB loads them
        await connectDB(); 

        const orders = await Order.find({ userId })
            .populate('address')               
            .populate('items.productId')       
            .sort({ createdAt: -1 });          

        return NextResponse.json({ success: true, orders });

    } catch (error) {
        console.error(error); 
        return NextResponse.json({ success: false, message: error.message });
    }
}