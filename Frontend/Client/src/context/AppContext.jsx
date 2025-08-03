import {  createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";


axios.defaults.withCredentials = true; //send cookie
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL

export const AppContext=createContext();

export const AppContextProvider=({children})=>{

    const currency=import.meta.env.VITE_CURRENCY;

    const navigate=useNavigate();
    const[user,setUser]=useState(null)
    const[isSeller,setIsSeller]= useState(false)
    const[showUserLogin,setShowUserLogin]=useState(false)
    const[products,setProducts]=useState([])
    const[cartItems,setCartItems]=useState({})
    const[searchQuery,setSearchQuery]=useState("")


//fetch seller status
    const fetchSeller = async()=>{
        try {
            const {data} = await axios.get('api/seller/is-auth');
            if(data.success){
                setIsSeller(true)
            } else {
                setIsSeller(false)
            }
        } catch {
            setIsSeller(false)
        }
    }

//featch user auth status,user data and cart items
    const fetchUser = async()=>{
        try {
            const {data} = await axios.get('api/user/is-auth');
            if(data.success){
                setUser(data.user);
                setCartItems(data.cartItems || {});
            }
        } catch {
            setUser(null);
            setCartItems({});
        }
    }

//fetch all products
    const fetchProducts=async()=>{
        try {
            const {data} = await axios.get('api/product/list');
            console.log("API Response for products:", data);
            if(data.success){
                setProducts(data.products)
                console.log("Products set in context:", data.products);
                
            }
        } catch (error) {
            toast.error(error.message)
            console.error("Error fetching products:", error);
            
        }
    }

//add product to cart

    const addToCart = (itemId) => {
    const id = itemId.toString(); 
    const currentCart = cartItems || {};
    let cartData = structuredClone(currentCart);

    if (cartData[id]) {
        cartData[id] += 1;
    } else {
        cartData[id] = 1;
    }

    setCartItems(cartData);
    toast.success("Added to cart");
};


// update cart item quantity
    const updateCartItem=(itemId,quantity)=>{
        let cartData=structuredClone(cartItems);
        cartData[itemId]=quantity;
        setCartItems(cartData)
        toast.success("Cart updated")
    }

//remove product from cart
    const removeFromCart = (itemId) => {
    const id = itemId.toString(); 
    let cartData = structuredClone(cartItems);

    if (cartData[id]) {
        cartData[id] -= 1;
        if (cartData[id] === 0) {
            delete cartData[id];
        }
    }

    toast.success("Removed from cart");
    setCartItems(cartData);
};


//get total item count
    const getCartCount=()=>{
        let totalCount=0;
        for(const item in cartItems){
            totalCount+=cartItems[item]
        }
        return totalCount;
    }

//get cart total amount
    const getCartAmount = () => {
    let totalAmount = 0;
    for (const items in cartItems) { 
        let itemInfo = products.find((product) => product._id === items);
        
        if (itemInfo) {
            if (cartItems[items] > 0) {
                totalAmount += itemInfo.offerPrice * cartItems[items]
            }
        }
    }
    return Math.floor(totalAmount * 100) / 100;
}

   


    useEffect(()=>{
        fetchProducts();
        fetchSeller();
        fetchUser();
    },[]);

    useEffect(()=>{
        const updateCart=async()=>{
            try {
               const {data} = await axios.post('api/cart/update', {cartItems});
               if(!data.success){
                   toast.error(data.message);
               }
            } catch (error) {
                toast.error(error.message);
            }
        }

        if(user){
            updateCart();
        }

    },[cartItems])

    const value={
        navigate,
        user,
        setUser,
        isSeller,
        setIsSeller,
        showUserLogin,
        setShowUserLogin,
        products,
        currency,
        addToCart,
        updateCartItem,
        removeFromCart,
        cartItems,
        searchQuery,
        setSearchQuery,
        getCartAmount,
        getCartCount,
        axios,
        fetchSeller,
        fetchProducts,
        setCartItems
        
        
    }
    return <AppContext.Provider value={value}> 
    {children}
    </AppContext.Provider>

}

export const useAppContext=()=>{
    return useContext(AppContext)
}