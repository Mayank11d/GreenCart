import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import toast from 'react-hot-toast';

const Cart = () => {
    const { 
        products, 
        currency, 
        cartItems, 
        removeFromCart, 
        getCartCount, 
        updateCartItem, 
        navigate, 
        getCartAmount, 
        axios, 
        user, 
        setCartItems } = useAppContext();

    const [cartArray, setCartArray] = useState([]);
    const [address, setAddress] = useState([]);
    const [showAddress, setShowAddress] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentOption, setPaymentOption] = useState("COD");

    // getproduct data and add in cartarray
    const getCart = () => {
        if (!products || products.length === 0) {
            setCartArray([]); 
            return;
        }

        let tempArray = [];
        if (cartItems && typeof cartItems === 'object') {
            for (const key in cartItems) {
                if (cartItems[key] > 0) {
                    const product = products.find((item) => item._id === key);
                    if (product) {
                        tempArray.push({ ...product, quantity: cartItems[key] });
                    }
                }
            }
        }
        setCartArray(tempArray);
    };

    const getUserAddress = async () => {
        try {
            const { data } = await axios.get('api/address/get');

            if (data.success) {
                const fetchedAddresses = data.addresses || [];
                setAddress(fetchedAddresses);
                if (fetchedAddresses.length > 0) {
                    setSelectedAddress(fetchedAddresses[0]);
                } else {
                    setSelectedAddress(null);
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch addresses");
        }
    };

    const placeOrder = async () => {
        try {
            if (!selectedAddress) {
                toast.error("Please select an address");
                return;
            }

            if (cartArray.length === 0) {
                toast.error("Your cart is empty!");
                return;
            }

             const itemsToOrder = cartArray.map(item => ({
                product: item._id, 
                quantity: item.quantity
            }));
            console.log("Items to order:", itemsToOrder);

            // Place order with COD
            if (paymentOption === "COD") {
                const { data } = await axios.post('api/order/cod', {
                    items: itemsToOrder,
                    address: selectedAddress._id,
                });
                if (data.success) {
                    toast.success(data.message);
                    setCartItems({});
                    navigate("/my-orders");
                } else {
                    toast.error(data.message);
                }
                return;
            } else {
                // Place order with online payment
                if (paymentOption === "Online") {
                    if (!user?._id) { 
                        toast.error("User not authenticated for online payment.");
                        return;
                    }
                    const { data } = await axios.post('api/order/stripe', {
                        userId: user._id,
                        items: itemsToOrder,
                        address: selectedAddress._id,
                    });

                    if (data.success) {
                        window.location.replace(data.url); 
                    } else {
                        toast.error(data.message);
                    }
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to place order");
        }
    };

    useEffect(() => {
        if (products.length > 0 && cartItems) {
            getCart();
        } else if (products.length === 0 && Object.keys(cartItems).length > 0) {
            setCartArray([]);
        } else {
             setCartArray([]); 
        }
    }, [products, cartItems]); 

    useEffect(() => {
        if (user) {
            getUserAddress();
        } else {
            setAddress([]);
            setSelectedAddress(null);
        }
    }, [user]);


    
    if (!products || products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] mt-16 text-gray-600">
                <p className="text-xl font-medium">Loading products...</p>
            </div>
        );
    }

    if (!cartItems || Object.keys(cartItems).length === 0 || getCartCount() === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] mt-16 text-gray-600">
                <p className="text-xl font-medium">Your cart is empty.</p>
                <button
                    onClick={() => { navigate("/products"); scrollTo(0, 0); }}
                    className="group cursor-pointer flex items-center mt-8 gap-2 text-primary font-medium"
                >
                    <img className='group-hover:-translate-x-1 transition' src={assets.arrow_right_icon_colored} alt="arrow" />
                    Continue Shopping
                </button>
            </div>
        );
    }


    return (
        <div className="flex flex-col md:flex-row mt-16 px-4 md:px-0"> 
            <div className='flex-1 max-w-4xl mx-auto md:mr-8'> 
                <h1 className="text-3xl font-medium mb-6">
                    Shopping Cart <span className="text-sm text-primary">{getCartCount()}</span>
                </h1>

                <div className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 text-base font-medium pb-3 border-b border-gray-300"> 
                    <p className="text-left">Product Details</p>
                    <p className="text-center">Subtotal</p>
                    <p className="text-center">Action</p>
                </div>

                {cartArray.map((product, index) => (
                    <div key={product._id || index} className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 items-center text-sm md:text-base font-medium py-4 border-b border-gray-200"> 
                        <div className="flex items-center md:gap-6 gap-3">
                            <div
                                onClick={() => {
                                    navigate(`/products/${product.category.toLowerCase()}/${product._id}`); scrollTo(0, 0);
                                }}
                                className="cursor-pointer w-24 h-24 flex items-center justify-center border border-gray-300 rounded overflow-hidden">
                                <img className="max-w-full h-full object-cover" src={product?.image?.[0] || assets.fallback_image} alt={product?.name || "Product Image"} />
                            </div>
                            <div>
                                <p className="hidden md:block font-semibold">{product.name}</p>
                                <div className="font-normal text-gray-500/70">
                                    <p>Weight: <span>{product.weight || "N/A"}</span></p>
                                    <div className='flex items-center'>
                                        <p>Qty:</p>
                                        <select
                                            onChange={e => updateCartItem(product._id, Number(e.target.value))}
                                            value={cartItems[product._id] || 0} 
                                            className='outline-none bg-white border border-gray-300 rounded px-1 ml-1'
                                        >
                                            {Array.from({ length: Math.max(10, cartItems[product._id] || 0) }, (_, i) => i + 1).map((qty) => (
                                                <option key={qty} value={qty}>{qty}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-center">{currency}{(product.offerPrice * product.quantity).toFixed(2)}</p>
                        <button onClick={() => {
                            removeFromCart(product._id);
                        }} className="cursor-pointer mx-auto">
                            <img className="inline-block w-6 h-6" src={assets.remove_icon} alt="remove" />
                        </button>
                    </div>
                ))}

                <button onClick={() => {
                    navigate("/products"); scrollTo(0, 0);
                }} className="group cursor-pointer flex items-center mt-8 gap-2 text-primary font-medium">
                    <img className='group-hover:-translate-x-1 transition' src={assets.arrow_right_icon_colored} alt="arrow" />
                    Continue Shopping
                </button>
            </div>

            <div className="max-w-[360px] w-full bg-gray-100/40 p-5 max-md:mt-16 border border-gray-300/70 mx-auto"> 
                <h2 className="text-xl md:text-xl font-medium">Order Summary</h2>
                <hr className="border-gray-300 my-5" />

                <div className="mb-6">
                    <p className="text-sm font-medium uppercase">Delivery Address</p>
                    <div className="relative flex justify-between items-start mt-2">
                        <p className="text-gray-500">{selectedAddress ? `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state}, ${selectedAddress.country}` : "No address found"}</p>
                        <button onClick={() => setShowAddress(!showAddress)} className="text-primary hover:underline cursor-pointer">
                            Change
                        </button>
                        {showAddress && (
                            <div className="absolute top-full left-0 mt-2 py-1 bg-white border border-gray-300 text-sm w-full shadow-lg z-10">
                                {address.length > 0 ? address.map((addr) => (
                                    <p onClick={() => { setSelectedAddress(addr); setShowAddress(false); }} className="text-gray-500 p-2 hover:bg-gray-100 cursor-pointer" key={addr._id}>
                                        {addr.street}, {addr.city}, {addr.state}, {addr.country}
                                    </p>
                                )) : (
                                    <p className="text-gray-500 p-2 text-center">No addresses available</p>
                                )}
                                <p onClick={() => { navigate("/add-address"); setShowAddress(false); }} className="text-primary text-center cursor-pointer p-2 hover:bg-primary/10 border-t border-gray-200">
                                    Add address
                                </p>
                            </div>
                        )}
                    </div>

                    <p className="text-sm font-medium uppercase mt-6">Payment Method</p>

                    <select onChange={e => setPaymentOption(e.target.value)} value={paymentOption} className="w-full border border-gray-300 bg-white px-3 py-2 mt-2 outline-none">
                        <option value="COD">Cash On Delivery</option>
                        <option value="Online">Online Payment</option>
                    </select>
                </div>

                <hr className="border-gray-300" />

                <div className="text-gray-500 mt-4 space-y-2">
                    <p className="flex justify-between">
                        <span>Price</span><span>{currency}{getCartAmount().toFixed(2)}</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Shipping Fee</span><span className="text-green-600">Free</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Tax (2%)</span><span>{currency}{(getCartAmount() * 0.02).toFixed(2)}</span>
                    </p>
                    <p className="flex justify-between text-lg font-medium mt-3">
                        <span>Total Amount:</span><span>{currency}{(getCartAmount() + getCartAmount() * 0.02).toFixed(2)}</span>
                    </p>
                </div>

                <button onClick={placeOrder} className="w-full py-3 mt-6 cursor-pointer bg-primary text-white font-medium hover:bg-primary-dull transition">
                    {paymentOption === "COD" ? "Place Order" : "Proceed to Checkout"}
                </button>
            </div>
        </div>
    );
};

export default Cart;