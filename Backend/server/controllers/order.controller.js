import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Product from "../models/product.model.js"; 
import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

// place order COD : /api/order/cod
export const placeOrderCOD = async (req, res) => {
    try {
        const { items, address } = req.body;
        const userId = req.userId; 

        if (!userId || !address || items.length === 0) {
            return res.json({ success: false, message: "Invalid data" });
        }

        //calculate amount
        let amount = await items.reduce(async (acc, item) => {
            const product = await Product.findById(item.product);
            if (!product) {
                throw new Error(`Product with ID ${item.product} not found.`);
            }
            
            return (await acc) + product.offerPrice * item.quantity; 
        }, 0);

        //add tax
        amount += (amount * 0.02);

        await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "COD"
        });

        return res.json({
            success: true,
            message: "Order Placed Successfully"
        });

    } catch (error) {

        return res.json({
            success: false,
            message: error.message
        });
    }
};

//place order stripe: /app/order/stripe
export const placeOrderStripe = async (req, res) => {
    try {
        const { items, address } = req.body;
        const userId = req.userId; 

        const { origin } = req.headers;

        if (!userId || !address || items.length === 0) {
            return res.json({ success: false, message: "Invalid data" });
        }

        let productData = [];

        //calculate amount
        let amount = await items.reduce(async (acc, item) => {
            const product = await Product.findById(item.product); 
            if (!product) {
                throw new Error(`Product with ID ${item.product} not found.`);
            }
            productData.push({
                name: product.name,
                price: product.offerPrice,
                quantity: item.quantity,
            });
            return (await acc) + product.offerPrice * item.quantity; 
        }, 0);

        //add tax
        amount += (amount * 0.02); 

        const order = await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "Online"
        });

        //stripe gateway integration
        const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY); 

        //create line items for stripe
        const line_item = productData.map((item) => {
            return {
                price_data: {
                    currency: "usd", 
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: Math.round((item.price + item.price * 0.02) * 100), 
                },
                quantity: item.quantity,
            };
        });

        //create checkout session
        const session = await stripeInstance.checkout.sessions.create({
            line_items: line_item,
            mode: "payment",
            success_url: `${origin}/loader?next=my-orders`,
            cancel_url: `${origin}/cart`,
            metadata: {
                orderId: order._id.toString(),
                userId: userId,
            },
        });

        return res.json({
            success: true,
            url: session.url
        });

    } catch (error) {
        console.error("Error placing Stripe order:", error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};

//stripe webhook to verify payment :/stripe 

export const stripeWebhook = async (req, res) => {
    //stripe gateway initialization
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY); 

    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripeInstance.webhooks.constructEvent( 
            req.rawBody, 
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        res.status(400).json(
            `Webhook Error: ${error.message}`
        );
        return; 
    }

    //handle the event
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const { orderId, userId } = session.metadata; 

        try {
            // Update order status
            await Order.findByIdAndUpdate(orderId, {
                isPaid: true,
                paymentType: "Online"
            });

            // Clear cart items 
            await User.findByIdAndUpdate(userId, { cartItems: {} }); 

        } catch (error) {
            console.error("Error updating order/clearing cart in webhook:", error);
            return res.status(500).json({ 
                received: true, 
                message: "Failed to update order or clear cart" 
            });
        }
    } else {
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
};


//get order by user id: /api/order/user

export const getUserOrder = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: "User not authenticated" 
            });
        }
        const orders = await Order.find({
            userId,
            $or: [{ paymentType: "COD" }, { isPaid: true }]
        }).populate("items.product address").sort({ createdAt: -1 });

        res.json({
            success: true,
            orders
        });
    } catch (error) {
        console.error("Error fetching user orders:", error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};


//all order data for seller/admin: api/order/seller

export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            $or: [{ paymentType: "COD" }, { isPaid: true }]
        }).populate("items.product address").sort({ createdAt: -1 });

        res.json({
            success: true,
            orders
        });
    } catch (error) {
        console.error("Error fetching all orders:", error);
        return res.json({
            success: false,
            message: error.message
        });
    }
};