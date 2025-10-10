import connectDB from "@/config/db";
import Address from "@/models/Address";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";



export async function GET(request) {
    try {
        const { userId } = getAuth(request);

        await connectDB();

        // 🛑 FIX: The populate fields must be correct, separated by only spaces, 
        // and match the field names in the Order model.
        // It should be 'address' and 'items.productId', not 'items.product'.
        const orders = await Order.find({ userId })
            .populate('address items.productId'); 

        return NextResponse.json({ success: true, orders });


    } catch (error) {
        // Log the error for debugging
        console.error(error); 
        return NextResponse.json({ success: false, message: error.message });
    }
}