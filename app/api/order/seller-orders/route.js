import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Address from "@/models/Address";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


export async function GET(request){
    try {
        const { userId } = getAuth(request);

        // 1. Authorization Check
        const isSeller = await authSeller(userId);

        if (!isSeller) {
            return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 });
        }

        await connectDB();
        
        // --- 2. Implement Seller-Specific Filtering ---
        
        // Find all Product IDs that belong to the current seller
        // (Assuming your Product model has a field named 'userId' to identify the seller)
        const sellerProducts = await Product.find({ userId: userId }).select('_id');
        const sellerProductIds = sellerProducts.map(p => p._id);

        // Find orders that contain any of the seller's products
        const orders = await Order.find({
            // Filter: where the 'productId' field within any 'items' element is in the list of seller's IDs
            'items.productId': { $in: sellerProductIds }
        })
        // 🛑 IMPORTANT: Corrected the populate path to 'items.productId'
        .populate('address items.productId') 
        .sort({ createdAt: -1 }); // Sort by creation date (or similar field)

        // Address.length (This line is unnecessary, you can remove it)

        return NextResponse.json({ success: true, orders });

    } catch (error) {
        console.error("Seller Orders API Error:", error);
        return NextResponse.json ({ success: false, message: error.message }, { status: 500 });
    }
}